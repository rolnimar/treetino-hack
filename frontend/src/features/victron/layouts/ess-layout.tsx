import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  FroniusIcon,
  SunIcon,
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

interface EssLayoutProps {
  demo: VictronDemoItem;
}

export function EssLayout({ demo }: EssLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, dailyTotals, financials } = demo;

  // Financial rates
  const spotArbitrageSpread = 0.28; // €0.28 / kWh spread
  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();
  const dailyDisplacedSavings = (
    dailyTotals.solarYieldKwh * 0.32 +
    dailyTotals.gridExportKwh * spotArbitrageSpread
  ).toFixed(2);

  const isGridExporting = (currentPower.gridWatts ?? 0) <= 0;
  const isBatteryDischarging = true; // -348 W in official demo

  const gridTrend = [-40, -35, -20, -10, currentPower.gridWatts || -27];
  const essentialTrend = [
    280,
    290,
    310,
    305,
    currentPower.consumptionWatts || 309,
  ];
  const batteryTrend = [45, 38, 32, 28, currentPower.batterySocPercent];
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
          label: 'Grid Arbitrage Spread',
          value: '€0.28 / kWh',
          subtext: 'Buy off-peak night → sell during peak morning demand',
        }}
        consumption={{
          label: 'Active Battery Export',
          value: '-348 W Discharging',
          subtext: 'Powering critical facility loads & day-ahead feed-in',
        }}
        revenueOrSavings={{
          label: 'Gross Daily Revenue',
          value: `+€${dailyDisplacedSavings} / day`,
          subtext: 'Combined solar self-consumption + grid arbitrage',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'Automated on-chain distribution to Solana investors',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Commercial ESS"
        stakePercent="0.20%"
        hourlyRate="+$0.024 / hr"
        baseYieldUsdc={0.0416}
        incrementPerSecond={0.0012}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS (Exact Replica of media_1791148405367.png) */}
        <div className="xl:col-span-9 overflow-x-auto rounded-2xl border border-forest/15 bg-[#fbfaf7] p-3 sm:p-5 flex items-center">
          <svg
            viewBox="0 0 770 560"
            className="w-full h-auto min-w-[720px] select-none"
          >
            {/* CONDUIT PIPES LAYER */}
            {/* 1. AC-In Conduit: Grid drop from (130, 165) down to (130, 275) */}
            <ConduitLine
              x1={130}
              y1={165}
              x2={130}
              y2={275}
              flow={
                flowMode !== 'funds'
                  ? isGridExporting
                    ? 'reverse-emerald'
                    : 'rose'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* 2. AC-In Conduit: PV Inverter 1 right (235, 275) through junction (130, 275) to MultiPlus left (280, 275) */}
            <ConduitLine
              x1={235}
              y1={275}
              x2={280}
              y2={275}
              flow={flowMode !== 'funds' ? 'amber' : null}
            />

            {/* 3. AC Loads tap: AC Loads bottom (385, 165) down to MultiPlus AC-In top (385, 200) */}
            <ConduitLine x1={385} y1={165} x2={385} y2={200} flow={null} />

            {/* 4. AC-Out Conduit: MultiPlus right (490, 275) to PV Inverter 2 left (535, 275) */}
            <ConduitLine
              x1={490}
              y1={275}
              x2={535}
              y2={275}
              flow={flowMode !== 'funds' ? 'sky' : null}
            />

            {/* 5. AC-Out Branch up to Essential Loads: from junction (512, 275) up to (512, 165) and right to (535, 165) */}
            <path
              d="M 512 275 V 165 H 535"
              className="vrm-conduit-outer"
              fill="none"
            />
            <path
              d="M 512 275 V 165 H 535"
              className="vrm-conduit-inner"
              fill="none"
            />
            {flowMode !== 'funds' && (
              <path
                d="M 512 275 V 165 H 535"
                className="vrm-flow-sky"
                fill="none"
              />
            )}
            {(flowMode === 'funds' || flowMode === 'both') && (
              <path
                d="M 535 165 H 512 V 275"
                className="vrm-flow-reverse-gold"
                fill="none"
              />
            )}

            {/* 6. DC Conduit: MultiPlus bottom (385, 350) down to Battery top (385, 390) */}
            <ConduitLine
              x1={385}
              y1={350}
              x2={385}
              y2={390}
              flow={
                flowMode !== 'funds'
                  ? isBatteryDischarging
                    ? 'reverse-emerald'
                    : 'emerald'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* 7. DC Conduit: Battery right (490, 462) across to PV Charger left (535, 462) */}
            <ConduitLine
              x1={490}
              y1={462}
              x2={535}
              y2={462}
              flow={flowMode !== 'funds' ? 'amber' : null}
            />

            {/* Junction Dots */}
            <circle
              cx="130"
              cy="275"
              r="6"
              fill="#059669"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <circle
              cx="512"
              cy="275"
              r="6"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="2.5"
            />

            {/* HARDWARE NODES LAYER (8 Authentic Victron Components) */}

            {/* ROW 1: GRID, AC LOADS, ESSENTIAL LOADS */}
            {/* Card 1.1: GRID CONNECTION (Feed-in Export / Import) */}
            <SchematicCard
              x={25}
              y={20}
              width={210}
              height={145}
              accent="forest"
              icon={<GridIcon className="h-4 w-4 text-forest/80" />}
              title="Grid Meter"
              badge={isGridExporting ? 'Feed-in Export' : 'Import Active'}
              primaryValue={
                currentPower.gridWatts !== 0
                  ? `${Math.abs(currentPower.gridWatts)} W ${isGridExporting ? 'Export' : 'Import'}`
                  : '46 W Export'
              }
              subtext="Dynamic Bi-directional Feed"
              sparklineData={gridTrend}
              footerLabel="Spot Arbitrage:"
              footerValue="+€0.28 / kWh"
            />

            {/* Card 1.2: AC LOADS (Non-critical) */}
            <SchematicCard
              x={280}
              y={20}
              width={210}
              height={145}
              accent="emerald"
              icon={<PowerPlugIcon className="h-4 w-4 text-emerald-700" />}
              title="AC Loads"
              badge="Non-critical"
              primaryValue="0 W"
              subtext="Grid-parallel circuits idle"
              sparklineData={[0, 0, 0, 0, 0]}
              footerLabel="Billed Tariff:"
              footerValue="$0.00 / hr"
            />

            {/* Card 1.3: ESSENTIAL LOADS (Protected UPS Sub-Panel) */}
            <SchematicCard
              x={535}
              y={20}
              width={210}
              height={145}
              accent="rose"
              icon={<PowerPlugIcon className="h-4 w-4 text-rose-700" />}
              title="Critical Loads"
              badge="AC Out"
              primaryValue={`${(currentPower.consumptionWatts || 483).toFixed(0)} W`}
              subtext={`Today: ${dailyTotals.consumptionKwh.toFixed(2)} kWh`}
              sparklineData={essentialTrend}
              footerLabel="Billing Velocity:"
              footerValue="+$0.10 / hr"
            />

            {/* ROW 2: PV INVERTER 1 (PRIMO), MULTIPLUS-II HUB, PV INVERTER 2 (SYMO) */}
            {/* Card 2.1: PV INVERTER #1 (Fronius Primo AC-In) */}
            <SchematicCard
              x={25}
              y={200}
              width={210}
              height={150}
              accent="amber"
              icon={<FroniusIcon className="h-4 w-4" />}
              title="PV Inverter (Primo)"
              badge="AC-In Side"
              primaryValue="-1 W"
              subtext="Fronius Primo AC coupled"
              sparklineData={[0, 0, -1, 0, -1]}
              footerLabel="Grid Coupling:"
              footerValue="AC-In Bus"
            />

            {/* Card 2.2: CENTER INVERTER HUB (MultiPlus-II 48/3000) */}
            <foreignObject x={280} y={200} width={210} height={150}>
              <div className="h-full w-full rounded-2xl border-2 border-forest bg-forest text-cream p-3.5 shadow-md flex flex-col justify-between overflow-hidden select-none">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-leaf">
                    Victron Energy
                  </span>
                  <span className="rounded bg-cream/15 px-2 py-0.5 font-mono text-[9px] font-bold text-cream">
                    ESS Hub
                  </span>
                </div>
                <div>
                  <div className="font-mono text-base font-black text-white">
                    MultiPlus-II 48V
                  </div>
                  <p className="text-[10px] text-cream/70 mt-0.5">
                    3000/35-32 (Ext Sensor)
                  </p>
                </div>
                <div className="rounded-lg bg-black/25 p-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cream/80">Mode:</span>
                  <span className="font-bold text-leaf">Recharging</span>
                </div>
                <div className="border-t border-cream/15 pt-1 flex items-center justify-between font-mono text-[10px] text-cream/70">
                  <span>Target APY:</span>
                  <strong className="text-leaf">
                    {financials.projectedApy}%
                  </strong>
                </div>
              </div>
            </foreignObject>

            {/* Card 2.3: PV INVERTER #2 (Fronius Symo AC-Out) */}
            <SchematicCard
              x={535}
              y={200}
              width={210}
              height={150}
              accent="amber"
              icon={<FroniusIcon className="h-4 w-4" />}
              title="PV Inverter (Symo)"
              badge="AC-Out Side"
              primaryValue="0 W"
              subtext="Fronius Symo Microgrid"
              sparklineData={[0, 0, 0, 0, 0]}
              footerLabel="Island Coupling:"
              footerValue="AC-Out Protected"
            />

            {/* ROW 3: BATTERY STORAGE (PYLONTECH) & PV CHARGER (MPPT) */}
            {/* Card 3.2: BATTERY STORAGE (Pylontech 48V Bank) */}
            <SchematicCard
              x={280}
              y={390}
              width={210}
              height={145}
              accent="emerald"
              icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
              title="Battery Storage"
              badge="Pylontech 48V"
              primaryValue={`${currentPower.batterySocPercent.toFixed(1)} %`}
              subtext="48.54 V · Discharging (-348 W)"
              sparklineData={batteryTrend}
              progressPercent={currentPower.batterySocPercent}
              footerLabel="Capacity:"
              footerValue="14.4 kWh LFP Bank"
            />

            {/* Card 3.3: PV CHARGER (SmartSolar MPPT VE.Can) */}
            <SchematicCard
              x={535}
              y={390}
              width={210}
              height={145}
              accent="amber"
              icon={<SunIcon className="h-4 w-4 text-amber-600" />}
              title="PV Charger (MPPT)"
              badge="DC-Coupled"
              primaryValue="-5 W"
              subtext="SmartSolar MPPT 250/100"
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Direct Bus:"
              footerValue="Battery Charging Bus"
            />
          </svg>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Grid Arbitrage"
            specialtyBadge="ESS BESS"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-forest/80">
                <div className="flex justify-between items-center">
                  <span>Spot Arbitrage Spread:</span>
                  <strong className="text-emerald-800 text-xs">
                    €0.28 / kWh spread
                  </strong>
                </div>
                <div className="text-forest/60">
                  Dynamic wholesale day-ahead market arbitrage
                </div>
                <div className="border-t border-forest/10 pt-1 flex justify-between items-center text-forest/60">
                  <span>Frequency Balancing:</span>
                  <span className="font-bold text-emerald-800">
                    Active Reserve
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="Industrial & Grid Balancing Operator"
        offTakerBadge="Dual-Market PPA"
        offTakerDescription="Commercial facility in Almere, Netherlands with smart battery energy storage system (BESS). Monetizes grid frequency regulation, peak shaving, and day-ahead wholesale energy arbitrage via automated algorithmic bidding."
        keyDetails={[
          {
            label: 'Balancing Spread',
            value: '€0.28 / kWh',
            subtext: 'Peak discharge margin',
          },
          {
            label: 'Frequency Reward',
            value: '€45 / MW / h',
            subtext: 'Transmission reserve',
          },
        ]}
        grossRevenueTitle="$7,100.00 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
