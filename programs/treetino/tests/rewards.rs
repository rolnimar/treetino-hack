mod common;
use common::*;

#[test]
fn full_lifecycle_transfer_preserves_paid_rewards() {
    let mut e = Env::new(20_000 * USDC);
    e.buy(1, 12_000 * USDC).unwrap();
    e.buy(2, 8_000 * USDC).unwrap();
    assert_eq!(e.tree().phase, Phase::Funded);
    assert_eq!(e.balance(e.funding_token_account), 20_000 * USDC);
    let mint: token::Mint = e.read(e.share_mint);
    assert_eq!(mint.mint_authority, COption::None);
    let supplier_before = e.balance(ata(&e.supplier.pubkey(), &e.mint));
    e.activate();
    assert_eq!(e.balance(e.funding_token_account), 0);
    assert_eq!(
        e.balance(ata(&e.supplier.pubkey(), &e.mint)),
        supplier_before + 20_000 * USDC
    );
    e.set_time(START + DAY);
    e.send(e.report(START, vec![1000; INTERVALS]), 5).unwrap();
    let r: Report = e.read(e.report_key(START));
    assert_eq!(r.total_wh, 96_000);
    assert_eq!(r.due, 0);
    assert!(!r.invoice_issued);
    e.invoice(START, 14_400_000).unwrap();
    assert_eq!(e.tree().paid, 0);
    custom(e.claim(1), TreeError::NoRewards);
    e.pay(START, 10 * USDC).unwrap();
    e.send(
        e.transfer_ix(e.alice.pubkey(), e.carol.pubkey(), 12_000 * USDC),
        1,
    )
    .unwrap();
    // Alice sold every share but keeps 60% of the first payment.
    let before = e.balance(ata(&e.alice.pubkey(), &e.mint));
    e.claim(1).unwrap();
    assert_eq!(
        e.balance(ata(&e.alice.pubkey(), &e.mint)),
        before + 6 * USDC
    );
    custom(e.claim(3), TreeError::NoRewards);
    e.pay(START, 4_400_000).unwrap();
    let before = e.balance(ata(&e.carol.pubkey(), &e.mint));
    e.claim(3).unwrap();
    assert_eq!(
        e.balance(ata(&e.carol.pubkey(), &e.mint)),
        before + 2_640_000
    );
    let before = e.balance(ata(&e.bob.pubkey(), &e.mint));
    e.claim(2).unwrap();
    assert_eq!(e.balance(ata(&e.bob.pubkey(), &e.mint)), before + 5_760_000);
    assert_eq!(e.balance(e.revenue_token_account), 0);
    assert_eq!(e.tree().claimed, 14_400_000);
    custom(e.claim(1), TreeError::NoRewards);
    custom(e.pay(START, 1), TreeError::Overpayment);
}

#[test]
fn fractional_rewards_survive_repeated_small_payments() {
    let mut e = Env::new(3);
    e.buy(1, 1).unwrap();
    e.buy(2, 2).unwrap();
    e.activate();
    e.set_time(START + DAY);
    e.send(e.report(START, vec![1; INTERVALS]), 5).unwrap();
    e.invoice(START, 96).unwrap();
    e.pay(START, 1).unwrap();
    custom(e.claim(1), TreeError::NoRewards);
    custom(e.claim(2), TreeError::NoRewards);
    e.pay(START, 2).unwrap();
    let alice = e.balance(ata(&e.alice.pubkey(), &e.mint));
    let bob = e.balance(ata(&e.bob.pubkey(), &e.mint));
    e.claim(1).unwrap();
    e.claim(2).unwrap();
    assert_eq!(e.balance(ata(&e.alice.pubkey(), &e.mint)), alice + 1);
    assert_eq!(e.balance(ata(&e.bob.pubkey(), &e.mint)), bob + 2);
    assert_eq!(e.tree().reward_remainder, 0);
    assert_eq!(e.balance(e.revenue_token_account), 0);
}
