mod common;
use common::*;

#[test]
fn funding_caps_are_atomic_and_funding_stays_open_until_target() {
    let mut e = Env::new(20 * USDC);
    e.buy(1, 12 * USDC).unwrap();
    custom(e.buy(2, 9 * USDC), TreeError::FundingCap);
    assert!(e
        .svm
        .get_account(&position(&e.tree, &e.bob.pubkey()))
        .is_none());
    assert_eq!(e.balance(e.funding_token_account), 12 * USDC);
    let transfer = e.transfer_ix(e.alice.pubkey(), e.bob.pubkey(), USDC);
    custom(e.send(transfer, 1), TreeError::InvalidPhase);
    // No expiry: the remaining shares can be bought later.
    e.set_time(START + 365 * DAY);
    e.buy(2, 8 * USDC).unwrap();
    assert_eq!(e.tree().phase, Phase::Funded);
    assert_eq!(e.tree().raised, 20 * USDC);
    assert_eq!(e.balance(e.funding_token_account), 20 * USDC);
    custom(e.buy(1, 1), TreeError::InvalidPhase);
}

#[test]
fn unauthorized_purchase_and_wrong_payment_mint_are_rejected() {
    let mut e = Env::new(USDC);
    e.buy(1, USDC / 2).unwrap();
    let mut investor = e.investor(e.alice.pubkey());
    investor.payment_token_account = investor.share_token_account;
    assert!(e
        .send(ix(investor, i::BuyShares { amount: USDC / 2 }), 1)
        .is_err());
    assert_eq!(e.tree().raised, USDC / 2);
    e.buy(1, USDC / 2).unwrap();
    let purchase = ix(
        a::PurchaseTree {
            creator: e.alice.pubkey(),
            tree: e.tree,
            funding_token_account: e.funding_token_account,
            supplier_payment_token_account: ata(&e.supplier.pubkey(), &e.mint),
            token_program: token::ID,
        },
        i::PurchaseTree {},
    );
    assert!(e.send(purchase, 1).is_err());
    assert_eq!(e.tree().phase, Phase::Funded);
    assert_eq!(e.balance(e.funding_token_account), USDC);
}
