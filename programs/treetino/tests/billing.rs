mod common;
use common::*;

fn reported() -> Env {
    let mut e = Env::new(USDC);
    e.buy(1, USDC).unwrap();
    e.activate();
    e.set_time(START + DAY);
    e.send(e.report(START, vec![1000; INTERVALS]), 5).unwrap();
    e
}

#[test]
fn backend_submits_final_amount_and_only_paid_revenue_creates_rewards() {
    let mut e = reported();
    let before = e.balance(ata(&e.client.pubkey(), &e.mint));
    custom(e.pay(START, 1), TreeError::InvoiceNotIssued);
    assert_eq!(e.balance(ata(&e.client.pubkey(), &e.mint)), before);
    // Mock backend result: no tariff or multiplication is sent to the program.
    e.invoice(START, 14_400_000).unwrap();
    let report: Report = e.read(e.report_key(START));
    assert!(report.invoice_issued);
    assert_eq!(report.due, 14_400_000);
    assert_eq!(e.tree().billed, 14_400_000);
    assert_eq!(e.tree().paid, 0);
    custom(e.claim(1), TreeError::NoRewards);
    custom(e.pay(START, 14_400_001), TreeError::Overpayment);
    assert_eq!(e.balance(ata(&e.client.pubkey(), &e.mint)), before);
    e.pay(START, 4_400_000).unwrap();
    e.pay(START, 10 * USDC).unwrap();
    e.claim(1).unwrap();
    assert_eq!(e.tree().claimed, 14_400_000);
    assert_eq!(e.balance(e.revenue_token_account), 0);
    custom(e.pay(START, 1), TreeError::Overpayment);
}

#[test]
fn invoice_authority_is_required_and_amount_cannot_be_rewritten() {
    let mut e = reported();
    let mut spoof = e.invoice_ix(START, 14_400_000);
    spoof.accounts[0].pubkey = e.device.pubkey();
    assert!(e.send(spoof, 5).is_err());
    assert_eq!(e.tree().billed, 0);
    assert!(!e.read::<Report>(e.report_key(START)).invoice_issued);
    e.invoice(START, 14_400_000).unwrap();
    custom(e.invoice(START, 1), TreeError::InvoiceAlreadyIssued);
    e.pay(START, USDC).unwrap();
    custom(e.invoice(START, 2 * USDC), TreeError::InvoiceAlreadyIssued);
    let report: Report = e.read(e.report_key(START));
    assert_eq!(report.due, 14_400_000);
    assert_eq!(report.paid, USDC);
    assert_eq!(e.tree().billed, 14_400_000);
}

#[test]
fn zero_amount_invoice_is_distinct_from_not_yet_billed() {
    let mut e = reported();
    e.invoice(START, 0).unwrap();
    assert!(e.read::<Report>(e.report_key(START)).invoice_issued);
    custom(e.invoice(START, USDC), TreeError::InvoiceAlreadyIssued);
    custom(e.pay(START, 1), TreeError::Overpayment);
    assert_eq!(e.tree().billed, 0);
    assert_eq!(e.tree().paid, 0);
}

#[test]
fn cumulative_invoice_overflow_rolls_back_the_second_invoice() {
    let mut e = reported();
    e.invoice(START, u64::MAX).unwrap();
    e.set_time(START + 2 * DAY);
    e.send(e.report(START + DAY, vec![1; INTERVALS]), 5)
        .unwrap();
    custom(e.invoice(START + DAY, 1), TreeError::Overflow);
    let report: Report = e.read(e.report_key(START + DAY));
    assert!(!report.invoice_issued);
    assert_eq!(report.due, 0);
    assert_eq!(e.tree().billed, u64::MAX);
}
