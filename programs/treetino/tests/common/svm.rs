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
    pub fn new(target: u64) -> Self {
        let mut svm = LiteSVM::new();
        svm.add_program(
            treetino::id(),
            include_bytes!("../../../../target/deploy/treetino.so"),
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
        // Seed only mock USDC fixtures. Share mint/ATAs/vaults are created by real CPIs.
        let mint = Pubkey::new_unique();
        let mut data = vec![0; spl_token::state::Mint::LEN];
        spl_token::state::Mint::pack(
            spl_token::state::Mint {
                mint_authority: COption::Some(creator.pubkey()),
                supply: 6_000_000 * USDC,
                decimals: 6,
                is_initialized: true,
                freeze_authority: COption::None,
            },
            &mut data,
        )
        .unwrap();
        svm.set_account(
            mint,
            SolAccount {
                lamports: 10_000_000,
                data,
                owner: token::ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();
        for key in [&alice, &bob, &carol, &client, &supplier, &creator] {
            let mut data = vec![0; spl_token::state::Account::LEN];
            spl_token::state::Account::pack(
                spl_token::state::Account {
                    mint,
                    owner: key.pubkey(),
                    amount: 1_000_000 * USDC,
                    delegate: COption::None,
                    state: spl_token::state::AccountState::Initialized,
                    is_native: COption::None,
                    delegated_amount: 0,
                    close_authority: COption::None,
                },
                &mut data,
            )
            .unwrap();
            svm.set_account(
                ata(&key.pubkey(), &mint),
                SolAccount {
                    lamports: 10_000_000,
                    data,
                    owner: token::ID,
                    executable: false,
                    rent_epoch: 0,
                },
            )
            .unwrap();
        }
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
        let init = ix(
            a::InitTree {
                creator: e.creator.pubkey(),
                tree,
                payment_mint: mint,
                share_mint,
                funding_token_account,
                revenue_token_account,
                token_program: token::ID,
                system_program: system_program::ID,
            },
            i::InitTree {
                tree_id: 1,
                target,
                supplier: e.supplier.pubkey(),
                client: e.client.pubkey(),
                reporter: e.device.pubkey(),
                max_interval_wh: 10_000,
            },
        );
        e.send(init, 0).unwrap();
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
