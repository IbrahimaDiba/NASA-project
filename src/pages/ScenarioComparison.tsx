// ============================================================================
// Lunar Horizon — Page 4: Scenario Comparison
// Compare candidate landing sites and dates side-by-side
// ============================================================================

import React, { useMemo } from 'react';
import { GitCompare, Plus, Trash2, Check, X, ShieldAlert, Zap, Radio, Mountain } from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';
import { SITES, formatCoordinates } from '../data/sites';
import { getMissionMetrics } from '../data/solar-data';
import { formatDegrees, formatPercent, formatElevation } from '../utils/formatters';

export default function ScenarioComparison() {
  const { comparisonSiteIds, toggleComparisonSite, selectedDate } = useMissionStore();

  const comparedSites = useMemo(() => {
    return comparisonSiteIds
      .map((id) => SITES.find((s) => s.id === id))
      .filter((s): s is (typeof SITES)[0] => !!s);
  }, [comparisonSiteIds]);

  const candidateSites = useMemo(() => {
    return SITES.filter((s) => !comparisonSiteIds.includes(s.id));
  }, [comparisonSiteIds]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Landing Site Scenario Comparison</h2>
          <p className="page-subtitle">
            Evaluate illumination windows, direct-to-Earth link margins, and topographic hazards across candidate sites.
          </p>
        </div>

        {/* Add Candidate Dropdown */}
        {candidateSites.length > 0 && comparisonSiteIds.length < 4 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#64748B]">Add Site to Matrix:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  toggleComparisonSite(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] outline-none cursor-pointer shadow-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select candidate site…
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

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {comparedSites.map((site) => {
          const metrics = getMissionMetrics(selectedDate, site);

          return (
            <div key={site.id} className="card relative flex flex-col justify-between border-2 border-[#E2E8F0] hover:border-[#0F172A]">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="badge badge-demo text-[9px]">{site.category}</span>
                  {comparisonSiteIds.length > 1 && (
                    <button
                      onClick={() => toggleComparisonSite(site.id)}
                      className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                      title="Remove from comparison"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-[#0F172A] leading-snug">
                  {site.name}
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {formatCoordinates(site.lat, site.lon)}
                </p>

                {/* LOLA Elevation Banner */}
                <div className="mt-3 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] font-semibold flex items-center gap-1">
                    <Mountain size={13} className="text-[#0F172A]" /> NASA Elevation:
                  </span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {formatElevation(site.elevation)}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 space-y-2 text-[12px]">
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Solar Elevation</span>
                    <span className="font-mono font-bold text-[#E8A838]">
                      {formatDegrees(metrics.solarElevation)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Power Availability</span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {metrics.powerAvailabilityPct}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Earth Elevation</span>
                    <span className="font-mono font-bold text-[#2563EB]">
                      {formatDegrees(metrics.earthElevation)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">DTE Direct Visibility</span>
                    <span className="font-bold">
                      {metrics.earthVisibility ? (
                        <span className="text-[#16A34A] flex items-center gap-1">
                          <Check size={13} /> Continuous
                        </span>
                      ) : (
                        <span className="text-[#DC2626] flex items-center gap-1">
                          <X size={13} /> Blocked
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Water Ice Potential</span>
                    <span className="font-bold text-[#0F172A]">{site.waterIcePotential || 'Medium'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Terrain Safety Score</span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {metrics.terrainSuitabilityScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                  {site.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
