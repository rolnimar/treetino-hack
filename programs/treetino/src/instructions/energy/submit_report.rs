use crate::constants::DAY;
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(day_start_ts: i64, wh: Vec<u32>)]
pub struct SubmitReport<'info> {
    #[rustfmt::skip]
    #[account(
        mut
    )]
    pub reporter: Signer<'info>,
    #[account(
        mut,
        has_one = reporter,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        init,
        payer = reporter,
        space = Report::space(wh.len()),
        seeds = [seeds::REPORT, tree.key().as_ref(), &day_start_ts.to_le_bytes()],
        bump
    )]
    pub report: Account<'info, Report>,
    pub system_program: Program<'info, System>,
}

pub fn submit_report(ctx: Context<SubmitReport>, day_start_ts: i64, wh: Vec<u32>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Active, TreeError::InvalidPhase);
    let now = Clock::get()?.unix_timestamp;
    let next = day_start_ts.checked_add(DAY).ok_or(TreeError::Overflow)?;
    require!(
        day_start_ts >= 0 && day_start_ts % DAY == 0 && next <= now,
        TreeError::InvalidDay
    );
    let total_wh = wh
        .iter()
        .try_fold(0u64, |sum, x| sum.checked_add(*x as u64))
        .ok_or(TreeError::Overflow)?;
    a.tree.total_wh = a
        .tree
        .total_wh
        .checked_add(total_wh)
        .ok_or(TreeError::Overflow)?;
    // Historical submissions must not move the automatic reporting cursor backwards.
    a.tree.next_day_start_ts = a.tree.next_day_start_ts.max(next);
    a.report.set_inner(Report {
        tree: a.tree.key(),
        day_start_ts,
        submitted_at: now,
        reporter: a.reporter.key(),
        wh,
        total_wh,
        invoice_issued: false,
        due: 0,
        paid: 0,
        reserved: [0; 128],
    });
    emit!(ProductionReported {
        tree: a.tree.key(),
        report: a.report.key(),
        day_start_ts,
        total_wh
    });
    Ok(())
}
