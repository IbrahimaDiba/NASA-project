// ============================================================================
// Lunar Horizon — Solar & Earth Ephemeris and Illumination Engine
// Provides realistic lunar orbital geometry, sub-solar/sub-Earth calculations,
// and horizon elevation profiles for candidate landing sites.
// ============================================================================

import { LunarSite, MissionMetrics, HourlySolarData } from '../types';

/**
 * Approximate lunar orbital geometry parameters
 * Mean obliquity of Moon's axis to ecliptic is ~1.543°
 * Earth libration in latitude +/- 6.7°, longitude +/- 7.9°
 */
export function calculateLunarEphemeris(dateStr: string, site: LunarSite) {
  const d = new Date(dateStr).getTime() || Date.now();
  const dayOffset = (d - new Date('2026-01-01T00:00:00Z').getTime()) / (1000 * 86400);

  // Synodic period of Moon (lunar day) ~ 29.53059 days
  const synodicPhase = ((dayOffset % 29.53059) / 29.53059) * 2 * Math.PI;

  // Draconic / nodal cycle ~ 27.212 days
  const draconicPhase = ((dayOffset % 27.212) / 27.212) * 2 * Math.PI;

  // Solar sub-latitude oscillation (-1.54° to +1.54°)
  const subSolarLat = 1.543 * Math.sin(draconicPhase);

  // Solar sub-longitude moves westward at ~360° per 29.53 days
  const subSolarLon = 180 - ((dayOffset % 29.53059) / 29.53059) * 360;

  // Earth sub-latitude libration (-6.7° to +6.7°)
  const subEarthLat = 6.68 * Math.sin(draconicPhase + 0.5);

  // Earth sub-longitude libration (-7.9° to +7.9°)
  const subEarthLon = 7.91 * Math.cos(synodicPhase * 0.95);

  // Calculate angular distance to Sun
  const latRad = (site.lat * Math.PI) / 180;
  const lonRad = (site.lon * Math.PI) / 180;
  const sunLatRad = (subSolarLat * Math.PI) / 180;
  const sunLonRad = (subSolarLon * Math.PI) / 180;

  const earthLatRad = (subEarthLat * Math.PI) / 180;
  const earthLonRad = (subEarthLon * Math.PI) / 180;

  // Great circle distance to Sun / Earth
  const cosZenithSun =
    Math.sin(latRad) * Math.sin(sunLatRad) +
    Math.cos(latRad) * Math.cos(sunLatRad) * Math.cos(lonRad - sunLonRad);

  const solarZenithAngle = Math.acos(Math.max(-1, Math.min(1, cosZenithSun)));
  const solarElevationDeg = 90 - (solarZenithAngle * 180) / Math.PI;

  const cosZenithEarth =
    Math.sin(latRad) * Math.sin(earthLatRad) +
    Math.cos(latRad) * Math.cos(earthLatRad) * Math.cos(lonRad - earthLonRad);

  const earthZenithAngle = Math.acos(Math.max(-1, Math.min(1, cosZenithEarth)));
  const earthElevationDeg = 90 - (earthZenithAngle * 180) / Math.PI;

  // Horizon adjustment: elevated rims (e.g. Malapert Massif +5km) give a depression angle advantage
  // Dip of the horizon theta = sqrt(2 * h / R)
  const moonRadiusMeters = 1737400;
  const horizonDipDeg = site.elevation > 0 ? (Math.sqrt((2 * site.elevation) / moonRadiusMeters) * 180) / Math.PI : 0;

  const effectiveSolarElev = solarElevationDeg + horizonDipDeg;
  const effectiveEarthElev = earthElevationDeg + horizonDipDeg;

  // Azimuth calculation
  const sunAzimuth =
    ((Math.atan2(
      Math.sin(sunLonRad - lonRad),
      Math.cos(latRad) * Math.tan(sunLatRad) - Math.sin(latRad) * Math.cos(sunLonRad - lonRad)
    ) *
      180) /
      Math.PI +
      360) %
    360;

  const earthAzimuth =
    ((Math.atan2(
      Math.sin(earthLonRad - lonRad),
      Math.cos(latRad) * Math.tan(earthLatRad) - Math.sin(latRad) * Math.cos(earthLonRad - lonRad)
    ) *
      180) /
      Math.PI +
      360) %
    360;

  return {
    solarElevationDeg: Number(effectiveSolarElev.toFixed(2)),
    earthElevationDeg: Number(effectiveEarthElev.toFixed(2)),
    rawSolarElev: solarElevationDeg,
    rawEarthElev: earthElevationDeg,
    sunAzimuth: Math.round(sunAzimuth),
    earthAzimuth: Math.round(earthAzimuth),
    subSolarLat,
    subSolarLon,
    subEarthLat,
    subEarthLon,
  };
}

