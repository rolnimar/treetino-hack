use crate::utils::move_tokens;
use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct PurchaseTree<'info> {
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = creator,
        seeds = [seeds::TREE, tree.creator.as_ref(), &tree.seed_id],
        bump = tree.bump,
        constraint = tree.payment_mint == Pubkey::find_program_address(
            &[seeds::PAYMENT_MINT], &crate::ID
        ).0 @ TreeError::InvalidPaymentMint
    )]
    pub tree: Account<'info, Tree>,
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
        token::authority = tree.supplier
    )]
    pub supplier_payment_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn purchase_tree(ctx: Context<PurchaseTree>) -> Result<()> {
    let a = ctx.accounts;
    require!(a.tree.phase == Phase::Funded, TreeError::InvalidPhase);
    move_tokens(
        a.token_program.to_account_info(),
        a.funding_token_account.to_account_info(),
        a.supplier_payment_token_account.to_account_info(),
        a.tree.to_account_info(),
        &[&a.tree.seeds()],
        a.tree.target,
    )?;
    a.tree.phase = Phase::Purchased;
    emit_tree_changed(&a.tree);
    Ok(())
}
