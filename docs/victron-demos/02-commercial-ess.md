# Demo 02: Commercial ESS Battery Storage (Site 219742)

> **Archetype**: Grid Flexibility · High-Yield Arbitrage  
> **Physical Location**: Amsterdam, Netherlands (`52.3629° LAT`, `4.89298° LNG`)  
> **Venus OS Gateway Identifier**: `c0619ab27f32`  
> **Official Victron VRM Portal**: [https://vrm.victronenergy.com/installation/219742/dashboard](https://vrm.victronenergy.com/installation/219742/dashboard)

---

## 1. System Topology & Electrical Hardware

This installation is a commercial grid-tied Energy Storage System (ESS) located in the Netherlands. It operates simultaneously with high-capacity rooftop solar arrays, a multi-phase battery storage cluster, an industrial MultiPlus-II inverter/charger, and a utility-grade grid meter.

### Real Physical Hardware Detected on Cerbo-S GX (via `/v2/installations/219742/system-overview`)

| Device Role | Component Model | Firmware | Instance / ID |
| :--- | :--- | :--- | :--- |
| **System Gateway** | Victron Cerbo-S GX | `v3.80` | Host Controller |
| **Bidirectional Inverter** | MultiPlus-II 48/3000/35-32 (50A sensor) | `2628494` | Instance 276 (VE.Bus) |
| **Battery Bank** | Pylontech US3000C Lithium 48V | N/A | Instance 512 (CAN-bus BMS) |
| **Solar Charger 1** | SmartSolar Charger VE.Can 150/70 | `v3.10` | Instance 1 (`MPPT VE.Can 150/70`) |
| **Solar Charger 2** | SmartSolar MPPT RS 450/100 | `v1.10` | Instance 3 (`HQ2044HT47H`) |
| **Solar Charger 3** | SmartSolar MPPT RS 450/200 | `v1.09` | Instance 278 (`HQ2112W93LC`) |
| **PV Inverter (AC-coupled)** | Fronius Primo 5.0-1 | `0.3.23.0` | Instance 20 (`Fronius`) |
| **PV Inverter (Secondary)** | Single Phase PV Inverter on L2 | `1` | Instance 30 |
| **3-Phase Grid Meter** | Carlo Gavazzi Energy Meter ET340 | `1` | Instance 31 |

---

## 2. Live Telemetry Data Received from Victron VRM API

The following real-time telemetry is fetched directly from the Victron VRM API:

```json
{
  "siteId": 219742,
  "solarYieldWatts": 528.0,
  "consumptionWatts": 288.0,
  "gridWatts": -14.0,
  "batterySocPercent": 22.0,
  "batteryVoltage": 48.75,
  "batteryCurrentAmps": 4.90,
  "batteryState": "Charging",
  "systemState": "Recharging",
  "systemType": "ESS",
  "gridStatus": "Grid ok",
  "acInWatts": 115.0,
  "acOutWatts": 92.0
}
```

### Exact VRM API Attribute Mapping:
- **Solar Yield (Watts)**: `extended.solar_yield` (Aggregated yield across Fronius PV inverters + 3x SmartSolar MPPTs).
- **Consumption (Watts)**: `extended.consumption` (Facility AC loads).
- **Grid Exchange (Watts)**: `extended.from_to_grid` (Negative value = exporting excess green energy into the Dutch grid).
- **Battery State of Charge**: `extended.bs` (22.0% SOC).
- **Battery Voltage**: `extended.bv` (48.75 V nominal 48V bank).
- **Battery Current**: `extended.bc` (+4.90 A charging current).
- **Operational Mode**: `extended.ss` (`Recharging` in ESS mode).
- **Grid Safety State**: `extended.Agl` (`Grid ok` — synchronized with frequency and voltage requirements).
- **24-Hour Timeseries**: `/stats?type=kwh` providing hourly points for:
  - `kwh`: Solar array production curve
  - `Pc`: Direct solar power self-consumed
  - `Pb`: Solar power stored into the battery
  - `Pg`: Solar power exported to the grid
  - `Bg`: Battery energy discharged into the grid during peak evening hours (grid balancing)

---

## 3. Treetino DePIN Tokenization Economics

### The Problem in Grid Flexibility
Transmission System Operators (TSOs) face severe grid congestion: excess solar floods the grid around midday causing negative wholesale prices, followed by extreme price spikes during the 17:00–21:00 evening peak. Stationary Battery Energy Storage Systems (BESS) are essential to buffer this volatility, but institutional projects require millions in capital.

### The Treetino Protocol Solution
1. **Commercial BESS Crowdfunding**: Treetino tokenizes commercial-scale battery systems, allowing retail and institutional crypto capital to co-fund storage assets.
2. **Algorithmic Arbitrage Execution**: The system automatically charges when wholesale day-ahead spot prices are lowest/negative and discharges during peak tariff windows.
3. **Capacity Reserve Revenue**: Contracted automated frequency restoration reserve (aFRR / FCR) provides steady availability payments (€45/MW/h).
4. **Programmatic Yield Stream**: Net arbitrage profits and grid capacity fees stream directly to BESS share holders on Solana.

### Financial Parameters:
- **Suggested Target**: $50,000 USDC
- **Funded Capital**: $42,100 USDC (84.2% funded)
- **Tokenized Shares**: 50,000 shares @ $1.00 USDC
- **Projected APY**: **14.2%**
- **Estimated Annual Revenue**: $7,100.00 / year
- **Estimated Monthly Revenue**: $591.67 / month
- **Tariff Spread**: $0.35/kWh peak discharge spread + €45/MW/h grid frequency reserve

### Cashflow Waterfall:
```
Gross Energy & Balancing Revenue ($7,100.00 / yr · 100%)
 ├── Grid Interconnection & Trading Fee (-$497.00 / yr · 7%)
 │    └── Transmission operator intertie fee and automated algorithmic bidding
 └── Net Investor Distribution ($6,603.00 / yr · 93%)
      └── Real-time and quarterly yield distributions streamed to BESS holders
```

---

## 4. Discrepancy & Disclosure Notice

| Feature | Physical Reality (Victron VRM) | Modeled in Demo App (Treetino) | Rationale |
| :--- | :--- | :--- | :--- |
| **Grid Power Sign** | Negative value means export | Dynamic animated gold/emerald conduits | Flow particles move toward the grid card when exporting and toward the house when importing. |
| **Arbitrage Settlement** | European EPEX SPOT day-ahead settlement | Calculated as $0.35/kWh peak spread | Simplifies European power market clearing into an intuitive yield metric for global investors. |
| **Secondary Meter** | Carlo Gavazzi ET340 on L2 | Uncoupled IoT Telemetry card | Highlights the presence of sub-metering without cluttering the primary high-voltage schematic. |
