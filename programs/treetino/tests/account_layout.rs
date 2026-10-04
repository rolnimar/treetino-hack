mod common;
use common::*;

fn store(e: &mut Env, key: Pubkey, value: impl AccountSerialize) {
    let mut account = e.svm.get_account(&key).unwrap();
    value
        .try_serialize(&mut account.data.as_mut_slice())
        .unwrap();
    e.svm.set_account(key, account).unwrap();
}

#[test]
fn account_reserves_are_allocated_zeroed_and_preserved_through_updates() {
    let mut e = Env::new(USDC);
    let admin_key = pda(&[seeds::ADMINS]);
    let position_key = position(&e.tree, &e.alice.pubkey());
    assert_eq!(e.svm.get_account(&e.tree).unwrap().data.len(), 430);
    assert_eq!(e.svm.get_account(&admin_key).unwrap().data.len(), 460);
    assert_eq!(e.tree().reserved, [0; 128]);
    assert_eq!(e.read::<AdminConfig>(admin_key).reserved, [0; 128]);
    e.buy(1, USDC).unwrap();
    assert_eq!(e.svm.get_account(&position_key).unwrap().data.len(), 240);
    assert_eq!(e.read::<Position>(position_key).reserved, [0; 128]);
    e.activate();
    e.set_time(START + DAY);
    e.send(e.report(START, vec![1; INTERVALS]), 5).unwrap();
    let report_key = e.report_key(START);
    assert_eq!(e.svm.get_account(&report_key).unwrap().data.len(), 625);
    assert_eq!(e.read::<Report>(report_key).reserved, [0; 128]);

    // Future fields stored in the reserve must survive current instruction writes.
    let mut tree = e.tree();
    tree.reserved = [11; 128];
    let tree_key = e.tree;
    store(&mut e, tree_key, tree);
    let mut admins = e.read::<AdminConfig>(admin_key);
    admins.reserved = [12; 128];
    store(&mut e, admin_key, admins);
    let mut investor = e.read::<Position>(position_key);
    investor.reserved = [13; 128];
    store(&mut e, position_key, investor);
    let mut report = e.read::<Report>(report_key);
    report.reserved = [14; 128];
    store(&mut e, report_key, report);

    e.send(
        e.set_admins_ix(
            e.creator.pubkey(),
            vec![e.creator.pubkey(), e.alice.pubkey()],
        ),
        0,
    )
    .unwrap();
    e.send(e.transfer_ix(e.alice.pubkey(), e.bob.pubkey(), USDC / 2), 1)
        .unwrap();
    let recipient_key = position(&e.tree, &e.bob.pubkey());
    assert_eq!(e.svm.get_account(&recipient_key).unwrap().data.len(), 240);
    assert_eq!(e.read::<Position>(recipient_key).reserved, [0; 128]);
    e.invoice(START, USDC).unwrap();
    e.pay(START, USDC).unwrap();
    e.claim(1).unwrap();
    e.claim(2).unwrap();
    assert_eq!(e.tree().reserved, [11; 128]);
    assert_eq!(e.read::<AdminConfig>(admin_key).reserved, [12; 128]);
    assert_eq!(e.read::<Position>(position_key).reserved, [13; 128]);
    assert_eq!(e.read::<Report>(report_key).reserved, [14; 128]);
}
