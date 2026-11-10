// ============================================================================
// Lunar Horizon — Page 4: Scenario & Launch Slip Trade-off Matrix
// Evaluates alternative landing sites in the same region, alternative dates for the
// same site (launch slip delays), and custom mission contingency scenarios.
// Pure White Primary Interface (#FFFFFF) with solid Black Buttons (#000000).
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  Plus,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Zap,
  Radio,
  Mountain,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useMissionStore } from '../stores/useMissionStore';
import { SITES, formatCoordinates } from '../data/sites';
import { getMissionMetrics } from '../data/solar-data';
import { formatDegrees, formatPercent, formatElevation } from '../utils/formatters';
import type { LunarSite } from '../types';

interface CustomScenario {
  id: string;
  name: string;
  site: LunarSite;
  date: string;
  isBaseline?: boolean;
}

export default function ScenarioComparison() {
  const {
    comparisonSiteIds,
    toggleComparisonSite,
    selectedSite,
    setSelectedSite,
    selectedDate,
    setSelectedDate,
  } = useMissionStore();

  // Mode: 'sites' (alternative sites) | 'dates' (launch slip on same site) | 'custom' (multi-variable matrix)
  const [comparisonMode, setComparisonMode] = useState<'sites' | 'dates' | 'custom'>('sites');

  // Launch delay presets relative to selectedDate
  const slipDelays = [
    { label: 'Baseline (T0)', days: 0, desc: 'Original target launch window' },
    { label: '+14 Days Slip', days: 14, desc: 'Half-lunation (polar illumination reversal)' },
    { label: '+29.5 Days Slip', days: 29.5, desc: '1 Synodic Month (next illumination cycle)' },
    { label: '+90 Days Slip', days: 90, desc: 'Quarter-year seasonal shift' },
  ];

  // Custom multi-scenario list
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([
    {
      id: 'sc-1',
      name: 'Plan A (Baseline)',
      site: SITES[1], // Malapert Massif
      date: '2026-11-20T12:00',
      isBaseline: true,
    },
    {
      id: 'sc-2',
      name: 'Plan B (1-Month Slip)',
      site: SITES[1], // Malapert Massif
      date: '2026-12-20T00:00',
    },
    {
      id: 'sc-3',
      name: 'Plan C (Regional Alt: Shackleton)',
      site: SITES[0], // Shackleton Ridge
      date: '2026-12-20T00:00',
    },
  ]);

  const [newScenarioSiteId, setNewScenarioSiteId] = useState<string>(SITES[0].id);
  const [newScenarioDate, setNewScenarioDate] = useState<string>('2027-01-15T12:00');
  const [newScenarioName, setNewScenarioName] = useState<string>('Contingency Plan D');

  // Compared sites for 'sites' mode
  const comparedSites = useMemo(() => {
    return comparisonSiteIds
      .map((id) => SITES.find((s) => s.id === id))
      .filter((s): s is (typeof SITES)[0] => !!s);
  }, [comparisonSiteIds]);

  const candidateSites = useMemo(() => {
    return SITES.filter((s) => !comparisonSiteIds.includes(s.id));
  }, [comparisonSiteIds]);

  // Add custom scenario
  const handleAddCustomScenario = () => {
    const site = SITES.find((s) => s.id === newScenarioSiteId) || SITES[0];
    const newSc: CustomScenario = {
      id: `sc-${Date.now()}`,
      name: newScenarioName || `Scenario ${customScenarios.length + 1}`,
      site,
      date: newScenarioDate,
    };
    setCustomScenarios([...customScenarios, newSc]);
  };

  const removeCustomScenario = (id: string) => {
    if (customScenarios.length <= 1) return;
    setCustomScenarios(customScenarios.filter((s) => s.id !== id));
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* ================================================================== */}
      {/* 1. Header with Mode Selector                                       */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-black text-[#0F172A] tracking-tight">
              Mission Contingency & Scenario Trade-off Matrix
            </h2>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#000000] text-white uppercase">
              NASA Trade Study
            </span>
          </div>
          <p className="text-[12.5px] text-[#64748B] mt-1 max-w-3xl leading-relaxed">
            Rapidly evaluate alternative landing sites in the same region, or alternative dates at the same site,
            to understand how launch slips and hardware schedule shifts impact mission feasibility.
          </p>
        </div>

        {/* Mode Switcher Tabs (Fond Blanc, Boutons Noirs) */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#CBD5E1] p-1 rounded-2xl shadow-sm shrink-0">
          <button
            onClick={() => setComparisonMode('sites')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 ${
              comparisonMode === 'sites'
                ? 'bg-[#000000] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Mountain size={13} />
            <span>Alternative Sites</span>
          </button>

          <button
            onClick={() => setComparisonMode('dates')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 ${
              comparisonMode === 'dates'
                ? 'bg-[#000000] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Clock size={13} />
            <span>Launch Slip Delays</span>
          </button>

          <button
            onClick={() => setComparisonMode('custom')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 ${
              comparisonMode === 'custom'
                ? 'bg-[#000000] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <GitCompare size={13} />
            <span>Multi-Variable Matrix</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODE 1: ALTERNATIVE SITES (Same Date)                              */}
      {/* ================================================================== */}
      {comparisonMode === 'sites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#64748B]">
              Fixed Evaluation Date: <strong className="text-[#0F172A] font-mono">{selectedDate.replace('T', ' ')} UTC</strong>
            </div>

            {candidateSites.length > 0 && comparisonSiteIds.length < 4 && (
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-bold text-[#64748B]">Add Regional Target:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleComparisonSite(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-[#0F172A] outline-none cursor-pointer shadow-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select candidate landing site…
                  </option>
                  {candidateSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCoordinates(s.lat, s.lon, 1)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {comparedSites.map((site) => {
              const metrics = getMissionMetrics(selectedDate, site);
              const isCurrent = site.id === selectedSite.id;

              return (
                <div
                  key={site.id}
                  className={`bg-[#FFFFFF] border-2 rounded-2xl p-4 shadow-sm relative flex flex-col justify-between transition-all ${
                    isCurrent ? 'border-[#000000] ring-2 ring-[#000000]/10' : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-[#F1F5F9] text-[#475569] uppercase">
                        {site.category}
                      </span>
                      {comparisonSiteIds.length > 1 && (
                        <button
                          onClick={() => toggleComparisonSite(site.id)}
                          className="w-6 h-6 rounded-lg bg-[#000000] text-white flex items-center justify-center hover:bg-[#EF4444] transition-colors shadow-sm"
                          title="Remove site from matrix"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A] leading-snug">
                      {site.name}
                    </h3>
                    <p className="text-[10.5px] text-[#64748B] mt-0.5 font-mono">
                      {formatCoordinates(site.lat, site.lon, 1)}
                    </p>

                    {/* Topography Badge */}
                    <div className="mt-3 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B] font-bold flex items-center gap-1.5">
                        <Mountain size={13} className="text-[#000000]" /> Altitude LOLA:
                      </span>
                      <span className="font-mono font-black text-[#0F172A]">
                        {formatElevation(site.elevation)}
                      </span>
                    </div>

                    {/* Metric Breakdown Table */}
                    <div className="mt-4 space-y-2 text-[11.5px]">
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Solar Elevation</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {formatDegrees(metrics.solarElevation)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Power Viability</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {metrics.powerAvailabilityPct}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Earth Link (DTE)</span>
                        <span className="font-bold flex items-center gap-1">
                          {metrics.earthVisibility ? (
                            <span className="text-[#16A34A] flex items-center gap-1">
                              <Check size={12} /> Continuous
                            </span>
                          ) : (
                            <span className="text-[#DC2626] flex items-center gap-1">
                              <X size={12} /> Obstructed
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Terrain Safety Score</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {metrics.terrainSuitabilityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => setSelectedSite(site)}
                      className={`w-full py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
                        isCurrent
                          ? 'bg-[#000000] text-white shadow-md'
                          : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#000000] hover:text-white border border-[#CBD5E1]'
                      }`}
                    >
                      {isCurrent ? '✓ Active Selected Target' : 'Set as Active Target'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODE 2: LAUNCH SLIP & DATE SHIFT ANALYSIS (Same Site)              */}
      {/* ================================================================== */}
      {comparisonMode === 'dates' && (
        <div className="space-y-4">
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] block">
                Target Under Schedule Stress Test
              </span>
              <h3 className="text-base font-black text-[#0F172A]">
                {selectedSite.name} ({formatCoordinates(selectedSite.lat, selectedSite.lon, 1)})
              </h3>
            </div>
            <div className="text-[11.5px] text-[#64748B]">
              LOLA Elevation: <strong className="text-[#0F172A] font-mono">{formatElevation(selectedSite.elevation)}</strong> · Baseline: <strong className="text-[#0F172A] font-mono">{selectedDate}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {slipDelays.map((slip) => {
              const baseTime = new Date(selectedDate).getTime();
              const slippedTime = new Date(baseTime + slip.days * 86400 * 1000);
              const slippedIso = slippedTime.toISOString().slice(0, 16);
              const metrics = getMissionMetrics(slippedIso, selectedSite);
              const baselineMetrics = getMissionMetrics(selectedDate, selectedSite);
              const powerDelta = metrics.powerAvailabilityPct - baselineMetrics.powerAvailabilityPct;

              return (
                <div
                  key={slip.label}
                  className="bg-[#FFFFFF] border-2 border-[#E2E8F0] hover:border-[#000000] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-[#000000] text-white uppercase">
                        {slip.label}
                      </span>
                      <span className="text-[9px] font-mono text-[#64748B]">
                        {slippedTime.toISOString().slice(0, 10)}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-[#0F172A]">{slippedIso.replace('T', ' ')} UTC</h4>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-snug">{slip.desc}</p>

                    {/* Solar Angle & Delta */}
                    <div className="mt-4 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B] font-bold">Solar Elevation:</span>
                      <span className="font-mono font-black text-[#0F172A]">
                        {formatDegrees(metrics.solarElevation)}
                      </span>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="mt-3 space-y-2 text-[11.5px]">
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Power Availability</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[#0F172A]">{metrics.powerAvailabilityPct}%</span>
                          {slip.days > 0 && (
                            <span
                              className={`text-[9.5px] font-bold font-mono ${
                                powerDelta >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              ({powerDelta >= 0 ? `+${powerDelta}` : powerDelta}%)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Earth DTE Link</span>
                        <span className="font-bold">
                          {metrics.earthVisibility ? (
                            <span className="text-[#16A34A] flex items-center gap-1">
                              <Check size={12} /> Viable ({metrics.earthElevation.toFixed(1)}°)
                            </span>
                          ) : (
                            <span className="text-[#DC2626] flex items-center gap-1">
                              <X size={12} /> Obstructed
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Feasibility Score</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {metrics.terrainSuitabilityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => setSelectedDate(slippedIso)}
                      className="w-full py-2 bg-[#000000] text-white hover:bg-[#1E293B] rounded-xl text-[11px] font-bold transition-all shadow-sm"
                    >
                      Apply This Slip Date
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODE 3: MULTI-VARIABLE SCENARIO TRADE STUDY (Custom Site + Date)    */}
      {/* ================================================================== */}
      {comparisonMode === 'custom' && (
        <div className="space-y-6">
          {/* Add Custom Scenario Form */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-2xl flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[9.5px] font-mono font-bold text-[#64748B] uppercase mb-1">
                Contingency Scenario Name
              </label>
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-[#0F172A] outline-none"
                placeholder="e.g. Malapert Q1 Backup"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[9.5px] font-mono font-bold text-[#64748B] uppercase mb-1">
                Alternative Landing Site
              </label>
              <select
                value={newScenarioSiteId}
                onChange={(e) => setNewScenarioSiteId(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-[#0F172A] outline-none cursor-pointer"
              >
                {SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatElevation(s.elevation)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-[9.5px] font-mono font-bold text-[#64748B] uppercase mb-1">
                Alternative Target Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={newScenarioDate}
                onChange={(e) => setNewScenarioDate(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-[11.5px] font-mono font-bold text-[#0F172A] outline-none"
              />
            </div>

            <button
              onClick={handleAddCustomScenario}
              className="bg-[#000000] text-white hover:bg-[#1E293B] px-4 py-2 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={13} />
              <span>Add to Matrix</span>
            </button>
          </div>

          {/* Scenario Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {customScenarios.map((sc) => {
              const metrics = getMissionMetrics(sc.date, sc.site);

              return (
                <div
                  key={sc.id}
                  className="bg-[#FFFFFF] border-2 border-[#E2E8F0] hover:border-[#000000] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-[#000000] text-white uppercase">
                        {sc.name}
                      </span>
                      {customScenarios.length > 1 && (
                        <button
                          onClick={() => removeCustomScenario(sc.id)}
                          className="w-6 h-6 rounded-lg bg-[#000000] text-white flex items-center justify-center hover:bg-[#EF4444] transition-colors shadow-sm"
                          title="Remove scenario"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A] leading-snug">{sc.site.name}</h3>
                    <p className="text-[10.5px] text-[#64748B] font-mono mt-0.5">
                      Date: <strong className="text-[#0F172A]">{sc.date.replace('T', ' ')} UTC</strong>
                    </p>

                    <div className="mt-3 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B] font-bold">Altitude LOLA:</span>
                      <span className="font-mono font-black text-[#0F172A]">
                        {formatElevation(sc.site.elevation)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-[11.5px]">
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Solar Elevation</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {formatDegrees(metrics.solarElevation)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Power Viability</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {metrics.powerAvailabilityPct}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Earth DTE Link</span>
                        <span className="font-bold">
                          {metrics.earthVisibility ? (
                            <span className="text-[#16A34A] flex items-center gap-1">
                              <Check size={12} /> Continuous ({metrics.earthElevation.toFixed(1)}°)
                            </span>
                          ) : (
                            <span className="text-[#DC2626] flex items-center gap-1">
                              <X size={12} /> Obstructed
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                        <span className="text-[#64748B]">Feasibility Score</span>
                        <span className="font-mono font-black text-[#0F172A]">
                          {metrics.terrainSuitabilityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setSelectedSite(sc.site);
                        setSelectedDate(sc.date);
                      }}
                      className="w-full py-2 bg-[#000000] text-white hover:bg-[#1E293B] rounded-xl text-[11px] font-bold transition-all shadow-sm"
                    >
                      Adopt Scenario as Mission Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
