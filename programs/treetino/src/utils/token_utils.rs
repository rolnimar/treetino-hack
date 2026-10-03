use crate::instructions::Tree;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, spl_token, TokenAccount};

pub fn move_tokens<'info>(
    program: AccountInfo<'info>,
    from_token_account: AccountInfo<'info>,
    to_token_account: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            program.key(),
            token::Transfer {
                from: from_token_account,
                to: to_token_account,
                authority,
            },
            seeds,
        ),
        amount,
    )
}

pub fn freeze<'info>(
    program: AccountInfo<'info>,
    share_token_account: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    seeds: &[&[&[u8]]],
) -> Result<()> {
    token::freeze_account(CpiContext::new_with_signer(
        program.key(),
        token::FreezeAccount {
            account: share_token_account,
            mint,
            authority,
        },
        seeds,
    ))
}

pub fn thaw<'info>(
    program: AccountInfo<'info>,
    share_token_account: &Account<'info, TokenAccount>,
    mint: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    seeds: &[&[&[u8]]],
) -> Result<()> {
    if share_token_account.state == spl_token::state::AccountState::Frozen {
        token::thaw_account(CpiContext::new_with_signer(
            program.key(),
            token::ThawAccount {
                account: share_token_account.to_account_info(),
                mint,
                authority,
            },
            seeds,
        ))?;
    }
    Ok(())
}

pub fn revoke_mint<'info>(
    program: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    tree: &Account<'info, Tree>,
) -> Result<()> {
    token::set_authority(
        CpiContext::new_with_signer(
            program.key(),
            token::SetAuthority {
                account_or_mint: mint,
                current_authority: tree.to_account_info(),
            },
            &[&tree.seeds()],
        ),
        spl_token::instruction::AuthorityType::MintTokens,
        None,
    )
}
