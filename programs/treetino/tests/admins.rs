mod common;
use common::*;

fn assert_no_tree(e: &Env, creator: Pubkey, id: u64) {
    let tree = pda(&[seeds::TREE, creator.as_ref(), &id.to_le_bytes()]);
    for key in [
        tree,
        pda(&[seeds::SHARES, tree.as_ref()]),
        pda(&[seeds::FUNDING, tree.as_ref()]),
        pda(&[seeds::REVENUE, tree.as_ref()]),
    ] {
        assert!(e.svm.get_account(&key).is_none());
    }
}

#[test]
fn only_real_upgrade_authority_can_initialize_singleton_admin_list() {
    let mut e = Env::uninitialized();
    e.send(e.init_payment_token_ix(), 0).unwrap();
    assert!(e.send(e.init_tree_ix(1, USDC, e.mint), 0).is_err());
    assert_no_tree(&e, e.creator.pubkey(), 1);

    let mut outsider = e.init_admins_ix(vec![e.alice.pubkey()]);
    outsider.accounts[0].pubkey = e.alice.pubkey();
    custom(e.send(outsider, 1), TreeError::Unauthorized);
    assert!(e.svm.get_account(&pda(&[seeds::ADMINS])).is_none());

    // A loader-owned account containing the right authority must also be linked
    // to this exact program; otherwise another program's authority could take over.
    let counterfeit = Pubkey::new_unique();
    e.svm
        .set_account(counterfeit, e.svm.get_account(&program_data()).unwrap())
        .unwrap();
    let mut wrong_program_data = e.init_admins_ix(vec![e.creator.pubkey()]);
    wrong_program_data.accounts[2].pubkey = counterfeit;
    custom(e.send(wrong_program_data, 0), TreeError::Unauthorized);
    assert!(e.svm.get_account(&pda(&[seeds::ADMINS])).is_none());

    e.send(e.init_admins_ix(vec![e.creator.pubkey()]), 0)
        .unwrap();
    assert!(e.send(e.init_admins_ix(vec![e.alice.pubkey()]), 0).is_err());
    assert_eq!(
        e.read::<AdminConfig>(pda(&[seeds::ADMINS])).admins,
        vec![e.creator.pubkey()]
    );
}

#[test]
fn admin_list_accepts_ten_distinct_wallets_and_each_can_create_a_tree() {
    let mut e = Env::uninitialized();
    for admins in [
        vec![],
        vec![Pubkey::default()],
        vec![e.creator.pubkey(); 2],
        (0..11).map(|_| Pubkey::new_unique()).collect(),
    ] {
        custom(
            e.send(e.init_admins_ix(admins), 0),
            TreeError::InvalidAdmins,
        );
        assert!(e.svm.get_account(&pda(&[seeds::ADMINS])).is_none());
    }
    let admins: Vec<Keypair> = (0..MAX_ADMINS).map(|_| Keypair::new()).collect();
    let wallets = admins
        .iter()
        .map(|admin| admin.pubkey())
        .collect::<Vec<_>>();
    e.send(e.init_admins_ix(wallets.clone()), 0).unwrap();
    e.send(e.init_payment_token_ix(), 0).unwrap();
    assert_eq!(e.read::<AdminConfig>(pda(&[seeds::ADMINS])).admins, wallets);
    for (index, admin) in admins.iter().enumerate() {
        e.svm.airdrop(&admin.pubkey(), 10_000_000_000).unwrap();
        e.svm.expire_blockhash();
        let id = index as u64;
        let instruction = e.init_tree_for(admin.pubkey(), id, USDC, e.mint);
        let transaction = Transaction::new(
            &[&e.fee, admin],
            Message::new(&[instruction], Some(&e.fee.pubkey())),
            e.svm.latest_blockhash(),
        );
        e.svm.send_transaction(transaction).unwrap();
        let tree = pda(&[seeds::TREE, admin.pubkey().as_ref(), &id.to_le_bytes()]);
        assert_eq!(e.read::<Tree>(tree).creator, admin.pubkey());
    }
}

