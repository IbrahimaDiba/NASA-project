// ============================================================================
// Lunar Horizon — Aerospace Mission Control Sidebar Navigation
// Primary White aesthetic with Black buttons & active states
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  SunMedium,
  GitCompare,
  Clock,
  Sparkles,
  Database,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useMissionStore } from '../../stores/useMissionStore';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/explorer', label: 'Site Explorer', icon: Globe2 },
  { path: '/simulator', label: 'Sun & Earth 3D', icon: SunMedium },
  { path: '/comparison', label: 'Scenario Comparison', icon: GitCompare },
  { path: '/timeline', label: 'Mission Timeline', icon: Clock },
  { path: '/advisor', label: 'AI Advisor', icon: Sparkles },
  { path: '/data', label: 'Data & Sources', icon: Database },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useMissionStore();

  return (
    <aside
      className={`border-r border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out z-20 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        <div
          className={`px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] ${
            isSidebarCollapsed ? 'text-center' : ''
          }`}
        >
          {isSidebarCollapsed ? 'OPS' : 'Mission Control'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#000000] text-white shadow-sm'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon
                size={17}
                className="shrink-0 transition-transform group-hover:scale-110"
              />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Dataset Badge & Sidebar Toggle */}
      <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        {!isSidebarCollapsed ? (
          <div className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl text-[11px] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Shield size={13} className="text-[#000000]" />
                NASA Topography
              </span>
              <span className="font-mono text-[9px] bg-[#000000] text-white px-1.5 py-0.5 rounded font-bold">
                16 px/°
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] leading-tight">
              LOLA 16-bit DEM & LROC 4K mosaic calibrated.
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" title="NASA LOLA Calibrated" />
          </div>
        )}

        {/* Collapse / Expand Toggle Black Button */}
        <button
          onClick={toggleSidebar}
          className="mt-2 w-full py-1.5 flex items-center justify-center bg-[#000000] text-white hover:bg-[#1E293B] rounded-xl transition-colors text-[11px] shadow-sm"
          title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
