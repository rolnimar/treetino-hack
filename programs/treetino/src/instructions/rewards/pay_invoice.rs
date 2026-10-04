use crate::utils::move_tokens;
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct PayInvoice<'info> {
    pub client: Signer<'info>,
    #[account(
        mut,
        has_one = client,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump,
        constraint = tree.payment_mint == Pubkey::find_program_address(
            &[seeds::PAYMENT_MINT], &crate::ID
        ).0 @ TreeError::InvalidPaymentMint
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        mut,
        has_one = tree,
        seeds = [seeds::REPORT, tree.key().as_ref(), &report.day_start_ts.to_le_bytes()],
        bump
    )]
    pub report: Account<'info, Report>,
    #[account(
        mut,
        token::mint = tree.payment_mint,
        token::authority = client
    )]
    pub payment_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [seeds::REVENUE, tree.key().as_ref()],
        bump,
        token::mint = tree.payment_mint,
        token::authority = tree
    )]
    pub revenue_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn pay_invoice(ctx: Context<PayInvoice>, amount: u64) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Active, TreeError::InvalidPhase);
    require!(a.report.invoice_issued, TreeError::InvoiceNotIssued);
    require!(amount > 0, TreeError::InvalidInput);
    require!(
        amount <= a.report.due - a.report.paid,
        TreeError::Overpayment
    );
    move_tokens(
        a.token_program.to_account_info(),
        a.payment_token_account.to_account_info(),
        a.revenue_token_account.to_account_info(),
        a.client.to_account_info(),
        &[],
        amount,
    )?;
    a.report.paid += amount;
    credit_rewards(&mut a.tree, amount)?;
    emit!(InvoicePaid {
        tree: a.tree.key(),
        report: a.report.key(),
        amount
    });
    Ok(())
}
