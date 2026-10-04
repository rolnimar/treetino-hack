pub mod constants;
pub mod errors;
pub mod instructions;
pub mod utils;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n");

#[program]
pub mod treetino {
    use super::*;
    pub fn init_admins(ctx: Context<InitAdmins>, admins: Vec<Pubkey>) -> Result<()> {
        init_admins::init_admins(ctx, admins)
    }
    pub fn set_admins(ctx: Context<SetAdmins>, admins: Vec<Pubkey>) -> Result<()> {
        set_admins::set_admins(ctx, admins)
    }
    pub fn init_payment_token(ctx: Context<InitPaymentToken>) -> Result<()> {
        init_payment_token::init_payment_token(ctx)
    }
    pub fn give_me_money(ctx: Context<GiveMeMoney>, amount: u64) -> Result<()> {
        give_me_money::give_me_money(ctx, amount)
    }
    pub fn init_tree(
        ctx: Context<InitTree>,
        tree_id: u64,
        target: u64,
        supplier: Pubkey,
        client: Pubkey,
        reporter: Pubkey,
    ) -> Result<()> {
        init_tree::init_tree(ctx, tree_id, target, supplier, client, reporter)
    }
    pub fn buy_shares(ctx: Context<BuyShares>, amount: u64) -> Result<()> {
        buy_shares::buy_shares(ctx, amount)
    }
    pub fn purchase_tree(ctx: Context<PurchaseTree>) -> Result<()> {
        purchase_tree::purchase_tree(ctx)
    }
    pub fn activate_tree(ctx: Context<ActivateTree>, first_day_start_ts: i64) -> Result<()> {
        activate_tree::activate_tree(ctx, first_day_start_ts)
    }
    pub fn issue_invoice(ctx: Context<IssueInvoice>, amount: u64) -> Result<()> {
        issue_invoice::issue_invoice(ctx, amount)
    }
    pub fn submit_report(
        ctx: Context<SubmitReport>,
        day_start_ts: i64,
        wh: Vec<u32>,
    ) -> Result<()> {
        submit_report::submit_report(ctx, day_start_ts, wh)
    }
    pub fn pay_invoice(ctx: Context<PayInvoice>, amount: u64) -> Result<()> {
        pay_invoice::pay_invoice(ctx, amount)
    }
    pub fn transfer_shares(ctx: Context<TransferShares>, amount: u64) -> Result<()> {
        transfer_shares::transfer_shares(ctx, amount)
    }
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        claim_rewards::claim_rewards(ctx)
    }
}
