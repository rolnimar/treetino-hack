import { useState } from 'react';

interface TreetinoHardwareShowcaseProps {
  onSelectAsset?: (siteId: number) => void;
  onBackProject?: (siteId: number) => void;
}

const SHOWCASE_STEPS = [
  {
    step: '01 / 04',
    category: 'Biomimetic Energy Tree',
    title: 'Treetino Biomimetic Solar-Wind Microgrid',
    desc: 'Patented biomimetic architecture tracking the sun with 22 dynamic leaf actuators and 12 ducted vertical wind turbines. Streams on-site clean power directly to corporate facilities under 15-year PPAs.',
    badge: '35 kWp Peak · 14.2% APY',
    img: '/products/main-tree.png',
    siteId: 100001,
    raised: '€192,700',
    target: '€235,000',
    percent: 82,
    apy: '12.8% Fixed APY',
    backers: 48,
    specs: [
      '22 Dynamic Sun-Tracking Leaves',
      '12 Ducted VAWT Turbines (Low Noise)',
      '15-Year Industrial Off-Taker PPA',
      'Victron Cerbo GX Telemetry Oracle',
    ],
  },
  {
    step: '02 / 04',
    category: 'Grid Balancing & Arbitrage',
    title: 'BESS Přeštice 8.6 MW: Utility Battery Storage',
    desc: 'High-capacity WATTINO hBESS battery storage directly interconnected with the ČEZ 110/22 kV Přeštice substation. Monetizes ancillary grid balancing services and automated spot power arbitrage.',
    badge: '8.6 MW / 17.2 MWh · 21.8% APY',
    img: '/campaigns/ess.jpg',
    siteId: 219742,
    raised: '€84,200',
    target: '€108,000',
    percent: 78,
    apy: '21.8% Project IRR',
    backers: 64,
    specs: [
      '2× Signed Grid Connection Agreements (22 kV MV)',
      'WATTINO hBESS (Samsung SDI EU NCM 622 Cells)',
      'Sub-10ms Inverter Response (FCR / aFRR)',
      'Net EBITDA €1.02M – €1.48M / yr (25.6M CZK)',
    ],
  },
  {
    step: '03 / 04',
    category: 'EV Fast-Charging Plazas',
    title: 'High-Power EV Charging Plaza & Microgrid',
    desc: 'Commercial 150kW ultra-fast charging array backed by buffer batteries and solar canopies. Monetizes 24/7 high-margin machine-to-machine charging sessions from logistics fleets and commuters.',
    badge: '10 Bays · 18.5% APY',
    img: '/products/V1.png',
    siteId: 374891,
    raised: '€91,500',
    target: '€100,000',
    percent: 92,
    apy: '18.5% Fixed APY',
    backers: 82,
    specs: [
      'Quattro 48/10000 Inverter Network',
      '1000A Lynx Shunt & Telemetry',
      'Smart POS Micro-Billing Integration',
      'Contracted Municipal Fleet Concessions',
    ],
  },
  {
    step: '04 / 04',
    category: 'Closed-Loop Energy Economy',
    title: '1:1 Energy Stablecoin & Bond Yield Distributions',
    desc: 'Every kilowatt-hour generated, stored, or charged across all Treetino assets is settled in our 1:1 asset-backed energy currency. Zero crypto volatility: off-taker electricity payments flow directly into automated bond yield payouts.',
    badge: '1:1 Pegged · Daily Distributions',
    img: '/products/Still_Turbina.png',
    siteId: 100001,
    raised: '€68,400',
    target: '€75,000',
    percent: 91,
    apy: '14.2% – 18.5% APY',
    backers: 142,
    specs: [
      '1:1 Asset-Backed Currency (No Volatility)',
      'Direct PPA Revenue Distribution',
      'Continuous Daily Smart Contract Payouts',
      'Cryptographically Verified by Venus OS',
    ],
  },
];

