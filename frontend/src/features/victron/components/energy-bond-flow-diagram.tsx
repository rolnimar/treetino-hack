import { useState } from 'react';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BoltIcon,
} from '../victron-icons';

export function EnergyBondFlowDiagram() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | null>(null);

  const stepDetails = {
    1: {
      tag: 'Anchor PDA Escrow',
      desc: 'Your pledge is locked in a non-custodial smart contract until 100% funding is reached, after which fractional hardware titles (SPL) are minted with permanently burned authority (zero dilution).',
    },
    2: {
      tag: 'Victron SCADA Oracle',
      desc: 'On-site Victron Cerbo GX controllers cryptographically sign 15-minute generation readings to Solana daily report PDAs. Commercial off-takers are legally bound by 15-year PPAs to pay metered invoices.',
    },
    3: {
      tag: '10^18 Precision Accumulator',
      desc: 'Commercial off-taker invoice payments fund the on-chain revenue vault. Our O(1) mathematical accumulator credits your wallet in 1:1 stable currency with zero crypto volatility and zero middlemen.',
    },
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. Diagram Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#183d89]">
            Visual Capital & Energy Flow
          </span>
          <h3 className="text-lg sm:text-xl font-medium text-zinc-950">
            How You Earn 14.2% – 18.5% APY in 3 Steps
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% Physical Asset Backed
          </span>
        </div>
      </div>

      {/* 2. Visual 3-Node Connected Schema */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 relative">
        {/* Step 1: Back Hardware */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 1 ? null : 1)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 1 ? null : 1);
            }
          }}
          className={`group relative rounded-2xl border p-5 transition-all cursor-pointer ${
            activeStep === 1
              ? 'border-[#183d89] bg-blue-50/40 shadow-sm ring-2 ring-[#183d89]/20'
              : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-50 hover:border-black/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#183d89] bg-white border border-black/10 px-2 py-0.5 rounded-md shadow-2xs">
              01 / PLEDGE
            </span>
            <span className="font-mono text-[11px] font-semibold text-zinc-500">
              From €50
            </span>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#183d89] text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                You Back Hardware
              </h4>
              <p className="text-xs font-mono text-[#183d89] font-medium">
                Legal Fractional Title
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-light leading-relaxed">
            Co-own patented solar trees, batteries, and charging plazas.
            Non-custodial escrow guarantees zero dilution.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] font-mono text-zinc-400">
            <span>Anchor PDA Escrow</span>
            <span className="text-[#183d89] group-hover:translate-x-0.5 transition-transform">
              Details ↓
            </span>
          </div>

          {/* Desktop Pipeline Arrow */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-black/15 shadow-xs text-xs font-mono text-zinc-600 pointer-events-none"
          >
            ➔
          </div>
        </div>

        {/* Step 2: 24/7 Power Sales */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 2 ? null : 2)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 2 ? null : 2);
            }
          }}
          className={`group relative rounded-2xl border p-5 transition-all cursor-pointer ${
            activeStep === 2
              ? 'border-[#183d89] bg-blue-50/40 shadow-sm ring-2 ring-[#183d89]/20'
              : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-50 hover:border-black/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              02 / GENERATE
            </span>
            <span className="font-mono text-[11px] font-semibold text-emerald-700">
              15-Year PPA
            </span>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <BoltIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                Electricity Sold 24/7
              </h4>
              <p className="text-xs font-mono text-amber-700 font-medium">
                Factories & Grid Off-Takers
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-light leading-relaxed">
            Hardware produces power around the clock. Victron Cerbo GX meters
            kilowatt-hours and signs telemetry on-chain.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] font-mono text-zinc-400">
            <span>Cerbo GX Oracle</span>
            <span className="text-[#183d89] group-hover:translate-x-0.5 transition-transform">
              Details ↓
            </span>
          </div>

          {/* Desktop Pipeline Arrow */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-black/15 shadow-xs text-xs font-mono text-zinc-600 pointer-events-none"
          >
            ➔
          </div>
        </div>

        {/* Step 3: Direct Cash Flow */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveStep(activeStep === 3 ? null : 3)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveStep(activeStep === 3 ? null : 3);
            }
          }}
          className={`group relative rounded-2xl border p-5 transition-all cursor-pointer ${
            activeStep === 3
              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20'
              : 'border-black/10 bg-zinc-50/60 hover:bg-zinc-50 hover:border-black/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              03 / YIELD
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-700">
              14.2% – 18.5% APY
            </span>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-950">
                Direct Cash Flow
              </h4>
              <p className="text-xs font-mono text-emerald-700 font-medium">
                1:1 Stable Daily Payout
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-light leading-relaxed">
            Off-takers pay commercial invoices. Automated smart contracts stream
            bond yields to your wallet with zero crypto volatility.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] font-mono text-zinc-400">
            <span>O(1) Accumulator</span>
            <span className="text-emerald-700 group-hover:translate-x-0.5 transition-transform">
              Details ↓
            </span>
          </div>
        </div>
      </div>

      {/* 3. Animated Energy & Cash Flow Pipeline Banner */}
      <div className="rounded-2xl border border-black/10 bg-zinc-950 p-4 text-white overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <span className="text-zinc-400">AUTOMATED CLOSED-LOOP:</span>{' '}
              <span className="text-white font-medium">
                Pledge Capital ➔ Solar & Battery Generation ➔ 1:1 Stable Payouts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-[11px] shrink-0">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Zero Speculative Crypto Volatility</span>
          </div>
        </div>

        {/* Animated Pipeline Graphic */}
        <div className="mt-3 relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-300 animate-pulse"
            style={{
              animationDuration: '2.5s',
              animationIterationCount: 'infinite',
            }}
          />
        </div>
      </div>

      {/* 4. Interactive Step Detail Drawer (Quick 1-Line Explanation on Click) */}
      {activeStep && (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#183d89] uppercase tracking-wider">
              Step {activeStep}: {stepDetails[activeStep].tag}
            </span>
            <button
              type="button"
              onClick={() => setActiveStep(null)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer font-mono text-[11px]"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-zinc-700 font-light leading-relaxed">
            {stepDetails[activeStep].desc}
          </p>
        </div>
      )}
    </div>
  );
}
