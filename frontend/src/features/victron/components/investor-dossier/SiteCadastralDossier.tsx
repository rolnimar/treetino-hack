import type { ProjectDossier } from '../../types/investor-dossier';

interface SiteCadastralDossierProps {
  dossier: ProjectDossier;
}

export function SiteCadastralDossier({ dossier }: SiteCadastralDossierProps) {
  const { meta, contracts } = dossier;

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER */}
      <div className="border-b border-black/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
            Site Analysis, Grid Interconnection & Zoning Clearance
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {meta.offTakerAgreementTitle ??
            `${meta.location} · Grid Interconnection Dossier`}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-3xl leading-relaxed">
          Strategic site positioning with secured legal agreements, utility
          interconnection approvals, and verified zoning compliance for{' '}
          {meta.projectName}.
        </p>
      </div>

      {/* 2. SIGNED CONNECTION CONTRACTS & OFF-TAKE AGREEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-800 uppercase tracking-wider">
              {contracts.phase1.name}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {contracts.phase1.capacity}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-zinc-950">
            {contracts.phase1.sopNumber}
          </div>
          <p className="text-xs text-zinc-600">
            Executed and legally binding off-take and grid interconnection
            agreement securing hardware operation rights and capacity.
          </p>
        </div>

        {contracts.phase2 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-emerald-800 uppercase tracking-wider">
                {contracts.phase2.name}
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                {contracts.phase2.capacity}
              </span>
            </div>
            <div className="font-mono text-lg font-bold text-zinc-950">
              {contracts.phase2.sopNumber}
            </div>
            <p className="text-xs text-zinc-600">
              Executed secondary agreement / expansion option providing
              multi-phase scalability and additional monetization channels.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-zinc-50/60 p-5 space-y-2">
            <span className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Single-Phase Turnkey Execution
            </span>
            <div className="font-mono text-lg font-bold text-zinc-950">
              Contracted Under Master PPA
            </div>
            <p className="text-xs text-zinc-600">
              Single-phase installation fully covered under current funding
              round with immediate commercial energization upon commissioning.
            </p>
          </div>
        )}
      </div>

      {/* 3. TECHNICAL SPECIFICATIONS & REGULATORY CLEARANCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-black/10 p-5 bg-zinc-50/60 space-y-3">
          <h4 className="font-bold text-sm text-zinc-950">
            Technical Interconnection Parameters
          </h4>
          <div className="space-y-2 text-xs divide-y divide-black/5">
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Grid Operator / Network:</span>
              <strong className="font-mono text-zinc-900">
                {meta.dsoName}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Voltage Level:</span>
              <strong className="font-mono text-zinc-900">
                {meta.voltageLevel}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Reserved Capacity / Rating:</span>
              <strong className="font-mono text-t-blue font-bold">
                {meta.capacityLabel}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Point of Interconnection:</span>
              <strong className="font-mono text-zinc-900">
                {meta.cadastralArea}
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Primary Partner / Host:</span>
              <span className="font-mono text-zinc-800">
                {meta.partnerCompany}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">SCADA & Inverter Controls:</span>
              <span className="text-zinc-800">
                Automated dynamic dispatch with sub-second telemetry logging
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 p-5 bg-zinc-50/60 space-y-3">
          <h4 className="font-bold text-sm text-zinc-950">
            Zoning, Environmental & Permitting Compliance
          </h4>
          <div className="space-y-2 text-xs divide-y divide-black/5">
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Zoning Plan Compliance:</span>
              <span className="text-emerald-700 font-bold">
                FULL COMPLIANCE (Permitted Energy Infrastructure)
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Environmental Permitting:</span>
              <span className="text-emerald-700 font-semibold">
                Classified Zero-Direct Emissions Installation
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Flood Hazard Assessment:</span>
              <strong className="text-emerald-700">
                100% Secure (Outside Flood Plains / Engineered Drainage)
              </strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Safety Clearances:</span>
              <span className="text-zinc-800">
                Complies with all statutory perimeter and electrical easements
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Acoustic Standards:</span>
              <span className="font-mono text-zinc-800">
                ≤ 40 dB(A) at property perimeter (Silent Solid-State & MagLev)
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-600">Civil & Foundation:</span>
              <span className="text-zinc-800">
                Engineered for minimal soil impact and rapid installation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STRATEGIC ADVANTAGE CALLOUT */}
      <div className="rounded-2xl border border-black/10 bg-zinc-950 text-white p-5 text-xs space-y-2">
        <span className="font-mono text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
          Strategic Location & Interconnection Advantage
        </span>
        <p className="text-zinc-300 leading-relaxed">
          Direct physical proximity to high-capacity electrical distribution
          nodes guarantees low transmission impedance, near-zero line losses,
          and unconstrained export/import capacity. Every kilowatt-hour
          generated or traded is verified cryptographically by on-site Victron
          SCADA oracles and reported transparently to protocol investors.
        </p>
      </div>
    </div>
  );
}
