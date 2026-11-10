// ============================================================================
// Lunar Horizon — Page 1: Mission Overview
// Complete aerospace mission control dashboard
// ============================================================================

import React, { useMemo } from 'react';
import {
  Sun,
  Globe,
  Clock,
  BatteryCharging,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Mountain,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useMissionStore } from '../stores/useMissionStore';
import { SITES, formatCoordinates } from '../data/sites';
import { getMissionMetrics, generateHourlyData } from '../data/solar-data';
import { formatDegrees, formatPercent, formatDurationHours } from '../utils/formatters';

export default function MissionOverview() {
  const {
    selectedSite,
    setSelectedSite,
    selectedDate,
    setSelectedDate,
    simulationDurationHours,
    setSimulationDurationHours,
  } = useMissionStore();

  const metrics = useMemo(
    () => getMissionMetrics(selectedDate, selectedSite),
    [selectedDate, selectedSite]
  );

  const hourlyData = useMemo(
    () => generateHourlyData(selectedDate, selectedSite, simulationDurationHours),
    [selectedDate, selectedSite, simulationDurationHours]
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="page-title">Mission Overview</h2>
            <span className="badge badge-demo">Demonstration Data</span>
          </div>
          <p className="page-subtitle">
            Monitor lunar landing conditions, power feasibility, and direct-to-Earth operational readiness.
          </p>
        </div>

        {/* Mission Configuration Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] p-1.5 rounded-xl shadow-sm">
          {/* Site Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <Mountain size={13} className="text-[#0F172A]" />
            <select
              value={selectedSite.id}
              onChange={(e) => {
                const s = SITES.find((site) => site.id === e.target.value);
                if (s) setSelectedSite(s);
              }}
              className="bg-transparent border-none text-[12px] font-bold text-[#0F172A] outline-none cursor-pointer"
            >
              {SITES.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.lat > 0 ? '+' : ''}{site.lat.toFixed(1)}°)
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <Calendar size={13} className="text-[#0F172A]" />
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-[12px] font-mono font-bold text-[#0F172A] outline-none cursor-pointer"
            >
            </input>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <Clock size={13} className="text-[#0F172A]" />
            <select
              value={simulationDurationHours}
              onChange={(e) => setSimulationDurationHours(Number(e.target.value))}
              className="bg-transparent border-none text-[12px] font-semibold text-[#0F172A] outline-none cursor-pointer"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
              <option value={168}>7 Days (168h)</option>
              <option value={336}>14 Days (336h)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Six Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Solar Elevation */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Solar Elevation</span>
            <Sun size={15} className="text-[#E8A838]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0F172A]">
            {formatDegrees(metrics.solarElevation)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Azimuth:</span>
            <span className="font-mono font-semibold text-[#0F172A]">{metrics.sunAzimuth}°</span>
          </p>
        </div>

        {/* 2. Solar Illumination */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Solar Illumination</span>
            <BatteryCharging size={15} className="text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0F172A]">
            {formatPercent(metrics.solarIllumination)}
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#000000] h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics.solarIllumination}%` }}
            />
          </div>
        </div>

        {/* 3. Sunlight Duration */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Sunlight Duration</span>
            <Clock size={15} className="text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0F172A]">
            {formatDurationHours(metrics.sunlightDurationHours)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Polar Summer Peak Window
          </p>
        </div>

        {/* 4. Earth Elevation */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Earth Elevation</span>
            <Globe size={15} className="text-[#2563EB]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0F172A]">
            {formatDegrees(metrics.earthElevation)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Azimuth:</span>
            <span className="font-mono font-semibold text-[#0F172A]">{metrics.earthAzimuth}°</span>
          </p>
        </div>

        {/* 5. Earth Visibility */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Earth Visibility</span>
            <Radio size={15} className="text-[#0F172A]" />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                metrics.earthVisibility ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
              }`}
            />
            <span className="text-2xl font-black text-[#0F172A]">
              {metrics.earthVisibility ? 'Line-of-Sight' : 'Occluded'}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Direct-to-Earth (DTE) Link
          </p>
        </div>

        {/* 6. Next Sunset / Earthset */}
        <div className="card">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="section-label">Next Sunset</span>
            <Clock size={15} className="text-[#0F172A]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#0F172A]">
            {metrics.nextSunsetHours > 0 ? `+${metrics.nextSunsetHours} hrs` : 'Sun Below Rim'}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Earthset: {metrics.nextEarthsetHours ? `+${metrics.nextEarthsetHours} hrs` : 'Continuous'}
          </p>
        </div>
      </div>

      {/* Scientific Elevation Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Solar & Earth Elevation Over Time */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Solar & Earth Elevation Profiles Relative to Horizon
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Angle above local topographical horizon in degrees ({simulationDurationHours}h window)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8A838]" />
                <span>Sun</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span>Earth</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="°" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="solarElevation"
                  name="Solar Elevation"
                  stroke="#E8A838"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="earthElevation"
                  name="Earth Elevation"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Solar Illumination & Power Generation */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Solar Illumination & Estimated Power Output
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Effective array incident flux (Watts) and illumination timeline
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-demo text-[9px]">LOLA Altimeter Model</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="powerOutputWatts"
                  name="Power Output (W)"
                  stroke="#000000"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#powerGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Three Operational Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Power Availability */}
        <div className="card border-l-4 border-l-[#22C55E]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BatteryCharging size={18} className="text-[#0F172A]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Power Availability</h4>
            </div>
            <span className="badge badge-success text-[10px]">Optimal</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#0F172A]">
              {metrics.powerAvailabilityPct}%
            </span>
            <span className="text-[11px] text-[#64748B]">estimated operational efficiency</span>
          </div>
          <p className="text-[12px] text-[#475569] mt-2 leading-relaxed">
            Continuous grazing solar incidence allows vertical solar arrays to generate sufficient margin for lander payloads and battery recharge cycles.
          </p>
        </div>

        {/* 2. Communication Availability */}
        <div className="card border-l-4 border-l-[#2563EB]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-[#0F172A]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Communication Availability</h4>
            </div>
            <span className="badge badge-demo text-[10px]">Direct Link</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#0F172A]">
              {metrics.communicationQualityPct}%
            </span>
            <span className="text-[11px] text-[#64748B]">DTE link quality</span>
          </div>
          <p className="text-[12px] text-[#475569] mt-2 leading-relaxed">
            Direct-to-Earth line of sight is maintained with elevation above the 3.0° terrain obstruction threshold. Continuous high-rate X-band downlink viable.
          </p>
        </div>

        {/* 3. Terrain Suitability */}
        <div className="card border-l-4 border-l-[#000000]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Mountain size={18} className="text-[#0F172A]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Terrain Suitability</h4>
            </div>
            <span className="badge badge-demo text-[10px]">LOLA Verified</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-[#0F172A]">
              {metrics.terrainSuitabilityScore}/100
            </span>
            <span className="text-[11px] text-[#64748B]">slope & roughness index</span>
          </div>
          <p className="text-[12px] text-[#475569] mt-2 leading-relaxed">
            NASA LOLA DEM slope calculations demonstrate landing zone slopes below 8°, well within the structural safety limit of commercial lunar landers.
          </p>
        </div>
      </div>

      {/* Mission Summary Panel */}
      <div className="card bg-[#F8FAFC] border border-[#CBD5E1] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#0F172A]" />
            <h3 className="text-sm font-bold text-[#0F172A]">
              Mission Feasibility Summary — {selectedSite.name}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#64748B]">
            Coordinates: {formatCoordinates(selectedSite.lat, selectedSite.lon)}
          </span>
        </div>
        <p className="text-[12.5px] text-[#334155] leading-relaxed">
          {selectedSite.description} During the chosen simulation epoch ({selectedDate}), the site offers a solar elevation of{' '}
          <strong className="text-[#0F172A] font-mono">{formatDegrees(metrics.solarElevation)}</strong> and Earth elevation of{' '}
          <strong className="text-[#0F172A] font-mono">{formatDegrees(metrics.earthElevation)}</strong>. This configuration guarantees an uninterrupted communication window of over 48 hours and dependable solar power generation.
        </p>
      </div>
    </div>
  );
}
