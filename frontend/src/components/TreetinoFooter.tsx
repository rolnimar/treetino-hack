import { LogoType } from './LogoType';

interface TreetinoFooterProps {
  protocolStatus?: {
    connected: boolean;
    unavailable: boolean;
  };
}

export function TreetinoFooter({ protocolStatus }: TreetinoFooterProps) {
  return (
    <footer className="relative mt-20 border-t border-black/10 bg-white text-zinc-900">
      {/* Main footer container */}
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Top brand header */}
        <div className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoType className="h-6 md:h-7 text-zinc-950" />
            <span className="rounded-full bg-t-blue/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-t-blue uppercase">
              Protocol Crowdfunding
            </span>
          </div>

          <div className="flex items-center gap-5 text-zinc-600">
            {/* X / Twitter */}
            <a
              href="https://x.com/treetino"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on X"
              className="transition hover:text-t-blue"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/company/treetino"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on LinkedIn"
              className="transition hover:text-t-blue"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/treetino"
              target="_blank"
              rel="noreferrer"
              aria-label="Treetino on Instagram"
              className="transition hover:text-t-blue"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 3-Column Navigation Grid */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {/* Column 1: Protocol & Products */}
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              Platform
            </span>
            <div className="mt-4 flex flex-col gap-2.5 text-xs text-zinc-600">
              <a href="#explore" className="hover:text-zinc-950 transition">
                Explore Clean Energy Assets
              </a>
              <a href="#portfolio" className="hover:text-zinc-950 transition">
                Investor Dividend Dashboard
              </a>
              <a href="#client" className="hover:text-zinc-950 transition">
                Client Power Billing
              </a>
              <a href="#admin" className="hover:text-zinc-950 transition">
                Protocol Admin Workspace
              </a>
              <a
                href="#pitch"
                className="hover:text-zinc-950 transition font-medium text-t-blue flex items-center gap-1"
              >
                <span>Investor Pitch Deck (3-Min)</span>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
              <a
                href="https://treetino.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition flex items-center gap-1"
              >
                <span>Treetino Main Site</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          {/* Column 2: Physical Hardware */}
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              Hardware DePIN
            </span>
            <div className="mt-4 flex flex-col gap-2.5 text-xs text-zinc-600">
              <span className="hover:text-zinc-950 transition cursor-default">
                Strom V1 · Solar & Wind Tree
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Strom V2 · Urban Energy Canopy
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Turbina · Ducted VAWT
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Victron Cerbo GX Telemetry
              </span>
            </div>
          </div>

          {/* Column 3: Legal & Governance */}
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              Legal & Trust
            </span>
            <div className="mt-4 flex flex-col gap-2.5 text-xs text-zinc-600">
              <span className="hover:text-zinc-950 transition cursor-default">
                Token Terms & PPA Conditions
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Investor Privacy Policy
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Non-Disclosure Agreement
              </span>
              <span className="hover:text-zinc-950 transition cursor-default">
                Mediation Agreement
              </span>
            </div>
          </div>

          {/* Column 4: Network & Backend State */}
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              DePIN Network
            </span>
            <div className="mt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-zinc-700">Solana Devnet</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    protocolStatus?.connected
                      ? 'bg-emerald-500'
                      : protocolStatus?.unavailable
                        ? 'bg-amber-500'
                        : 'bg-zinc-400'
                  }`}
                />
                <span className="font-mono text-zinc-700">
                  {protocolStatus?.connected
                    ? 'Backend Connected'
                    : protocolStatus?.unavailable
                      ? 'Backend Offline'
                      : 'Connecting Backend…'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                PPA Settlement: Instant on-chain
              </span>
            </div>
          </div>
        </div>

        {/* CzechInvest Grant Acknowledgment Banner (Exact from treetino-website-dev) */}
        <div className="my-8 rounded-2xl border border-black/10 bg-zinc-50/50 p-5 transition hover:bg-zinc-50">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <img
                src="/partners/image.png"
                alt="Technology Incubation & CzechInvest"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // Fallback gracefully if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <p className="max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-xs">
                Supported by the Technological Incubation project of the
                CzechInvest Agency. Verification of clean energy yield and
                distributed ledger hardware integration under Grant EP-4664750.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-t-blue">
              <span>Technology Incubation</span>
              <span className="text-xs">→</span>
            </div>
          </div>
        </div>

        {/* Official Company Card (Exact from treetino-website-dev) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-t-blue p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                Company Information
              </span>
              <span className="font-mono text-[10px] text-white/60 tracking-wider">
                CZECH REPUBLIC
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-2xl font-bold tracking-tight text-white">
                Treetino Corp s.r.o.
              </h4>
              <p className="mt-1 text-xs text-white/80">Company ID: 10800107</p>
              <p className="text-xs text-white/80">VAT ID: CZ10800107</p>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                Bila - Vlcetin 62,
                <br />
                463 43 &mdash; Bila - Vlcetin, Czech Republic
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 text-[11px] text-white/70">
              © 2026, Treetino Corp s.r.o. All rights reserved.
              <br />
              Clean Energy Crowdfunding Protocol built for Solana.
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-black/10 bg-zinc-50 p-6 text-xs text-zinc-600">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-t-blue uppercase">
                Architecture & Security
              </span>
              <h5 className="mt-2 text-base font-bold text-zinc-900">
                Victron Energy + Anchor Solana Smart Contracts
              </h5>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                Each tokenized asset represents fractional legal and economic
                ownership in physical microgrid hardware. Real-time telemetry is
                cryptographically attested by Victron Cerbo GX controllers,
                triggering automated PPA client invoices and proportional
                dividends.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-black/10 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Solana Cluster: Devnet</span>
              <span>Hardware Oracle: Cerbo GX SCADA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
