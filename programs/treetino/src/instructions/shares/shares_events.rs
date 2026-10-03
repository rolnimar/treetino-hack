use anchor_lang::prelude::*;

#[event]
pub struct SharesTransferred {
    pub tree: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}
