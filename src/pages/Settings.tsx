// ============================================================================
// Lunar Horizon — Page 8: Settings
// Application configuration, unit choices, and rendering preferences
// ============================================================================

import React from 'react';
import { Settings as SettingsIcon, Monitor, Compass, Shield } from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';

export default function Settings() {
  const { missionName, setMissionName, simulationDurationHours, setSimulationDurationHours } =
    useMissionStore();

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h2 className="page-title">Settings & Mission Parameters</h2>
        <p className="page-subtitle">
          Configure active mission parameters, coordinate systems, and display preferences.
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Active Mission Identifier
          </label>
          <input
            type="text"
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
            className="input-field max-w-md text-[13px] font-semibold"
          />
          <p className="text-[11px] text-[#64748B] mt-1">
            Displayed across the navigation bar and generated mission assessment reports.
          </p>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Default Ephemeris Simulation Window
          </label>
          <select
            value={simulationDurationHours}
            onChange={(e) => setSimulationDurationHours(Number(e.target.value))}
            className="input-field max-w-xs text-[13px] font-semibold"
          >
            <option value={24}>24 Hours</option>
            <option value={48}>48 Hours (Recommended)</option>
            <option value={72}>72 Hours</option>
            <option value={168}>7 Days</option>
            <option value={336}>14 Days (Full Lunar Day)</option>
          </select>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Reference Lunar Spheroid
          </label>
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[12px] font-mono text-[#0F172A]">
            IAU/NASA Reference Radius: 1,737.4 km (LOLA Datum)
          </div>
        </div>
      </div>
    </div>
  );
}
