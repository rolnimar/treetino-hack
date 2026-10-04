# Demo 03: Solar EV Fast-Charging Hub (Site 374891)

> **Archetype**: Machine-to-Machine · High-Velocity Economy  
> **Physical Location**: Paris, France (`48.8575° LAT`, `2.35138° LNG`)  
> **Venus OS Gateway Identifier**: `c0619ab3086a`  
> **Official Victron VRM Portal**: [https://vrm.victronenergy.com/installation/374891/dashboard](https://vrm.victronenergy.com/installation/374891/dashboard)

---

## 1. System Topology & Electrical Hardware

This site represents a high-throughput commercial Electric Vehicle (EV) charging plaza. It is engineered with high-power Quattro inverter/chargers, utility grid connection, rooftop solar PV, and an extensive network of commercial Victron EV Charging Stations.

### Real Physical Hardware Detected on Cerbo GX (via `/v2/installations/374891/system-overview`)

Cerbo GX manages **21 connected industrial hardware components**:

| Device Role | Component Model | Firmware | Instance / ID |
| :--- | :--- | :--- | :--- |
| **System Gateway** | Victron Cerbo GX | `v3.90-beta5` | Host Controller |
| **Heavy-Duty Inverter** | Quattro 48/10000/140-2x100 | `2653502` | Instance 276 (Dual AC-In Inverter) |
| **Precision Shunt** | Lynx Shunt 1000A VE.Can | `v1.08` | Instance 1 (`Lynx Shunt`) |
| **Solar Charger 1** | SmartSolar MPPT VE.Can 250/100 rev2 | `v3.14` | Instance 278 (`MPPT 3`) |
| **Solar Charger 2** | SmartSolar MPPT VE.Can 250/100 rev2 | `v3.14` | Instance 279 (`MPPT 2`) |
| **Solar Charger 3** | SmartSolar MPPT RS 450/200 | `v1.10` | Instance 280 (`HQ2231PGF9X`) |
| **PV Inverter 1** | Fronius PV Inverter | `0.3.29.1` | Instance 20 |
| **PV Inverter 2** | Fronius PV Inverter | `0.3.27.2` | Instance 48 |
| **PV Inverter 3** | Fronius PV Inverter | `0.3.30.0` | Instance 52 |
| **3-Phase Power Meter** | Energy Meter VM-3P75CT | `v1.03` | Instance 41 (`HQ2322EJFQP`) |
| **Wireless IoT Sensor** | RuuviTag Wireless Environmental Probe | N/A | Instance 20 (`TEST PARTER`) |
| **EV Charger Bay 1** | Victron EV Charging Station 32A NS | `v1.27` | Instance 62 (`EVCS-Victron1`) |
| **EV Charger Bay 2** | Victron EV Charging Station 32A NS | `v1.27` | Instance 70 (`EVCS-Victron2`) |
| **EV Charger Bay 3** | Victron EV Charging Station 32A | `v1.27` | Instance 51 (`EVCS-Victron3`) |
| **EV Charger Bay 4** | Victron EV Charging Station 32A NS | `v1.27` | Instance 74 (`EVCS-Victron5`) |
| **EV Charger Bay 5** | Victron EV Charging Station 32A | `v1.27` | Instance 55 (`EVCS-Victron6`) |
| **EV Charger Bay 6** | Victron EV Charging Station 32A | `v1.27` | Instance 52 (`EVCS-Victron7`) |
| **EV Charger Bay 7** | Victron EV Charging Station 32A | `v1.27` | Instance 56 (`EVCS-Victron8`) |
| **EV Charger Bay 8** | Victron EV Charging Station 32A | `v1.27` | Instance 47 (`EVCS-Victron9`) |
| **EV Charger Bay 9** | Victron EV Charging Station 32A | `v1.27` | Instance 75 (`EVCS-Victron10`) |
| **EV Charger Bay 10** | Victron EV Charging Station 32A NS | `v1.27` | Instance 96 (`EVCS-Victron11`) |

---

## 2. Live Telemetry Data Received from Victron VRM API

The following real-time telemetry is fetched directly from the Victron VRM API:

```json
{
  "siteId": 374891,
  "solarYieldWatts": 577.0,
  "consumptionWatts": 9558.0,
  "gridWatts": 9101.0,
  "batterySocPercent": 51.0,
  "batteryVoltage": 52.49,
  "batteryCurrentAmps": 0.10,
  "batteryState": "Idle",
  "temperatureProbeCelsius": 36.9,
  "temperatureProbeName": "TEST PARTER",
  "evDeliveredKwh24h": 265.42,
  "chargerConfig": {
    "maxCurrentAmps": 32,
    "serialNumber": "HQ2112MWRUI"
  }
}
```

### Exact VRM API Attribute Mapping:
- **Consumption (Watts)**: `extended.consumption` (**9,558 W** — heavy active charging power drawn by vehicles).
- **Grid Import (Watts)**: `extended.from_to_grid` (**9,101 W** drawn from the 3-phase grid to support fast dispensers).
- **Solar Yield (Watts)**: `extended.solar_yield` (**577 W** supplementary rooftop solar).
- **Wireless Probe Temperature**: `extended.tsT` (**36.9 °C**) from RuuviTag probe labeled `TEST PARTER`.
- **24-Hour EV Delivered Energy**: `/stats?type=evcs` attribute `evE` (**265.42 kWh** delivered across chargers in past 24 hours).
- **Charger Serial & Amperage Limit**: `extended.evS` (`HQ2112MWRUI`) and `extended.evmi` (`32 A` per phase).

---

## 3. Treetino DePIN Tokenization Economics

### The Problem in EV Charging Infrastructure
Fast-charging hubs require substantial upfront capital ($100k+ for high-amperage transformers, Quattro inverters, and commercial dispensers). Traditional financing is slow and centralized, while EV drivers demand transparent point-of-sale pricing without proprietary walled-garden membership cards.

### The Treetino Protocol Solution
1. **Community Infrastructure Financing**: Retail investors fund the $100,000 plaza installation via tokenized shares on Solana.
2. **Machine-to-Machine Micro-Billing**: Vehicles connect to dispensers; smart contracts meter energy delivery and accept instant payment in stablecoins.
3. **Future Energy Stablecoin Foundation**: High-velocity daily energy throughput (265+ kWh/day) creates the ideal real-world peg for an energy-backed stablecoin.
4. **Autonomous Revenue Distribution**: Charging fees are programmatically collected, site leases deducted, and net yields streamed continuously to plaza tokenholders.

### Financial Parameters:
- **Suggested Target**: $100,000 USDC
- **Funded Capital**: $91,500 USDC (91.5% funded)
- **Tokenized Shares**: 100,000 shares @ $1.00 USDC
- **Projected APY**: **18.5%**
- **Estimated Annual Revenue**: $18,500.00 / year
- **Estimated Monthly Revenue**: $1,541.67 / month
- **Tariff Structure**: $0.42 / kWh delivered + $2.50 session connection fee per charge

### Cashflow Waterfall:
```
Gross Charging Revenue ($18,500.00 / yr · 100%)
 ├── Site Lease & Payment Gateway (-$1,480.00 / yr · 8%)
 │    └── Commercial parking space lease, hardware warranty, network processing
 └── Net Investor Distribution ($17,020.00 / yr · 92%)
      └── Automated yield stream distributed to plaza tokenholders on Solana
```

---

## 4. Discrepancy & Disclosure Notice

| Feature | Physical Reality (Victron VRM) | Modeled in Demo App (Treetino) | Rationale |
| :--- | :--- | :--- | :--- |
| **EV Charger Count** | 10 physical EVCS chargers (`EVCS-Victron1` to `EVCS-Victron11`) | 10 commercial charging bays displayed in grid | **100% matched to physical reality** — Cerbo GX tracks all 10 hardware units. |
| **Total EV Energy** | 265.42 kWh delivered over 24 hours (`/stats?type=evcs`) | Displayed as 24h plaza throughput metric | Real live data aggregated from Victron's EVCS stats endpoint. |
| **Individual Bay Vehicles** | Victron reports aggregate site load (9.5 kW) and individual charger status codes | Bay cards display simulated vehicles (e.g. Model 3, Taycan, Ioniq 5) with battery SOC% and elapsed time | Victron's EVCS API does not report the vehicle's internal battery SOC or VIN to the public VRM demo. Simulating the connected vehicle models illustrates the complete consumer-facing DePIN experience. |
| **Temperature Sensor** | RuuviTag wireless probe `TEST PARTER` @ 36.9 °C | Dedicated Plaza IoT Telemetry console | Uncoupled from the power flow schematic as requested, accurately reflecting auxiliary IoT telemetry. |
