import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  SunIcon,
  BatteryIcon,
  GridIcon,
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

  const batteryTrend = [52, 51.5, 51.2, 51.0, currentPower.batterySocPercent];
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
          value: `${(currentPower.consumptionWatts / 1000).toFixed(2)} kW Active`,
          subtext: `Past 24h: ${demo.evDeliveredKwh24h ?? 265.42} kWh delivered`,
        }}
        revenueOrSavings={{
          label: 'High-Velocity EV Revenue',
          value: `+$${financials.estDailyRevenueUsdc.toFixed(2)} / day`,
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
        assetName="EV Charging Plaza"
        stakePercent="0.10%"
        hourlyRate="+$0.042 / hr"
        baseYieldUsdc={0.052}
        incrementPerSecond={0.0018}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS */}
        <div className="xl:col-span-9 overflow-x-auto rounded-2xl border border-forest/15 bg-[#fbfaf7] p-3 sm:p-5 flex items-center">
          <svg
            viewBox="0 0 770 420"
            className="w-full h-auto min-w-[680px] select-none"
          >
            {/* CONDUIT PIPES */}
            {/* Pipe 1: Grid Intertie (240, 110) -> Quattro Hub (320, 110) */}
            <ConduitLine
              x1={240}
              y1={110}
              x2={320}
              y2={110}
              flow={flowMode !== 'funds' ? 'reverse-rose' : null}
            />

            {/* Pipe 2: Quattro Hub (490, 110) -> EVCS #1 (560, 110) */}
            <ConduitLine
              x1={490}
              y1={110}
              x2={560}
              y2={110}
              flow={flowMode !== 'funds' ? 'sky' : null}
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both'
                  ? 'reverse-gold'
                  : null
              }
            />

            {/* Pipe 3: Quattro Hub bottom (405, 190) -> Buffer Battery (405, 230) */}
            <ConduitLine
              x1={405}
              y1={190}
              x2={405}
              y2={230}
              flow={flowMode !== 'funds' ? 'emerald' : null}
            />

            {/* Pipe 4: Canopy Solar (240, 310) -> Buffer Battery (320, 310) */}
            <ConduitLine
              x1={240}
              y1={310}
              x2={320}
              y2={310}
              flow={
                flowMode !== 'funds' && currentPower.solarYieldWatts > 0
                  ? 'amber'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* Pipe 5: Buffer Battery (490, 310) -> EVCS #2 (560, 310) */}
            <ConduitLine x1={490} y1={310} x2={560} y2={310} flow={null} />

            {/* HARDWARE NODES */}
            {/* Card 1.1: GRID INTERTIE (400V 3-Phase VM-3P75CT) */}
            <SchematicCard
              x={30}
              y={30}
              accent="rose"
              icon={<GridIcon className="h-4 w-4 text-rose-700" />}
              title="Grid Supply"
              badge="3-Phase 400V"
              primaryValue={`${(currentPower.gridWatts / 1000).toFixed(2)} kW`}
              subtext="Commercial Fast-Feed Intertie"
              footerLabel="Grid Meter:"
              footerValue="VM-3P75CT Metered"
            />

            {/* Card 1.2: QUATTRO INVERTER HUB BOX */}
            <foreignObject x={320} y={30} width={170} height={160}>
              <div className="h-full w-full rounded-2xl border-2 border-forest/20 bg-cream/90 shadow-md flex flex-col justify-between overflow-hidden text-center select-none">
                <div className="bg-forest py-2 text-white">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-black">
                    48V
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-bold tracking-tight text-white/90">
                    Quattro 48/10000
                  </div>
                </div>
                <div className="p-2 flex flex-col items-center justify-center">
                  <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest">
                    Bulk · 140A
                  </span>
                  <div className="mt-1 font-mono text-xs font-extrabold text-emerald-800">
                    {financials.projectedApy}% APY Yield
                  </div>
                </div>
                <div className="bg-white/80 py-1 font-mono text-[9px] text-forest/60 border-t border-forest/10">
                  Plaza Fast-Charging Hub
                </div>
              </div>
            </foreignObject>

            {/* Card 1.3: EVCS STATION #1 (ACTIVE 14.45 kW) */}
            <SchematicCard
              x={560}
              y={30}
              accent="sky"
              icon={<EvChargerIcon className="h-4 w-4 text-sky-600" />}
              title="EVCS Bay #1"
              badge="Active 32A"
              primaryValue="14.45 kW"
              subtext="Fast charging session in progress"
              footerLabel="Session Rate:"
              footerValue="$0.42 / kWh"
            />

            {/* Card 2.1: CANOPY SOLAR ARRAY */}
            <SchematicCard
              x={30}
              y={230}
              accent="amber"
              icon={<SunIcon className="h-4 w-4 text-amber-600" />}
              title="Canopy Solar"
              badge="Dual Fronius"
              primaryValue={`${currentPower.solarYieldWatts.toFixed(0)} W`}
              subtext={`Harvested: ${dailyTotals.solarYieldKwh.toFixed(2)} kWh`}
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Controllers:"
              footerValue="SmartSolar 250/100"
            />

            {/* Card 2.2: BUFFER BATTERY STORAGE */}
            <SchematicCard
              x={320}
              y={230}
              width={170}
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

            {/* Card 2.3: EVCS STATION #2 (STANDBY) */}
            <SchematicCard
              x={560}
              y={230}
              accent="forest"
              icon={<EvChargerIcon className="h-4 w-4 text-forest/70" />}
              title="EVCS Bay #2"
              badge="Standby"
              primaryValue="EV Ready"
              subtext="Awaiting vehicle connection"
              footerLabel="Station State:"
              footerValue="Available"
            />
          </svg>
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
                    {demo.systemInfo.temperatureProbeCelsius ?? 37.1} °C
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
            value: `${demo.evDeliveredKwh24h ?? 265.42} kWh`,
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
