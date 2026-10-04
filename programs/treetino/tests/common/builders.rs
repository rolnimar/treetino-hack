use super::*;

impl Env {
    pub fn init_admins_ix(&self, admins: Vec<Pubkey>) -> Instruction {
        ix(
            a::InitAdmins {
                authority: self.creator.pubkey(),
                program: treetino::ID,
                program_data: program_data(),
                admin_config: pda(&[seeds::ADMINS]),
                system_program: system_program::ID,
            },
            i::InitAdmins { admins },
        )
    }
    pub fn set_admins_ix(&self, authority: Pubkey, admins: Vec<Pubkey>) -> Instruction {
        ix(
            a::SetAdmins {
                authority,
                program: treetino::ID,
                program_data: program_data(),
                admin_config: pda(&[seeds::ADMINS]),
            },
            i::SetAdmins { admins },
        )
    }
    pub fn init_payment_token_ix(&self) -> Instruction {
        ix(
            a::InitPaymentToken {
                payer: self.creator.pubkey(),
                payment_mint: self.mint,
                payment_metadata: payment_metadata(&self.mint),
                metadata_program: metadata::ID,
                token_program: token::ID,
                system_program: system_program::ID,
                rent: Rent::id(),
            },
            i::InitPaymentToken {},
        )
    }
    pub fn give_me_money_ix(&self, owner: Pubkey, amount: u64) -> Instruction {
        ix(
            a::GiveMeMoney {
                owner,
                payment_mint: self.mint,
                payment_token_account: ata(&owner, &self.mint),
                associated_token_program: associated_token::ID,
                token_program: token::ID,
                system_program: system_program::ID,
            },
            i::GiveMeMoney { amount },
        )
    }
    pub fn init_tree_ix(&self, tree_id: u64, target: u64, payment_mint: Pubkey) -> Instruction {
        self.init_tree_for(self.creator.pubkey(), tree_id, target, payment_mint)
    }
    pub fn init_tree_for(
        &self,
        creator: Pubkey,
        tree_id: u64,
        target: u64,
        payment_mint: Pubkey,
    ) -> Instruction {
        let tree = pda(&[b"tree", creator.as_ref(), &tree_id.to_le_bytes()]);
        ix(
            a::InitTree {
                creator,
                admin_config: pda(&[seeds::ADMINS]),
                tree,
                payment_mint,
                share_mint: pda(&[b"shares", tree.as_ref()]),
                funding_token_account: pda(&[b"funding", tree.as_ref()]),
                revenue_token_account: pda(&[b"revenue", tree.as_ref()]),
                token_program: token::ID,
                system_program: system_program::ID,
            },
            i::InitTree {
                tree_id,
                target,
                supplier: self.supplier.pubkey(),
                client: self.client.pubkey(),
                reporter: self.device.pubkey(),
                max_interval_wh: 10_000,
            },
        )
    }
    pub fn investor(&self, owner: Pubkey) -> a::BuyShares {
        a::BuyShares {
            owner,
            tree: self.tree,
            share_mint: self.share_mint,
            funding_token_account: self.funding_token_account,
            payment_token_account: ata(&owner, &self.mint),
            share_token_account: ata(&owner, &self.share_mint),
            position: position(&self.tree, &owner),
            associated_token_program: associated_token::ID,
            token_program: token::ID,
            system_program: system_program::ID,
        }
    }
    pub fn buy(
        &mut self,
        who: usize,
        amount: u64,
    ) -> std::result::Result<(), Box<FailedTransactionMetadata>> {
        let owner = match who {
            1 => self.alice.pubkey(),
            2 => self.bob.pubkey(),
            _ => self.carol.pubkey(),
        };
        self.send(ix(self.investor(owner), i::BuyShares { amount }), who)
    }
    pub fn activate_accounts(&self) -> a::ActivateTree {
        a::ActivateTree {
            creator: self.creator.pubkey(),
            tree: self.tree,
            share_mint: self.share_mint,
            token_program: token::ID,
        }
    }
    pub fn activate(&mut self) {
        let purchase = ix(
            a::PurchaseTree {
                creator: self.creator.pubkey(),
                tree: self.tree,
                funding_token_account: self.funding_token_account,
                supplier_payment_token_account: ata(&self.supplier.pubkey(), &self.mint),
                token_program: token::ID,
            },
            i::PurchaseTree {},
        );
        self.send(purchase, 0).unwrap();
        self.send(
            ix(
                self.activate_accounts(),
                i::ActivateTree {
                    first_day_start_ts: START,
                },
            ),
            0,
        )
        .unwrap();
    }
    pub fn invoice_ix(&self, day_start_ts: i64, amount: u64) -> Instruction {
        ix(
            a::IssueInvoice {
                creator: self.creator.pubkey(),
                tree: self.tree,
                report: self.report_key(day_start_ts),
            },
            i::IssueInvoice { amount },
        )
    }
    pub fn invoice(
        &mut self,
        day_start_ts: i64,
        amount: u64,
    ) -> std::result::Result<(), Box<FailedTransactionMetadata>> {
        self.send(self.invoice_ix(day_start_ts, amount), 0)
    }
    pub fn report(&self, day_start_ts: i64, wh: Vec<u32>) -> Instruction {
        ix(
            a::SubmitReport {
                reporter: self.device.pubkey(),
                tree: self.tree,
                report: pda(&[b"report", self.tree.as_ref(), &day_start_ts.to_le_bytes()]),
                system_program: system_program::ID,
            },
            i::SubmitReport { day_start_ts, wh },
        )
    }
    pub fn report_key(&self, day_start_ts: i64) -> Pubkey {
        pda(&[b"report", self.tree.as_ref(), &day_start_ts.to_le_bytes()])
    }
    pub fn pay(
        &mut self,
        day_start_ts: i64,
        amount: u64,
    ) -> std::result::Result<(), Box<FailedTransactionMetadata>> {
        self.send(
            ix(
                a::PayInvoice {
                    client: self.client.pubkey(),
                    tree: self.tree,
                    report: self.report_key(day_start_ts),
                    payment_token_account: ata(&self.client.pubkey(), &self.mint),
                    revenue_token_account: self.revenue_token_account,
                    token_program: token::ID,
                },
                i::PayInvoice { amount },
            ),
            4,
        )
    }
    pub fn transfer_ix(&self, from: Pubkey, to: Pubkey, amount: u64) -> Instruction {
        ix(
            a::TransferShares {
                owner: from,
                recipient: to,
                tree: self.tree,
                share_mint: self.share_mint,
                share_token_account: ata(&from, &self.share_mint),
                recipient_share_token_account: ata(&to, &self.share_mint),
                position: position(&self.tree, &from),
                recipient_position: position(&self.tree, &to),
                associated_token_program: associated_token::ID,
                token_program: token::ID,
                system_program: system_program::ID,
            },
            i::TransferShares { amount },
        )
    }
    pub fn claim(&mut self, who: usize) -> std::result::Result<(), Box<FailedTransactionMetadata>> {
        let owner = match who {
            1 => self.alice.pubkey(),
            2 => self.bob.pubkey(),
            _ => self.carol.pubkey(),
        };
        self.send(
            ix(
                a::ClaimRewards {
                    owner,
                    tree: self.tree,
                    position: position(&self.tree, &owner),
                    revenue_token_account: self.revenue_token_account,
                    payment_token_account: ata(&owner, &self.mint),
                    token_program: token::ID,
                },
                i::ClaimRewards {},
            ),
            who,
        )
    }
}
