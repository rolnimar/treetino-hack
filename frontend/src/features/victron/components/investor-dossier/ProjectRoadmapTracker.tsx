import type { ProjectRoadmapStep } from '../../types/investor-dossier';

interface ProjectRoadmapTrackerProps {
  steps: ProjectRoadmapStep[];
  title?: string;
  subtitle?: string;
}

export function ProjectRoadmapTracker({
  steps,
  title = 'Structured Project Execution Roadmap',
  subtitle = 'Sequential milestone tracker from initial feasibility studies, permitting, and grid agreements to civil installation, commissioning, and full commercial operations.',
}: ProjectRoadmapTrackerProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER */}
      <div className="border-b border-black/10 pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
            Project Execution & Engineering Roadmap
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* 2. STEPPER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';

          return (
            <div
              key={step.step}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-xs transition ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50/60 text-zinc-900 shadow-2xs'
                  : isInProgress
                    ? 'border-t-blue bg-t-blue/5 text-zinc-950 shadow-xs ring-1 ring-t-blue/30'
                    : 'border-black/10 bg-zinc-50/60 text-zinc-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-[11px] text-zinc-400">
                    {step.step < 10 ? `0${step.step}` : step.step}.
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-200 text-emerald-900'
                        : isInProgress
                          ? 'bg-t-blue text-white animate-pulse'
                          : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {isCompleted
                      ? 'COMPLETED'
                      : isInProgress
                        ? 'IN PROGRESS'
                        : 'UPCOMING'}
                  </span>
                </div>

                <div className="font-bold text-xs text-zinc-950 leading-snug">
                  {step.code}
                </div>
                <div className="mt-1 text-[11px] text-zinc-600 leading-tight">
                  {step.title}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-black/5 text-[10px] text-zinc-500 line-clamp-3">
                {step.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. FOOTER SUMMARY */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-2 border-t border-black/5">
        <span className="font-medium text-zinc-700">
          Current Status:{' '}
          <strong className="text-t-blue">
            Civil works, EPC hardware procurement, and Victron SCADA telemetry
            integration active
          </strong>
        </span>
        <span className="font-mono text-zinc-400">
          Turnkey verification & milestone audits enforced on-chain
        </span>
      </div>
    </div>
  );
}
