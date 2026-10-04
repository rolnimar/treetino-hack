use crate::utils::{freeze, move_tokens, revoke_mint, thaw};
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[rustfmt::skip]
    #[account(
        mut
    )]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump,
        constraint = tree.payment_mint == Pubkey::find_program_address(
            &[seeds::PAYMENT_MINT], &crate::ID
        ).0 @ TreeError::InvalidPaymentMint
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        mut,
        address = tree.share_mint
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [seeds::FUNDING, tree.key().as_ref()],
        bump,
        token::mint = tree.payment_mint,
        token::authority = tree
    )]
    pub funding_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = tree.payment_mint,
        token::authority = owner
    )]
    pub payment_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = share_mint,
        associated_token::authority = owner
    )]
    pub share_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + Position::INIT_SPACE,
        seeds = [seeds::POSITION, tree.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn buy_shares(ctx: Context<BuyShares>, amount: u64) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Funding, TreeError::InvalidPhase);
    require!(amount > 0, TreeError::InvalidInput);
    let raised = a
        .tree
        .raised
        .checked_add(amount)
        .ok_or(TreeError::Overflow)?;
    require!(raised <= a.tree.target, TreeError::FundingCap);
    prepare_position(
        &mut a.position,
        a.tree.key(),
        a.owner.key(),
        a.tree.reward_index,
    )?;
    require!(
        a.position.shares == a.share_token_account.amount,
        TreeError::BalanceMismatch
    );
    move_tokens(
        a.token_program.to_account_info(),
        a.payment_token_account.to_account_info(),
        a.funding_token_account.to_account_info(),
        a.owner.to_account_info(),
        &[],
        amount,
    )?;
    let seeds = a.tree.seeds();
    thaw(
        a.token_program.to_account_info(),
        &a.share_token_account,
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    token::mint_to(
        CpiContext::new_with_signer(
            a.token_program.key(),
            token::MintTo {
                mint: a.share_mint.to_account_info(),
                to: a.share_token_account.to_account_info(),
                authority: a.tree.to_account_info(),
            },
            &[&seeds],
        ),
        amount,
    )?;
    freeze(
        a.token_program.to_account_info(),
        a.share_token_account.to_account_info(),
        a.share_mint.to_account_info(),
        a.tree.to_account_info(),
        &[&seeds],
    )?;
    a.position.shares = a
        .position
        .shares
        .checked_add(amount)
        .ok_or(TreeError::Overflow)?;
    a.tree.raised = raised;
    if raised == a.tree.target {
        a.tree.phase = Phase::Funded;
        revoke_mint(
            a.token_program.to_account_info(),
            a.share_mint.to_account_info(),
            &a.tree,
        )?;
    }
    emit_tree_changed(&a.tree);
    Ok(())
}
