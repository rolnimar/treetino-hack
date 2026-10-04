import type { VictronWaterfallStep } from '../victron-types';

export interface CommercialDossierDetail {
  label: string;
  value: string;
  subtext?: string;
}

export interface CashFlowDossierProps {
  offTakerTitle: string;
  offTakerBadge?: string;
  offTakerDescription: string;
  keyDetails?: CommercialDossierDetail[];
  grossRevenueTitle: string;
  waterfallSteps: VictronWaterfallStep[];
}

export function CashFlowDossier({
  offTakerTitle,
  offTakerBadge = 'Commercial Off-Taker',
  offTakerDescription,
  keyDetails = [],
  grossRevenueTitle,
  waterfallSteps,
}: CashFlowDossierProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Off-Taker / Commercial Counterparty Profile */}
      <div className="rounded-xl border border-forest/15 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-forest/10 pb-3">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Commercial Counterparty & Demand
            </span>
            <h4 className="text-lg font-extrabold text-forest">
              {offTakerTitle}
            </h4>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-300">
            {offTakerBadge}
          </span>
        </div>

        <p className="text-xs text-forest/70 leading-relaxed">
          {offTakerDescription}
        </p>

        {keyDetails.length > 0 && (
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {keyDetails.map((item, idx) => (
              <div key={idx} className="rounded-lg bg-forest/5 p-3">
                <span className="text-forest/60 text-[10px]">{item.label}</span>
                <div className="font-black text-forest text-sm mt-0.5">
                  {item.value}
                </div>
                {item.subtext && (
                  <span className="text-forest/60 text-[10px] block mt-0.5">
                    {item.subtext}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Transparent Investor Cash Flow Waterfall */}
      <div className="rounded-xl border border-forest/15 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-forest/10 pb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Tokenized Cash Flow Waterfall
          </span>
          <h4 className="text-lg font-extrabold text-forest">
            {grossRevenueTitle}
          </h4>
        </div>

        <div className="space-y-2.5">
          {waterfallSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-forest/10 bg-cream/30 p-2.5 text-xs font-mono"
            >
              <div>
                <span className="font-bold text-forest">{step.title}</span>
                <div className="text-[11px] text-forest/60">
                  {step.description}
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-900">
                  {step.amount}
                </span>
                <div className="text-[10px] text-forest/50 font-bold">
                  {step.percentage}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
