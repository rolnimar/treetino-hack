import { useState, useEffect } from 'react';
import type { VictronDemoItem } from './victron-types';
import { OffgridLayout } from './layouts/offgrid-layout';
import { EssLayout } from './layouts/ess-layout';
import { EvLayout } from './layouts/ev-layout';
import { TreetinoLayout } from './layouts/treetino-layout';
import { VictronEnergyChart } from './victron-energy-chart';
import { VictronMoneyFlow } from './victron-money-flow';
import { getCampaignCoverImage, CAMPAIGN_METADATA } from './campaign-helpers';
import { ProjectInvestorDossier } from './components/investor-dossier';
import { getProjectDossier } from './data';
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
  onBackProject?: (demo: VictronDemoItem) => void;
  onOpenDeposit?: () => void;
}

export function VictronAssetPage({
  demo,
  onBack,
  walletAddress,
  walletBalance,
  onBackProject,
  onOpenDeposit,
}: VictronAssetPageProps) {
  const [activeTab, setActiveTab] = useState<
    'story' | 'topology' | 'chart' | 'money' | 'hardware'
  >('story');

  const projectDossier = getProjectDossier(demo.key);

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
    <div className="py-4 space-y-8 animate-fade-in">
      {/* 1. TOP BREADCRUMB & BACK ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 font-medium text-xs text-zinc-800 shadow-2xs hover:bg-black/5 hover:border-black/20 transition active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Funding Opportunities</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono"
          >
            <span>/</span>
            <span>Campaigns</span>
            <span>/</span>
            <span className="font-bold text-zinc-900">{demo.title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {projectDossier && (
            <a
              href={projectDossier.downloadPdfPath}
              download={projectDossier.pdfFilename ?? 'Investor_Prospectus.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-2 font-mono text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
            >
              <svg
                className="h-3.5 w-3.5 text-emerald-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Official Prospectus (PDF)</span>
            </a>
          )}
          <a
            href={demo.vrmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 font-mono text-xs font-semibold text-t-blue shadow-2xs hover:bg-black/5 transition"
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
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              {demo.categoryBadge} · Site #{demo.siteId}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            {demo.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 max-w-3xl leading-relaxed sm:text-base">
            {demo.narrative}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-medium">
            <span>
              By{' '}
              <strong className="text-zinc-950 font-bold">
                {demo.key === 'ess'
                  ? 'WATTINO × EcoPower Solution'
                  : meta.creator}
              </strong>
            </span>
            <span>·</span>
            <span>
              {demo.location.city}, {demo.location.country}
            </span>
            <span>·</span>
            <span className="font-mono text-t-blue font-semibold">
              Cerbo GX Verified SCADA
            </span>
          </div>
        </div>

        {/* 2-Column Split: Image Left (60%), Kickstarter Funding Box Right (40%) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Big Cover Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-black/10 bg-zinc-100 shadow-sm sm:aspect-16/9">
              <img
                src={getCampaignCoverImage(demo.key)}
                alt={demo.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-950/80 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                  {demo.categoryBadge}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-t-blue/90 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
                  {demo.key === 'treetino-v1'
                    ? '42.8 kW Cerbo GX Live'
                    : `${(demo.currentPower.solarYieldWatts / 1000).toFixed(1)} kW Live`}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl bg-zinc-950/80 px-3.5 py-1.5 font-mono text-xs text-white backdrop-blur-md">
                <span>Gateway: {gatewayName}</span>
                <span className="mx-2 text-cyan-400">·</span>
                <span>Mode: {demo.systemInfo.systemState}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Kickstarter Funding Box */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-6">
              {/* Progress bar */}
              <div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full bg-linear-to-r from-t-blue to-t-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(demo.financials.fundedPercent, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-t-blue">
                    {demo.financials.fundedPercent}% funded
                  </span>
                  <span className="text-zinc-500">
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
                  <span className="font-mono text-3xl font-black text-zinc-950 sm:text-4xl">
                    ${demo.financials.fundedUsdc.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-xs text-zinc-500">
                    pledged of ${demo.financials.targetUsdc.toLocaleString()}{' '}
                    goal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-4">
                  <div>
                    <span className="font-mono text-2xl font-black text-t-blue">
                      {demo.financials.projectedApy}%
                    </span>
                    <span className="block text-xs text-zinc-500">
                      projected yield (APY)
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-black text-zinc-950">
                      {meta.daysLeft}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      days to go
                    </span>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-3 flex items-center justify-between text-xs text-zinc-600">
                  <span>Active Backers:</span>
                  <strong className="font-mono text-zinc-950">
                    {meta.backers} backers
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Contracted PPA Tariff:</span>
                  <strong className="font-mono text-t-blue">
                    {demo.financials.tariffRate}
                  </strong>
                </div>
              </div>

              {/* Escrow Badge */}
              <div className="rounded-xl border border-t-blue/20 bg-t-blue/5 p-3.5 text-xs text-zinc-800 flex items-start gap-2.5">
                <ShieldCheckIcon className="h-4 w-4 text-t-blue shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Hardware Escrow Guarantee:</strong> Backing funds are
                  held in programmatic escrow on Solana and released only
                  against cryptographically verified on-site Cerbo GX telemetry.
                </p>
              </div>
            </div>

            {/* Back CTA Button */}
            <div className="mt-6 pt-4 border-t border-black/10 space-y-2.5">
              {projectDossier && (
                <a
                  href={projectDossier.downloadPdfPath}
                  download={
                    projectDossier.pdfFilename ?? 'Investor_Prospectus.pdf'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 text-xs font-bold text-emerald-900 transition shadow-2xs cursor-pointer group"
                >
                  <svg
                    className="h-4 w-4 text-emerald-700 group-hover:translate-y-0.5 transition"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download Complete Investor Prospectus (PDF)</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onBackProject) {
                    onBackProject(demo);
                  } else {
                    setActiveTab('money');
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-t-blue hover:bg-t-blue/90 px-6 py-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                <span>Back this project with mockUSDC</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION TABS */}
      <div className="flex flex-wrap border-b border-black/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('story')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition cursor-pointer ${
            activeTab === 'story'
              ? 'border-t-blue text-t-blue bg-t-blue/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          <span>Investor Dossier & Financial Model</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition cursor-pointer ${
            activeTab === 'topology'
              ? 'border-t-blue text-t-blue bg-t-blue/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          <BoltIcon className="h-4 w-4" />
          Real Hardware Power Flow
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition cursor-pointer ${
            activeTab === 'chart'
              ? 'border-t-blue text-t-blue bg-t-blue/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          24-Hour Energy Data
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('money')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition cursor-pointer ${
            activeTab === 'money'
              ? 'border-t-blue text-t-blue bg-t-blue/5 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          <TrendUpIcon className="h-4 w-4" />
          Back Project & Yield Share
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3.5 transition cursor-pointer ${
            activeTab === 'hardware'
              ? 'border-t-blue text-t-blue bg-t-blue/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          Physical Devices ({demo.devices.length})
        </button>
      </div>

      {/* 4. ACTIVE TAB CONTENT */}
      {/* TAB 0: INVESTOR DOSSIER & FINANCIAL MODEL */}
      {activeTab === 'story' && (
        <ProjectInvestorDossier dossier={projectDossier} />
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
          onOpenDeposit={onOpenDeposit}
        />
      )}

      {/* TAB 4: PHYSICAL HARDWARE DEVICES */}
      {activeTab === 'hardware' && (
        <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs">
          <div className="border-b border-black/10 pb-4">
            <h3 className="text-xl font-bold text-zinc-950">
              Venus OS D-Bus Connected Hardware ({demo.devices.length} Physical
              Components)
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Verified physical devices communicating via VE.Can, VE.Direct, and
              Modbus TCP with the Cerbo GX gateway.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demo.devices.map((device, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-black/10 bg-zinc-50/70 p-4 text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                      {device.name}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                      <CheckIcon className="h-3 w-3" />
                      Online
                    </span>
                  </div>
                  <h4 className="mt-2 font-bold text-zinc-950 text-sm">
                    {device.modelName}
                  </h4>
                  <p className="mt-0.5 text-zinc-500 text-xs">
                    {device.productName}
                  </p>
                </div>

                {device.firmwareVersion && (
                  <div className="mt-3 border-t border-black/5 pt-2 font-mono text-[11px] text-zinc-400">
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
