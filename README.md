# Treetino

Bun workspace monorepo for the Treetino Solana hackathon prototype.

```text
programs/treetino/    Anchor program, Rust + LiteSVM tests
frontend/            React + Vite + TypeScript
backend/             NestJS + TypeScript, running on Bun
packages/contracts/  Shared generated IDL, program types and API response types
scripts/             IDL generation
```

The frontend provides public tree funding and wallet tools alongside the admin workspace.
The backend exposes health, protocol information, tree listings, indexed event history, and Swagger documentation.
It polls confirmed Solana transactions and preserves their data, decoded Anchor events,
and its cursor in PostgreSQL through Drizzle ORM. Wallet signature login separates
public access from admin access. The admin frontend builds, signs, and submits
chain management transactions. Tariff calculation is still to be implemented.
The program's lifecycle, token behavior and reward rules are documented in
[programs/treetino/README.md](programs/treetino/README.md).

## Victron Green Energy DePIN Tokenization Demos

Treetino bridges physical renewable energy hardware with Solana DeFi. The platform connects directly to live industrial telemetry from **Victron Energy VRM Portal API** (`https://vrmapi.victronenergy.com/v2`), proving real energy production and tokenizing fractional ownership:

- [**Victron VRM Data Provenance & DePIN Architecture**](docs/victron-demos/README.md) - Full audit of live API endpoints vs. tokenized economic modeling.
- [**01. Off-Grid Solar Microgrid (Site 209689)**](docs/victron-demos/01-offgrid-microgrid.md) - Residential solar + lithium storage replacing expensive off-grid diesel generation in Queensland, Australia (8.5% APY).
- [**02. Commercial ESS Battery Storage (Site 219742)**](docs/victron-demos/02-commercial-ess.md) - Grid-tied battery storage capturing wholesale power arbitrage and frequency response in Amsterdam, Netherlands (14.2% APY).
- [**03. Solar EV Fast-Charging Hub (Site 374891)**](docs/victron-demos/03-ev-charging-plaza.md) - 10-bay commercial fast-charging plaza with autonomous vehicle micro-billing in Paris, France (18.5% APY).
- [**04. Treetino V1 Biomimetic Smart Energy Tree**](docs/victron-demos/04-treetino-v1-tree.md) - Flagship dual-modality urban microgrid (22 solar tracking leaves + 12 ducted VAWT wind turbines + trunk battery storage + MKovo PPA, 11.8% APY).

## Local development

Use Bun 1.4.2 or newer. The lockfile and Docker images pin 1.4.2.
Run from the repository root:

```sh
rtk proxy bun install --frozen-lockfile
rtk proxy bun run dev
```

