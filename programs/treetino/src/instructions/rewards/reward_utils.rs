use crate::{
    constants::SCALE,
    errors::TreeError,
    instructions::{Position, Tree},
};
use anchor_lang::prelude::*;

pub fn credit_rewards(tree: &mut Tree, amount: u64) -> Result<()> {
    let numerator = (amount as u128)
        .checked_mul(SCALE)
        .and_then(|x| x.checked_add(tree.reward_remainder))
        .ok_or(TreeError::Overflow)?;
    tree.reward_index = tree
        .reward_index
        .checked_add(numerator / tree.target as u128)
        .ok_or(TreeError::Overflow)?;
    tree.reward_remainder = numerator % tree.target as u128;
    tree.paid = tree.paid.checked_add(amount).ok_or(TreeError::Overflow)?;
    Ok(())
}

pub fn prepare_position(
    position: &mut Position,
    tree: Pubkey,
    owner: Pubkey,
    index: u128,
) -> Result<()> {
    if position.tree == Pubkey::default() {
        position.tree = tree;
        position.owner = owner;
        position.index = index;
    }
    require_keys_eq!(position.tree, tree);
    require_keys_eq!(position.owner, owner);
    let earned = (position.shares as u128)
        .checked_mul(
            index
                .checked_sub(position.index)
                .ok_or(TreeError::Overflow)?,
        )
        .ok_or(TreeError::Overflow)?;
    position.pending_scaled = position
        .pending_scaled
        .checked_add(earned)
        .ok_or(TreeError::Overflow)?;
    position.index = index;
    Ok(())
}
