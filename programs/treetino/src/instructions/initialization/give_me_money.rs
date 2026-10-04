use crate::{constants::seeds, errors::TreeError};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct GiveMeMoney<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::PAYMENT_MINT],
        bump,
        mint::authority = payment_mint
    )]
    pub payment_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = payment_mint,
        associated_token::authority = owner
    )]
    pub payment_token_account: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn give_me_money(ctx: Context<GiveMeMoney>, amount: u64) -> Result<()> {
    require!(amount > 0, TreeError::InvalidInput);
    let signer_seeds: &[&[u8]] = &[seeds::PAYMENT_MINT, &[ctx.bumps.payment_mint]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            token::MintTo {
                mint: ctx.accounts.payment_mint.to_account_info(),
                to: ctx.accounts.payment_token_account.to_account_info(),
                authority: ctx.accounts.payment_mint.to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
    )
}