export function getMissionMetrics(dateStr: string, site: LunarSite): MissionMetrics {
  const eph = calculateLunarEphemeris(dateStr, site);
  const isIlluminated = eph.solarElevationDeg > 0;
  const isEarthVisible = eph.earthElevationDeg > 0;

  // Solar illumination percentage (accounting for grazing angle at pole)
  const solarIllumination = isIlluminated
    ? Math.min(100, Math.round(Math.max(15, eph.solarElevationDeg * 35)))
    : 0;

  // Power availability based on solar angle + solar array efficiency
  const powerAvailabilityPct = isIlluminated
    ? Math.min(100, Math.round(Math.max(20, (eph.solarElevationDeg / 3.0) * 85 + 15)))
    : 0;

  // Communication direct-to-Earth quality
  const communicationQualityPct = isEarthVisible
    ? Math.min(100, Math.round(Math.max(30, (eph.earthElevationDeg / 8.0) * 90 + 10)))
    : 0;

  // Sunlight duration (polar peaks enjoy up to hundreds of hours of continuous light)
  const sunlightDurationHours =
    Math.abs(site.lat) > 80
      ? Math.round((site.sunVisibilityPct || 75) * 7.08) // up to ~500 hrs in lunar summer
      : 354; // equatorial standard 14 earth days

  const nextSunsetHours = isIlluminated ? Math.round(Math.max(4, eph.solarElevationDeg * 48)) : 0;
  const nextEarthsetHours = isEarthVisible && Math.abs(site.lat) > 80 && eph.earthElevationDeg < 2 ? 36 : null;

  // Terrain suitability score based on slope & elevation safety
  const terrainSuitabilityScore =
    site.elevation > 4500 ? 76 : site.elevation > 2000 ? 88 : site.elevation > -2000 ? 94 : 82;

  // Surface thermal environment
  const thermalEnvironmentK = isIlluminated
    ? Math.round(210 + eph.solarElevationDeg * 8)
    : 105;

  return {
    solarElevation: eph.solarElevationDeg,
    solarIllumination,
    sunlightDurationHours,
    earthElevation: eph.earthElevationDeg,
    earthVisibility: isEarthVisible,
    earthAzimuth: eph.earthAzimuth,
    sunAzimuth: eph.sunAzimuth,
    nextSunsetHours,
    nextEarthsetHours,
    powerAvailabilityPct,
    communicationQualityPct,
    terrainSuitabilityScore,
    thermalEnvironmentK,
  };
}

export function generateHourlyData(dateStr: string, site: LunarSite, totalHours = 48): HourlySolarData[] {
  const baseDate = new Date(dateStr).getTime() || Date.now();
  const data: HourlySolarData[] = [];

  for (let i = 0; i < totalHours; i += 2) {
    const timestamp = new Date(baseDate + i * 3600 * 1000).toISOString();
    const eph = calculateLunarEphemeris(timestamp, site);

    const isSun = eph.solarElevationDeg > 0;
    const isEarth = eph.earthElevationDeg > 0;

    const powerWatts = isSun ? Math.round(Math.max(50, eph.solarElevationDeg * 280)) : 0;
    const commMbps = isEarth ? Number(Math.max(0.5, eph.earthElevationDeg * 1.8).toFixed(1)) : 0;

    data.push({
      time: `T+${i.toString().padStart(2, '0')}h`,
      solarElevation: eph.solarElevationDeg,
      earthElevation: eph.earthElevationDeg,
      solarIllumination: isSun ? Math.min(100, Math.round(eph.solarElevationDeg * 40)) : 0,
      commBandwidthMbps: commMbps,
      powerOutputWatts: powerWatts,
    });
  }

  return data;
}
