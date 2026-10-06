import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  FroniusIcon,
  SunIcon,
  EvChargerIcon,
} from '../victron-icons';
import {
  InstallationHeader,
  FlowSummaryBanner,
  StreamingYieldTicker,
  TelemetrySidepanel,
  CashFlowDossier,
  SchematicCard,
  ConduitLine,
} from '../components';

interface EvLayoutProps {
  demo: VictronDemoItem;
}

export function EvLayout({ demo }: EvLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, dailyTotals, financials } = demo;

  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();
  const dailyDisplacedSavings = (
    (demo.evDeliveredKwh24h ?? 288.59) * 0.42 +
    32 * 2.5
  ).toFixed(2);

  const gridTrend = [6500, 7200, 8100, 8500, currentPower.gridWatts || 8717];
  const acLoadTrend = [580, 610, 595, 620, 607];
  const essentialTrend = [7400, 7800, 8300, 7950, 8109];
  const batteryTrend = [55, 53, 52, 51.5, currentPower.batterySocPercent];
  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);

  return (
    <div className="rounded-2xl border border-forest/15 bg-white/95 p-5 shadow-sm sm:p-7 space-y-6">
      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
      />

      {/* 2. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Canopy Solar Generation',
          value: `${dailyTotals.solarYieldKwh.toFixed(2)} kWh Today`,
          subtext: `Live canopy output: ${currentPower.solarYieldWatts.toFixed(0)} W`,
        }}
        consumption={{
          label: 'Plaza EV Charging Load',
          value: '10.34 kW Active',
          subtext: `Past 24h: ${(demo.evDeliveredKwh24h ?? 288.59).toFixed(2)} kWh delivered`,
        }}
        revenueOrSavings={{
          label: 'High-Velocity EV Revenue',
          value: `+$${dailyDisplacedSavings} / day`,
          subtext: '10 Bays ($0.42/kWh + $2.50 session fee)',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'High-frequency transaction streaming on Solana',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Solar EV Fast-Charging Hub"
        stakePercent="0.10%"
        hourlyRate="+$0.042 / hr"
        baseYieldUsdc={0.0664}
        incrementPerSecond={0.0018}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS (Exact Replica of media_1791148416810.png) */}
        <div className="xl:col-span-9 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-forest/15 bg-[#fbfaf7] p-3 sm:p-5 flex items-center">
            <svg
              viewBox="0 0 770 700"
              className="w-full h-auto min-w-[720px] select-none"
            >
              {/* CONDUIT PIPES LAYER */}
              {/* 1. Grid bottom (130, 165) down to EVCS #1 top (130, 190) */}
              <ConduitLine
                x1={130}
                y1={165}
                x2={130}
                y2={190}
                flow={flowMode !== 'funds' ? 'rose' : null}
                fundsFlow={
                  flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
                }
              />

              {/* 2. EVCS #1 right (235, 262) to Quattro Inverter left (280, 262) */}
              <ConduitLine
                x1={235}
                y1={262}
                x2={280}
                y2={262}
                flow={flowMode !== 'funds' ? 'rose' : null}
              />

              {/* 3. AC Loads bottom (385, 165) down to Quattro AC-In top (385, 190) */}
              <ConduitLine
                x1={385}
                y1={165}
                x2={385}
                y2={190}
                flow={flowMode !== 'funds' ? 'emerald' : null}
              />

              {/* 4. Quattro AC-Out right (490, 262) to EVCS #2 left (535, 262) */}
              <ConduitLine
                x1={490}
                y1={262}
                x2={535}
                y2={262}
                flow={flowMode !== 'funds' ? 'sky' : null}
                fundsFlow={
                  flowMode === 'funds' || flowMode === 'both'
                    ? 'reverse-gold'
                    : null
                }
              />

              {/* 5. Branch up from AC-Out (512, 262) to Essential Loads (535, 165) */}
              <path
                d="M 512 262 V 165 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 512 262 V 165 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 512 262 V 165 H 535"
                  className="vrm-flow-sky"
                  fill="none"
                />
              )}

              {/* 6. Branch down from AC-Out (512, 262) to PV Inverter #2 (535, 432) */}
              <path
                d="M 512 262 V 432 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 512 262 V 432 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 535 432 H 512 V 262"
                  className="vrm-flow-amber"
                  fill="none"
                />
              )}

              {/* 7. Quattro bottom (385, 335) down to Battery top (385, 360) */}
              <ConduitLine
                x1={385}
                y1={335}
                x2={385}
                y2={360}
                flow={flowMode !== 'funds' ? 'emerald' : null}
              />

              {/* 8. Battery bottom (385, 505) down to y:602 and right to PV Charger (535, 602) */}
              <path
                d="M 385 505 V 602 H 535"
                className="vrm-conduit-outer"
                fill="none"
              />
              <path
                d="M 385 505 V 602 H 535"
                className="vrm-conduit-inner"
                fill="none"
              />
              {flowMode !== 'funds' && (
                <path
                  d="M 535 602 H 385 V 505"
                  className="vrm-flow-amber"
                  fill="none"
                />
              )}

              {/* 9. PV Inverter #1 top (130, 360) up to EVCS #1 bottom (130, 335) */}
              <ConduitLine
                x1={130}
                y1={360}
                x2={130}
                y2={335}
                flow={flowMode !== 'funds' ? 'amber' : null}
              />

              {/* Junction Dots */}
              <circle
                cx="130"
                cy="262"
                r="6"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <circle
                cx="512"
                cy="262"
                r="6"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* HARDWARE NODES LAYER (10 Authentic Victron Devices) */}

              {/* ROW 1: GRID SUPPLY, AC LOADS, ESSENTIAL LOADS */}
              {/* Card 1.1: GRID SUPPLY */}
              <SchematicCard
                x={25}
                y={20}
                width={210}
                height={145}
                accent="rose"
                icon={<GridIcon className="h-4 w-4 text-rose-700" />}
                title="Grid Supply"
                badge="3-Phase 400V"
                primaryValue={`${(currentPower.gridWatts || 8717).toFixed(0)} W`}
                subtext="Commercial Fast-Feed Intertie"
                sparklineData={gridTrend}
                footerLabel="Grid Meter:"
                footerValue="VM-3P75CT Metered"
              />

              {/* Card 1.2: AC LOADS */}
              <SchematicCard
                x={280}
                y={20}
                width={210}
                height={145}
                accent="emerald"
                icon={<PowerPlugIcon className="h-4 w-4 text-emerald-700" />}
                title="AC Loads"
                badge="Auxiliary"
                primaryValue="607 W"
                subtext="Facility lighting & canopy HVAC"
                sparklineData={acLoadTrend}
                footerLabel="Billed Tariff:"
                footerValue="-$0.07 / hr"
              />

              {/* Card 1.3: ESSENTIAL LOADS */}
              <SchematicCard
                x={535}
                y={20}
                width={210}
                height={145}
                accent="sky"
                icon={<PowerPlugIcon className="h-4 w-4 text-sky-700" />}
                title="Essential Loads"
                badge="EV Bus"
                primaryValue="8109 W"
                subtext="Dedicated high-speed charging bus"
                sparklineData={essentialTrend}
                footerLabel="Throughput:"
                footerValue="+$3.41 / hr"
              />

              {/* ROW 2: EVCS STATION #1, QUATTRO HUB, EVCS STATION #2 */}
              {/* Card 2.1: EVCS STATION #1 (ACTIVE 14.45 kW) */}
              <SchematicCard
                x={25}
                y={190}
                width={210}
                height={145}
                accent="sky"
                icon={<EvChargerIcon className="h-4 w-4 text-sky-600" />}
                title="EVCS Bay #1"
                badge="Active 32A"
                primaryValue="14.45 kW"
                subtext="Fast charging session in progress"
                footerLabel="Session Rate:"
                footerValue="$0.42 / kWh"
              />

              {/* Card 2.2: QUATTRO INVERTER HUB */}
              <foreignObject x={280} y={190} width={210} height={145}>
                <div className="h-full w-full rounded-2xl border-2 border-forest bg-forest text-cream p-3.5 shadow-md flex flex-col justify-between overflow-hidden select-none">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-leaf">
                      48V
                    </span>
                    <span className="rounded bg-cream/15 px-2 py-0.5 font-mono text-[9px] font-bold text-cream">
                      Quattro 48/10000
                    </span>
                  </div>
                  <div>
                    <div className="font-mono text-base font-black text-white">
                      Bulk · 140A
                    </div>
                    <div className="mt-0.5 font-mono text-xs font-extrabold text-leaf">
                      {financials.projectedApy}% APY Yield
                    </div>
                  </div>
                  <div className="border-t border-cream/15 pt-1 font-mono text-[10px] text-cream/70 text-center">
                    Plaza Fast-Charging Hub
                  </div>
                </div>
              </foreignObject>

              {/* Card 2.3: EVCS STATION #2 (STANDBY) */}
              <SchematicCard
                x={535}
                y={190}
                width={210}
                height={145}
                accent="forest"
                icon={<EvChargerIcon className="h-4 w-4 text-forest/70" />}
                title="EVCS Bay #2"
                badge="Standby"
                primaryValue="EV Ready"
                subtext="Awaiting vehicle connection"
                footerLabel="Station State:"
                footerValue="Available"
              />

              {/* ROW 3: PV INVERTER 1 (WEST), BUFFER BATTERY, PV INVERTER 2 (EAST) */}
              {/* Card 3.1: PV INVERTER #1 (Canopy West) */}
              <SchematicCard
                x={25}
                y={360}
                width={210}
                height={145}
                accent="amber"
                icon={<FroniusIcon className="h-4 w-4" />}
                title="Canopy Solar (West)"
                badge="Fronius Primo"
                primaryValue="0 W"
                subtext="Canopy West Array (AC-In)"
                sparklineData={[0, 0, 0, 0, 0]}
                footerLabel="Grid Coupling:"
                footerValue="AC-In Side"
              />

              {/* Card 3.2: BUFFER BATTERY (Lynx Shunt) */}
              <SchematicCard
                x={280}
                y={360}
                width={210}
                height={145}
                accent="emerald"
                icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
                title="Buffer Storage"
                badge="Lynx Shunt"
                primaryValue={`${currentPower.batterySocPercent.toFixed(1)} %`}
                subtext="52.49 V · 1000A Shunt"
                sparklineData={batteryTrend}
                progressPercent={currentPower.batterySocPercent}
                footerLabel="Bank Capacity:"
                footerValue="48V High-Rate BESS"
              />

              {/* Card 3.3: PV INVERTER #2 (Canopy East) */}
              <SchematicCard
                x={535}
                y={360}
                width={210}
                height={145}
                accent="amber"
                icon={<FroniusIcon className="h-4 w-4" />}
                title="Canopy Solar (East)"
                badge="Fronius Symo"
                primaryValue="118 W"
                subtext="Canopy East Array (AC-Out)"
                sparklineData={[80, 95, 110, 105, 118]}
                footerLabel="Island Coupling:"
                footerValue="AC-Out Side"
              />

              {/* ROW 4: PV CHARGER MPPT */}
              {/* Card 4.3: PV CHARGER (SmartSolar MPPT RS 450/200) */}
              <SchematicCard
                x={535}
                y={530}
                width={210}
                height={145}
                accent="amber"
                icon={<SunIcon className="h-4 w-4 text-amber-600" />}
                title="PV Charger (MPPT)"
                badge="SmartSolar"
                primaryValue="31 W"
                subtext="SmartSolar MPPT RS 450/200"
                sparklineData={
                  solarTrend.length > 0
                    ? solarTrend.slice(-10)
                    : [15, 20, 28, 25, 31]
                }
                footerLabel="DC Coupling:"
                footerValue="Direct Battery Bus"
              />
            </svg>
          </div>

          {/* 10-BAY COMMERCIAL FAST-CHARGING PLAZA STATUS GRID */}
          <div className="rounded-2xl border border-forest/15 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-forest/70">
                  Dispenser Array
                </span>
                <h4 className="text-base font-bold text-forest">
                  10x Commercial Fast-Charging Bays (32A Three-Phase Plaza)
                </h4>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-300">
                4 of 10 Bays Active Dispensing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {[
                { bay: 1, kw: '22 kW', status: 'Active', active: true },
                { bay: 2, kw: '22 kW', status: 'Active', active: true },
                { bay: 3, kw: '22 kW', status: 'Active', active: true },
                { bay: 4, kw: '22 kW', status: 'Active', active: true },
                { bay: 5, kw: 'Ready', status: 'Available', active: false },
                { bay: 6, kw: 'Ready', status: 'Available', active: false },
                { bay: 7, kw: 'Ready', status: 'Available', active: false },
                { bay: 8, kw: 'Ready', status: 'Available', active: false },
                { bay: 9, kw: 'Ready', status: 'Available', active: false },
                { bay: 10, kw: 'Ready', status: 'Available', active: false },
              ].map((item) => (
                <div
                  key={item.bay}
                  className={`rounded-xl border p-3 flex flex-col justify-between ${
                    item.active
                      ? 'border-sky-400 bg-sky-50/80 shadow-2xs'
                      : 'border-forest/10 bg-forest/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-forest">
                      Bay #{item.bay}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.active
                          ? 'bg-sky-500 animate-pulse'
                          : 'bg-forest/30'
                      }`}
                    />
                  </div>
                  <div className="my-1.5 font-mono text-sm font-black text-forest">
                    {item.kw}
                  </div>
                  <div className="text-[10px] font-mono text-forest/70">
                    {item.active ? 'Session in progress' : 'Ready to plug'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Plaza IoT & RuuviTag"
            specialtyBadge="10 Bays"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-forest/80">
                <div className="flex justify-between items-center">
                  <span>Environmental Probe:</span>
                  <strong className="text-emerald-800 text-xs">
                    {demo.systemInfo.temperatureProbeCelsius ?? 36.2} °C
                  </strong>
                </div>
                <div className="text-forest/60">
                  RuuviTag wireless environmental probe (TEST PARTER)
                </div>
                <div className="border-t border-forest/10 pt-1 flex justify-between items-center text-forest/60">
                  <span>Charging Protocol:</span>
                  <span className="font-bold text-emerald-800">
                    M2M Billing
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="Solar EV Fast-Charging Hub & Fleet Plaza"
        offTakerBadge="Point-of-Sale PPA"
        offTakerDescription="Multi-bay commercial EV charging plaza buffered with solar and storage in Paris, France. Processes high daily energy throughput, laying the foundation for autonomous vehicle micro-billing and native energy stablecoins."
        keyDetails={[
          {
            label: 'Delivered (24h)',
            value: `${demo.evDeliveredKwh24h ?? 288.59} kWh`,
            subtext: '10 commercial bays',
          },
          {
            label: 'Billing Velocity',
            value: '$0.42 / kWh',
            subtext: '+$2.50 session fee',
          },
        ]}
        grossRevenueTitle="$18,500.00 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
