use crate::constants::seeds;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Phase {
    Funding,
    Funded,
    Purchased,
    Active,
}

#[account]
#[derive(InitSpace)]
pub struct Tree {
    pub creator: Pubkey,
    pub seed_id: [u8; 8],
    pub bump: u8,
    pub supplier: Pubkey,
    pub client: Pubkey,
    pub reporter: Pubkey,
    pub payment_mint: Pubkey,
    pub share_mint: Pubkey,
    pub target: u64,
    pub raised: u64,
    pub phase: Phase,
    pub next_day_start_ts: i64,
    pub total_wh: u64,
    pub billed: u64,
    pub paid: u64,
    pub claimed: u64,
    pub reward_index: u128,
    pub reward_remainder: u128,
    /// Reserved for future fields; preserve on updates.
    pub reserved: [u8; 128],
}
impl Tree {
    pub fn seeds(&self) -> [&[u8]; 4] {
        [
            seeds::TREE,
            self.creator.as_ref(),
            &self.seed_id,
            std::slice::from_ref(&self.bump),
        ]
    }
}
