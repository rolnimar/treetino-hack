use crate::constants::DAY;
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct ActivateTree<'info> {
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
        address = tree.share_mint
    )]
    pub share_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

pub fn activate_tree(ctx: Context<ActivateTree>, first_day_start_ts: i64) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Purchased, TreeError::InvalidPhase);
    require!(
        first_day_start_ts >= 0 && first_day_start_ts % DAY == 0,
        TreeError::InvalidDay
    );
    a.tree.next_day_start_ts = first_day_start_ts;
    a.tree.phase = Phase::Active;
    emit_tree_changed(&a.tree);
    Ok(())
}
