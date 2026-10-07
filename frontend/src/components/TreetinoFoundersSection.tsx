export function TreetinoFoundersSection() {
  return (
    <section
      id="leadership"
      className="relative bg-white text-black py-24 sm:py-32 lg:py-36 border-t border-black/5"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col px-6 sm:w-[500px] sm:px-0 md:w-[700px] lg:w-[calc(100%-200px)] xl:w-[calc(100%-400px)]">
        {/* Section Header (Image 3) */}
        <div className="mb-16 sm:mb-20">
          <span className="text-xs font-semibold tracking-[0.2em] text-[#183d89] uppercase">
            PEOPLE BEHIND TREETINO
          </span>
          <h2 className="mt-3 text-4xl font-medium tracking-tight text-black sm:text-5xl lg:text-6xl">
            Founders & Leadership
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-black/70 sm:text-xl font-light">
            Bridging battle-tested execution in megawatt-scale clean energy,
            precision mechanical engineering, and cutting-edge software
            architecture with global reach.
          </p>
        </div>

        {/* Founder 1: Dominik Masek (Image 3) */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left: Portrait & Details */}
          <div className="flex flex-col items-center lg:col-span-4 lg:items-start">
            <div className="group relative aspect-4/5 w-full max-w-[280px] overflow-hidden rounded-2xl border border-black/10 bg-zinc-100 sm:max-w-[320px] shadow-sm">
              <img
                src="/img/founders/dominik-portrait.jpg"
                alt="Dominik Masek"
                className="h-full w-full object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-xs font-semibold tracking-wider uppercase text-white/90">
                  FOUNDER & CEO
                </div>
                <div className="text-xs font-light text-white/70">
                  Treetino Co-Founder
                </div>
              </div>
            </div>

            {/* Founder Location */}
            <div className="mt-4 flex w-full max-w-[280px] items-center justify-between sm:max-w-[320px]">
              <span className="text-xs font-medium text-black/60">
                Prague, Czech Republic
              </span>
              <span className="font-mono text-xs text-sky-700 font-semibold">
                Treetino Corp s.r.o.
              </span>
            </div>
          </div>

          {/* Right: Biography & Verified Track Record */}
          <div className="flex flex-col justify-between lg:col-span-8">
            <div className="space-y-6">
              <div className="border-l-2 border-[#183d89] pl-4">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#183d89]">
                  FOUNDER & CEO
                </span>
                <h3 className="mt-1 text-3xl sm:text-4xl font-bold text-black tracking-tight">
                  Dominik Masek
                </h3>
                <p className="mt-1 font-mono text-xs text-black/60 uppercase tracking-wider">
                  CLEANTECH ENTREPRENEUR • 23+ MW SOLAR DELIVERED • MECHANICAL
                  ENGINEERING & ENERGY
                </p>
              </div>

              <p className="text-base sm:text-lg leading-relaxed text-black/75 font-light">
                Over 5 years in the clean energy market, combining mechanical
                engineering education, 5 years of manufacturing practice, and 7
                years managing engineering teams and complex installations. With
                an established network of energy producers across Central
                Europe, he drives Treetino’s executive expansion and tokenized
                hardware rollout.
              </p>

              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-black/50">
                  KEY DOMAIN FOCUS AT TREETINO:
                </span>
                <p className="mt-1 text-xs sm:text-sm text-black/70 font-mono">
                  Utility Wind Energy • BIPV Architectural Solar • Industrial
                  Manufacturing • Project Finance
                </p>
              </div>
            </div>

            {/* Big Statistics Ribbon (Image 3) */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-black/10 pt-8">
              <div>
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-light text-black tracking-tight">
                  23+ MW
                </span>
                <span className="mt-1 block font-mono text-[11px] sm:text-xs text-black/60 uppercase">
                  SOLAR CAPACITY DELIVERED (WATTINO)
                </span>
              </div>

              <div>
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-light text-black tracking-tight">
                  5+ Years
                </span>
                <span className="mt-1 block font-mono text-[11px] sm:text-xs text-black/60 uppercase">
                  WIND ENERGY & EU REGULATIONS
                </span>
              </div>

              <div>
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-light text-black tracking-tight">
                  7+ Years
                </span>
                <span className="mt-1 block font-mono text-[11px] sm:text-xs text-black/60 uppercase">
                  ENGINEERING LEADERSHIP & INSTALLATIONS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
