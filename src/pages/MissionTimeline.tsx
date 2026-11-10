// ============================================================================
// Lunar Horizon — Page 5: Mission Timeline
// Interactive timeline of illumination & direct-to-Earth communication windows
// ============================================================================

import React, { useMemo } from 'react';
import { Clock, Sun, Radio, BatteryCharging, AlertCircle } from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';
import { generateHourlyData } from '../data/solar-data';

export default function MissionTimeline() {
  const { selectedSite, selectedDate } = useMissionStore();

  const hourlyData = useMemo(
    () => generateHourlyData(selectedDate, selectedSite, 72),
    [selectedDate, selectedSite]
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1550px] mx-auto">
      <div>
        <h2 className="page-title">Mission Operations Timeline</h2>
        <p className="page-subtitle">
          Hour-by-hour operational phases, solar array power output, and communication visibility for {selectedSite.name}.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#0F172A]" />
            <h3 className="text-sm font-bold text-[#0F172A]">72-Hour Sequential Operational Phase Matrix</h3>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" /> Continuous Power & Comm
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" /> Low Sun Angle
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Shadow / Quiescent
            </span>
          </div>
        </div>

        {/* Timeline Bar visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {hourlyData.map((slot, idx) => {
            const isPowerOk = slot.powerOutputWatts > 150;
            const isCommOk = slot.commBandwidthMbps > 0.5;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-[11px] transition-all ${
                  isPowerOk && isCommOk
                    ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                    : isPowerOk
                    ? 'bg-[#FEFCE8] border-[#FEF08A]'
                    : 'bg-[#FEF2F2] border-[#FECACA]'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <span className="font-mono text-[#0F172A]">{slot.time}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${
                      isPowerOk && isCommOk
                        ? 'bg-[#22C55E] text-white'
                        : isPowerOk
                        ? 'bg-[#EAB308] text-white'
                        : 'bg-[#EF4444] text-white'
                    }`}
                  >
                    {isPowerOk && isCommOk ? 'Nominal' : isPowerOk ? 'Comm Marginal' : 'Shadow'}
                  </span>
                </div>

                <div className="space-y-1 text-[#475569]">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Sun size={11} className="text-[#E8A838]" /> Sun Elevation:
                    </span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {slot.solarElevation > 0 ? `+${slot.solarElevation}°` : `${slot.solarElevation}°`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Radio size={11} className="text-[#2563EB]" /> Comm Link:
                    </span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {slot.commBandwidthMbps} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <BatteryCharging size={11} className="text-[#0F172A]" /> Array Flux:
                    </span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {slot.powerOutputWatts} W
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
