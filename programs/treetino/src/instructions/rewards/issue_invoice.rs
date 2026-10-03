use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct IssueInvoice<'info> {
    /// Backend uses the tree creator's key as the billing authority in this MVP.
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = creator,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        mut,
        has_one = tree,
        seeds = [seeds::REPORT, tree.key().as_ref(), &report.day_start_ts.to_le_bytes()],
        bump
    )]
    pub report: Account<'info, Report>,
}

pub fn issue_invoice(ctx: Context<IssueInvoice>, amount: u64) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Active, TreeError::InvalidPhase);
    require!(!a.report.invoice_issued, TreeError::InvoiceAlreadyIssued);
    a.tree.billed = a
        .tree
        .billed
        .checked_add(amount)
        .ok_or(TreeError::Overflow)?;
    a.report.due = amount;
    a.report.invoice_issued = true;
    emit!(InvoiceIssued {
        tree: a.tree.key(),
        report: a.report.key(),
        day_start_ts: a.report.day_start_ts,
        amount,
    });
    Ok(())
}
