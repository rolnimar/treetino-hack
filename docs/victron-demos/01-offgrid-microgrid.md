# Demo 01: Off-Grid Solar Microgrid (Site 209689)

> **Archetype**: Grassroots DePIN · Permissionless Adoption  
> **Physical Location**: Queensland, Australia (`-25.7503° LAT`, `151.265° LNG`)  
> **Venus OS Gateway Identifier**: `48e7da86e0d9`  
> **Official Victron VRM Portal**: [https://vrm.victronenergy.com/installation/209689/dashboard](https://vrm.victronenergy.com/installation/209689/dashboard)

---

## 1. System Topology & Electrical Hardware

This site represents a remote off-grid residential homestead that operates completely disconnected from the national electrical transmission grid. It relies on rooftop solar PV, a lithium battery storage bank, a multi-mode inverter/charger, and a backup diesel genset for emergencies.

### Real Physical Hardware Detected on Cerbo GX (via `/v2/installations/209689/system-overview`)

| Device Role | Component Model | Firmware | Instance / ID |
| :--- | :--- | :--- | :--- |
| **System Gateway** | Victron Cerbo GX | `v3.80` | Host Gateway |
| **Battery Management** | Lynx Smart BMS 500A | `v1.06` | Instance 0 (`HQ2148FGDJK`) |
| **Inverter / Charger** | Multi RS Smart 48V/6000VA/100A | `v1.13` | Instance 0 (`HQ2206VRM6K`) |
| **PV Array & MPPT** | Dual MPPT Solar Tracker Tracker | Built-in | Embedded in Multi RS Smart |
| **Backup Generator** | Standby Genset | N/A | Wired to AC-In 1 |

---

## 2. Live Telemetry Data Received from Victron VRM API

The following real-time telemetry is fetched directly from the Victron VRM API:

```json
{
  "siteId": 209689,
  "solarYieldWatts": 73.0,
  "consumptionWatts": 317.0,
  "gridWatts": 0,
  "batterySocPercent": 98.8,
  "batteryVoltage": 53.06,
  "batteryCurrentAmps": -5.10,
  "batteryState": "Discharging",
  "systemState": "Off",
  "systemType": "Hub-1",
  "generatorState": "Stopped",
  "batteryTimeToGoHours": 36.35,
  "batteryConsumedAh": -2.6
}
```

### Exact VRM API Attribute Mapping:
- **Solar Yield (Watts)**: `extended.solar_yield` (Real-time MPPT generation).
- **Consumption (Watts)**: `extended.consumption` (Instantaneous AC house loads).
- **Grid Power**: Always `null` / `0` because the installation is completely off-grid.
- **Battery State of Charge**: `extended.bs` (98.8%).
- **Battery Terminal Voltage**: `extended.bv` (53.06 V).
- **Battery Current**: `extended.bc` (-5.10 A discharging to supply house loads).
- **Battery Remaining Runtime**: `widgets/BatterySummary` attribute `52` (`TimeToGo` = 36.35 hours).
- **Battery Consumed Amphours**: `widgets/BatterySummary` attribute `50` (`ConsumedAmphours` = -2.6 Ah).
- **Generator State**: `extended.gRC` (`Stopped` — genset is in standby; zero diesel consumed).
- **D-Bus Latency**: `extended.rtt` (`1 ms` real-time control bus response).
- **24-Hour Timeseries**: `/stats?type=kwh` providing hourly points for `kwh` (solar) and `Bc` (battery to consumers).

---

## 3. Treetino DePIN Tokenization Economics

### The Problem in Traditional Off-Grid Infrastructure
In remote areas (Australia, Africa, Latin America), off-grid homeowners spend **$0.60 to $0.85 per kWh** running noisy, polluting diesel generators due to high fuel transportation costs. Upfront capital expenditure for a clean solar + lithium battery system ($10,000+) is unaffordable for most individuals.

### The Treetino Protocol Solution
1. **Fractional Capital Formation**: Web3 retail investors pool $10,000 USDC into the Off-Grid Microgrid vault on Solana.
2. **Permissionless Hardware Deployment**: The local installer commissions the Victron Cerbo GX, Multi RS, and Lynx BMS hardware.
3. **Metered Repayment**: The homeowner pays a fixed clean energy tariff of **$0.40 / kWh** (saving them ~40% compared to diesel).
4. **Automated Yield Streaming**: As the homeowner consumes metered solar and battery power, funds stream into the vault and distribute to token share holders.

### Financial Parameters:
- **Suggested Target**: $10,000 USDC
- **Funded Capital**: $7,850 USDC (78.5% funded)
- **Tokenized Shares**: 10,000 shares @ $1.00 USDC
- **Projected APY**: **8.5%**
- **Estimated Annual Revenue**: $850.00 / year
- **Estimated Monthly Revenue**: $70.83 / month

### Cashflow Waterfall:
```
Gross Metered Energy Revenue ($850.00 / yr · 100%)
 ├── O&M & Telemetry Reserve (-$42.50 / yr · 5%)
 │    └── Cerbo GX LTE data SIM, warranty, scheduled servicing
 └── Net Investor Distribution ($807.50 / yr · 95%)
      └── Continuous streaming USDC yield to tokenholders
```

---

## 4. Discrepancy & Disclosure Notice

| Feature | Physical Reality (Victron VRM) | Modeled in Demo App (Treetino) | Rationale |
| :--- | :--- | :--- | :--- |
| **Grid Conduit** | Disconnected (Offgrid) | Displayed as inactive/dashed conduit | Visually proves the microgrid is disconnected from the main grid. |
| **Genset State** | `Stopped` (0 W output) | Displayed with $0.00/hr fuel cost badge | Accentuates savings: 100% solar/battery powering the home without diesel. |
| **Yield Accrual** | Monthly/Quarterly invoicing | Live second-by-second ticker (+0.0009 USDC/s) | Visual demonstration of continuous DeFi streaming on Solana. |
