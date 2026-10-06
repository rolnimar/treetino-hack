use anchor_lang::prelude::*;

#[error_code]
pub enum TreeError {
    #[msg("Invalid configuration or amount")]
    InvalidInput,
    #[msg("Instruction unavailable in this tree phase")]
    InvalidPhase,
    #[msg("Funding target would be exceeded")]
    FundingCap,
    #[msg("Arithmetic limit exceeded")]
    Overflow,
    #[msg("Day must be a nonnegative UTC midnight; reports require a completed day")]
    InvalidDay,
    #[msg("Share balance differs from the reward ledger")]
    BalanceMismatch,
    #[msg("No paid rewards are available to claim")]
    NoRewards,
    #[msg("Payment exceeds the invoice balance")]
    Overpayment,
    #[msg("An invoice has already been issued for this report")]
    InvoiceAlreadyIssued,
    #[msg("The backend has not issued an invoice for this report")]
    InvoiceNotIssued,
    #[msg("Only the initialized demo payment mint is supported")]
    InvalidPaymentMint,
    #[msg("Signer is not authorized for this operation")]
    Unauthorized,
    #[msg("Admin list must contain 1 to 10 distinct nonzero wallets")]
    InvalidAdmins,
}
