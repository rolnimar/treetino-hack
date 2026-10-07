import { useState } from 'react';
import { ErrorMessage } from '../../components/ui/feedback';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useVictronInvestments } from './use-victron-investments';
import { useEnrichedCampaigns } from './use-enriched-campaigns';
import type { VictronDemoItem } from './victron-types';
import {
  SunIcon,
  BatteryIcon,
  PowerPlugIcon,
  ArrowRightIcon,
  CheckIcon,
  WindIcon,
  HeartIcon,
  BookmarkIcon,
  LockClosedIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from './victron-icons';
import { getCampaignCoverImage, CAMPAIGN_METADATA } from './campaign-helpers';
import { EnergyBondFlowDiagram } from './components/energy-bond-flow-diagram';

interface VictronDemosProps {
  onSelectAsset?: (siteId: number) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}

type CategoryFilter =
  'all' | 'solar-trees' | 'ess' | 'ev' | 'offgrid' | 'high-yield';

export function VictronDemos({
  onSelectAsset,
  searchQuery = '',
  onClearSearch,
  onBackProject,
}: VictronDemosProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [spotlightKey, setSpotlightKey] =
    useState<VictronDemoItem['key']>('treetino-v1');
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(
    () => new Set(['treetino-v1']),
  );
  const [showArchitecture, setShowArchitecture] = useState(false);

  const wallet = useConnectedWallet();
  const { investments } = useVictronInvestments(wallet?.address);
  const { demos, isPending, isLoading, error, updatedAt, refetch } =
    useEnrichedCampaigns();

  const toggleBookmark = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelect = (siteId: number) => {
    const target = demos.find((d) => d.siteId === siteId);
    if (target) {
      setSpotlightKey(target.key);
    }
    onSelectAsset?.(siteId);
  };

  // Filter campaigns by category and search query
  const filteredDemos = demos.filter((demo) => {
    // 1. Category check
    if (selectedCategory === 'solar-trees' && demo.key !== 'treetino-v1')
      return false;
    if (selectedCategory === 'ess' && demo.key !== 'ess') return false;
    if (selectedCategory === 'ev' && demo.key !== 'ev') return false;
    if (selectedCategory === 'offgrid' && demo.key !== 'offgrid') return false;
    if (selectedCategory === 'high-yield' && demo.financials.projectedApy < 14)
      return false;

    // 2. Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = demo.title.toLowerCase().includes(q);
      const matchNarrative = demo.narrative.toLowerCase().includes(q);
      const matchCity = demo.location?.city.toLowerCase().includes(q);
      const matchCountry = demo.location?.country.toLowerCase().includes(q);
      const matchBadge = demo.categoryBadge.toLowerCase().includes(q);
      const matchCreator = CAMPAIGN_METADATA[demo.key]?.creator
        .toLowerCase()
        .includes(q);
      return (
        matchTitle ||
        matchNarrative ||
        matchCity ||
        matchCountry ||
        matchBadge ||
        matchCreator
      );
    }

    return true;
  });

  // Dynamic spotlight: pick spotlightKey if present in filteredDemos, otherwise first match
  const filteredKeys = filteredDemos.map((d) => d.key);
  const effectiveKey = filteredKeys.includes(spotlightKey)
    ? spotlightKey
    : (filteredDemos[0]?.key ?? 'treetino-v1');

  const featuredDemo =
    filteredDemos.find((d) => d.key === effectiveKey) ?? filteredDemos[0];

  // Active pipeline: if multiple filtered results exist, show the other filtered ones.
  // Otherwise, show the other demos from the broader catalog so the pipeline column is never empty.
  const recommendedDemos =
    filteredDemos.length > 1
      ? filteredDemos.filter((d) => d.siteId !== featuredDemo?.siteId)
      : demos.filter((d) => d.siteId !== featuredDemo?.siteId);

  // Platform-wide metrics
  const totalTargetUsdc = demos.reduce(
    (acc, d) => acc + (d.financials.targetUsdc || 0),
    0,
  );
  const totalFundedUsdc = demos.reduce(
    (acc, d) => acc + (d.financials.fundedUsdc || 0),
    0,
  );
  const totalSolarYieldWatts = demos.reduce(
    (acc, d) =>
      acc + (d.currentPower.solarYieldWatts || 0) + (d.windYieldWatts || 0),
    0,
  );

  return (
    <div className="space-y-12">
      {/* 1. UNIFIED KICKSTARTER & BOND YIELD EXPLAINER HERO */}
      <div id="bond-explainer" className="scroll-mt-24 space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-black/10 pb-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Decentralized Energy Infrastructure
            </p>
            <h2 className="text-3xl font-medium tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              The Clean Energy Kickstarter
            </h2>
            <div className="mt-2 text-xl sm:text-2xl font-normal text-[#183d89]">
              Earn Real Yields from Physical Power. Zero Crypto Jargon.
            </div>
            <p className="mt-3 text-base sm:text-lg text-zinc-600 font-light leading-relaxed">
              Back physical clean power hardware starting from €50. Power is
              sold 24/7 to corporate off-takers, streaming 14.2% – 18.5% fixed
              yields in 1:1 stable currency.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void refetch()}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 font-mono text-xs font-medium text-zinc-800 shadow-2xs transition hover:bg-black/5 disabled:opacity-50 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {isLoading ? 'Syncing SCADA…' : 'Sync Live SCADA'}
            </button>
          </div>
        </div>

        {/* 2. VISUAL 3-STEP CAPITAL & ENERGY FLOW SCHEMA (ANIMATED / NO HEAVY TEXT) */}
        <EnergyBondFlowDiagram />

        {/* 3. YIELD COMPARISON RIBBON (CLEAN LIGHT FINTECH DESIGN) */}
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono shadow-xs">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-zinc-600">
            <span className="font-bold text-zinc-900 uppercase tracking-wider">
              Yield Comparison:
            </span>
            <span>
              Bank CDs:{' '}
              <strong className="text-zinc-800 font-semibold">~2.5%</strong>
            </span>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <span>
              10-Yr Gov Bonds:{' '}
              <strong className="text-zinc-800 font-semibold">~3.8%</strong>
            </span>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-md">
              Treetino Energy Bonds: 14.2% – 18.5% Fixed APY
            </span>
          </div>

          <div className="text-zinc-500 font-mono text-[11px] shrink-0">
            1:1 Stable Settlement · Zero Crypto Volatility
          </div>
        </div>
      </div>

      {/* 3. SMART CONTRACT ARCHITECTURE & ON-CHAIN GUARANTEES TOGGLE */}
      <div className="rounded-2xl border border-black/10 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowArchitecture((prev) => !prev)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-zinc-50/80 cursor-pointer"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#183d89] text-white">
              <CodeBracketIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-medium text-zinc-950 text-sm">
                Solana Smart Contract Architecture & On-Chain Security
              </span>
              <span className="hidden sm:inline font-mono text-xs text-zinc-500 ml-2">
                (Anchor Program ID:
                EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#183d89]">
              {showArchitecture
                ? 'Hide Guarantees'
                : 'View 5 On-Chain Guarantees'}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-zinc-500 transition-transform ${
                showArchitecture ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {showArchitecture && (
          <div className="border-t border-black/10 bg-zinc-50/50 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-zinc-600 font-light">
                Every solar tree, battery container, and EV plaza operates under
                non-custodial Anchor smart contracts deployed to Solana devnet.
                The creator has zero administrative backdoor to divert funds.
              </p>
              <a
                href="https://solscan.io/account/EEbZ5DVTQ9f4XeRwmSh4u2QPiMSSmQjqKPNEpDHoBU2n?cluster=devnet"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#183d89] hover:underline shrink-0"
              >
                <span>Verify on Solscan</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Guarantee 1 */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#183d89] bg-blue-50 px-2 py-0.5 rounded">
                    buy_shares.rs
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    revoke_mint
                  </span>
                </div>
                <h4 className="text-sm font-medium text-zinc-950">
                  Zero-Dilution Hard Cap
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Each hardware pool has an isolated SPL mint. Pledging mints
                  exact shares to your wallet. Once the target is reached,{' '}
                  <code className="font-mono text-[11px] text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">
                    revoke_mint
                  </code>{' '}
                  permanently burns mint authority on-chain.
                </p>
              </div>

              {/* Guarantee 2 */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#183d89] bg-blue-50 px-2 py-0.5 rounded">
                    purchase_tree.rs
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    PDA Escrow
                  </span>
                </div>
                <h4 className="text-sm font-medium text-zinc-950">
                  Supplier-Restricted Escrow
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Pledged capital is locked in{' '}
                  <code className="font-mono text-[11px] text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">
                    funding_token_account
                  </code>
                  . The creator cannot withdraw capital arbitrarily. Funds
                  release atomically only to the verified supplier at 100%
                  funding.
                </p>
              </div>

              {/* Guarantee 3 */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#183d89] bg-blue-50 px-2 py-0.5 rounded">
                    submit_report.rs
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Cerbo GX
                  </span>
                </div>
                <h4 className="text-sm font-medium text-zinc-950">
                  Cryptographic SCADA Oracle
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Authorized on-site Victron Cerbo GX controllers (
                  <code className="font-mono text-[11px] text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">
                    has_one = reporter
                  </code>
                  ) sign 15-minute generation readings directly to Solana report
                  PDAs with UTC day validation and lifetime accumulation.
                </p>
              </div>

              {/* Guarantee 4 */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#183d89] bg-blue-50 px-2 py-0.5 rounded">
                    issue_invoice.rs
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    pay_invoice.rs
                  </span>
                </div>
                <h4 className="text-sm font-medium text-zinc-950">
                  On-Chain PPA Billing
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Tamper-proof invoices are issued on-chain from actual metered
                  kWh and settled in 1:1 stable payment tokens by corporate
                  off-takers directly into the pool&apos;s revenue vault.
                </p>
              </div>

              {/* Guarantee 5 */}
              <div className="rounded-xl border border-black/10 bg-white p-5 space-y-2 shadow-2xs md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#183d89] bg-blue-50 px-2 py-0.5 rounded">
                    claim_rewards.rs
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    SCALE = 1e12
                  </span>
                </div>
                <h4 className="text-sm font-medium text-zinc-950">
                  O(1) Scaled Reward Index Accumulator
                </h4>
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Our reward distribution engine uses a Uniswap/MasterChef-style
                  scaled index accumulator ({' '}
                  <code className="font-mono text-[11px] text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">
                    reward_index += (paid * 10^12) / total_shares
                  </code>{' '}
                  ). Dividends accumulate seamlessly without loop gas spikes,
                  and investors can claim their exact proportional yield in
                  constant O(1) time with zero roundoff dust loss.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. CATEGORY SELECTOR PILLS & STABLE CURRENCY SHIELD */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All Pools' },
              { id: 'solar-trees', label: 'Gateway Trees (14.2% APY)' },
              { id: 'ess', label: 'Battery Storage BESS (15.4% APY)' },
              { id: 'ev', label: 'EV Fast Charging (18.5% APY)' },
              { id: 'offgrid', label: 'Off-Grid Microgrids (8.5% APY)' },
              { id: 'high-yield', label: 'High Yield (>14% APY)' },
            ] as const
          ).map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-full px-4 py-2 font-mono text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 1:1 Stablecoin Protection Note */}
        <div className="rounded-2xl border border-black/10 bg-zinc-50/80 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#183d89] text-white shrink-0">
              <LockClosedIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-950">
                1:1 Energy Currency Protection:
              </span>
              <span className="text-zinc-600 font-light ml-1.5">
                Revenues from real kilowatt-hours stream in stable currency.
                Zero crypto price volatility.
              </span>
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 shrink-0">
            Direct PPA Escrow · EUR/USD Pegged
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS BAR IF ACTIVE */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-zinc-50 px-6 py-4 text-xs text-zinc-800">
          <span>
            Search results for: <strong>&ldquo;{searchQuery}&rdquo;</strong> (
            {filteredDemos.length} found)
          </span>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="font-bold text-[#183d89] underline hover:text-[#2762ad] cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      <ErrorMessage error={error} />

      {isPending && (
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="h-120 animate-pulse rounded-2xl bg-zinc-200/60 lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-zinc-200/60"
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. THE SIGNATURE KICKSTARTER 2-COLUMN DISCOVERY SECTION */}
      {filteredDemos.length > 0 && featuredDemo && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            {/* LEFT COLUMN (60%): FEATURED PROJECT HERO */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
                  Featured Project
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  Curated DePIN Allocation
                </span>
              </div>

              <article
                onClick={() => handleSelect(featuredDemo.siteId)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-all duration-300 hover:border-black/30 hover:shadow-xl"
              >
                {/* 16:9 Photographic Cover Image */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100 sm:aspect-16/9">
                  <img
                    src={getCampaignCoverImage(featuredDemo.key)}
                    alt={featuredDemo.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-950/80 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md shadow-xs">
                      {featuredDemo.categoryBadge}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-[#183d89]/90 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      {featuredDemo.key === 'treetino-v1'
                        ? '42.8 kW Cerbo GX Live'
                        : `${(featuredDemo.currentPower.solarYieldWatts / 1000).toFixed(1)} kW Live`}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    aria-label="Bookmark this project"
                    onClick={(e) => toggleBookmark(featuredDemo.key, e)}
                    className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-md backdrop-blur-md transition hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <HeartIcon
                      className={`h-5 w-5 ${
                        bookmarkedKeys.has(featuredDemo.key)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>

                  <div className="absolute bottom-3 left-4 font-mono text-xs font-medium text-white drop-shadow-md">
                    {featuredDemo.location.city},{' '}
                    {featuredDemo.location.country}
                  </div>
                </div>

                {/* Minimalist Progress Line */}
                <div className="h-1.5 w-full bg-zinc-100">
                  <div
                    className="h-full bg-gradient-to-r from-[#183d89] to-[#2762ad] transition-all duration-500"
                    style={{
                      width: `${Math.min(featuredDemo.financials.fundedPercent, 100)}%`,
                    }}
                  />
                </div>

                {/* Content Details */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-medium tracking-tight text-zinc-950 group-hover:text-[#183d89] transition-colors sm:text-3xl">
                      {featuredDemo.title}
                    </h2>
                    <p className="font-mono text-xs text-zinc-500">
                      Operator:{' '}
                      <strong className="text-zinc-900">
                        {CAMPAIGN_METADATA[featuredDemo.key]?.creator ??
                          'MKovo Engineering'}
                      </strong>{' '}
                      · 12 verified installations
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-zinc-600 font-light line-clamp-3">
                    {featuredDemo.narrative}
                  </p>

                  {/* Kickstarter Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-black/10 py-6">
                    <div>
                      <span className="block font-mono text-2xl font-light text-zinc-950 sm:text-3xl">
                        ${featuredDemo.financials.fundedUsdc.toLocaleString()}
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 mt-1 uppercase">
                        of $
                        {featuredDemo.financials.targetUsdc.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-2xl font-light text-[#183d89] sm:text-3xl">
                        {featuredDemo.financials.projectedApy}%
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 mt-1 uppercase">
                        Projected APY
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-2xl font-light text-zinc-950 sm:text-3xl">
                        $
                        {(
                          featuredDemo.financials.estAnnualRevenueUsdc / 1000
                        ).toFixed(1)}
                        k
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 mt-1 uppercase">
                        Est. PPA / Yr
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-2xl font-light text-zinc-950 sm:text-3xl">
                        {CAMPAIGN_METADATA[featuredDemo.key]?.daysLeft ?? 18}
                      </span>
                      <span className="block font-mono text-[11px] text-zinc-500 mt-1 uppercase">
                        Days to go
                      </span>
                    </div>
                  </div>

                  {/* Live SCADA Telemetry Glance Strip */}
                  <div className="grid grid-cols-3 gap-3 rounded-xl border border-black/5 bg-zinc-50/80 p-3.5 text-xs">
                    <div>
                      <span className="block font-mono text-[10px] text-zinc-400 uppercase">
                        Solar Output
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 font-mono font-medium text-zinc-900">
                        <SunIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>
                          {featuredDemo.currentPower.solarYieldWatts >= 1000
                            ? `${(featuredDemo.currentPower.solarYieldWatts / 1000).toFixed(1)} kW`
                            : `${featuredDemo.currentPower.solarYieldWatts.toFixed(0)} W`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] text-zinc-400 uppercase">
                        {featuredDemo.key === 'treetino-v1'
                          ? 'Wind Turbines'
                          : 'Battery SoC'}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 font-mono font-medium text-zinc-900">
                        {featuredDemo.key === 'treetino-v1' ? (
                          <>
                            <WindIcon className="h-3.5 w-3.5 text-[#183d89] shrink-0" />
                            <span>
                              {(
                                (featuredDemo.windYieldWatts ?? 0) / 1000
                              ).toFixed(1)}{' '}
                              kW
                            </span>
                          </>
                        ) : (
                          <>
                            <BatteryIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {featuredDemo.currentPower.batterySocPercent.toFixed(
                                0,
                              )}
                              %
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] text-zinc-400 uppercase">
                        Live Load
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 font-mono font-medium text-zinc-900">
                        <PowerPlugIcon className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                        <span>
                          {featuredDemo.currentPower.consumptionWatts >= 1000
                            ? `${(featuredDemo.currentPower.consumptionWatts / 1000).toFixed(1)} kW`
                            : `${featuredDemo.currentPower.consumptionWatts.toFixed(0)} W`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables Checklist Callout Box */}
                  <div className="rounded-xl border border-black/10 bg-zinc-50/70 p-4 space-y-2.5">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-800 block">
                      Included with Your Backing:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-[#183d89] shrink-0" />
                        <span>SPL Hardware Share Certificate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-[#183d89] shrink-0" />
                        <span>15-Year MKovo Industrial PPA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-[#183d89] shrink-0" />
                        <span>Daily 1:1 Stablecoin Invoicing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-[#183d89] shrink-0" />
                        <span>Live Victron SCADA Audit</span>
                      </div>
                    </div>
                  </div>

                  {/* User Active Backing Pill */}
                  {investments[featuredDemo.siteId]?.amountUsdc ? (
                    <div className="flex items-center justify-between rounded-xl bg-[#183d89]/5 px-4 py-3 text-xs text-zinc-900 border border-[#183d89]/20">
                      <span className="flex items-center gap-1.5 font-bold text-[#183d89]">
                        <CheckIcon className="h-4 w-4 text-[#183d89]" />
                        You backed this hardware
                      </span>
                      <span className="font-mono font-bold text-[#183d89]">
                        $
                        {investments[
                          featuredDemo.siteId
                        ].amountUsdc.toLocaleString()}{' '}
                        mockUSDC
                      </span>
                    </div>
                  ) : null}

                  {/* Action Buttons Row */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBackProject) {
                          onBackProject(featuredDemo);
                        } else {
                          handleSelect(featuredDemo.siteId);
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#183d89] hover:bg-[#2762ad] px-8 py-4 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <span>Back This Hardware Pool</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(featuredDemo.siteId);
                      }}
                      className="flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white hover:bg-black/5 px-6 py-4 text-xs font-mono font-medium text-zinc-800 transition-all cursor-pointer"
                    >
                      <span>Inspect Live SCADA & Contract</span>
                      <ExternalLinkIcon className="h-3.5 w-3.5 text-zinc-500" />
                    </button>
                  </div>
                </div>
              </article>
            </div>

            {/* RIGHT COLUMN (40%): RECOMMENDED ACTIVE PIPELINE STACK */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
                  Active Hardware Pipeline
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  Select to Spotlight
                </span>
              </div>

              <div className="space-y-4">
                {recommendedDemos.map((item) => {
                  const meta = CAMPAIGN_METADATA[item.key] ?? {
                    creator: 'Verified Operator',
                    daysLeft: 14,
                    backers: 30,
                  };
                  const isSaved = bookmarkedKeys.has(item.key);
                  const isSpotlight = spotlightKey === item.key;
                  const holding = investments[item.siteId]?.amountUsdc;

                  return (
                    <article
                      key={item.siteId}
                      onClick={() => handleSelect(item.siteId)}
                      className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition-all duration-200 hover:shadow-lg cursor-pointer ${
                        isSpotlight
                          ? 'border-[#183d89] ring-2 ring-[#183d89]/15'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      {/* Top Row: Thumbnail + Core Metadata */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Thumbnail with Single Clean APY Badge */}
                        <div className="relative aspect-16/10 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:aspect-4/3">
                          <img
                            src={getCampaignCoverImage(item.key)}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 rounded-md bg-zinc-950/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 backdrop-blur-xs">
                            {item.financials.projectedApy}% APY
                          </span>
                        </div>

                        {/* Title & Core Metadata */}
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-500">
                              <span className="font-mono text-xs font-medium uppercase tracking-wider text-[#183d89]">
                                {item.categoryBadge}
                              </span>
                              <button
                                type="button"
                                aria-label="Bookmark project"
                                onClick={(e) => toggleBookmark(item.key, e)}
                                className="text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                              >
                                <BookmarkIcon
                                  className={`h-4 w-4 ${
                                    isSaved
                                      ? 'fill-rose-500 text-rose-500'
                                      : 'text-zinc-400'
                                  }`}
                                />
                              </button>
                            </div>

                            <h3 className="mt-1 text-base font-medium text-zinc-950 group-hover:text-[#183d89] transition line-clamp-2">
                              {item.title}
                            </h3>

                            <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                              {meta.creator} · {item.location.city}
                            </p>
                          </div>

                          <div className="mt-2 text-[11px] font-mono text-zinc-500">
                            {item.key === 'treetino-v1'
                              ? '42.8 kW Clean Generation · MKovo PPA'
                              : `${item.currentPower.batterySocPercent > 0 ? `${item.currentPower.batterySocPercent.toFixed(0)}% Storage · ` : ''}15-Yr Off-Take Agreement`}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Financial Breakdown */}
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#183d89] to-[#2762ad] rounded-full"
                            style={{
                              width: `${Math.min(item.financials.fundedPercent, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600">
                          <div>
                            <span className="font-semibold text-zinc-950">
                              ${item.financials.fundedUsdc.toLocaleString()}
                            </span>
                            <span className="text-zinc-500 ml-1">
                              ({item.financials.fundedPercent}%)
                            </span>
                          </div>
                          <span>{meta.daysLeft} days left</span>
                        </div>
                      </div>

                      {/* Active User Backing Indicator */}
                      {holding && holding > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 border border-emerald-200/50 px-3 py-1.5 text-xs text-emerald-800">
                          <span className="flex items-center gap-1 text-[11px] font-medium font-mono">
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                            Backed pool position
                          </span>
                          <span className="font-mono text-[11px] font-bold">
                            ${holding.toLocaleString()} mockUSDC
                          </span>
                        </div>
                      )}

                      {/* Single Primary Action Button */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBackProject?.(item);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-950 hover:bg-[#183d89] py-2.5 px-4 text-xs font-semibold text-white shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                        >
                          <span>Back This Pool</span>
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Discovery Box */}
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-6 text-xs text-zinc-600 space-y-2">
                <span className="font-medium block text-zinc-950 text-sm">
                  Continuous Telemetry Attestation
                </span>
                <p className="text-xs text-zinc-500 leading-relaxed font-light">
                  Every pool is connected to on-site Victron Cerbo GX hardware
                  relaying live kilowatt-hours, battery charge cycles, and
                  institutional PPA cashflow directly to the Solana blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. PLATFORM DEPIN HARDWARE IMPACT STATS STRIP */}
      {demos.length > 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-xs sm:p-10">
          <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-6">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
                SCADA TELEMETRY NETWORK
              </span>
              <h3 className="mt-1 text-xl font-medium text-zinc-950 sm:text-2xl">
                On-Chain Physical Infrastructure
              </h3>
            </div>
            <span className="rounded-full bg-black/5 px-4 py-1.5 font-mono text-xs font-medium text-zinc-800">
              Venus OS Telemetry
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <span className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Total Goal
              </span>
              <span className="mt-2 block font-mono text-2xl sm:text-3xl font-light text-zinc-950">
                ${totalTargetUsdc.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Capital Backed
              </span>
              <span className="mt-2 block font-mono text-2xl sm:text-3xl font-light text-[#183d89]">
                ${totalFundedUsdc.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Live Output
              </span>
              <span className="mt-2 block font-mono text-2xl sm:text-3xl font-light text-zinc-950">
                {(totalSolarYieldWatts / 1000).toFixed(1)} kW
              </span>
            </div>
            <div>
              <span className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Active Nodes
              </span>
              <span className="mt-2 flex items-center gap-2 font-mono text-2xl sm:text-3xl font-light text-zinc-950">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {demos.length} Industrial
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-6 font-mono text-xs text-zinc-500">
            <span>Telemetry Source: Victron Cerbo GX via VRM REST API</span>
            <span>
              Last hardware sync: {new Date(updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
