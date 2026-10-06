import { useState, useEffect } from 'react';
import type { VictronDemoItem } from './victron-types';
import { OffgridLayout } from './layouts/offgrid-layout';
import { EssLayout } from './layouts/ess-layout';
import { EvLayout } from './layouts/ev-layout';
import { TreetinoLayout } from './layouts/treetino-layout';
import { VictronEnergyChart } from './victron-energy-chart';
import { VictronMoneyFlow } from './victron-money-flow';
import { getCampaignCoverImage, CAMPAIGN_METADATA } from './campaign-helpers';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  TrendUpIcon,
  ExternalLinkIcon,
  CheckIcon,
  ShieldCheckIcon,
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
    'story' | 'topology' | 'chart' | 'money' | 'hardware'
  >('story');

  const meta = CAMPAIGN_METADATA[demo.key] ?? {
    creator: 'Verified Operator',
    daysLeft: 14,
    backers: 42,
  };

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
            <span>Back to Funding Opportunities</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-2 text-xs text-forest/60 font-mono"
          >
            <span>/</span>
            <span>Campaigns</span>
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

      {/* 2. KICKSTARTER ASSET HEADER & 2-COLUMN HERO */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
              {demo.categoryBadge} · Site #{demo.siteId}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl lg:text-5xl">
            {demo.title}
          </h1>
          <p className="mt-2 text-sm text-forest/75 max-w-3xl leading-relaxed sm:text-base">
            {demo.narrative}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-forest/70 font-medium">
            <span>
              By <strong>{meta.creator}</strong>
            </span>
            <span>·</span>
            <span>
              📍 {demo.location.city}, {demo.location.country}
            </span>
            <span>·</span>
            <span className="font-mono text-emerald-800 font-semibold">
              Cerbo GX Verified SCADA
            </span>
          </div>
        </div>

        {/* 2-Column Split: Image Left (60%), Kickstarter Funding Box Right (40%) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Big Cover Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-forest/15 bg-forest/10 shadow-sm sm:aspect-16/9">
              <img
                src={getCampaignCoverImage(demo.key)}
                alt={demo.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-forest/80 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                  {demo.categoryBadge}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  {demo.key === 'treetino-v1'
                    ? '⚡ 42.8 kW Cerbo GX Live'
                    : `⚡ ${(demo.currentPower.solarYieldWatts / 1000).toFixed(1)} kW Live`}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl bg-forest/80 px-3.5 py-1.5 font-mono text-xs text-white backdrop-blur-md">
                <span>Gateway: {gatewayName}</span>
                <span className="mx-2 text-emerald-400">·</span>
                <span>Mode: {demo.systemInfo.systemState}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Kickstarter Funding Box */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-forest/15 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-6">
              {/* Progress bar */}
              <div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-forest/10">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(demo.financials.fundedPercent, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800">
                    {demo.financials.fundedPercent}% funded
                  </span>
                  <span className="font-mono text-xs text-forest/60">
                    $
                    {(
                      demo.financials.targetUsdc - demo.financials.fundedUsdc
                    ).toLocaleString()}{' '}
                    to go
                  </span>
                </div>
              </div>

              {/* Big Metrics */}
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-3xl font-black text-forest sm:text-4xl">
                    ${demo.financials.fundedUsdc.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-xs text-forest/60">
                    pledged of ${demo.financials.targetUsdc.toLocaleString()}{' '}
                    goal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-forest/10 pt-4">
                  <div>
                    <span className="font-mono text-2xl font-black text-emerald-800">
                      {demo.financials.projectedApy}%
                    </span>
                    <span className="block text-xs text-forest/60">
                      projected yield (APY)
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-black text-forest">
                      {meta.daysLeft}
                    </span>
                    <span className="block text-xs text-forest/60">
                      days to go
                    </span>
                  </div>
                </div>

                <div className="border-t border-forest/10 pt-3 flex items-center justify-between text-xs text-forest/75">
                  <span>Active Backers:</span>
                  <strong className="font-mono text-forest">
                    {meta.backers} backers
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs text-forest/75">
                  <span>Contracted PPA Tariff:</span>
                  <strong className="font-mono text-emerald-800">
                    {demo.financials.tariffRate}
                  </strong>
                </div>
              </div>

              {/* Escrow Badge */}
              <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Hardware Escrow Guarantee:</strong> Backing funds are
                  deposited on Solana and released only against verified on-site
                  Cerbo GX telemetry.
                </p>
              </div>
            </div>

            {/* Back CTA Button */}
            <div className="mt-6 pt-4 border-t border-forest/10">
              <button
                type="button"
                onClick={() => setActiveTab('money')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#05ce78] hover:bg-[#04b669] px-6 py-4 text-sm font-bold text-forest shadow-xs transition active:scale-[0.99]"
              >
                <span>Back this project with mockUSDC</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION TABS */}
      <div className="flex flex-wrap border-b border-forest/15 font-mono text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('story')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition ${
            activeTab === 'story'
              ? 'border-forest text-forest bg-forest/5'
              : 'border-transparent text-forest/60 hover:text-forest'
          }`}
        >
          <span>📖</span>
          Campaign Story & PPA
        </button>

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
          24-Hour Energy Data
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
          Back Project & Yield Share
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
      {/* TAB 0: CAMPAIGN STORY & PPA AGREEMENT */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-forest/15 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-2xl font-bold tracking-tight text-forest">
              Why Back This Clean Energy Project?
            </h3>
            <p className="mt-3 text-sm text-forest/80 leading-relaxed max-w-4xl">
              {demo.narrative}
            </p>

            <div className="mt-6 rounded-xl border border-forest/15 bg-cream/40 p-5">
              <span className="font-mono text-xs font-bold text-forest uppercase">
                Investor Thesis & Economic Moat:
              </span>
              <p className="mt-1 text-sm text-forest/80 font-medium">
                {demo.investorHighlight}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-forest/15 p-5 bg-white">
                <span className="font-mono text-xs font-bold text-emerald-800 uppercase">
                  PPA Off-Taker & Tariff Agreement
                </span>
                <div className="mt-2 space-y-2 text-xs text-forest/75">
                  <div className="flex justify-between py-1 border-b border-forest/10">
                    <span className="font-medium">Contracted Tariff:</span>
                    <strong className="font-mono text-forest">
                      {demo.financials.tariffRate}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-forest/10">
                    <span className="font-medium">Revenue Model:</span>
                    <span className="text-right max-w-xs text-forest">
                      {demo.financials.revenueModelDescription}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium">Annual Gross Run-Rate:</span>
                    <strong className="font-mono text-emerald-800">
                      ${demo.financials.estAnnualRevenueUsdc.toLocaleString()}{' '}
                      USDC
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-forest/15 p-5 bg-white">
                <span className="font-mono text-xs font-bold text-forest uppercase">
                  DePIN Hardware Verification
                </span>
                <div className="mt-2 space-y-2 text-xs text-forest/75">
                  <div className="flex justify-between py-1 border-b border-forest/10">
                    <span className="font-medium">Gateway Controller:</span>
                    <strong className="font-mono text-forest">
                      {gatewayName}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-forest/10">
                    <span className="font-medium">Telemetry Channel:</span>
                    <span className="font-mono text-forest">
                      Venus OS D-Bus ({demo.systemInfo.dbusRtt} RTT)
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium">Signer Authentication:</span>
                    <span className="text-emerald-800 font-semibold">
                      Cryptographically Signed Reports
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setActiveTab('money')}
                className="inline-flex items-center gap-2 rounded-xl bg-forest px-8 py-3.5 font-bold text-white shadow-sm hover:bg-[#23573e] transition active:scale-[0.98]"
              >
                <span>Back This Installation with mockUSDC</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
