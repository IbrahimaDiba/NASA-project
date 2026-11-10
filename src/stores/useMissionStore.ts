// ============================================================================
// Lunar Horizon — Global Mission State Management (Zustand)
// ============================================================================

import { create } from 'zustand';
import { LunarSite } from '../types';
import { SITES } from '../data/sites';

interface MissionState {
  // Current active site & date
  selectedSite: LunarSite;
  selectedDate: string;
  simulationDurationHours: number;
  missionName: string;

  // Comparison scenarios
  comparisonSiteIds: string[];

  // App settings & view preferences
  theme: 'dark' | 'light';
  dataMode: 'nasa-dem' | 'synthetic';
  isSidebarCollapsed: boolean;

  // Actions
  setSelectedSite: (site: LunarSite) => void;
  setSelectedDate: (date: string) => void;
  setSimulationDurationHours: (hours: number) => void;
  setMissionName: (name: string) => void;
  toggleComparisonSite: (siteId: string) => void;
  setComparisonSiteIds: (ids: string[]) => void;
  setDataMode: (mode: 'nasa-dem' | 'synthetic') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  selectedSite: SITES[1], // Malapert Massif (highest South Pole peak, rich elevation data)
  selectedDate: '2026-11-20T12:00',
  simulationDurationHours: 48,
  missionName: 'CLPS Mission Nova-C / Artemis Polar Recon',
  comparisonSiteIds: ['malapert-massif', 'shackleton-connecting-ridge', 'nobile-rim-1'],
  theme: 'light',
  dataMode: 'nasa-dem',
  isSidebarCollapsed: false,

  setSelectedSite: (site) => set({ selectedSite: site }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSimulationDurationHours: (hours) => set({ simulationDurationHours: hours }),
  setMissionName: (name) => set({ missionName: name }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  toggleComparisonSite: (siteId) =>
    set((state) => {
      const exists = state.comparisonSiteIds.includes(siteId);
      if (exists) {
        if (state.comparisonSiteIds.length <= 1) return state; // Keep at least one
        return { comparisonSiteIds: state.comparisonSiteIds.filter((id) => id !== siteId) };
      } else {
        if (state.comparisonSiteIds.length >= 4) return state; // Limit max 4
        return { comparisonSiteIds: [...state.comparisonSiteIds, siteId] };
      }
    }),

  setComparisonSiteIds: (ids) => set({ comparisonSiteIds: ids }),
  setDataMode: (mode) => set({ dataMode: mode }),
}));
