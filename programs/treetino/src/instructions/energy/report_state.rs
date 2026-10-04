use anchor_lang::prelude::*;

#[account]
pub struct Report {
    pub tree: Pubkey,
    /// Unix timestamp in seconds for the start of this UTC day.
    pub day_start_ts: i64,
    pub submitted_at: i64,
    pub reporter: Pubkey,
    /// Readings supplied by the reporter, without count or energy-value validation.
    pub wh: Vec<u32>,
    pub total_wh: u64,
    /// Backend invoice is immutable once issued, including a zero-amount bill.
    pub invoice_issued: bool,
    /// Final invoice amount in payment-mint base units; calculated off-chain.
    pub due: u64,
    pub paid: u64,
    /// Reserved for future fields; preserve on updates.
    pub reserved: [u8; 128],
}

impl Report {
    /// Discriminator, fixed fields and Vec length prefix, followed by the readings.
    pub fn space(reading_count: usize) -> usize {
        8 + 32 + 8 + 8 + 32 + 4 + 4 * reading_count + 8 + 1 + 8 + 8 + 128
    }
}
