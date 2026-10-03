// Generated from the Anchor IDL. Run bun run idl to refresh.
export const TreetinoErrorCode = {
  "InvalidInput": 6000,
  "InvalidPhase": 6001,
  "FundingCap": 6002,
  "Overflow": 6003,
  "InvalidDay": 6004,
  "BalanceMismatch": 6005,
  "NoRewards": 6006,
  "Overpayment": 6007,
  "InvoiceAlreadyIssued": 6008,
  "InvoiceNotIssued": 6009
} as const;

export type TreetinoErrorName = keyof typeof TreetinoErrorCode;