export function TreetinoHardwareShowcase({
  onSelectAsset,
  onBackProject,
}: TreetinoHardwareShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = SHOWCASE_STEPS[activeIndex];

  return (
    <section
      id="hardware-showcase"
      className="relative bg-[#fdfdfd] text-zinc-950 py-20 sm:py-28 lg:py-36"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#183d89]/10 px-3.5 py-1 text-xs font-mono font-bold text-[#183d89] uppercase tracking-wider mb-3">
            <span>PHYSICAL HARDWARE SPECIFICATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-950 leading-tight">
            Tokenized Clean Energy Infrastructure
          </h2>
          <p className="mt-3 text-base sm:text-lg text-zinc-600 font-light max-w-3xl leading-relaxed">
            Every tokenized pool corresponds to physical machinery on the
            ground. Explore the three core asset classes powering high-yield,
            bond-style cash flows.
          </p>
        </div>

        {/* Step Selector Pills at top */}
        <div className="mb-12 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SHOWCASE_STEPS.map((item, idx) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full px-5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeIndex === idx
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-950'
              }`}
            >
              {item.step.split(' / ')[0]} · {item.category}
            </button>
          ))}
        </div>

        {/* Signature Split View */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column (5/12) - Big Typography & Spacious Content */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <span className="font-mono text-xs sm:text-sm font-semibold text-zinc-400 tabular-nums uppercase tracking-wider">
              {current.step} · {current.category}
            </span>

            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-zinc-950 leading-tight">
              {current.title}
            </h3>

            <p className="text-base sm:text-lg text-zinc-700 font-light leading-relaxed">
              {current.desc}
            </p>

            {/* Hardware Specification Points */}
            <div className="my-1 space-y-2.5">
              {current.specs.map((spec) => (
                <div
                  key={spec}
                  className="flex items-center gap-3 text-xs sm:text-sm font-mono text-zinc-800"
                >
                  <span className="h-2 w-2 rounded-full bg-[#183d89] shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>

            {/* Crowdfunding Bar (Clean & Minimalist Kickstarter Style) */}
            <div className="mt-2 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-950">
                  {current.raised}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  Target: {current.target}
                </span>
                <span className="font-mono text-xs font-bold text-[#183d89]">
                  {current.percent}%
                </span>
              </div>

              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full bg-gradient-to-r from-[#183d89] to-[#2762ad] transition-all duration-500"
                  style={{ width: `${current.percent}%` }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-zinc-600 font-mono">
                <span>{current.backers} Backers</span>
                <span className="text-emerald-700 font-bold">
                  {current.apy}
                </span>
                <span className="text-zinc-500">Cerbo GX Attested</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (onBackProject) {
                    onBackProject(current.siteId);
                  } else {
                    onSelectAsset?.(current.siteId);
                  }
                }}
                className="rounded-full bg-[#183d89] px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2762ad] active:scale-[0.98] cursor-pointer"
              >
                Back This Hardware
              </button>
              <button
                type="button"
                onClick={() => onSelectAsset?.(current.siteId)}
                className="rounded-full border border-black/15 bg-transparent px-6 py-3 text-sm font-medium text-zinc-800 transition-all hover:border-black/30 hover:bg-black/5 cursor-pointer"
              >
                Inspect Telemetry ↗
              </button>
            </div>
          </div>

          {/* Right Column (7/12) - High-Resolution 3D Visual with Breathing Room */}
          <div className="relative flex items-center justify-center lg:col-span-7">
            {/* Ambient Radial Soft Glow */}
            <div className="pointer-events-none absolute h-[320px] w-[320px] sm:h-[450px] sm:w-[450px] rounded-full bg-gradient-to-br from-sky-200/40 via-blue-100/30 to-transparent blur-3xl" />

            <div className="relative w-full max-w-lg lg:max-w-2xl">
              <img
                src={current.img}
                alt={current.title}
                className="relative z-10 w-full max-h-[520px] object-contain drop-shadow-2xl transition-all duration-700 hover:scale-[1.02]"
              />

              {/* Floating Clean Spec Tag */}
              <div className="absolute top-6 right-6 z-20 rounded-full border border-black/10 bg-white/90 px-4 py-1.5 font-mono text-xs font-semibold text-zinc-900 shadow-md backdrop-blur-md">
                {current.badge}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
