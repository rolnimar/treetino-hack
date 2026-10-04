use crate::{constants::seeds, errors::TreeError, instructions::AdminConfig, program::Treetino};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetAdmins<'info> {
    pub authority: Signer<'info>,
    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()) @ TreeError::Unauthorized
    )]
    pub program: Program<'info, Treetino>,
    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ TreeError::Unauthorized
    )]
    pub program_data: Account<'info, ProgramData>,
    #[account(mut, seeds = [seeds::ADMINS], bump)]
    pub admin_config: Account<'info, AdminConfig>,
}

pub fn set_admins(ctx: Context<SetAdmins>, admins: Vec<Pubkey>) -> Result<()> {
    ctx.accounts.admin_config.set_admins(admins)
}
