mod common;
use common::*;

#[test]
fn raw_spl_transfer_and_burn_cannot_bypass_ledger() {
    let mut e = Env::new(20 * USDC);
    e.buy(1, 10 * USDC).unwrap();
    e.buy(2, 10 * USDC).unwrap();
    let raw = spl_token::instruction::transfer(
        &token::ID,
        &ata(&e.alice.pubkey(), &e.share_mint),
        &ata(&e.bob.pubkey(), &e.share_mint),
        &e.alice.pubkey(),
        &[],
        USDC,
    )
    .unwrap();
    assert!(e.send(raw, 1).is_err());
    let burn = spl_token::instruction::burn(
        &token::ID,
        &ata(&e.alice.pubkey(), &e.share_mint),
        &e.share_mint,
        &e.alice.pubkey(),
        &[],
        USDC,
    )
    .unwrap();
    assert!(e.send(burn, 1).is_err());
    assert_eq!(e.balance(ata(&e.alice.pubkey(), &e.share_mint)), 10 * USDC);
    e.send(e.transfer_ix(e.alice.pubkey(), e.bob.pubkey(), USDC), 1)
        .unwrap();
    let p: Position = e.read(position(&e.tree, &e.bob.pubkey()));
    assert_eq!(p.shares, 11 * USDC);
}

#[test]
fn secondary_sale_is_atomic_with_the_buyers_payment() {
    let mut e = Env::new(10 * USDC);
    e.buy(1, 10 * USDC).unwrap();
    let seller_payment_token_account = ata(&e.alice.pubkey(), &e.mint);
    let buyer_payment_token_account = ata(&e.bob.pubkey(), &e.mint);
    let pay = spl_token::instruction::transfer(
        &token::ID,
        &buyer_payment_token_account,
        &seller_payment_token_account,
        &e.bob.pubkey(),
        &[],
        2 * USDC,
    )
    .unwrap();
    let bad_transfer = e.transfer_ix(e.alice.pubkey(), e.bob.pubkey(), 11 * USDC);
    let before = e.balance(buyer_payment_token_account);
    e.svm.expire_blockhash();
    let tx = Transaction::new(
        &[&e.fee, &e.alice, &e.bob],
        Message::new(&[pay.clone(), bad_transfer], Some(&e.fee.pubkey())),
        e.svm.latest_blockhash(),
    );
    assert!(e.svm.send_transaction(tx).is_err());
    assert_eq!(e.balance(buyer_payment_token_account), before);
    assert_eq!(e.balance(ata(&e.alice.pubkey(), &e.share_mint)), 10 * USDC);
    e.svm.expire_blockhash();
    let transfer = e.transfer_ix(e.alice.pubkey(), e.bob.pubkey(), USDC);
    let tx = Transaction::new(
        &[&e.fee, &e.alice, &e.bob],
        Message::new(&[pay, transfer], Some(&e.fee.pubkey())),
        e.svm.latest_blockhash(),
    );
    assert!(wincode::serialize(&tx).unwrap().len() <= 1232);
    e.svm.send_transaction(tx).unwrap();
    assert_eq!(e.balance(buyer_payment_token_account), before - 2 * USDC);
    assert_eq!(e.balance(ata(&e.bob.pubkey(), &e.share_mint)), USDC);
}
