import { useState, useEffect } from 'react';
import type { VictronDemoItem } from './victron-types';
import { OffgridLayout } from './layouts/offgrid-layout';
import { EssLayout } from './layouts/ess-layout';
import { EvLayout } from './layouts/ev-layout';
import { TreetinoLayout } from './layouts/treetino-layout';
import { VictronEnergyChart } from './victron-energy-chart';
import { VictronMoneyFlow } from './victron-money-flow';
import {
  ArrowLeftIcon,
  BoltIcon,
  TrendUpIcon,
  ExternalLinkIcon,
  CheckIcon,
} from './victron-icons';

interface VictronAssetPageProps {
  demo: VictronDemoItem;
  onBack: () => void;
  walletAddress?: string;
  walletBalance?: string;
}

export function VictronAssetPage({
  demo,
  onBack,
  walletAddress,
  walletBalance,
}: VictronAssetPageProps) {
  const [activeTab, setActiveTab] = useState<
    'topology' | 'chart' | 'money' | 'hardware'
  >('topology');

  const gateway = demo.devices.find(
    (d) =>
      d.deviceType === 'gateway' ||
      d.name.toLowerCase().includes('gateway') ||
      d.productName.toLowerCase().includes('cerbo'),
  );
  const gatewayName = gateway
    ? gateway.productName || gateway.name
    : 'Cerbo GX';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [demo.siteId]);

  return (
    <div className="py-8 space-y-8 animate-fade-in">
      {/* 1. TOP BREADCRUMB & BACK ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-white px-3.5 py-2 font-bold text-xs text-forest shadow-xs hover:bg-forest/5 hover:border-forest/40 transition active:scale-[0.98]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Clean Energy Assets</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-2 text-xs text-forest/60 font-mono"
          >
            <span>/</span>
            <span>Assets</span>
            <span>/</span>
            <span className="font-bold text-forest">{demo.title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={demo.vrmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/20 bg-white px-3.5 py-2 font-mono text-xs font-bold text-forest shadow-xs hover:bg-forest/5 transition"
          >
            <span>Victron VRM Live</span>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 2. ASSET HERO HEADER */}
      <div className="rounded-2xl border border-forest/15 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                {demo.categoryBadge} · Site #{demo.siteId}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
              {demo.title}
            </h1>
            <p className="mt-1 text-sm text-forest/70 max-w-3xl">
              {demo.narrative}
            </p>
          </div>

          {/* Quick Hardware Pill */}
          <div className="rounded-xl border border-forest/15 bg-cream/40 p-4 text-xs font-mono text-forest/80">
            <div>
              Location:{' '}
              <strong className="text-forest">
                {demo.location.city}, {demo.location.country}
              </strong>
            </div>
            <div className="mt-1">
              Gateway:{' '}
              <strong className="text-forest">
                {gatewayName} ({demo.systemInfo.firmwareVersion})
              </strong>
            </div>
            <div className="mt-1">
              Mode:{' '}
              <strong className="text-emerald-800">
                {demo.systemInfo.systemState}
              </strong>
            </div>
          </div>
        </div>

        {/* 4 Key Metric Badges */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-forest/10 pt-6">
          <div className="rounded-xl bg-forest/5 p-4">
            <span className="block text-xs font-bold text-forest/60">
              Projected Yield
            </span>
            <span className="mt-1 block font-mono text-2xl font-black text-emerald-800 tracking-tight">
              {demo.financials.projectedApy}% APY
            </span>
          </div>

          <div className="rounded-xl bg-forest/5 p-4">
            <span className="block text-xs font-bold text-forest/60">
              Annual Revenue Run-Rate
            </span>
            <span className="mt-1 block font-mono text-2xl font-black text-forest tracking-tight">
              ${demo.financials.estAnnualRevenueUsdc.toLocaleString()} / yr
            </span>
          </div>

          <div className="rounded-xl bg-forest/5 p-4">
            <span className="block text-xs font-bold text-forest/60">
              Capital Pool Funding
            </span>
            <span className="mt-1 block font-mono text-2xl font-black text-leaf tracking-tight">
              {demo.financials.fundedPercent}% funded
            </span>
          </div>

          <div className="rounded-xl bg-forest/5 p-4">
            <span className="block text-xs font-bold text-forest/60">
              Current Battery SOC
            </span>
            <span className="mt-1 block font-mono text-2xl font-black text-sky-900 tracking-tight">
              {demo.currentPower.batterySocPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. SECTION TABS */}
      <div className="flex flex-wrap border-b border-forest/15 font-mono text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition ${
            activeTab === 'topology'
              ? 'border-forest text-forest bg-forest/5'
              : 'border-transparent text-forest/60 hover:text-forest'
          }`}
        >
          <BoltIcon className="h-4 w-4" />
          Real Hardware Power Flow
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition ${
            activeTab === 'chart'
              ? 'border-forest text-forest bg-forest/5'
              : 'border-transparent text-forest/60 hover:text-forest'
          }`}
        >
          24-Hour Energy Data History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('money')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition ${
            activeTab === 'money'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-forest/60 hover:text-forest'
          }`}
        >
          <TrendUpIcon className="h-4 w-4" />
          Tokenized Cash Flow & Yield Share
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition ${
            activeTab === 'hardware'
              ? 'border-forest text-forest bg-forest/5'
              : 'border-transparent text-forest/60 hover:text-forest'
          }`}
        >
          Physical Devices ({demo.devices.length})
        </button>
      </div>

      {/* 4. ACTIVE TAB CONTENT */}
      {/* TAB 1: TOPOLOGY POWER FLOW */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Distinct Hardware Layout based on site key */}
          {demo.key === 'treetino-v1' && <TreetinoLayout demo={demo} />}
          {demo.key === 'offgrid' && <OffgridLayout demo={demo} />}
          {demo.key === 'ess' && <EssLayout demo={demo} />}
          {demo.key === 'ev' && <EvLayout demo={demo} />}

          {/* 24-Hour Energy Data Chart integrated directly underneath */}
          <VictronEnergyChart
            hourlyData={demo.hourlyData}
            dailyTotals={demo.dailyTotals}
            isEv={demo.key === 'ev'}
          />
        </div>
      )}

      {/* TAB 2: 24-HOUR ENERGY DATA HISTORY */}
      {activeTab === 'chart' && (
        <VictronEnergyChart
          hourlyData={demo.hourlyData}
          dailyTotals={demo.dailyTotals}
          isEv={demo.key === 'ev'}
        />
      )}

      {/* TAB 3: MONEY FLOW & INVESTOR ALLOCATION CALCULATOR */}
      {activeTab === 'money' && (
        <VictronMoneyFlow
          demo={demo}
          walletAddress={walletAddress}
          walletBalance={walletBalance}
        />
      )}

      {/* TAB 4: PHYSICAL HARDWARE DEVICES */}
      {activeTab === 'hardware' && (
        <div className="rounded-2xl border border-forest/15 bg-white/90 p-6 shadow-sm">
          <div className="border-b border-forest/10 pb-4">
            <h3 className="text-xl font-bold text-forest">
              Venus OS D-Bus Connected Hardware ({demo.devices.length} Physical
              Components)
            </h3>
            <p className="mt-0.5 text-xs text-forest/70">
              Verified physical devices communicating via VE.Can, VE.Direct, and
              Modbus TCP with the Cerbo GX.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demo.devices.map((device, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-forest/15 bg-cream/30 p-4 text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-forest/60 uppercase font-bold">
                      {device.name}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800 font-bold text-[10px]">
                      <CheckIcon className="h-3 w-3" />
                      Online
                    </span>
                  </div>
                  <h4 className="mt-2 font-bold text-forest text-sm">
                    {device.modelName}
                  </h4>
                  <p className="mt-0.5 text-forest/70 text-xs">
                    {device.productName}
                  </p>
                </div>

                {device.firmwareVersion && (
                  <div className="mt-3 border-t border-forest/10 pt-2 font-mono text-[11px] text-forest/60">
                    Firmware: {device.firmwareVersion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