#[test]
fn tree_creation_tracks_current_admin_membership() {
    let mut e = Env::new(USDC);
    custom(
        e.send(e.init_tree_for(e.alice.pubkey(), 2, USDC, e.mint), 1),
        TreeError::Unauthorized,
    );
    assert_no_tree(&e, e.alice.pubkey(), 2);
    e.send(
        e.set_admins_ix(e.creator.pubkey(), vec![e.alice.pubkey()]),
        0,
    )
    .unwrap();
    custom(
        e.send(e.init_tree_ix(2, USDC, e.mint), 0),
        TreeError::Unauthorized,
    );
    assert_no_tree(&e, e.creator.pubkey(), 2);
    e.send(e.init_tree_for(e.alice.pubkey(), 2, USDC, e.mint), 1)
        .unwrap();
    // Removing an admin does not modify their existing tree or creator role.
    assert_eq!(e.tree().creator, e.creator.pubkey());
    e.buy(1, USDC).unwrap();
    e.activate();
    assert_eq!(e.tree().phase, Phase::Active);
}

#[test]
fn only_current_upgrade_authority_can_change_the_list() {
    let mut e = Env::new(USDC);
    let initial = vec![e.creator.pubkey(), e.alice.pubkey()];
    e.send(e.set_admins_ix(e.creator.pubkey(), initial.clone()), 0)
        .unwrap();
    custom(
        e.send(e.set_admins_ix(e.alice.pubkey(), vec![e.alice.pubkey()]), 1),
        TreeError::Unauthorized,
    );
    assert_eq!(e.read::<AdminConfig>(pda(&[seeds::ADMINS])).admins, initial);
    e.set_upgrade_authority(Some(e.bob.pubkey()));
    custom(
        e.send(
            e.set_admins_ix(e.creator.pubkey(), vec![e.creator.pubkey()]),
            0,
        ),
        TreeError::Unauthorized,
    );
    e.send(e.set_admins_ix(e.bob.pubkey(), vec![e.bob.pubkey()]), 2)
        .unwrap();
    assert_eq!(
        e.read::<AdminConfig>(pda(&[seeds::ADMINS])).admins,
        vec![e.bob.pubkey()]
    );
    e.set_upgrade_authority(None);
    custom(
        e.send(e.set_admins_ix(e.bob.pubkey(), vec![e.alice.pubkey()]), 2),
        TreeError::Unauthorized,
    );
}

#[test]
fn invalid_admin_updates_preserve_existing_access() {
    let mut e = Env::new(USDC);
    let before = e.svm.get_account(&pda(&[seeds::ADMINS])).unwrap();
    for admins in [
        vec![],
        vec![Pubkey::default()],
        vec![e.alice.pubkey(); 2],
        (0..11).map(|_| Pubkey::new_unique()).collect(),
    ] {
        custom(
            e.send(e.set_admins_ix(e.creator.pubkey(), admins), 0),
            TreeError::InvalidAdmins,
        );
        assert_eq!(e.svm.get_account(&pda(&[seeds::ADMINS])).unwrap(), before);
    }
    e.send(e.init_tree_ix(2, USDC, e.mint), 0).unwrap();
}

#[test]
fn substituting_another_admin_account_cannot_bypass_membership() {
    let mut e = Env::new(USDC);
    let counterfeit = Pubkey::new_unique();
    let mut account = e.svm.get_account(&pda(&[seeds::ADMINS])).unwrap();
    AdminConfig {
        admins: vec![e.alice.pubkey()],
        reserved: [0; 128],
    }
    .try_serialize(&mut account.data.as_mut_slice())
    .unwrap();
    e.svm.set_account(counterfeit, account).unwrap();
    let mut instruction = e.init_tree_for(e.alice.pubkey(), 2, USDC, e.mint);
    instruction.accounts[1].pubkey = counterfeit;
    assert!(e.send(instruction, 1).is_err());
    assert_no_tree(&e, e.alice.pubkey(), 2);
}
