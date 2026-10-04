import type { ReactNode } from 'react';
import type { VictronDemoItem } from '../victron-types';
import { CloudIcon } from '../victron-icons';

export interface TelemetrySidepanelProps {
  demo: VictronDemoItem;
  specialtyTitle?: string;
  specialtyBadge?: string;
  specialtyContent?: ReactNode;
}

export function TelemetrySidepanel({
  demo,
  specialtyTitle,
  specialtyBadge,
  specialtyContent,
}: TelemetrySidepanelProps) {
  const { location, liveWeather, systemInfo } = demo;

  const gateway = demo.devices.find(
    (d) =>
      d.deviceType === 'gateway' ||
      d.name.toLowerCase().includes('gateway') ||
      d.productName.toLowerCase().includes('cerbo'),
  );
  const gatewayName = gateway
    ? gateway.productName || gateway.name
    : 'Cerbo GX';

  return (
    <aside
      aria-label="Site Telemetry and Climate Diagnostics"
      className="h-full rounded-2xl border-2 border-forest/20 bg-[#ece8dc]/95 p-4 shadow-sm flex flex-col justify-between text-forest space-y-4"
    >
      {/* 1. TELEMETRY HEADER */}
      <div className="border-b border-forest/15 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-forest/90 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Telemetry
          </span>
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-forest uppercase tracking-wider">
            Uncoupled
          </span>
        </div>
        <p className="text-[11px] text-forest/70 mt-1 font-medium">
          Environmental & Venus OS Diagnostics
        </p>
      </div>

      <div className="space-y-3.5 flex-1">
        {/* 2. ARCHETYPE SPECIALTY COMPONENT (Modular per site) */}
        {specialtyContent && (
          <div className="rounded-xl border border-forest/15 bg-white/95 p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-forest">
                {specialtyTitle || 'Site Diagnostic'}
              </span>
              {specialtyBadge && (
                <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[9px] text-emerald-800 font-bold border border-emerald-200">
                  {specialtyBadge}
                </span>
              )}
            </div>
            {specialtyContent}
          </div>
        )}

        {/* 3. REAL-TIME WEATHER STATION (Unified across all 4) */}
        <div className="rounded-xl border border-forest/15 bg-white/95 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-forest">
              <CloudIcon className="h-4 w-4 text-forest/70" />
              Weather Station
            </span>
            <span className="font-mono text-[10px] text-forest/60">
              Open-Meteo Live
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-forest font-mono">
              {liveWeather?.tempCelsius ?? 17} °C
            </span>
            <span className="font-mono text-xs font-semibold text-forest/80">
              {liveWeather?.condition ?? 'Partly Cloudy'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-forest/10 pt-2 font-mono text-[10px] text-forest/70">
            <div>
              <span>Humidity: </span>
              <strong className="text-forest">
                {liveWeather?.humidityPercent ?? 65}%
              </strong>
            </div>
            <div className="text-right">
              <span>Wind: </span>
              <strong className="text-forest">
                {liveWeather?.windSpeedKmh ?? 8.0} km/h
              </strong>
            </div>
          </div>
          <div className="text-[10px] text-forest/60 font-mono">
            {location.city}, {location.country}
          </div>
        </div>

        {/* 4. CERBO GX & VENUS OS CONNECTIVITY (Unified across all 4) */}
        <div className="rounded-xl border border-forest/15 bg-white/95 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-forest">Cerbo GX Gateway</span>
            <span className="rounded bg-forest/5 px-2 py-0.5 font-mono text-[9px] text-forest/70 font-bold">
              {systemInfo.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-forest/80">
            <div>
              <span className="text-forest/60">Hardware:</span>
              <div
                className="font-bold text-forest truncate"
                title={gatewayName}
              >
                {gatewayName}
              </div>
            </div>
            <div>
              <span className="text-forest/60">Firmware:</span>
              <div className="font-bold text-forest truncate">
                {systemInfo.firmwareVersion}
              </div>
            </div>
            <div>
              <span className="text-forest/60">DBus RTT:</span>
              <div className="font-bold text-emerald-800">
                {systemInfo.dbusRtt}
              </div>
            </div>
            <div>
              <span className="text-forest/60">System Mode:</span>
              <div className="font-bold text-emerald-800 truncate">
                {systemInfo.systemState}
              </div>
            </div>
          </div>

          <div className="border-t border-forest/10 pt-1.5 font-mono text-[9px] text-forest/50 truncate">
            ID: {demo.identifier}
          </div>
        </div>
      </div>

      {/* 5. CONSOLE FOOTER */}
      <div className="text-center font-mono text-[9px] text-forest/60 border-t border-forest/15 pt-2">
        Venus OS · Real-Time Telemetry Node
      </div>
    </aside>
  );
}
