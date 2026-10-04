# Victron VRM Data Provenance & DePIN Tokenization Architecture

> **Complete Audit & Transparent Disclosure**: This document details the exact boundary between **live telemetry fetched from Victron Energy's VRM API** and the **synthetic DePIN economic model** developed by Treetino for the Solana Hackathon.

---

## Executive Summary: Is This Real API Data?

**YES, the electrical and hardware telemetry is 100% real and pulled live from official Victron Energy Venus OS devices via the Victron VRM API.**

However, Victron Energy is an industrial renewable energy hardware manufacturer and SCADA telemetry platform. **Victron does not operate on blockchain, does not issue tokens, and has no concept of USDC yield, tokenized fractional shares, or Solana liquidity pools.** 

The **Treetino protocol** is the bridge: it ingests physical telemetry from Venus OS / Cerbo GX controllers, proves energy generation and consumption cryptographically, and tokenizes renewable hardware into fractional yield-bearing digital assets.

```
┌────────────────────────────────────────────────────────┐
│             VICTRON ENERGY VRM API (LIVE)              │
│  • Instantaneous Watts (Solar, Battery, Grid, Loads)   │
│  • Battery SOC %, Voltage, Amperage, Time-To-Go (TTG)  │
│  • Real Hardware Inventory & Firmware Versions         │
│  • Cumulative Energy Counters (kWh Today, Week, Year)  │
│  • 24-Hour Hourly Load & Generation Timeseries         │
│  • Wireless IoT Environmental Probes (RuuviTag)        │
└───────────────────────────┬────────────────────────────┘
                            │ Real-Time SCADA Telemetry
                            ▼
┌────────────────────────────────────────────────────────┐
│             TREETINO DEPIN TOKENIZATION LAYER          │
│  • Fractional Token Issuance (e.g. 1 Share = $1 USDC)  │
│  • Revenue Monetization Mechanics (Arbitrage, Tariffs) │
│  • Target Pool Funding & Real-Time Wallet Yield Stream │
│  • Transparent Cashflow Waterfall & Reserves           │
└────────────────────────────────────────────────────────┘
```

---

## Live API Endpoints Queried by Treetino Backend

Our backend service (`backend/src/victron/victron.service.ts`) communicates directly with `https://vrmapi.victronenergy.com/v2` using official demo authentication:

| Endpoint | Method | Purpose & Real Data Extracted |
| :--- | :--- | :--- |
| `/v2/auth/loginAsDemo` | `GET` | Generates a valid JSON Web Token (`Bearer <token>`) for demo session access. |
| `/v2/users/22/installations?extended=1` | `GET` | Fetches master site metadata, Venus OS identifier, GPS coordinates, and real-time instantaneous electrical parameters (`solar_yield`, `consumption`, `from_to_grid`, `bv`, `bs`, `bc`, `bst`, `rtt`, `gRC`, `tsT`). |
| `/v2/installations/{siteId}/system-overview` | `GET` | Discovers all physical hardware connected to the Cerbo GX: Inverters (MultiPlus, Quattro, Multi RS), MPPT solar chargers, BMS, Carlo Gavazzi & VM-3P75CT energy meters, and EVCS charging stations. |
| `/v2/installations/{siteId}/overallstats` | `GET` | Reads lifetime and cumulative energy counters: `total_solar_yield`, `total_consumption`, `grid_history_to`, `grid_history_from`. |
| `/v2/installations/{siteId}/stats?type=kwh` | `GET` | Queries 24-hour hourly production and consumption points (`kwh`, `Pc`, `Bc`, `Pb`, `Pg`, `Bg`, `Gc`). |
| `/v2/installations/{siteId}/stats?type=evcs` | `GET` | Queries 24-hour hourly energy delivered specifically to electric vehicles (`evE`) on Site 374891. |
| `/v2/installations/{siteId}/widgets/BatterySummary` | `GET` | Queries battery state of health, remaining runtime (`TTG`), and consumed amp-hours (`CE`). |
| `https://api.open-meteo.com/v1/forecast` | `GET` | Live ambient weather (temperature, humidity, wind speed) fetched for each site's exact GPS coordinates. |

---

## Complete Audit: Real Telemetry vs. Modeled DePIN Layer

