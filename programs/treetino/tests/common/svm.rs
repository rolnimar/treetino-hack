use super::*;

pub struct Env {
    pub svm: LiteSVM,
    pub fee: Keypair,
    pub creator: Keypair,
    pub alice: Keypair,
    pub bob: Keypair,
    pub carol: Keypair,
    pub client: Keypair,
    pub device: Keypair,
    pub supplier: Keypair,
    pub mint: Pubkey,
    pub tree: Pubkey,
    pub share_mint: Pubkey,
    pub funding_token_account: Pubkey,
    pub revenue_token_account: Pubkey,
}

impl Env {
    pub fn uninitialized() -> Self {
        let mut svm = LiteSVM::new();
        svm.add_program(
            treetino::id(),
            include_bytes!("../../../../target/deploy/treetino.so"),
        )
        .unwrap();
        svm.add_program(
            metadata::ID,
            include_bytes!("../../../../target/deploy/mpl_token_metadata.so"),
        )
        .unwrap();
        let fee = Keypair::new();
        let creator = Keypair::new();
        let alice = Keypair::new();
        let bob = Keypair::new();
        let carol = Keypair::new();
        let client = Keypair::new();
        let device = Keypair::new();
        let supplier = Keypair::new();
        for key in [
            &fee, &creator, &alice, &bob, &carol, &client, &device, &supplier,
        ] {
            svm.airdrop(&key.pubkey(), 10_000_000_000).unwrap();
        }
        let mut clock: solana_clock::Clock = svm.get_sysvar();
        clock.unix_timestamp = START;
        svm.set_sysvar(&clock);
        let mint = pda(&[seeds::PAYMENT_MINT]);
        let tree = pda(&[b"tree", creator.pubkey().as_ref(), &1u64.to_le_bytes()]);
        let share_mint = pda(&[b"shares", tree.as_ref()]);
        let funding_token_account = pda(&[b"funding", tree.as_ref()]);
        let revenue_token_account = pda(&[b"revenue", tree.as_ref()]);
        let mut e = Self {
            svm,
            fee,
            creator,
            alice,
            bob,
            carol,
            client,
            device,
            supplier,
            mint,
            tree,
            share_mint,
            funding_token_account,
            revenue_token_account,
        };
        e.set_upgrade_authority(Some(e.creator.pubkey()));
        e
    }
    pub fn set_upgrade_authority(&mut self, authority: Option<Pubkey>) {
        use anchor_lang::solana_program::bpf_loader_upgradeable::UpgradeableLoaderState;
        let mut account = self.svm.get_account(&program_data()).unwrap();
        bincode::serialize_into(
            account.data.as_mut_slice(),
            &UpgradeableLoaderState::ProgramData {
                slot: 0,
                upgrade_authority_address: authority,
            },
        )
        .unwrap();
        self.svm.set_account(program_data(), account).unwrap();
    }
    pub fn new(target: u64) -> Self {
        let mut e = Self::uninitialized();
        e.send(e.init_admins_ix(vec![e.creator.pubkey()]), 0)
            .unwrap();
        e.send(e.init_payment_token_ix(), 0).unwrap();
        // All demo balances are issued through the permissionless faucet.
        for (owner, who) in [
            (e.alice.pubkey(), 1),
            (e.bob.pubkey(), 2),
            (e.carol.pubkey(), 3),
            (e.client.pubkey(), 4),
            (e.supplier.pubkey(), 6),
            (e.creator.pubkey(), 0),
        ] {
            e.send(e.give_me_money_ix(owner, 1_000_000 * USDC), who)
                .unwrap();
        }
        e.send(e.init_tree_ix(1, target, e.mint), 0).unwrap();
        e
    }
    pub fn send(
        &mut self,
        instruction: Instruction,
        who: usize,
    ) -> std::result::Result<(), Box<FailedTransactionMetadata>> {
        self.svm.expire_blockhash();
        let signer = match who {
            0 => &self.creator,
            1 => &self.alice,
            2 => &self.bob,
            3 => &self.carol,
            4 => &self.client,
            5 => &self.device,
            6 => &self.supplier,
            _ => panic!(),
        };
        let tx = Transaction::new(
            &[&self.fee, signer],
            Message::new(&[instruction], Some(&self.fee.pubkey())),
            self.svm.latest_blockhash(),
        );
        assert!(
            wincode::serialize(&tx).unwrap().len() <= 1232,
            "instruction exceeds Solana packet limit"
        );
        self.svm.send_transaction(tx).map(|_| ()).map_err(Box::new)
    }
    pub fn read<T: AccountDeserialize>(&self, key: Pubkey) -> T {
        T::try_deserialize(&mut self.svm.get_account(&key).unwrap().data.as_slice()).unwrap()
    }
    pub fn tree(&self) -> Tree {
        self.read(self.tree)
    }
    pub fn balance(&self, key: Pubkey) -> u64 {
        spl_token::state::Account::unpack(&self.svm.get_account(&key).unwrap().data)
            .unwrap()
            .amount
    }
    pub fn set_time(&mut self, time: i64) {
        let mut clock: solana_clock::Clock = self.svm.get_sysvar();
        clock.unix_timestamp = time;
        self.svm.set_sysvar(&clock);
    }
}
