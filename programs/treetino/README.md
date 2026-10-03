# Treetino Solana protocol

Hackathon MVP built with Anchor 1.2, Anchor SPL, Rust, and LiteSVM 0.17.
No validator is needed for the tests: they execute the compiled SBF program.

Each tree has its own PDA, six-decimal SPL share mint, funding vault, revenue
vault, and investor reward positions. The program ID is
`EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n`.

## Lifecycle

1. `init_tree`: creator chooses tree ID, target, payment mint,
   supplier, client, device public key, and maximum Wh per quarter-hour.
   Tree identity is scoped to the creator. A six-decimal classic SPL mint can
   stand in for USDC on devnet. There is no global approved-mint registry.
2. `buy_shares(amount)`: transfer mockUSDC into the funding vault and mint
   shares 1:1 in raw units. For example, 100 USDC buys 100 shares, and
   20,000 USDC fully funds a 20,000-share tree. Buying cannot exceed the target.
   Transfers are disabled until fully funded; mint authority is then revoked.
   Funding stays open until the target is reached. This MVP has no refund or
   cancellation path; contributed capital stays in the funding vault until purchase.
3. `purchase_tree`: creator releases exactly the target to a token account
   owned by the configured supplier. Extra unsolicited vault deposits do not
   issue shares or change the target. They have no withdrawal path in this MVP.
4. `activate_tree(first_day_start_ts)`: creator starts billing on a future UTC midnight
   (or the current instant if it is midnight). This represents installation;
   the contract cannot verify installation or enforce a physical agreement.
5. `submit_report(day_start_ts, wh)`: the configured device key signs one transaction
   after the day ends, with 96 unsigned quarter-hour **Wh** readings.
   Reports must arrive in day order; backfilling is allowed, skipping is not.
   Each reading is bounded by the configured physical limit. A unique report
   PDA prevents duplicates. `day_start_ts` is an i64 Unix timestamp in seconds
   aligned to UTC midnight. Zero production is valid. Reporting does not depend
   on prices or an invoice.
6. `issue_invoice(amount)`: the backend submits the final bill for a report
   in payment-mint base units (micro-USDC for mockUSDC). The creator's key is
   the backend billing authority in this MVP. Each invoice can be issued once;
   zero is valid and is distinguished from an invoice not yet issued.
7. `pay_invoice(amount)`: the configured client pays all or part of a report's
   bill in mockUSDC. This payment, rather than the report, credits rewards.
8. `claim_rewards`: a holder withdraws their portion of paid revenue.
   `transfer_shares(amount)` checkpoints both holders before transferring.

## Billing and rewards

The backend reads the production report and calculates the bill using its
tariff, currency conversion, and rounding rules. The contract stores only the
final invoice amount and payment state. It stores no energy prices, price
schedules, or billing remainder, and it does not verify the backend's pricing
calculation. The backend billing authority is trusted for invoice amounts.

Example backend calculation: 48 kWh at 0.10 USDC/kWh plus 48 kWh at
0.20 costs 14.40 USDC. The backend calls `issue_invoice(14_400_000)`.
With Alice holding 60% and Bob 40%, a 10-USDC payment gives them 6 and 4.
If Alice then sells every share to Carol, Alice retains those 6 USDC.
A subsequent 4.40-USDC payment gives Carol 2.64 and Bob 1.76.
Unpaid invoices follow ownership at the time the payment is received.

Rewards use a cumulative index with 10^18 precision. Positions retain
fractional micro-USDC between claims. Global division dust carries into later
payments. Tiny final fractions can remain unclaimable; there is no close or
dust-sweep instruction. Revenue is isolated from capital.

## Token account names

Instruction token accounts use descriptive `*_token_account` names:
`funding_token_account`, `revenue_token_account`, `payment_token_account`,
`share_token_account`, `recipient_share_token_account`, and
`supplier_payment_token_account`.

The share token accounts are canonical associated token accounts (ATAs).
Funding and revenue token accounts are PDA vaults created with program seeds.
Payment accounts are validated by mint and owner; they do not have to be ATAs.

## Transfer behavior