| Data Property in App | Real Victron VRM API? | Source / Endpoint / Explanation |
| :--- | :---: | :--- |
| **Instantaneous Solar Yield (W)** | **REAL** | `extended.solar_yield` from `/v2/users/22/installations` |
| **Instantaneous Consumption (W)** | **REAL** | `extended.consumption` from `/v2/users/22/installations` |
| **Instantaneous Grid Exchange (W)** | **REAL** | `extended.from_to_grid` from `/v2/users/22/installations` |
| **Battery State of Charge (SOC %)** | **REAL** | `extended.bs` from `/v2/users/22/installations` |
| **Battery Voltage (V) & Amps (A)** | **REAL** | `extended.bv` and `extended.bc` from `/v2/users/22/installations` |
| **Battery Operational State** | **REAL** | `extended.bst` ('Charging', 'Discharging', 'Idle') |
| **Battery Runtime Remaining (TTG)** | **REAL** | `BatterySummary.data['52'].valueFloat` (hours) |
| **Battery Consumed Ah** | **REAL** | `BatterySummary.data['50'].valueFloat` (Amphours) |
| **Connected Hardware Device List** | **REAL** | `/v2/installations/{siteId}/system-overview` (`records.devices`) |
| **Firmware Versions & Bus IDs** | **REAL** | Device records (e.g. `v3.80`, `v1.13`, `2628494`, `v1.27`) |
| **Backup Generator Status** | **REAL** | `extended.gRC` ('Stopped') for off-grid system |
| **Wireless Temperature Probe** | **REAL** | `extended.tsT` (e.g. 36.9 °C) and `extended.tscn` ('TEST PARTER') from RuuviTag probe |
| **Site Geographic Coordinates** | **REAL** | `extended.lt` (Latitude) and `extended.lg` (Longitude) |
| **24-Hour Solar Production Timeseries** | **REAL** | `/stats?type=kwh` (`records.kwh` hourly array) |
| **24-Hour Consumption Timeseries** | **REAL** | `/stats?type=kwh` (`records.Pc` / `records.Bc`) |
| **24-Hour Grid Export Timeseries** | **REAL** | `/stats?type=kwh` (`records.Pg`) |
| **24-Hour EV Dispensed Energy (kWh)** | **REAL** | `/stats?type=evcs` (`records.evE` hourly array) |
| **Cumulative Daily & Annual Energy** | **REAL** | `/overallstats` (`today`, `week`, `month`, `year`) |
| **Live Ambient Weather** | **REAL** | Open-Meteo API using exact site GPS coordinates |
| **Token Funding Target & Share Price** | *MODELED* | Treetino DePIN protocol smart contract asset parameters |
| **Projected APY %** | *MODELED* | Treetino economic yield projection based on asset archetype |
| **Tariff Rates ($/kWh)** | *MODELED* | Treetino off-taker energy purchase agreement (PPA) model |
| **Live Wallet Streaming Ticker** | *MODELED* | Client-side micro-yield demonstration (+0.0009 USDC/s) |
| **Individual EV Bay Car Names/SOC** | *MODELED* | While Victron tracks 10 EV chargers and total site EV power, per-car models (e.g. "Taycan 78%") are animated UI simulations |

---

## Detailed Installation Profiles

Each installation has its own dedicated documentation detailing its electrical architecture, VRM API mapping, and tokenization economics:

1. [**01. Off-Grid Solar Microgrid (Site 209689)**](./01-offgrid-microgrid.md) - Remote residential solar + lithium storage replacing expensive diesel generation in Queensland, Australia (8.5% APY).
2. [**02. Commercial ESS Battery Storage (Site 219742)**](./02-commercial-ess.md) - High-yield commercial battery storage performing wholesale day-ahead arbitrage and grid frequency regulation in Amsterdam, Netherlands (14.2% APY).
3. [**03. Solar EV Fast-Charging Hub (Site 374891)**](./03-ev-charging-plaza.md) - 10-bay high-throughput commercial EV charging plaza buffered by solar and Quattro inverters in Paris, France (18.5% APY).
4. [**04. Treetino V1 Biomimetic Smart Energy Tree**](./04-treetino-v1-tree.md) - Flagship dual-modality urban DePIN (22 solar tracking leaves + 12 ducted VAWT wind turbines + trunk battery + MKovo PPA, 11.8% APY).

---

## Reusable Component Architecture (`frontend/src/features/victron/components/`)

All 4 installation layouts have been refactored away from ad-hoc markup into a standardized, reusable component hierarchy:

- `TelemetrySidepanel`: Standardized HTML sidepanel column (`xl:col-span-3`) containing the live telemetry header, archetype-specific specialty slot (e.g. Tree physics, Diesel replacement, ESS Arbitrage, EV Bay RuuviTag), real-time Open-Meteo weather station, and Cerbo GX / Venus OS connectivity diagnostics. Decoupled from SVG to prevent vertical clipping.
- `InstallationHeader`: Standardized hero header with installation title, category badge, and interactive 3-mode flow switcher (`Energy Flow`, `Fund Flow`, `Unified`).
- `FlowSummaryBanner`: 4-column KPI metric banner summarizing clean generation, off-take load, metered revenue/savings, and investor APY.
- `StreamingYieldTicker`: Live client-side micro-yield dividend counter reflecting real-time token returns.
- `SchematicCard`: Standardized SVG card component for topology nodes with accent palettes (`amber`, `sky`, `emerald`, `rose`, `forest`), sparklines, badges, and progress bars.
- `ConduitLine`: Orthogonal SVG conduit pipe with directional particle animations for kilowatt power flows and USDC cash flows.
- `CashFlowDossier`: Off-taker commercial counterparty profile and 3-tier investor waterfall.

