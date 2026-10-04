use crate::{constants::seeds, errors::TreeError, instructions::AdminConfig, program::Treetino};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitAdmins<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()) @ TreeError::Unauthorized
    )]
    pub program: Program<'info, Treetino>,
    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ TreeError::Unauthorized
    )]
    pub program_data: Account<'info, ProgramData>,
    #[account(
        init,
        payer = authority,
        space = 8 + AdminConfig::INIT_SPACE,
        seeds = [seeds::ADMINS],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    pub system_program: Program<'info, System>,
}

pub fn init_admins(ctx: Context<InitAdmins>, admins: Vec<Pubkey>) -> Result<()> {
    ctx.accounts.admin_config.reserved = [0; 128];
    ctx.accounts.admin_config.set_admins(admins)
}
