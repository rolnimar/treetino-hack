use crate::constants::SCALE;
use crate::utils::move_tokens;
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        mut,
        seeds = [seeds::POSITION, tree.key().as_ref(), owner.key().as_ref()],
        bump,
        has_one = tree,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [seeds::REVENUE, tree.key().as_ref()],
        bump,
        token::mint = tree.payment_mint,
        token::authority = tree
    )]
    pub revenue_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = tree.payment_mint,
        token::authority = owner
    )]
    pub payment_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Active, TreeError::InvalidPhase);
    prepare_position(
        &mut a.position,
        a.tree.key(),
        a.owner.key(),
        a.tree.reward_index,
    )?;
    let amount =
        u64::try_from(a.position.pending_scaled / SCALE).map_err(|_| TreeError::Overflow)?;
    require!(amount > 0, TreeError::NoRewards);
    require!(
        amount <= a.tree.paid - a.tree.claimed,
        TreeError::BalanceMismatch
    );
    move_tokens(
        a.token_program.to_account_info(),
        a.revenue_token_account.to_account_info(),
        a.payment_token_account.to_account_info(),
        a.tree.to_account_info(),
        &[&a.tree.seeds()],
        amount,
    )?;
    a.position.pending_scaled %= SCALE;
    a.tree.claimed = a
        .tree
        .claimed
        .checked_add(amount)
        .ok_or(TreeError::Overflow)?;
    emit!(RewardsClaimed {
        tree: a.tree.key(),
        owner: a.owner.key(),
        amount
    });
    Ok(())
}
