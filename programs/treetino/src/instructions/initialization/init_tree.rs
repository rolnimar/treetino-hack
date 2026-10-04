use crate::{constants::seeds, errors::TreeError, instructions::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(tree_id: u64)]
pub struct InitTree<'info> {
    #[rustfmt::skip]
    #[account(
        mut
    )]
    pub creator: Signer<'info>,
    #[account(
        seeds = [seeds::ADMINS],
        bump,
        constraint = admin_config.admins.contains(&creator.key()) @ TreeError::Unauthorized
    )]
    pub admin_config: Account<'info, AdminConfig>,
    #[account(
        init,
        payer = creator,
        space = 8 + Tree::INIT_SPACE,
        seeds = [seeds::TREE, creator.key().as_ref(), &tree_id.to_le_bytes()],
        bump
    )]
    pub tree: Account<'info, Tree>,
    #[account(
        seeds = [seeds::PAYMENT_MINT],
        bump,
        constraint = payment_mint.decimals == 6
    )]
    pub payment_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        seeds = [seeds::SHARES, tree.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = tree,
        mint::freeze_authority = tree
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = creator,
        seeds = [seeds::FUNDING, tree.key().as_ref()],
        bump,
        token::mint = payment_mint,
        token::authority = tree
    )]
    pub funding_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = creator,
        seeds = [seeds::REVENUE, tree.key().as_ref()],
        bump,
        token::mint = payment_mint,
        token::authority = tree
    )]
    pub revenue_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn init_tree(
    ctx: Context<InitTree>,
    tree_id: u64,
    target: u64,
    supplier: Pubkey,
    client: Pubkey,
    reporter: Pubkey,
) -> Result<()> {
    require!(target > 0, TreeError::InvalidInput);
    require!(
        [supplier, client, reporter]
            .iter()
            .all(|k| *k != Pubkey::default() && *k != ctx.accounts.tree.key()),
        TreeError::InvalidInput
    );
    ctx.accounts.tree.set_inner(Tree {
        creator: ctx.accounts.creator.key(),
        seed_id: tree_id.to_le_bytes(),
        bump: ctx.bumps.tree,
        supplier,
        client,
        reporter,
        payment_mint: ctx.accounts.payment_mint.key(),
        share_mint: ctx.accounts.share_mint.key(),
        target,
        raised: 0,
        phase: Phase::Funding,
        next_day_start_ts: 0,
        total_wh: 0,
        billed: 0,
        paid: 0,
        claimed: 0,
        reward_index: 0,
        reward_remainder: 0,
        reserved: [0; 128],
    });
    emit_tree_changed(&ctx.accounts.tree);
    Ok(())
}
