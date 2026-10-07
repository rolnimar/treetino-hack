import { ArrowRightIcon } from '../features/victron/victron-icons';

interface TreetinoBlueprintBannerProps {
  onExplorePools?: () => void;
  onFaucetClick?: () => void;
  faucetPending?: boolean;
}

export function TreetinoBlueprintBanner({
  onExplorePools,
  onFaucetClick,
  faucetPending,
}: TreetinoBlueprintBannerProps) {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-zinc-950 pt-20 pb-20 text-white"
    >
      {/* 1. Architectural Blueprint Contour Map Background */}
      <div className="pointer-events-none absolute inset-0 opacity-20 overflow-hidden mix-blend-screen">
        <img
          src="/img/treetino-vrstevnice.png"
          alt=""
          className="h-full w-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
      </div>

      {/* Floating Badges */}
      <div className="pointer-events-none absolute inset-x-0 top-12 hidden 2xl:block">
        <div className="mx-auto flex max-w-7xl justify-between px-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <span className="block font-mono text-[10px] text-white/50 uppercase">
              Corporate PPA Contracted
            </span>
            <span className="font-mono text-lg font-bold text-white">
              MKovo +€68,400
            </span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <span className="block font-mono text-[10px] text-white/50 uppercase">
              Pipeline Capacity
            </span>
            <span className="font-mono text-lg font-bold text-sky-400">
              23+ MW DePIN
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Centered Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Institutional Energy Crowdfunding
        </p>

        {/* Main Title */}
        <h2 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-tight">
          Power the Global Clean Energy Transition
        </h2>

        {/* Lead Paragraph */}
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-300 font-light leading-relaxed">
          Back physical clean power hardware starting from €50. Electricity
          contracted to corporate off-takers streams fixed yields directly in
          1:1 stable currency.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onExplorePools}
            className="flex items-center gap-2 rounded-full bg-[#183d89] px-8 py-3.5 text-sm font-semibold text-white shadow-xl transition-all hover:bg-[#2762ad] active:scale-[0.98] cursor-pointer"
          >
            <span>Explore Active Campaigns</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={faucetPending}
            onClick={onFaucetClick}
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-xl transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {faucetPending
              ? 'Depositing mockUSDC…'
              : '+ Deposit Test Capital ($1,000)'}
          </button>
        </div>

        {/* Platform Metric Ribbon */}
        <div className="mt-14 grid w-full grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4 text-left font-mono">
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              €4.2M+
            </span>
            <span className="mt-1 block text-[11px] text-zinc-400 uppercase tracking-wider">
              Asset Pipeline
            </span>
          </div>
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-emerald-400">
              14.2% – 18.5%
            </span>
            <span className="mt-1 block text-[11px] text-zinc-400 uppercase tracking-wider">
              Fixed APY
            </span>
          </div>
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              Venus OS
            </span>
            <span className="mt-1 block text-[11px] text-zinc-400 uppercase tracking-wider">
              SCADA Telemetry
            </span>
          </div>
          <div>
            <span className="block text-2xl sm:text-3xl font-light text-white">
              1:1 USDC
            </span>
            <span className="mt-1 block text-[11px] text-zinc-400 uppercase tracking-wider">
              Stable Settlement
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
