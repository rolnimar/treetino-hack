mod common;
use common::*;

#[test]
fn anyone_can_request_demo_tokens_repeatedly_without_issuer_signature() {
    let mut e = Env::uninitialized();
    e.send(e.init_payment_token_ix(), 0).unwrap();
    let alice_account = ata(&e.alice.pubkey(), &e.mint);
    let bob_account = ata(&e.bob.pubkey(), &e.mint);
    assert!(e.svm.get_account(&alice_account).is_none());
    e.send(e.give_me_money_ix(e.alice.pubkey(), 100 * USDC), 1)
        .unwrap();
    e.send(e.give_me_money_ix(e.alice.pubkey(), 50 * USDC), 1)
        .unwrap();
    e.send(e.give_me_money_ix(e.bob.pubkey(), 200 * USDC), 2)
        .unwrap();
    assert_eq!(e.balance(alice_account), 150 * USDC);
    assert_eq!(e.balance(bob_account), 200 * USDC);
    let mint = spl_token::state::Mint::unpack(&e.svm.get_account(&e.mint).unwrap().data).unwrap();
    assert_eq!(mint.supply, 350 * USDC);

    // Even the initializer must use the faucet: no wallet holds mint authority.
    let direct_mint = spl_token::instruction::mint_to(
        &token::ID,
        &e.mint,
        &alice_account,
        &e.creator.pubkey(),
        &[],
        USDC,
    )
    .unwrap();
    assert!(e.send(direct_mint, 0).is_err());
    assert_eq!(e.balance(alice_account), 150 * USDC);
}

#[test]
fn faucet_requires_initialized_mint_and_positive_amount() {
    let mut e = Env::uninitialized();
    let account = ata(&e.alice.pubkey(), &e.mint);
    assert!(e
        .send(e.give_me_money_ix(e.alice.pubkey(), USDC), 1)
        .is_err());
    assert!(e.svm.get_account(&account).is_none());
    e.send(e.init_payment_token_ix(), 0).unwrap();
    custom(
        e.send(e.give_me_money_ix(e.alice.pubkey(), 0), 1),
        TreeError::InvalidInput,
    );
    assert!(e.svm.get_account(&account).is_none());
    let mint = spl_token::state::Mint::unpack(&e.svm.get_account(&e.mint).unwrap().data).unwrap();
    assert_eq!(mint.supply, 0);
}

#[test]
fn faucet_rejects_other_mints_and_other_users_token_accounts() {
    let mut e = Env::new(USDC);
    let alice_account = ata(&e.alice.pubkey(), &e.mint);
    let bob_account = ata(&e.bob.pubkey(), &e.mint);
    let mut wrong_recipient = e.give_me_money_ix(e.alice.pubkey(), USDC);
    wrong_recipient.accounts[2].pubkey = bob_account;
    assert!(e.send(wrong_recipient, 1).is_err());
    let other_mint = Pubkey::new_unique();
    e.svm
        .set_account(other_mint, e.svm.get_account(&e.mint).unwrap())
        .unwrap();
    let wrong_mint = ix(
        a::GiveMeMoney {
            owner: e.alice.pubkey(),
            payment_mint: other_mint,
            payment_token_account: ata(&e.alice.pubkey(), &other_mint),
            associated_token_program: associated_token::ID,
            token_program: token::ID,
            system_program: system_program::ID,
        },
        i::GiveMeMoney { amount: USDC },
    );
    assert!(e.send(wrong_mint, 1).is_err());
    assert_eq!(e.balance(alice_account), 1_000_000 * USDC);
    assert_eq!(e.balance(bob_account), 1_000_000 * USDC);
    assert!(e
        .svm
        .get_account(&ata(&e.alice.pubkey(), &other_mint))
        .is_none());
}

#[test]
fn spl_supply_overflow_rolls_back_faucet_payment() {
    let mut e = Env::uninitialized();
    e.send(e.init_payment_token_ix(), 0).unwrap();
    e.send(e.give_me_money_ix(e.alice.pubkey(), u64::MAX), 1)
        .unwrap();
    let mint_before = e.svm.get_account(&e.mint).unwrap();
    assert!(e.send(e.give_me_money_ix(e.bob.pubkey(), 1), 2).is_err());
    assert!(e.svm.get_account(&ata(&e.bob.pubkey(), &e.mint)).is_none());
    assert_eq!(e.svm.get_account(&e.mint).unwrap(), mint_before);
    assert_eq!(e.balance(ata(&e.alice.pubkey(), &e.mint)), u64::MAX);
}
