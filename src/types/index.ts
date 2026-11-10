// ============================================================================
// Lunar Horizon — Core TypeScript Type Definitions
// ============================================================================

export type SiteCategory = 'clps' | 'artemis' | 'apollo' | 'international' | 'scientific';

export type SiteStatus = 'planned' | 'success' | 'poi' | 'candidate';

export interface LunarSite {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
  elevation: number; // in meters (NASA LOLA datum)
  category: SiteCategory;
  status: SiteStatus;
  description: string;
  targetDate?: string;
  primaryMission?: string;
  sunVisibilityPct?: number;
  earthVisibilityPct?: number;
  maxSolarElevation?: number;
  maxEarthElevation?: number;
  temperatureRangeK?: [number, number];
  waterIcePotential?: 'High' | 'Medium' | 'Low' | 'Negligible';
  simpleSummary?: string;
  significance?: string;
}

export interface MissionMetrics {
  solarElevation: number; // degrees
  solarIllumination: number; // percentage 0-100
  sunlightDurationHours: number;
  earthElevation: number; // degrees
  earthVisibility: boolean;
  earthAzimuth: number; // degrees
  sunAzimuth: number; // degrees
  nextSunsetHours: number;
  nextEarthsetHours: number | null; // null if continuously visible
  powerAvailabilityPct: number;
  communicationQualityPct: number;
  terrainSuitabilityScore: number; // 0-100
  thermalEnvironmentK: number;
}

export interface HourlySolarData {
  time: string; // ISO string or relative hour "T+00h"
  solarElevation: number;
  earthElevation: number;
  solarIllumination: number; // 0 or 100 or %
  commBandwidthMbps: number;
  powerOutputWatts: number;
}

export interface SiteComparisonScenario {
  id: string;
  site: LunarSite;
  date: string;
  durationDays: number;
  metrics: MissionMetrics;
}