Frontend: http://localhost:5173. Backend: http://localhost:3000/api/health.
Swagger UI: http://localhost:3000/api/docs. OpenAPI JSON:
http://localhost:3000/api/docs-json. Both are also available through the frontend's
`/api` proxy and on Railway under the same paths. Swagger documents all backend
endpoints, query parameters, and response schemas using NestJS decorators.
See [NestJS Swagger setup](https://docs.nestjs.com/openapi/introduction).
Vite proxies `/api` to the backend. `BACKEND_URL` overrides the default
`http://localhost:3000` target.

`bun run dev:frontend` and `bun run dev:backend` run applications separately.
The backend compiles TypeScript before running JavaScript on Bun, so Nest's
decorator metadata and dependency injection work consistently.
The backend reads environment variables from `backend/.env` when Bun starts there;
copy `backend/.env.example` to `backend/.env` to override the defaults.
Local PostgreSQL must be running on `127.0.0.1:5468`, with database `treetino`
and user/password `postgres`/`postgres`. Startup creates application tables through
migrations; it expects the database itself to exist. No SQLite file is used.
For DBeaver, select PostgreSQL and use these same local connection settings.

Backend integration tests use temporary databases on the local PostgreSQL server,
then drop only those test databases. The test role needs permission to create
and drop databases. Set `TEST_DATABASE_URL` to use a dedicated test server.
Tests never truncate or drop the configured application database.

```sh
rtk proxy bun run build
rtk proxy bun run typecheck
rtk proxy bun run test
rtk proxy bun run format:check
```

Build the program before its LiteSVM tests, which embed the compiled binary:

```sh
rtk proxy anchor build
rtk proxy bun run test:program
rtk proxy bun run idl
```

See the program README for pinned Rust/SBF tooling and the direct SBF build workaround.
IDL generation uses `target/tooling/bin/anchor` when available, otherwise the
Anchor CLI on PATH. Regenerate the shared artifacts after changing program accounts
or instructions. The program address is unchanged by the project rename.

## Developer Onboarding & Architecture Guide

Welcome! If you are picking up this repository, here is everything you need to know about the system architecture, how the frontend and backend interact, and how to extend the platform.

### High-Level Architecture

The platform tokenizes physical renewable energy installations and smart trees on Solana, backed by live SCADA telemetry:

```text
[ Victron Energy VRM API / Open-Meteo API ]
                     │
                     ▼ (Live SCADA Telemetry & Weather)
[ NestJS Backend (Bun) ] ── (PostgreSQL via Drizzle)
         │           └────────── (Solana Indexer Polling Worker)
         ▼
[ React + Vite Frontend ]
         ├── Public Marketplace & Investment Vaults
         ├── Admin Protocol Management & Invoicing
         └── Victron & Treetino DePIN Asset Dashboards
                 │
                 ├── Shared Modular Component Suite (frontend/src/features/victron/components/)
                 │     ├── TelemetrySidepanel (Uncoupled HTML sidepanel, zero SVG clipping)
                 │     ├── InstallationHeader (Title, badges, 3-mode flow switcher)
                 │     ├── FlowSummaryBanner (4-pillar generation, load, revenue, APY KPI)
                 │     ├── StreamingYieldTicker (Live micro-yield dividend ticker)
                 │     ├── SchematicCard (Reusable SVG electrical node card)
                 │     ├── ConduitLine (Dual-channel power & fund particle flows)
                 │     └── CashFlowDossier (Off-taker profile & 3-tier investor waterfall)
                 │
                 └── Archetype Layouts (frontend/src/features/victron/layouts/)
                       ├── OffgridLayout (Queensland off-grid microgrid, 8.5% APY)
                       ├── EssLayout (Almere commercial battery arbitrage, 14.2% APY)
                       ├── EvLayout (Paris 10-bay fast-charging plaza, 18.5% APY)
                       └── TreetinoLayout (Czech Republic biomimetic tree, 11.8% APY)
```

### Component Architecture & Guidelines

1. **Decoupled Telemetry Sidepanel (`xl:col-span-3` alongside `xl:col-span-9`)**:
   - The electrical schematic is rendered inside an SVG canvas (`viewBox="0 0 770 420"`), while `TelemetrySidepanel` is rendered as an HTML column sibling in a 12-column grid.
   - **Never embed HTML sidepanels inside SVG `<foreignObject>`** — SVG bounds constrain viewport height and clip cards.
   - Standard hierarchy in `TelemetrySidepanel`:
     - System Status pulse header.
     - Specialty slot (archetype-specific metrics, e.g. Tree physics, Diesel replacement, ESS arbitrage spread, EV bay probes).
     - Live Open-Meteo Weather station card.
     - Cerbo GX / Venus OS connectivity diagnostics (firmware, D-Bus latency, status).
     - Node verification footer.

2. **Flow Animation Modes**:
   - Every layout supports 3 interactive flow modes toggled in `InstallationHeader`:
     - `energy`: Animates kilowatt electrical flow along conduits.
     - `funds`: Animates reverse USDC cash flow from off-takers to investor vaults.
     - `both`: Shows unified dual flows simultaneously.

3. **Styling & Design System**:
   - Primary palette: `#f5f3eb` (cream background), `#173d2c` (deep forest green), `#6f8d40` (leaf green accent).
   - Card accents: `forest`, `emerald`, `amber`, `sky`, `rose`.
   - **Zero emojis**: All status indicators, metrics, and actions use clean SVG vector icons (`victron-icons.tsx`) or badge pills.

### Quick Commands

```sh
bun run build        # Compiles frontend, backend, and contracts
bun test             # Runs all 39 unit and integration tests
bun run lint         # Lints frontend TypeScript
bun run format:check # Verifies Prettier code style
```

## Public and admin access

Public endpoints and browsing work without login. One Connect wallet button opens
the Solana wallet-adapter picker. Phantom and Solflare are explicitly available;
other installed Wallet Standard wallets are discovered automatically. The shared
provider connects the selected wallet. Anyone can use the demo faucet and buy
shares without an admin login. **Sign in as admin** separately asks the wallet to
sign a server-issued message. Signing that challenge does not submit a transaction.
Switching accounts or disconnecting clears the admin session.

The public marketplace loads trees from `GET /api/trees`, with phase filters,
pagination, funding bars and 10-second refreshes. Active trees remain visible;
new shares are sold during the funding phase, at 1 mockUSDC per share. Purchases
cannot exceed your mockUSDC balance or the tree’s remaining funding. The **Max**
button uses the smaller of those amounts. Wallet balances come from the mockUSDC
payment ATA; a missing ATA displays zero. The faucet creates it as needed.

Faucet and share-purchase transactions are built on the frontend and signed by
the connected wallet, without a JWT. The balance refreshes after confirmation;
funding progress updates when the backend indexer observes the purchase. Amounts
use exact six-decimal integer conversion. Public actions live under
`frontend/src/features/marketplace`; `frontend/src/chain/public.ts` validates and
builds them, and the PDA helpers include buyer share ATAs and position accounts.

The `admins` table contains only a generated UUID `id` and a unique `wallet` address.
Add the first admin from `backend/` (using the same `DATABASE_URL` as the backend):

```sh
rtk proxy bun run admin -- add <SOLANA_WALLET>
rtk proxy bun run admin -- list
rtk proxy bun run admin -- remove <SOLANA_WALLET>
```

These commands apply pending migrations and manage the whitelist directly. There is
no public admin registration endpoint. Alternatively, use DBeaver:

```sql
INSERT INTO admins (wallet) VALUES ('YOUR_SOLANA_WALLET') ON CONFLICT DO NOTHING;
```

Authentication endpoints are documented in Swagger:

- `POST /api/auth/challenge` with `{ "wallet": "..." }` returns `id`, the exact
  `message` to sign, and `expiresAt`. Challenges expire after five minutes and are
  stored in PostgreSQL, so they survive a backend restart.
- `POST /api/auth/login` with `{ "challengeId": "...", "wallet": "...", "signature": "..." }`
  verifies the base58 Ed25519 signature, consumes the challenge once and checks the
  admin whitelist. Success returns `accessToken`, `expiresAt`, and `admin`.
- `GET /api/admin/me` requires `Authorization: Bearer <accessToken>` and returns the
  current admin. Missing, invalid or expired tokens return 401; revoked admins return 403. Swagger's **Authorize** button accepts the token.

JWTs expire after one hour. The frontend keeps its JWT in memory and clears the
session on sign-out, wallet account changes, expiration, or access rejection. A page
reload requires login again. Removing an admin immediately blocks backend requests;
the open frontend rechecks access every minute and when the tab receives focus.
Authentication endpoints are limited to 20 requests per minute per backend peer IP.
Future protected controllers should import `AuthModule` and use `@UseGuards(AdminGuard)`
plus `@ApiBearerAuth()`; public controllers need no authentication guard.

Set `AUTH_JWT_SECRET` to a random secret of at least 32 bytes and `AUTH_ORIGIN` to the
frontend's public origin. Both are required in production. Generate a secret locally:

```sh
rtk proxy bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the result in the ignored `backend/.env`. In development, omitting the secret uses
an ephemeral secret and invalidates JWTs on backend restart; the default origin is
`http://localhost:5173`. On Railway, set both variables on the backend service and
use the frontend's HTTPS origin for `AUTH_ORIGIN`.

Database admin access controls backend routes and frontend visibility. Chain admin
instructions still enforce the program's own admin accounts; a JWT does not grant
on-chain authority. The admin workspace fetches trees from `GET /api/trees`, with
phase filters, pagination and polling every 10 seconds. New trees appear after the
backend indexer observes initialization. The tree ID is chosen in the creation form;
the database assigns a separate UUID. The workspace builds transactions on the frontend
using the shared IDL and the connected wallet signs them. The frontend submits
signed transactions directly to Solana and waits for confirmation. The backend
handles wallet login and indexed public history; it does not construct or relay
admin transactions.

After signing in, use the admin tabs in this order:

1. **Protocol setup**: initialize chain admins as the current program upgrade
   authority. Include your own wallet if it should create trees. Later, use
   **Update chain admins** to replace the list (1–10 distinct nonzero wallets).
2. **Protocol setup**: initialize the mockUSDC payment token and metadata once.
3. **Create tree**: enter a creator-scoped integer tree ID, funding target in
   mockUSDC, supplier, client and reporter.
   Your wallet must be in the chain admin list.
4. **Trees**: inspect indexed trees, filter by phase, page through results, and
   purchase fully funded trees. Purchase sends the target to the supplier's
   payment ATA, creating that account in the same transaction if necessary.
5. **Trees**: activate purchased trees with a future UTC first billing day.
   The creator can load active tree reports and issue a final invoice, including
   a zero invoice. Invoice amounts cannot be changed after issuance.
6. **Demo faucet**: mint demo mockUSDC to your wallet's payment ATA.

Purchase, activation and invoice actions require the original tree creator,
even if chain admin membership later changes. Report submission remains the
configured device's role; payment and reward claims belong to clients and holders.
Those user/device flows are not admin controls.

PDA seeds, little-endian integer seeds and ATA derivation live in
`frontend/src/chain/addresses.ts`. Instruction account metas and Borsh arguments
come from the JSON IDL in `frontend/src/chain/instructions.ts`. Protocol and report
reads live in `read.ts`, transaction construction and permission checks in `build.ts`,
and wallet signing, submission and confirmation polling in `transaction.ts`. `client.ts`
exposes these operations to the admin hooks. Token inputs use exact six-decimal
integer conversion, without floating-point arithmetic.

The frontend groups authentication and admin screens under `src/features`, reusable
controls under `src/components/ui`, and API validation under `src/lib`. TanStack
Query handles server state and cache invalidation. React Hook Form and Zod validate
forms; Zod also checks API responses and transaction inputs. Admin styling uses
Tailwind CSS through its Vite plugin. `rtk proxy bun run lint` checks React hooks
and TypeScript rules. `rtk proxy bun run test` includes backend integration tests
and frontend transaction/schema tests. Builds use the native TypeScript 7 compiler;
the TypeScript 6 alias supplies the JavaScript API required by ESLint.

Set frontend `VITE_SOLANA_RPC_URL` to a **public browser-accessible devnet RPC**
if needed. The default is `https://api.devnet.solana.com`. This URL is bundled
into the frontend and must not contain private credentials. Backend
`SOLANA_RPC_URL` configures the indexer separately; point both at devnet.
Changing a Vite variable requires rebuilding the frontend. Docker supports
`--build-arg VITE_SOLANA_RPC_URL=...`. The frontend checks the genesis hash before
building transactions, so pointing it at another cluster stops admin actions.

## Event history

The NestJS worker runs immediately on startup and every `INDEXER_POLL_SECONDS`
seconds (default `10`). Polls never overlap. Configure the backend with:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
INDEXER_ENABLED=true
INDEXER_POLL_SECONDS=10
INDEXER_START_AT=2026-10-04T00:00:00Z
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5468/treetino
```

The fixed default start date is October 4, 2026 at UTC midnight. The initial scan
pages backward through the program's transaction signatures to that time.
Subsequent polls stop at the saved transaction signature, including after restarts.
The original start time is saved in PostgreSQL; changing `INDEXER_START_AT` does not
reset an existing stream. The worker scopes each stream by chain genesis hash and
program ID, so switching RPC providers for the same chain retains the cursor.

Successful transactions are fetched and decoded with the shared IDL. Failed
transactions advance the cursor without producing events or fetching transaction
details. Transactions, events, and each cursor update commit together; retries
cannot duplicate events. Event integer fields are decimal strings to preserve
64-bit precision, and event names/fields retain the JSON IDL's Rust names.
Fetched transaction data is also saved for later inspection or decoding.

- `GET /api/events/status` returns the cursor, start time, counts, and latest poll error.
- `GET /api/events?after=0&limit=100` returns stored events in insertion order and
  `nextCursor`. Each event has a UUID `id` and a separate integer `sequence`.
  Pass the integer `nextCursor` as `after` for the next page (`limit`: 1–1000).
- `GET /api/trees` returns `{ trees, total }` for initialized trees observed since
  the configured start time. Optional `phase` is `funding`, `funded`, `purchased`,
  or `active`; `limit` defaults to 100 (1–1000), and `offset` defaults to 0.
  Use `GET /api/trees?phase=funding` for trees still raising funds.

`TreeChanged` is emitted on initialization, share purchases, and phase changes.
The worker reads the referenced tree account with confirmed commitment and a
minimum context slot matching the transaction, checks its program owner and PDA,
and decodes static purchase details with the shared IDL. The event supplies the
phase and raised amount, preserving their history order during a backfill.
Each tree is upserted by chain/program stream and address, with a stable UUID.
Trees, raw events, transactions, and the cursor commit atomically. An unavailable
tree account blocks the cursor and retries on the next poll.

The public tree response includes `address`, creator-scoped `treeId`, `creator`,
`supplier`, `client`, `reporter`, `paymentMint`, `shareMint`,
`fundingTokenAccount`, `target`, `raised`, `remaining`, `phase`, `canBuy`,
`updatedAt`, and the latest indexed transaction `signature`.
Amounts and tree IDs are decimal strings to preserve u64 precision. Payment
and shares have 6 decimals and a 1:1 base-unit ratio. `canBuy` is true only during
funding with a positive remaining amount. The frontend signs `buy_shares` with
the buyer's wallet; the contract enforces the current phase and funding cap.
The endpoint reads PostgreSQL without making RPC requests and remains available
offline. Its funding figures reflect the last indexed confirmed event and can
lag live state until the next poll. Trees initialized before the start time are
discovered only if they emit a subsequent `TreeChanged` event within the scan.

History already saved remains readable if the RPC is offline. A missing
transaction, unavailable block time, truncated logs, or undecodable event data
stops progress and is retried on the next poll. If the saved signature cannot be
found in the available RPC history, the worker reports a history gap and does not
advance. Configure an RPC provider retaining the required history to recover it.
The first scan can only retrieve what the provider still has; it cannot prove
completeness or recover transactions already pruned before indexing began.
Devnet ledger resets can remove upstream history. PostgreSQL persistence
preserves the data already indexed; it is not an RPC archive or a backup.
See [Solana history RPC](https://solana.com/docs/rpc/http/getsignaturesforaddress)
and [Anchor log limitations](https://www.anchor-lang.com/docs/features/events).

## Database and migrations

The backend uses **Drizzle ORM** with the PostgreSQL `postgres.js` driver for typed queries.
The schema lives in `backend/src/database/schema.ts`; Drizzle Kit generates
versioned SQL migrations and snapshots under `backend/migrations/`.
The indexer accesses it through `IndexerRepository`; database connection and
migration startup belong to `DatabaseModule`.
Every application table has a native PostgreSQL UUIDv4 `id` primary key.
PostgreSQL generates IDs with `gen_random_uuid()`. Stream identifiers, RPC/program
pairs, transaction signatures, and transaction/event positions retain unique
constraints for lookups and duplicate prevention. Events use a separate unique
integer sequence for ordered pagination; this is not their primary key.

Every backend startup automatically applies pending migrations to `DATABASE_URL`
before the API listens or the polling worker starts. Drizzle records applied
migrations in `drizzle.__drizzle_migrations` and skips them on subsequent starts.
A migration error fails startup and rolls back the pending migration transaction.
The single initial migration creates a fresh PostgreSQL database with UUID primary keys.
Event pagination uses a database-generated bigint sequence; gaps after retries or
rollbacks are valid. Clients should use the returned cursor rather than assume
consecutive numbers.

For a schema change, edit `schema.ts`, then run from `backend/`:

```sh
rtk proxy bun run db:generate --name=describe_the_change
```

Review and commit the generated SQL, snapshot, and journal alongside the schema
change. Do not edit migrations already applied to a persistent database; generate
a new migration instead. Production runs the checked-in migrations; it never
generates migrations or uses schema push.

To apply pending migrations manually during local development:

```sh
rtk proxy bun run db:migrate
```

The commands use the same `DATABASE_URL` as the backend. Automatic runtime migration
uses Drizzle ORM; Drizzle Kit is only needed to generate migrations during development.
See [Drizzle's PostgreSQL driver](https://orm.drizzle.team/docs/get-started-postgresql)
and [migration workflow](https://orm.drizzle.team/docs/migrations).

## Railway

Create two services, `frontend` and `backend`, from the same GitHub repository.
Keep both Root Directory settings at `/`: their Docker builds need the root
workspace and shared contracts package. Configure these settings:

| Setting                  | Frontend                                      | Backend                                      |
| ------------------------ | --------------------------------------------- | -------------------------------------------- |
| Dockerfile path variable | `RAILWAY_DOCKERFILE_PATH=frontend/Dockerfile` | `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile` |
| Port variable            | `PORT=8080`                                   | `PORT=3000`                                  |
| Healthcheck path         | `/health`                                     | `/api/health`                                |
| Healthcheck timeout      | 60 seconds                                    | 60 seconds                                   |
| Restart policy           | On failure, 3 retries                         | On failure, 3 retries                        |

Set frontend `BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3000`.
The backend listens on IPv4 and IPv6 for private networking.
Generate a public domain for the frontend, targeting port 8080.
Its Bun server serves the built assets and proxies `/api` to NestJS at runtime,
so backend addresses are not baked into the browser bundle.
Leave custom build/start commands unset; each Dockerfile defines them.

Add a **PostgreSQL** service to the same Railway project/environment. In the
backend's Variables, reference that service's private connection URL:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
INDEXER_POLL_SECONDS=10
INDEXER_START_AT=2026-10-04T00:00:00Z
SOLANA_RPC_URL=https://api.devnet.solana.com
```

The service name `Postgres` must match the actual database service name. The backend
uses PostgreSQL over Railway's private network. PostgreSQL owns persistent storage;
the backend does not need a volume, `SQLITE_PATH`, or `RAILWAY_RUN_UID=0`.
The Docker image includes the migration files. Startup awaits checked-in migrations
before the API and polling worker start. A database advisory lock serializes
migrations across concurrent starts; no separate pre-deploy migration command is
needed. Keep **one backend replica** for one polling worker. The indexer retains
its cursor and history in PostgreSQL across backend restarts/redeployments.
See [Railway PostgreSQL](https://docs.railway.com/databases/postgresql).

Watch paths for the frontend: `/frontend/**`, `/packages/contracts/**`,
`/package.json`, `/bun.lock`, `/tsconfig.json`, `/.dockerignore`.
For the backend, replace `/frontend/**` with `/backend/**`.
This avoids deploying application services when only Rust sources change;
regenerating the shared IDL triggers both services.

Railway's legacy `railway.json` format is deprecated for new services.
The settings above can be configured in the dashboard; Railway's current
[Infrastructure as Code](https://docs.railway.com/infrastructure-as-code) can
manage them later. See also [Dockerfile deployment](https://docs.railway.com/builds/dockerfiles)
and [monorepo deployment](https://docs.railway.com/deployments/monorepo).
No Railway project or deployment has been created by this setup.

## Docker

Build both images from the repository root:

```sh
rtk proxy docker build -f backend/Dockerfile -t treetino-backend .
rtk proxy docker build -f frontend/Dockerfile -t treetino-frontend .
```

The frontend requires `BACKEND_URL` pointing at a reachable backend.
Environment variable examples live in each application's `.env.example`.
