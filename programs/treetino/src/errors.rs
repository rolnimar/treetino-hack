use anchor_lang::prelude::*;

#[error_code]
pub enum TreeError {
    #[msg("Invalid configuration, amount, or interval data")]
    InvalidInput,
    #[msg("Instruction unavailable in this tree phase")]
    InvalidPhase,
    #[msg("Funding target would be exceeded")]
    FundingCap,
    #[msg("Arithmetic limit exceeded")]
    Overflow,
    #[msg("Report must cover the next complete UTC day")]
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
}
