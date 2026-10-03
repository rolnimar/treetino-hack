use anchor_lang::prelude::*;

#[event]
pub struct InvoicePaid {
    pub tree: Pubkey,
    pub report: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsClaimed {
    pub tree: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct InvoiceIssued {
    pub tree: Pubkey,
    pub report: Pubkey,
    pub day_start_ts: i64,
    pub amount: u64,
}
