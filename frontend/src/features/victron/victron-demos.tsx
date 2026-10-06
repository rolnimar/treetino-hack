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
  ShieldCheckIcon,
  SparklesIcon,
} from './victron-icons';

interface VictronDemosProps {
  onSelectAsset?: (siteId: number) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

import { getCampaignCoverImage, CAMPAIGN_METADATA } from './campaign-helpers';

type CategoryFilter =
  'all' | 'solar-trees' | 'ess' | 'ev' | 'offgrid' | 'high-yield';

export function VictronDemos({
  onSelectAsset,
  searchQuery = '',
  onClearSearch,
}: VictronDemosProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(
    () => new Set(['treetino-v1']),
  );

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

  // Pick featured project: default to treetino-v1 if in results, else first match
  const featuredDemo =
    filteredDemos.find((d) => d.key === 'treetino-v1') ?? filteredDemos[0];
  const recommendedDemos = filteredDemos.filter(
    (d) => d.siteId !== featuredDemo?.siteId,
  );

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
    <section
      id="kickstarter-marketplace"
      aria-label="Clean Energy Crowdfunding Marketplace"
      className="space-y-10 pb-16"
    >
      {/* 1. KICKSTARTER CATEGORY SUB-NAV BAR */}
      <nav
        aria-label="Campaign Categories"
        className="flex items-center gap-2 overflow-x-auto border-b border-forest/15 pb-3 pt-2 text-xs font-semibold scrollbar-none"
      >
        {(
          [
            { id: 'all', label: 'All Projects' },
            { id: 'solar-trees', label: 'Solar & Wind Trees' },
            { id: 'ess', label: 'Commercial BESS' },
            { id: 'ev', label: 'EV Fast-Charging' },
            { id: 'offgrid', label: 'Off-Grid Solar' },
            { id: 'high-yield', label: 'High Yield (>14% APY)' },
          ] as const
        ).map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 transition-all duration-150 ${
                isActive
                  ? 'bg-forest text-white shadow-2xs'
                  : 'bg-white/80 text-forest/75 hover:bg-forest/10 hover:text-forest'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 rounded-full border border-forest/20 bg-white px-3.5 py-1.5 font-mono text-[11px] font-bold text-forest transition hover:bg-forest/5 disabled:opacity-50"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {isLoading ? 'Syncing…' : 'Sync Live SCADA'}
          </button>
        </div>
      </nav>

      {/* 2. SEARCH ACTIVE NOTICE IF SEARCHING */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between rounded-xl bg-forest/5 px-4 py-2.5 text-xs text-forest">
          <span>
            Search results for: <strong>&ldquo;{searchQuery}&rdquo;</strong> (
            {filteredDemos.length} found)
          </span>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="font-bold underline hover:text-leaf"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* 3. HERO CURATED SPOTLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#103022] via-[#173d2c] to-[#0a2016] px-6 py-8 text-white shadow-md sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-300 uppercase backdrop-blur-xs">
            <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
            Clean Energy Harvest 2026 · Live DePIN Crowdfunding
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight">
            Bring a clean energy project to life.
          </h1>
          <p className="text-sm leading-relaxed text-emerald-100/90 sm:text-base">
            Back physical solar microgrids, battery arbitrage, and sculptural
            energy trees. Verified on-site by Victron Cerbo GX hardware
            streaming instant on-chain dividends directly to your wallet on
            Solana.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-emerald-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
              Cerbo GX Hardware Escrow
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Milestone PPA Tariffs
            </span>
            <span>Continuous USDC Distributions</span>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-48 w-48 rounded-full bg-leaf/15 blur-2xl" />
      </div>

      <ErrorMessage error={error} />

      {isPending && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-120 animate-pulse rounded-3xl bg-forest/5 lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-forest/5"
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. THE SIGNATURE KICKSTARTER 2-COLUMN DISCOVERY SECTION */}
      {filteredDemos.length > 0 && featuredDemo && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN (60%): FEATURED PROJECT HERO */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest/70">
                  Featured Project
                </span>
                <span className="text-xs font-medium text-forest/60">
                  Curated by Treetino DePIN Council
                </span>
              </div>

              <article
                onClick={() => handleSelect(featuredDemo.siteId)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-forest/15 bg-white shadow-sm transition-all duration-300 hover:border-forest/40 hover:shadow-xl"
              >
                {/* 16:9 Photographic Cover Image */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-forest/10 sm:aspect-16/9">
                  <img
                    src={getCampaignCoverImage(featuredDemo.key)}
                    alt={featuredDemo.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-forest/80 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md">
                      {featuredDemo.categoryBadge}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {featuredDemo.key === 'treetino-v1'
                        ? '⚡ 42.8 kW Cerbo GX Live'
                        : `⚡ ${(featuredDemo.currentPower.solarYieldWatts / 1000).toFixed(1)} kW Live`}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    aria-label="Bookmark this project"
                    onClick={(e) => toggleBookmark(featuredDemo.key, e)}
                    className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest shadow-md backdrop-blur-md transition hover:bg-white hover:scale-110 active:scale-95"
                  >
                    <HeartIcon
                      className={`h-5 w-5 ${
                        bookmarkedKeys.has(featuredDemo.key)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-forest/70'
                      }`}
                    />
                  </button>

                  <div className="absolute bottom-3 left-4 text-xs font-semibold text-white drop-shadow-md">
                    📍 {featuredDemo.location.city},{' '}
                    {featuredDemo.location.country}
                  </div>
                </div>

                {/* Kickstarter Green Progress Bar */}
                <div className="h-2 w-full bg-forest/10">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(featuredDemo.financials.fundedPercent, 100)}%`,
                    }}
                  />
                </div>

                {/* Content Details */}
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-forest group-hover:text-emerald-800 transition-colors sm:text-3xl">
                      {featuredDemo.title}
                    </h2>
                    <p className="text-xs text-forest/60 font-medium">
                      By{' '}
                      <strong>
                        {CAMPAIGN_METADATA[featuredDemo.key]?.creator ??
                          'MKovo Engineering'}
                      </strong>{' '}
                      · 12 backed clean energy deployments
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-forest/80 line-clamp-3">
                    {featuredDemo.narrative}
                  </p>

                  {/* Kickstarter Stats Row */}
                  <div className="grid grid-cols-3 gap-4 border-y border-forest/10 py-4">
                    <div>
                      <span className="block font-mono text-xl font-black text-forest sm:text-2xl">
                        ${featuredDemo.financials.fundedUsdc.toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-forest/60">
                        pledged of $
                        {featuredDemo.financials.targetUsdc.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-xl font-black text-emerald-800 sm:text-2xl">
                        {featuredDemo.financials.projectedApy}%
                      </span>
                      <span className="block text-[11px] text-forest/60">
                        projected yield (APY)
                      </span>
                    </div>

                    <div>
                      <span className="block font-mono text-xl font-black text-forest sm:text-2xl">
                        {CAMPAIGN_METADATA[featuredDemo.key]?.daysLeft ?? 14}
                      </span>
                      <span className="block text-[11px] text-forest/60">
                        days to go
                      </span>
                    </div>
                  </div>

                  {/* User Active Backing Pill */}
                  {investments[featuredDemo.siteId]?.amountUsdc ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-950 border border-emerald-600/30">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckIcon className="h-4 w-4 text-emerald-700" />
                        You backed this project
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        $
                        {investments[
                          featuredDemo.siteId
                        ].amountUsdc.toLocaleString()}{' '}
                        mockUSDC
                      </span>
                    </div>
                  ) : null}

                  {/* Primary CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(featuredDemo.siteId);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#05ce78] hover:bg-[#04b669] px-6 py-3.5 text-sm font-bold text-forest shadow-xs transition active:scale-[0.99]"
                    >
                      <span>Back this project with mockUSDC</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            </div>

            {/* RIGHT COLUMN (40%): RECOMMENDED FOR YOU STACK */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest/70">
                  Recommended For You
                </span>
                <span className="text-xs font-medium text-leaf">
                  Verified hardware
                </span>
              </div>

              <div className="space-y-4">
                {recommendedDemos.slice(0, 3).map((item) => {
                  const meta = CAMPAIGN_METADATA[item.key] ?? {
                    creator: 'Verified Operator',
                    daysLeft: 14,
                    backers: 30,
                  };
                  const isSaved = bookmarkedKeys.has(item.key);

                  return (
                    <article
                      key={item.siteId}
                      onClick={() => handleSelect(item.siteId)}
                      className="group relative flex flex-col sm:flex-row gap-4 overflow-hidden rounded-2xl border border-forest/15 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-forest/40 hover:shadow-md cursor-pointer"
                    >
                      {/* Thumbnail (16:9 or square on desktop) */}
                      <div className="relative aspect-16/10 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-forest/10 sm:aspect-4/3">
                        <img
                          src={getCampaignCoverImage(item.key)}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 rounded-md bg-forest/80 px-2 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs">
                          {item.financials.projectedApy}% APY
                        </span>
                      </div>

                      {/* Content Column */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-forest/60">
                            <span className="font-mono font-bold uppercase tracking-wider">
                              {item.categoryBadge}
                            </span>
                            <button
                              type="button"
                              aria-label="Bookmark project"
                              onClick={(e) => toggleBookmark(item.key, e)}
                              className="text-forest/50 hover:text-rose-500 transition"
                            >
                              <BookmarkIcon
                                className={`h-4 w-4 ${
                                  isSaved
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-forest/40'
                                }`}
                              />
                            </button>
                          </div>

                          <h3 className="mt-1 text-sm font-bold text-forest group-hover:text-emerald-800 transition line-clamp-2">
                            {item.title}
                          </h3>

                          <p className="mt-0.5 text-[11px] text-forest/60">
                            By {meta.creator} · {item.location.city}
                          </p>
                        </div>

                        {/* Progress Bar & Mini Stats */}
                        <div className="mt-3">
                          <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${Math.min(item.financials.fundedPercent, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-forest/70">
                            <span className="font-bold text-emerald-800">
                              {item.financials.fundedPercent}% funded
                            </span>
                            <span>{meta.daysLeft} days left</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Discovery Box */}
              <div className="rounded-2xl border border-dashed border-forest/20 bg-cream/30 p-5 text-xs text-forest/80">
                <span className="font-bold block text-forest text-sm">
                  Looking to back custom capacity?
                </span>
                <p className="mt-1 text-xs text-forest/70">
                  Every project is backed by verified Cerbo GX hardware and a
                  signed long-term corporate PPA off-taker agreement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. "TAKING OFF: CLEAN ENERGY PROJECTS TRENDING RIGHT NOW" GRID */}
      <div className="space-y-6 pt-6 border-t border-forest/15">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                Taking Off
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
              Clean Energy Projects Trending Right Now
            </h2>
            <p className="mt-1 text-xs text-forest/70 sm:text-sm">
              Community solar microgrids, battery arbitrage, and fleet
              electrification streaming metered investor yields on Solana.
            </p>
          </div>

          <span className="font-mono text-xs text-forest/60">
            Showing {filteredDemos.length} verified installations
          </span>
        </div>

        {/* 4-COLUMN KICKSTARTER CARD GRID */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {filteredDemos.map((demo) => (
            <CleanKickstarterCard
              key={demo.siteId}
              demo={demo}
              holdingAmount={investments[demo.siteId]?.amountUsdc}
              isBookmarked={bookmarkedKeys.has(demo.key)}
              onToggleBookmark={(e) => toggleBookmark(demo.key, e)}
              onSelect={() => handleSelect(demo.siteId)}
            />
          ))}
        </div>
      </div>

      {/* 6. PLATFORM DEPIN HARDWARE IMPACT STATS STRIP */}
      {demos.length > 0 && (
        <div className="rounded-3xl border border-forest/15 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-forest/10 pb-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                Network Telemetry
              </span>
              <h3 className="text-lg font-bold text-forest">
                Making Clean Energy DePIN a Reality
              </h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
              Live Venus OS SCADA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <span className="block font-mono text-[11px] font-bold text-forest/60 uppercase">
                Total Capital Goal
              </span>
              <span className="mt-0.5 block font-mono text-xl font-black text-forest sm:text-2xl">
                ${totalTargetUsdc.toLocaleString()} USDC
              </span>
            </div>
            <div>
              <span className="block font-mono text-[11px] font-bold text-forest/60 uppercase">
                Capital Backed
              </span>
              <span className="mt-0.5 block font-mono text-xl font-black text-emerald-800 sm:text-2xl">
                ${totalFundedUsdc.toLocaleString()} USDC
              </span>
            </div>
            <div>
              <span className="block font-mono text-[11px] font-bold text-forest/60 uppercase">
                Real-Time Generation
              </span>
              <span className="mt-0.5 block font-mono text-xl font-black text-sky-900 sm:text-2xl">
                {(totalSolarYieldWatts / 1000).toFixed(1)} kW
              </span>
            </div>
            <div>
              <span className="block font-mono text-[11px] font-bold text-forest/60 uppercase">
                Active Gateways
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-mono text-xl font-black text-forest sm:text-2xl">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                {demos.length} Industrial Sites
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-forest/10 pt-3 text-[11px] font-mono text-forest/60">
            <span>
              Hardware Channel: <strong>Cerbo GX & Venus OS</strong> via Victron
              VRM REST API
            </span>
            <span>
              Last hardware sync: {new Date(updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function CleanKickstarterCard({
  demo,
  holdingAmount,
  isBookmarked,
  onToggleBookmark,
  onSelect,
}: {
  demo: VictronDemoItem;
  holdingAmount?: number;
  isBookmarked?: boolean;
  onToggleBookmark: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  const { currentPower, financials, location } = demo;
  const meta = CAMPAIGN_METADATA[demo.key] ?? {
    creator: 'Verified Operator',
    daysLeft: 14,
    backers: 35,
  };

  return (
    <article
      onClick={onSelect}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-forest/15 bg-white shadow-2xs transition-all duration-200 hover:border-forest/40 hover:shadow-lg cursor-pointer"
    >
      <div>
        {/* Cover Image (16:9 ratio) */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-forest/10">
          <img
            src={getCampaignCoverImage(demo.key)}
            alt={demo.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Top Overlaid Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="rounded-full bg-forest/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-xs">
              {demo.categoryBadge}
            </span>
          </div>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            aria-label="Bookmark project"
            onClick={onToggleBookmark}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-forest shadow-xs backdrop-blur-xs transition hover:bg-white hover:scale-110 active:scale-95"
          >
            <BookmarkIcon
              className={`h-4 w-4 ${
                isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-forest/50'
              }`}
            />
          </button>

          {/* Bottom Live Hardware Overlay */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {demo.key === 'treetino-v1'
              ? '⚡ 42.8 kW Cerbo GX'
              : `⚡ ${(currentPower.solarYieldWatts / 1000).toFixed(1)} kW Live`}
          </div>
        </div>

        {/* Kickstarter Green Progress Bar */}
        <div className="h-1.5 w-full bg-forest/10">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(financials.fundedPercent, 100)}%` }}
          />
        </div>

        {/* Body Padding */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold tracking-tight text-forest group-hover:text-emerald-800 transition line-clamp-1">
              {demo.title}
            </h3>
            <p className="mt-0.5 text-xs text-forest/60">
              By {meta.creator} · {location?.city ?? 'Site'},{' '}
              {location?.country ?? ''}
            </p>
          </div>

          <p className="text-xs text-forest/75 line-clamp-2 leading-relaxed">
            {demo.narrative}
          </p>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-forest/5 p-3">
            <div>
              <span className="block text-[10px] font-semibold text-forest/60">
                Projected APY
              </span>
              <span className="font-mono font-extrabold text-base text-emerald-800">
                {financials.projectedApy}%
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-forest/60">
                Annual Revenue
              </span>
              <span className="font-mono font-bold text-xs text-forest">
                ${financials.estAnnualRevenueUsdc.toLocaleString()} / yr
              </span>
            </div>
          </div>

          {/* Live Telemetry Flow Glance */}
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-forest/10 bg-cream/30 p-2 text-[11px]">
            <div className="flex items-center gap-1">
              <SunIcon className="h-3 w-3 text-amber-600 shrink-0" />
              <span className="font-mono font-bold text-forest truncate">
                {currentPower.solarYieldWatts >= 1000
                  ? `${(currentPower.solarYieldWatts / 1000).toFixed(1)}k`
                  : `${currentPower.solarYieldWatts.toFixed(0)}W`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {demo.key === 'treetino-v1' ? (
                <WindIcon className="h-3 w-3 text-sky-700 shrink-0" />
              ) : (
                <BatteryIcon className="h-3 w-3 text-emerald-700 shrink-0" />
              )}
              <span className="font-mono font-bold text-forest truncate">
                {demo.key === 'treetino-v1'
                  ? `${((demo.windYieldWatts ?? 0) / 1000).toFixed(1)}k`
                  : `${currentPower.batterySocPercent.toFixed(0)}%`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <PowerPlugIcon className="h-3 w-3 text-emerald-800 shrink-0" />
              <span className="font-mono font-bold text-forest truncate">
                {currentPower.consumptionWatts >= 1000
                  ? `${(currentPower.consumptionWatts / 1000).toFixed(1)}k`
                  : `${currentPower.consumptionWatts.toFixed(0)}W`}
              </span>
            </div>
          </div>

          {/* Kickstarter Pledged & Days Left */}
          <div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono font-black text-sm text-forest">
                  ${financials.fundedUsdc.toLocaleString()}
                </span>
                <span className="ml-1 text-[11px] text-forest/60">
                  pledged ({financials.fundedPercent}%)
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-forest/70">
                {meta.daysLeft}d left
              </span>
            </div>
          </div>

          {/* User Active Investment Badge if invested */}
          {holdingAmount && holdingAmount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-950">
              <span className="flex items-center gap-1 font-bold text-[11px]">
                <CheckIcon className="h-3 w-3 text-emerald-700" />
                Your Backing:
              </span>
              <span className="font-mono font-bold text-[11px] text-emerald-800">
                ${holdingAmount.toLocaleString()} mockUSDC
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#23573e] active:scale-[0.99]"
        >
          <span>Inspect Hardware & Back</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
