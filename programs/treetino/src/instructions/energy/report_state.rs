use crate::constants::INTERVALS;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Report {
    pub tree: Pubkey,
    /// Unix timestamp in seconds for the start of this UTC day.
    pub day_start_ts: i64,
    pub submitted_at: i64,
    pub reporter: Pubkey,
    pub wh: [u32; INTERVALS],
    pub total_wh: u64,
    /// Backend invoice is immutable once issued, including a zero-amount bill.
    pub invoice_issued: bool,
    /// Final invoice amount in payment-mint base units; calculated off-chain.
    pub due: u64,
    pub paid: u64,
}
