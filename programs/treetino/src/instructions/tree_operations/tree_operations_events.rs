use super::tree_state::{Phase, Tree};
use anchor_lang::prelude::*;

#[event]
pub struct TreeChanged {
    pub tree: Pubkey,
    pub phase: Phase,
    pub raised: u64,
}

pub(crate) fn emit_tree_changed(tree: &Account<Tree>) {
    emit!(TreeChanged {
        tree: tree.key(),
        phase: tree.phase,
        raised: tree.raised
    });
}
