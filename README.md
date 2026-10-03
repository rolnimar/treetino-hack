# Treetino

Bun workspace monorepo for the Treetino Solana hackathon prototype.

```text
programs/treetino/    Anchor program, Rust + LiteSVM tests
frontend/            React + Vite + TypeScript
backend/             NestJS + TypeScript, running on Bun
packages/contracts/  Shared generated IDL, program types and API response types
scripts/             IDL generation
```

The frontend currently displays the protocol overview and checks the backend connection.
The backend exposes `GET /api/health` and `GET /api/protocol`.
Wallet flows, event indexing, persistence and tariff billing are still to be implemented.
The program's lifecycle, token behavior and reward rules are documented in
[programs/treetino/README.md](programs/treetino/README.md).

## Local development

Use Bun 1.4.2 or newer. The lockfile and Docker images pin 1.4.2.
Run from the repository root:

```sh
rtk proxy bun install --frozen-lockfile
rtk proxy bun run dev
```

Frontend: http://localhost:5173. Backend: http://localhost:3000/api/health.
Vite proxies `/api` to the backend. `BACKEND_URL` overrides the default
`http://localhost:3000` target.

`bun run dev:frontend` and `bun run dev:backend` run applications separately.
The backend compiles TypeScript before running JavaScript on Bun, so Nest's
decorator metadata and dependency injection work consistently.

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

## Railway

Create two services, `frontend` and `backend`, from the same GitHub repository.
Keep both Root Directory settings at `/`: their Docker builds need the root
workspace and shared contracts package. Configure these settings:

| Setting | Frontend | Backend |
| --- | --- | --- |
| Dockerfile path variable | `RAILWAY_DOCKERFILE_PATH=frontend/Dockerfile` | `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile` |
| Port variable | `PORT=8080` | `PORT=3000` |
| Healthcheck path | `/health` | `/api/health` |
| Healthcheck timeout | 60 seconds | 60 seconds |
| Restart policy | On failure, 3 retries | On failure, 3 retries |

Set frontend `BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3000`.
The backend listens on IPv4 and IPv6 for private networking.
Generate a public domain for the frontend, targeting port 8080.
Its Bun server serves the built assets and proxies `/api` to NestJS at runtime,
so backend addresses are not baked into the browser bundle.
Leave custom build/start commands unset; each Dockerfile defines them.

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
