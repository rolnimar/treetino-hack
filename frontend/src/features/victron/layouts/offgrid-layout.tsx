import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  SunIcon,
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
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

interface OffgridLayoutProps {
  demo: VictronDemoItem;
}

export function OffgridLayout({ demo }: OffgridLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, dailyTotals, financials } = demo;

  // Financial rates
  const dieselReplacementRate = 0.35; // $0.35 / kWh displaced
  const dailyDisplacedSavings = (
    dailyTotals.solarYieldKwh * dieselReplacementRate
  ).toFixed(2);
  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();

  const loadTrend = demo.hourlyData.map((d) => d.consumptionKwh);
  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);
  const batteryTrend = [98, 98.5, 99, 99.4, currentPower.batterySocPercent];

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
      />

      {/* 2. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Metered Clean Generation',
          value: `${dailyTotals.solarYieldKwh.toFixed(2)} kWh Today`,
          subtext: 'Clean solar generation displacing diesel reliance',
        }}
        consumption={{
          label: 'Home Load Consumption',
          value: `${currentPower.consumptionWatts.toFixed(0)} W`,
          subtext: `Today: ${dailyTotals.consumptionKwh.toFixed(2)} kWh consumed`,
        }}
        revenueOrSavings={{
          label: 'Displaced Fuel Value',
          value: `+$${dailyDisplacedSavings} / day saved`,
          subtext: 'Billed at consumer tariff ($0.35/kWh)',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'Distributed proportionally to tokenholders on Solana',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Microgrid"
        stakePercent="0.40%"
        hourlyRate="+$0.028 / hr"
        baseYieldUsdc={0.0245}
        incrementPerSecond={0.0009}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS */}
        <div className="xl:col-span-9 overflow-x-auto rounded-3xl border border-black/10 bg-zinc-50/50 p-4 sm:p-6 flex items-center shadow-xs">
          <svg
            viewBox="0 0 770 420"
            className="w-full h-auto min-w-[680px] select-none"
          >
            {/* CONDUIT PIPES */}
            {/* Pipe 1: Generator (240, 110) -> Inverter Hub (320, 110) */}
            <ConduitLine x1={240} y1={110} x2={320} y2={110} />

            {/* Pipe 2: Inverter Hub (490, 110) -> AC Loads (560, 110) */}
            <ConduitLine
              x1={490}
              y1={110}
              x2={560}
              y2={110}
              flow={
                flowMode !== 'funds' && currentPower.consumptionWatts > 0
                  ? 'sky'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both'
                  ? 'reverse-gold'
                  : null
              }
            />

            {/* Pipe 3: Inverter Hub bottom (405, 190) -> DC Junction (405, 310) */}
            <ConduitLine x1={405} y1={190} x2={405} y2={310} />

            {/* Pipe 4: Battery Storage (240, 310) -> DC Junction (405, 310) */}
            <ConduitLine
              x1={240}
              y1={310}
              x2={405}
              y2={310}
              flow={flowMode !== 'funds' ? 'reverse-emerald' : null}
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* Pipe 5: DC Junction (405, 310) -> PV Charger (560, 310) */}
            <ConduitLine
              x1={405}
              y1={310}
              x2={560}
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

            {/* Central DC Bus T-Junction Node */}
            <circle
              cx="405"
              cy="310"
              r="8"
              fill="#059669"
              stroke="#ffffff"
              strokeWidth="3"
            />

            {/* HARDWARE NODES */}
            {/* Card 1.1: BACKUP GENERATOR */}
            <SchematicCard
              x={30}
              y={30}
              accent="forest"
              icon={<GridIcon className="h-4 w-4 text-zinc-600" />}
              title="Generator"
              badge={demo.systemInfo.generatorState || 'Stopped'}
              primaryValue="—"
              subtext="Standby backup power"
              footerLabel="Fuel Cost:"
              footerValue="$0.00 / hr"
            />

            {/* Card 1.2: INVERTER HUB (Multi RS Smart) */}
            <foreignObject x={320} y={30} width={170} height={160}>
              <div className="h-full w-full rounded-2xl border-2 border-black/10 bg-white shadow-md flex flex-col justify-between overflow-hidden text-center select-none">
                <div className="bg-t-blue py-2 text-white">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-mono text-xs font-black">
                    RS
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-bold tracking-tight text-white/90">
                    Multi RS Smart 48V
                  </div>
                </div>
                <div className="p-2 flex flex-col items-center justify-center">
                  <span className="rounded-full bg-t-blue/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-t-blue">
                    Mode: {demo.systemInfo.systemState}
                  </span>
                  <div className="mt-1 font-mono text-xs font-extrabold text-t-blue">
                    {financials.projectedApy}% APY
                  </div>
                </div>
                <div className="bg-zinc-50 py-1 font-mono text-[9px] text-zinc-500 border-t border-black/10">
                  Off-Grid Controller
                </div>
              </div>
            </foreignObject>

            {/* Card 1.3: AC LOADS */}
            <SchematicCard
              x={560}
              y={30}
              accent="sky"
              icon={<PowerPlugIcon className="h-4 w-4 text-sky-700" />}
              title="AC Loads"
              badge="230V Microgrid"
              primaryValue={`${currentPower.consumptionWatts.toFixed(0)} W`}
              subtext={`Today: ${dailyTotals.consumptionKwh.toFixed(2)} kWh`}
              sparklineData={loadTrend.slice(-10)}
              footerLabel="Tariff:"
              footerValue="$0.35 / kWh"
            />

            {/* Card 2.1: BATTERY STORAGE */}
            <SchematicCard
              x={30}
              y={230}
              accent="emerald"
              icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
              title="Battery Bank"
              badge={currentPower.batteryState}
              primaryValue={`${currentPower.batterySocPercent.toFixed(1)} %`}
              subtext={`${currentPower.batteryVoltage.toFixed(2)} V · 0.6 A`}
              sparklineData={batteryTrend}
              progressPercent={currentPower.batterySocPercent}
              footerLabel="Reserve Bank:"
              footerValue="15.0 kWh Lithium"
            />

            {/* Card 2.3: PV CHARGER (MPPT) */}
            <SchematicCard
              x={560}
              y={230}
              accent="amber"
              icon={<SunIcon className="h-4 w-4 text-amber-600" />}
              title="Solar Charger"
              badge="MPPT Active"
              primaryValue={`${currentPower.solarYieldWatts.toFixed(0)} W`}
              subtext={`Today: ${dailyTotals.solarYieldKwh.toFixed(2)} kWh`}
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Yield Stream:"
              footerValue={`+$${dailyDisplacedSavings} / day`}
            />
          </svg>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Diesel Replacement"
            specialtyBadge="Clean Equity"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-zinc-600">
                <div className="flex justify-between items-center">
                  <span>Daily Fuel Savings:</span>
                  <strong className="text-emerald-700 text-xs">
                    +${dailyDisplacedSavings} / day
                  </strong>
                </div>
                <div className="text-zinc-500">
                  100% clean solar microgrid operation
                </div>
                <div className="border-t border-black/10 pt-1 text-zinc-400">
                  Displacing $1.40/L generator fuel cost
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="Residential Off-Grid Cooperative"
        offTakerBadge="Consumer Repayment"
        offTakerDescription="Decentralized off-grid residential homes in rural Queensland, Australia. Homeowners make daily metered repayments for clean power generated by tokenized solar panels and batteries, avoiding expensive diesel generator operation."
        keyDetails={[
          {
            label: 'Replaced Power',
            value: 'Diesel Generator',
            subtext: '0% fossil fuel consumption',
          },
          {
            label: 'Billing Velocity',
            value: '$0.35 / kWh',
            subtext: 'Direct consumer tariff',
          },
        ]}
        grossRevenueTitle="$1,850.00 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
