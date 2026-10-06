mod common;
use common::*;

#[test]
fn reports_require_device_signature_and_complete_day() {
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
fn reports_can_backfill_any_completed_day_in_any_order_without_rewinding_the_cursor() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.activate();
    e.set_time(START + 2 * DAY);
    e.send(e.report(START + DAY, vec![1; INTERVALS]), 5)
        .unwrap();
    e.send(e.report(START, vec![0; INTERVALS]), 5).unwrap();
    // Explicit history is independent of activation's scheduled start.
    e.send(e.report(START - 3 * DAY, vec![7, 9]), 5).unwrap();
    assert_eq!(
        e.read::<Report>(e.report_key(START - 3 * DAY)).wh,
        vec![7, 9]
    );
    assert_eq!(e.tree().total_wh, 112);
    assert_eq!(e.tree().next_day_start_ts, START + 2 * DAY);
    assert_eq!(e.tree().billed, 0);
    assert!(e.send(e.report(START - 3 * DAY, vec![99]), 5).is_err());
    assert_eq!(e.tree().total_wh, 112);
    for day in [-DAY, START + 1, START + 2 * DAY] {
        custom(e.send(e.report(day, vec![1]), 5), TreeError::InvalidDay);
        assert!(e.svm.get_account(&e.report_key(day)).is_none());
    }
}

#[test]
fn activation_can_start_reporting_from_a_past_utc_day() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.set_time(START + 2 * DAY);
    e.activate_from(START - DAY);
    assert_eq!(e.tree().next_day_start_ts, START - DAY);
    e.send(e.report(START - DAY, vec![12]), 5).unwrap();
    assert_eq!(e.tree().next_day_start_ts, START);
}

#[test]
fn reports_store_supplied_readings_without_count_or_energy_limits() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.activate();
    let mut cumulative_wh = 0;
    for (index, count) in [0, 1, 95, 96, 97, 128].into_iter().enumerate() {
        let day = START + index as i64 * DAY;
        e.set_time(day + DAY);
        let wh = vec![u32::MAX; count];
        e.send(e.report(day, wh.clone()), 5).unwrap();
        let report: Report = e.read(e.report_key(day));
        let total_wh = u64::from(u32::MAX) * count as u64;
        cumulative_wh += total_wh;
        assert_eq!(report.wh, wh);
        assert_eq!(report.total_wh, total_wh);
        assert_eq!(e.tree().total_wh, cumulative_wh);
        assert_eq!(
            e.svm.get_account(&e.report_key(day)).unwrap().data.len(),
            Report::space(count)
        );
        e.invoice(day, USDC).unwrap();
        e.pay(day, USDC).unwrap();
        assert_eq!(e.read::<Report>(e.report_key(day)).wh, report.wh);
    }
}
