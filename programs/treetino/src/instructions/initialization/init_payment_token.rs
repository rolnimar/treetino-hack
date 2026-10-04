use crate::constants::{seeds, PAYMENT_TOKEN_NAME, PAYMENT_TOKEN_SYMBOL};
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{self, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3, Metadata},
    token::{Mint, Token},
};

#[derive(Accounts)]
pub struct InitPaymentToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [seeds::PAYMENT_MINT],
        bump,
        mint::decimals = 6,
        mint::authority = payment_mint
    )]
    pub payment_mint: Account<'info, Mint>,
    /// CHECK: The canonical metadata PDA is validated here and created by Metaplex.
    #[account(
        mut,
        seeds = [b"metadata", metadata_program.key().as_ref(), payment_mint.key().as_ref()],
        bump,
        seeds::program = metadata_program.key()
    )]
    pub payment_metadata: UncheckedAccount<'info>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn init_payment_token(ctx: Context<InitPaymentToken>) -> Result<()> {
    let signer_seeds: &[&[u8]] = &[seeds::PAYMENT_MINT, &[ctx.bumps.payment_mint]];
    metadata::create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.metadata_program.key(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.payment_metadata.to_account_info(),
                mint: ctx.accounts.payment_mint.to_account_info(),
                mint_authority: ctx.accounts.payment_mint.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.payment_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &[signer_seeds],
        ),
        DataV2 {
            name: PAYMENT_TOKEN_NAME.to_owned(),
            symbol: PAYMENT_TOKEN_SYMBOL.to_owned(),
            uri: String::new(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false,
        true,
        None,
    )
}
