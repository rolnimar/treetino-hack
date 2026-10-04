use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub tree: Pubkey,
    pub owner: Pubkey,
    pub shares: u64,
    pub index: u128,
    pub pending_scaled: u128,
    /// Reserved for future fields; preserve on updates.
    pub reserved: [u8; 128],
}
