# 04. Treetino V1 · Biomimetic Smart Energy Tree (Dual-Modality DePIN)

> **Asset Archetype**: Urban/Industrial Biomimetic Dual-Modality Microgrid (Solar Tracking Leaves + Ducted VAWT Wind Turbines + Trunk Storage + Micro-PPA).  
> **Location**: Středočeský Region, Czech Republic (`50.0755° N, 14.4378° E`)  
> **Commercial Off-Taker**: MKovo s.r.o. (Precision CNC metal tooling workshop)  
> **Tokenized Valuation**: $125,000 USDC · 125,000 Shares · **11.8% Projected APY**  

---

## 1. Physical Architecture & Hardware Specifications

The **Treetino V1** is an autonomous renewable energy microgrid engineered in the form of a biomimetic architectural tree, delivering continuous 24/7 power from both solar and wind with a compact $1.2\text{ m}^2$ ground footprint.

```
                    [ 22x Solar Tracking Leaves ]
                       (8.8 kWp Monocrystalline)
                                   │
                                   ▼
 [ 12x VAWT Turbines ] ──► [ Trunk Core (MPPT & MultiPlus) ] ──► [ MKovo s.r.o. CNC ]
   (35 kWp Ducted Venturi)         │                                (12 kW Peak Load)
                                   ▼
                        [ 40 kWh LiFePO4 Battery ]
                           (Trunk Base Storage)
                                   │
                                   ▼
                        [ Regional Grid Intertie ]
                           (Bidirectional AC)
```

### Physical Subsystems:
1. **Biomimetic Solar Canopy**:
   - **22 motorized PV "leaves"** with dual-axis heliostatic sun tracking.
   - Total solar capacity: **8.8 kWp** monocrystalline bifacial cells.
   - Stepper actuators with optical encoder feedback (RE 30-2-500) adjust azimuth and elevation hourly, increasing solar yield by up to 34% compared to static rooftop solar.
   - Automated storm defense stowing (feathering against trunk at winds $>20\text{ m/s}$) and snow-shedding tilt routines.

2. **Ducted Vertical-Axis Wind Turbines (VAWT)**:
   - **12 omnidirectional ducted turbines** integrated around the trunk perimeter.
   - Total wind capacity: **35 kWp**.
   - Venturi duct geometry accelerates ambient airflow through the turbine blades by $+27\%$, lowering the cut-in wind speed to just $1.8\text{ m/s}$.
   - Silent magnetic levitation bearings maintain noise levels below **35 dB(A) at 10 meters**, making the tree compliant with dense urban and industrial noise codes.

3. **Trunk Core Power Electronics**:
   - **Inverter/Charger**: Victron MultiPlus-II 48/5000/70-50 (48V DC to 230V AC pure sine wave).
   - **Solar Charge Controllers**: Dual Victron SmartSolar MPPT 250/100-Tr with VE.Can bus.
   - **Battery Storage**: 40 kWh Lithium Iron Phosphate (LiFePO4) cell pack with integrated Victron Lynx Smart BMS.
   - **SCADA Gateway**: Victron Cerbo GX controller running Venus OS with D-Bus communication to on-tree microcontrollers.

---

## 2. Telemetry Ingestion & Simulation Mechanics

Because the Treetino V1 Tree is our flagship prototype undergoing physical deployment, its telemetry combines:
1. **Live Open-Meteo Weather**: Actual ambient temperature, wind velocity, and solar irradiance fetched in real-time for its exact coordinates in Czech Republic.
2. **First-Principles Aerodynamic & Solar Physics**:
   - Wind generation is computed dynamically via the cubic wind power curve $P_{\text{wind}} = \frac{1}{2} \rho A v^3 C_p$ boosted by the $27\%$ Venturi cowl effect.
   - Solar leaf generation accounts for real-time sun elevation, cloud cover, and active 2-axis tracking angles.
   - Acoustic noise is calculated as a logarithmic function of turbine RPM: $L_p = 22 + 10 \cdot \log_{10}(\text{RPM} / 60)$.
3. **Venus OS / D-Bus Telemetry Schema**: Formatted to the exact specification of Victron Energy's VRM JSON payloads so our smart contracts and frontend treat it identically to our other industrial Victron sites.

---

## 3. Commercial Counterparty & Cash Flow Waterfall

### Off-Taker: MKovo s.r.o.
- **Facility**: Precision metal CNC fabrication workshop.
- **Contract Type**: 10-year direct Corporate Power Purchase Agreement (PPA).
- **Tariff Rate**: **$0.32 / kWh** (vs. volatile grid industrial tariff of $0.38 - $0.44 / kWh).
- **Billing Mechanics**: Automated daily smart meter reconciliation streaming USDC payments directly to the Solana escrow vault.

### Annual Investor Revenue Waterfall ($14,750 / Year Projected):

| Priority Tier | Beneficiary | % of Gross | Est. Annual (USDC) | Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **Tier 1: Senior** | Operating & Maintenance | 12.0% | $1,770 | Actuator calibration, turbine inspection, firmware updates |
| **Tier 2: Reserve** | Capital Replacement Fund | 8.0% | $1,180 | Battery cell replacement & insurance reserve |
| **Tier 3: Equity** | **Tokenized Share Holders** | **80.0%** | **$11,800** | **Streamed continuously to Solana token holders (11.8% APY)** |

---

## 4. Frontend Component Implementation

The Treetino V1 layout is implemented in [`frontend/src/features/victron/layouts/treetino-layout.tsx`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/layouts/treetino-layout.tsx) using the shared component architecture:
- [`InstallationHeader`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/components/installation-header.tsx) with live flow switcher (**Energy**, **Funds**, **Unified**).
- [`FlowSummaryBanner`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/components/flow-summary-banner.tsx) displaying combined generation (solar + wind), CNC load, and net yield.
- [`StreamingYieldTicker`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/components/streaming-yield-ticker.tsx) with real-time dividend ticker.
- Dedicated 12-column responsive layout: 9 columns for the SVG circuit topology canvas and 3 columns for [`TelemetrySidepanel`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/components/telemetry-sidepanel.tsx).
- [`CashFlowDossier`](file:///Users/jakub/Projects/treetino-hack/frontend/src/features/victron/components/cash-flow-dossier.tsx) presenting the MKovo s.r.o. contract and revenue waterfall.