Share ATAs remain frozen outside program calls. The program atomically thaws,
mints/transfers, and freezes them again. This makes the reward ledger
authoritative and prevents direct SPL transfer or burn from bypassing it.
Use `transfer_shares`, rather than wallet-native SPL transfer. No Token-2022
transfer hook, NFT, senior/junior tranche, order book, or USDC yield strategy is
included. TREE-001 is an application label; Metaplex name/symbol metadata is
not created.

A secondary sale can combine the buyer's USDC payment and the seller's
`transfer_shares` instruction into one transaction signed by both parties.
If either instruction fails, both changes roll back. Settlement UI and order
matching are outside this program.

## Device and backend mock

The integration tests mock a Cerbo GX with a signing keypair and signed report
transactions. Authentication proves the configured key submitted the readings;
it does not prove physical production. Device provisioning, secure key storage,
key rotation, actual Victron access, and transaction retries are not implemented.

A backend should index finalized program events and reconcile the accounts.
`ProductionReported` identifies a report PDA storing all 96 values, timestamp,
device key, energy total, whether an invoice was issued, amount due, and amount
paid. `InvoiceIssued`, `InvoicePaid`,
`SharesTransferred`, `RewardsClaimed`, and `TreeChanged` track the other flows.
Scan historical transactions when reconnecting; subscription logs alone are
not a durable index.

The tests mock the backend's final invoice amount, with no price oracle or
cloud dependency. The NestJS backend scaffold lives at `backend/`; actual indexing and tariff integration are not implemented.
Days are fixed **UTC** 96-interval days: normalize local-market DST days before
submitting readings. The invoice amount must be nonnegative; client credits
and invoice amendments are outside this MVP. Taxes, network fees, foreign
exchange, penalties, invoices/PDFs, and legal collection remain backend
concerns. There is no guaranteed return.

## Source layout

The layout follows OnRe's instruction-family modules. Each instruction file
contains its own `#[derive(Accounts)]` struct and handler; `lib.rs` only
dispatches entrypoints.

- `src/instructions/initialization/`: tree initialization.
- `src/instructions/funding/`: buying shares.
- `src/instructions/tree_operations/`: purchase, activation,
  and tree state.
- `src/instructions/energy/`: daily production reports and their state.
- `src/instructions/shares/`: transfers and investor position state.
- `src/instructions/rewards/`: backend-issued invoices, payments, claims, and reward math.
- `src/utils/token_utils.rs`: shared SPL CPI helpers.
- `src/constants.rs` and `src/errors.rs`: shared seeds, units, and errors.
- `tests/{funding,energy,billing,shares,rewards}.rs`: domain integration tests.
- `tests/common/`: LiteSVM setup, mock USDC fixtures, and account builders.

Daily report accounts are retained. Device wallets need SOL for
rent-exempt account creation as well as transaction fees; this MVP has no
pruning/closing instruction.

## Development

Run the following commands from the repository root.

Rust 1.98 is pinned for host builds; SBF platform tools v1.54 are pinned
separately. Cargo.lock records the compatible dependency set.
Install Anchor CLI 1.2.0 and Solana/Agave SBF tooling, then:

```sh
rtk proxy anchor build
rtk proxy cargo test -p treetino --tests
rtk proxy cargo fmt --all -- --check
rtk proxy cargo clippy -p treetino --all-targets -- -D warnings
```

Always rebuild before running LiteSVM: tests embed
`target/deploy/treetino.so`. Account metas come from Anchor-generated
types, and the fee payer is separate from the instruction signer.

On machines affected by rustup's custom-toolchain parsing, build directly:
```sh
rtk proxy env PATH="$HOME/.cache/solana/v1.54/platform-tools/rust/bin:$PATH" cargo build-sbf --no-rustup-override --tools-version v1.54 --skip-tools-install
```

Run `rtk proxy bun run idl` from the repository root to regenerate the shared
IDL, TypeScript program type, and error codes in `packages/contracts/src/`.
Both applications import this package as `@treetino/contracts`.
This repository does not deploy or spend devnet funds automatically.

The matching Anchor CLI was installed locally for this checkout at
`target/tooling/bin/anchor`; the existing global CLI was preserved.
