import { useState } from 'react';
import type { IntervalPoint } from '../report-chart-data';

const number = new Intl.NumberFormat('en', { maximumFractionDigits: 3 });
const time = (timestamp: string) =>
  new Date(Number(timestamp) * 1000).toISOString().slice(11, 16);

export function IntervalChart({
  title,
  unit,
  points,
}: {
  title: string;
  unit: string;
  points: IntervalPoint[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!points.length)
    return (
      <p className="text-xs text-forest/65">
        {title}: no interval readings were submitted.
      </p>
    );
  if (points.some(({ value }) => !Number.isFinite(value)))
    return (
      <p className="text-xs text-forest/65">{title}: chart data unavailable.</p>
    );
  const lower = points.reduce((min, point) => Math.min(min, point.value), 0);
  const upper = points.reduce((max, point) => Math.max(max, point.value), 0);
  const ceiling = upper === lower ? lower + 1 : upper;
  const span = ceiling - lower;
  const x = (index: number) =>
    points.length === 1 ? 300 : (index / (points.length - 1)) * 600;
  const y = (value: number) => 150 - ((value - lower) / span) * 140;
  const active = selected === null ? undefined : points[selected];
  const ticks = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ];
  return (
    <figure className="rounded-md border border-forest/15 bg-white/60 p-3">
      <figcaption className="mb-3 flex flex-wrap justify-between gap-2 text-xs">
        <span className="font-semibold">{title}</span>
        <span className="text-forest/65">
          {unit} · UTC · {points.length} intervals
        </span>
      </figcaption>
      <div className="relative pl-12">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 flex w-10 flex-col justify-between pb-2 text-right text-[10px] text-forest/65"
        >
          {[ceiling, lower + span / 2, lower].map((value, index) => (
            <span key={index}>{number.format(value)}</span>
          ))}
        </div>
        <svg
          role="img"
          aria-label={title}
          tabIndex={0}
          viewBox="0 0 600 160"
          preserveAspectRatio="none"
          className="h-40 w-full touch-pan-y outline-offset-2 focus-visible:outline-leaf"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setSelected(
              Math.max(
                0,
                Math.min(
                  points.length - 1,
                  Math.round(
                    ((event.clientX - bounds.left) / bounds.width) *
                      (points.length - 1),
                  ),
                ),
              ),
            );
          }}
          onPointerLeave={() => setSelected(null)}
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            setSelected(
              Math.max(
                0,
                Math.min(
                  points.length - 1,
                  Math.round(
                    ((event.clientX - bounds.left) / bounds.width) *
                      (points.length - 1),
                  ),
                ),
              ),
            );
          }}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
              return;
            event.preventDefault();
            setSelected(
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? points.length - 1
                  : Math.max(
                      0,
                      Math.min(
                        points.length - 1,
                        (selected ?? 0) + (event.key === 'ArrowRight' ? 1 : -1),
                      ),
                    ),
            );
          }}
          onBlur={() => setSelected(null)}
        >
          <desc>
            Values for each 15-minute interval. Use arrow keys to inspect exact
            timestamps and values. Range {number.format(lower)} to{' '}
            {number.format(upper)} {unit}.
          </desc>
          {[10, 80, 150].map((height) => (
            <line
              key={height}
              x1="0"
              x2="600"
              y1={height}
              y2={height}
              stroke="currentColor"
              className="text-forest/15"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {lower < 0 && (
            <line
              x1="0"
              x2="600"
              y1={y(0)}
              y2={y(0)}
              stroke="currentColor"
              className="text-forest/40"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={points
              .map((point, index) => `${x(index)},${y(point.value)}`)
              .join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-leaf"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {(active || points.length === 1) && (
            <circle
              cx={x(selected ?? 0)}
              cy={y((active ?? points[0]!).value)}
              r="4"
              fill="currentColor"
              className="text-forest"
            />
          )}
        </svg>
        <div
          aria-hidden="true"
          className="mt-1 flex justify-between text-[10px] text-forest/65"
        >
          {ticks.map((index) => (
            <span key={index}>{time(points[index]!.startTs)}</span>
          ))}
        </div>
      </div>
      <p role="status" className="mt-3 min-h-8 text-xs text-forest/75">
        {active
          ? `${new Date(Number(active.startTs) * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC · ${active.value} ${unit}`
          : 'Hover, tap, or use arrow keys to inspect an interval.'}
      </p>
    </figure>
  );
}
