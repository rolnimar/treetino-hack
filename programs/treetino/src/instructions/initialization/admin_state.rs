use crate::{constants::MAX_ADMINS, errors::TreeError};
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AdminConfig {
    #[max_len(10)]
    pub admins: Vec<Pubkey>,
    /// Reserved for future fields; preserve on updates.
    pub reserved: [u8; 128],
}

impl AdminConfig {
    pub fn set_admins(&mut self, admins: Vec<Pubkey>) -> Result<()> {
        require!(
            !admins.is_empty() && admins.len() <= MAX_ADMINS,
            TreeError::InvalidAdmins
        );
        for (index, admin) in admins.iter().enumerate() {
            require!(
                *admin != Pubkey::default() && !admins[..index].contains(admin),
                TreeError::InvalidAdmins
            );
        }
        self.admins = admins;
        Ok(())
    }
}
