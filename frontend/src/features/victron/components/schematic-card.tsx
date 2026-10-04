import type { ReactNode } from 'react';
import { Sparkline } from '../victron-icons';

export interface SchematicCardProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  accent?: 'amber' | 'sky' | 'emerald' | 'rose' | 'forest';
  icon: ReactNode;
  title: string;
  badge?: string;
  primaryValue: string;
  subtext?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  progressPercent?: number;
  footerLabel?: string;
  footerValue?: string;
  customContent?: ReactNode;
}

const ACCENT_STYLES = {
  amber: {
    border: 'border-amber-600/30',
    bg: 'bg-amber-50/50',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    primaryText: 'text-amber-950',
    subText: 'text-amber-700',
    footerBorder: 'border-amber-200/80',
    footerText: 'text-amber-950',
    progressBg: 'bg-amber-200',
    progressBar: 'bg-amber-600',
    defaultSparkline: '#d97706',
  },
  sky: {
    border: 'border-sky-600/30',
    bg: 'bg-sky-50/50',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    primaryText: 'text-sky-950',
    subText: 'text-sky-700',
    footerBorder: 'border-sky-200/80',
    footerText: 'text-sky-950',
    progressBg: 'bg-sky-200',
    progressBar: 'bg-sky-600',
    defaultSparkline: '#0284c7',
  },
  emerald: {
    border: 'border-emerald-600/30',
    bg: 'bg-emerald-50/50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    primaryText: 'text-emerald-950',
    subText: 'text-emerald-700',
    footerBorder: 'border-emerald-200/80',
    footerText: 'text-emerald-950',
    progressBg: 'bg-emerald-200',
    progressBar: 'bg-emerald-600',
    defaultSparkline: '#059669',
  },
  rose: {
    border: 'border-rose-600/30',
    bg: 'bg-rose-50/50',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    primaryText: 'text-rose-950',
    subText: 'text-rose-700',
    footerBorder: 'border-rose-200/80',
    footerText: 'text-rose-950',
    progressBg: 'bg-rose-200',
    progressBar: 'bg-rose-600',
    defaultSparkline: '#e11d48',
  },
  forest: {
    border: 'border-forest/15',
    bg: 'bg-white',
    badgeBg: 'bg-forest/5',
    badgeText: 'text-forest/70',
    primaryText: 'text-forest',
    subText: 'text-forest/60',
    footerBorder: 'border-forest/10',
    footerText: 'text-forest/70',
    progressBg: 'bg-forest/10',
    progressBar: 'bg-forest',
    defaultSparkline: '#173d2c',
  },
};

export function SchematicCard({
  x,
  y,
  width = 210,
  height = 160,
  accent = 'forest',
  icon,
  title,
  badge,
  primaryValue,
  subtext,
  sparklineData,
  sparklineColor,
  progressPercent,
  footerLabel,
  footerValue,
  customContent,
}: SchematicCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        className={`h-full w-full rounded-xl border ${styles.border} ${styles.bg} p-3.5 shadow-xs flex flex-col justify-between select-none`}
      >
        {/* Card Header Row */}
        <div className="flex items-center justify-between text-xs">
          <span
            className={`flex items-center gap-1.5 font-bold ${styles.primaryText}`}
          >
            {icon}
            {title}
          </span>
          {badge && (
            <span
              className={`rounded-sm ${styles.badgeBg} px-2 py-0.5 font-mono text-[10px] ${styles.badgeText} font-bold`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Card Body */}
        {customContent ? (
          customContent
        ) : (
          <div className="flex items-baseline justify-between">
            <div>
              <span
                className={`font-mono text-2xl font-extrabold ${styles.primaryText}`}
              >
                {primaryValue}
              </span>
              {subtext && (
                <p className={`text-[11px] ${styles.subText} mt-0.5`}>
                  {subtext}
                </p>
              )}
            </div>
            {sparklineData && sparklineData.length >= 2 && (
              <Sparkline
                data={sparklineData}
                color={sparklineColor || styles.defaultSparkline}
                width={50}
                height={20}
              />
            )}
          </div>
        )}

        {/* Progress Bar (if provided) */}
        {typeof progressPercent === 'number' && (
          <div className="space-y-1">
            <div
              className={`h-1.5 w-full overflow-hidden rounded-full ${styles.progressBg}`}
            >
              <div
                className={`h-full ${styles.progressBar} rounded-full transition-all duration-300`}
                style={{
                  width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Card Footer (if provided) */}
        {(footerLabel || footerValue) && (
          <div
            className={`border-t ${styles.footerBorder} pt-1.5 font-mono text-[10px] ${styles.footerText} flex items-center justify-between`}
          >
            <span>{footerLabel}</span>
            {footerValue && <strong>{footerValue}</strong>}
          </div>
        )}
      </div>
    </foreignObject>
  );
}
