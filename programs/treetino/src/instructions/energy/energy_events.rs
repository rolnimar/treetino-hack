use anchor_lang::prelude::*;

#[event]
pub struct ProductionReported {
    pub tree: Pubkey,
    pub report: Pubkey,
    pub day_start_ts: i64,
    pub total_wh: u64,
}
