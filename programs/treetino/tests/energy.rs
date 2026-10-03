mod common;
use common::*;

#[test]
fn reports_require_device_signature_complete_day_and_valid_intervals() {
    let mut e = Env::new(20 * USDC);
    e.buy(1, 20 * USDC).unwrap();
    e.activate();
    custom(
        e.send(e.report(START, vec![1000; INTERVALS]), 5),
        TreeError::InvalidDay,
    );
    e.set_time(START + DAY);
    let mut spoof = e.report(START, vec![1000; INTERVALS]);
    spoof.accounts[0].pubkey = e.alice.pubkey();
    assert!(e.send(spoof, 1).is_err());
    custom(
        e.send(e.report(START, vec![1000; 95]), 5),
        TreeError::InvalidInput,
    );
    custom(
        e.send(e.report(START, vec![10_001; INTERVALS]), 5),
        TreeError::InvalidInput,
    );
    assert_eq!(e.tree().total_wh, 0);
    // Production reporting is independent of backend billing.
    e.send(e.report(START, vec![1000; INTERVALS]), 5).unwrap();
    let report: Report = e.read(e.report_key(START));
    assert_eq!(report.total_wh, 96_000);
    assert!(!report.invoice_issued);
    assert_eq!(report.due, 0);
    assert_eq!(e.tree().billed, 0);
    assert!(e.send(e.report(START, vec![1000; INTERVALS]), 5).is_err());
}

#[test]
fn reports_can_backfill_without_a_price_schedule_or_invoice() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.activate();
    e.set_time(START + 2 * DAY);
    custom(
        e.send(e.report(START + DAY, vec![1; INTERVALS]), 5),
        TreeError::InvalidDay,
    );
    e.send(e.report(START, vec![0; INTERVALS]), 5).unwrap();
    e.send(e.report(START + DAY, vec![1; INTERVALS]), 5)
        .unwrap();
    assert_eq!(e.tree().total_wh, 96);
    assert_eq!(e.tree().next_day_start_ts, START + 2 * DAY);
    assert_eq!(e.tree().billed, 0);
}
