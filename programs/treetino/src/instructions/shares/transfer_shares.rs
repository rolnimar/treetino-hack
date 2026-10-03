use crate::utils::{freeze, move_tokens, thaw};
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct TransferShares<'info> {
    #[rustfmt::skip]
    #[account(
        mut
    )]
    pub owner: Signer<'info>,
    /// CHECK: recipient is a public key; ownership is enforced on their ATA and position.
    pub recipient: UncheckedAccount<'info>,
    #[account(
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        address = tree.share_mint
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = share_mint,
        associated_token::authority = owner
    )]
    pub share_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = share_mint,
        associated_token::authority = recipient
    )]
    pub recipient_share_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [seeds::POSITION, tree.key().as_ref(), owner.key().as_ref()],
        bump,
        has_one = tree,
        has_one = owner
    )]
    pub position: Account<'info, Position>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + Position::INIT_SPACE,
        seeds = [seeds::POSITION, tree.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub recipient_position: Account<'info, Position>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn transfer_shares(ctx: Context<TransferShares>, amount: u64) -> Result<()> {
    let a = ctx.accounts;
    require!(
        matches!(
            a.tree.phase,
            Phase::Funded | Phase::Purchased | Phase::Active
        ),
        TreeError::InvalidPhase
    );
    require!(
        amount > 0 && amount <= a.position.shares && a.owner.key() != a.recipient.key(),
        TreeError::InvalidInput
    );
    prepare_position(
        &mut a.position,
        a.tree.key(),
        a.owner.key(),
        a.tree.reward_index,
    )?;
    prepare_position(
        &mut a.recipient_position,
        a.tree.key(),
        a.recipient.key(),
        a.tree.reward_index,
    )?;
    require!(
        a.position.shares == a.share_token_account.amount
            && a.recipient_position.shares == a.recipient_share_token_account.amount,
        TreeError::BalanceMismatch
    );
    let seeds = a.tree.seeds();
    thaw(
        a.token_program.to_account_info(),
        &a.share_token_account,
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    thaw(
        a.token_program.to_account_info(),
        &a.recipient_share_token_account,
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    move_tokens(
        a.token_program.to_account_info(),
        a.share_token_account.to_account_info(),
        a.recipient_share_token_account.to_account_info(),
        a.owner.to_account_info(),
        &[],
        amount,
    )?;
    freeze(
        a.token_program.to_account_info(),
        a.share_token_account.to_account_info(),
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    freeze(
        a.token_program.to_account_info(),
        a.recipient_share_token_account.to_account_info(),
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    a.position.shares -= amount;
    a.recipient_position.shares = a
        .recipient_position
        .shares
        .checked_add(amount)
        .ok_or(TreeError::Overflow)?;
    emit!(SharesTransferred {
        tree: a.tree.key(),
        from: a.owner.key(),
        to: a.recipient.key(),
        amount
    });
    Ok(())
}
