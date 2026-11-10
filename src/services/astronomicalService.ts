// ============================================================================
// Lunar Horizon — Dedicated Astronomical Positioning Service
// Designed for NASA SPICE (NAIF) Integration & Demonstration Ephemeris
// ============================================================================

import { LunarSite } from '../types';

export interface CelestialBodySkyState {
  name: 'Sun' | 'Earth';
  azimuthDeg: number; // 0° = North, 90° = East, 180° = South, 270° = West
  elevationDeg: number; // Degrees above local horizontal plane (-90° to +90°)
  rawElevationDeg: number; // Elevation without terrain dip correction
  distanceKm: number; // True physical distance
  apparentDiameterDeg: number; // Visual apparent angular size in the lunar sky
  isVisible: boolean; // Above topographical horizon
  phasePct: number; // Sunlit fraction (0-100%)
  subBodyLat: number; // Sub-solar or sub-Earth latitude on Moon
  subBodyLon: number; // Sub-solar or sub-Earth longitude on Moon
  nextRiseHours: number | null; // Hours until next rise above horizon
  nextSetHours: number | null; // Hours until next set below horizon
  fluxOrMargin: string; // Solar flux (W/m²) or DTE Link Margin (dB)
}

export interface LunarSkyObservation {
  site: LunarSite;
  epochIso: string;
  epochTimestamp: number;
  sun: CelestialBodySkyState;
  earth: CelestialBodySkyState;
  observerDipDeg: number; // Horizon depression angle due to elevation
  isSunLit: boolean;
  isDirectToEarthViable: boolean;
  statusLabel: 'DEMONSTRATION DATA (SPICE PRE-INTEGRATION)';
}

class AstronomicalService {
  /**
   * Reference constants
   */
  readonly MOON_MEAN_RADIUS_KM = 1737.4;
  readonly SUN_RADIUS_KM = 696340;
  readonly EARTH_RADIUS_KM = 6371.0;
  readonly MEAN_EARTH_MOON_DIST_KM = 384400;
  readonly MEAN_SUN_MOON_DIST_KM = 149597870; // 1 AU
  readonly LUNAR_SYNODIC_PERIOD_DAYS = 29.530588; // 708.73 hours
  readonly LUNAR_NODAL_PERIOD_DAYS = 27.21222; // Draconic precession cycle
  readonly MOON_AXIS_TILT_TO_ECLIPTIC_DEG = 1.543; // Very small tilt creates low polar sun

  /**
   * Compute astronomical positions of the Sun and Earth as viewed by an observer
   * at a specific lunar surface site and timestamp.
   */
  calculateSkyPositions(site: LunarSite, dateInput: string | Date | number): LunarSkyObservation {
    const epochDate = new Date(dateInput);
    const timestamp = isNaN(epochDate.getTime()) ? Date.now() : epochDate.getTime();
    const epochIso = new Date(timestamp).toISOString();

    // Days elapsed since J2000 standard epoch (2000-01-01T12:00:00Z)
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const daysSinceJ2000 = (timestamp - J2000) / (86400 * 1000);

    // Dip of the horizon due to observer altitude h: theta = sqrt(2 * h / R)
    const elevMeters = Math.max(0, site.elevation || 0);
    const dipDeg = (Math.sqrt((2 * elevMeters) / (this.MOON_MEAN_RADIUS_KM * 1000)) * 180) / Math.PI;

    // ------------------------------------------------------------------------
    // 1. Sun Ephemeris & Apparent Position
    // ------------------------------------------------------------------------
    // Solar longitude along lunar equator advances ~360° per synodic month
    const synodicPhase = (daysSinceJ2000 % this.LUNAR_SYNODIC_PERIOD_DAYS) / this.LUNAR_SYNODIC_PERIOD_DAYS;
    const subSunLon = ((180 - synodicPhase * 360) % 360 + 360) % 360 - 180;

    // Solar latitude oscillates within +/- 1.543° due to axial tilt
    const draconicPhase = (daysSinceJ2000 % this.LUNAR_NODAL_PERIOD_DAYS) / this.LUNAR_NODAL_PERIOD_DAYS;
    const subSunLat = this.MOON_AXIS_TILT_TO_ECLIPTIC_DEG * Math.sin(draconicPhase * 2 * Math.PI);

    // Compute topocentric Sun azimuth and elevation
    const sunAngles = this.computeAzimuthElevation(site.lat, site.lon, subSunLat, subSunLon);
    const effectiveSunElevation = sunAngles.elevationDeg + dipDeg;

    // Apparent solar angular diameter = 2 * atan(R_sun / D_sun) ~ 0.533°
    const sunDistanceKm = this.MEAN_SUN_MOON_DIST_KM * (1 - 0.0167 * Math.cos(draconicPhase * 2 * Math.PI));
    const sunDiameterDeg = (2 * Math.atan(this.SUN_RADIUS_KM / sunDistanceKm) * 180) / Math.PI;

    // Calculate solar flux: 1361 W/m² solar constant * sin(elevation)
    const solarFlux = effectiveSunElevation > 0
      ? Math.round(1361 * Math.sin(Math.max(0.01, (effectiveSunElevation * Math.PI) / 180)))
      : 0;

    // Sunrise / sunset prediction for polar locations
    const sunIsVisible = effectiveSunElevation > 0;
    const nextSunsetHours = sunIsVisible
      ? Math.max(1, Math.round(effectiveSunElevation * 42))
      : null;
    const nextSunriseHours = !sunIsVisible
      ? Math.max(1, Math.round(Math.abs(effectiveSunElevation) * 38))
      : null;

    // ------------------------------------------------------------------------
    // 2. Earth Ephemeris & Apparent Position (with Libration)
    // ------------------------------------------------------------------------
    // The Moon is tidally locked; Earth hovers around (0° Lat, 0° Lon)
    // Optical & physical libration causes Earth to wobble +/- 7.9° in lon, +/- 6.7° in lat
    const anomalisticPhase = (daysSinceJ2000 % 27.55455) / 27.55455; // Perigee to apogee cycle
    const subEarthLon = 7.91 * Math.sin(anomalisticPhase * 2 * Math.PI);
    const subEarthLat = 6.68 * Math.cos(draconicPhase * 2 * Math.PI);

    // Distance varies between ~356,400 km and ~406,700 km
    const earthDistanceKm = this.MEAN_EARTH_MOON_DIST_KM * (1 - 0.0549 * Math.cos(anomalisticPhase * 2 * Math.PI));

    const earthAngles = this.computeAzimuthElevation(site.lat, site.lon, subEarthLat, subEarthLon);
    const effectiveEarthElevation = earthAngles.elevationDeg + dipDeg;

    // Apparent Earth angular diameter = 2 * atan(R_earth / D_earth) ~ 1.9° (approx 3.7x larger than Sun)
    const earthDiameterDeg = (2 * Math.atan(this.EARTH_RADIUS_KM / earthDistanceKm) * 180) / Math.PI;

    // Earth phase seen from Moon is exact opposite of Moon phase seen from Earth!
    const earthPhasePct = Math.round(((1 - Math.cos((synodicPhase + 0.5) * 2 * Math.PI)) / 2) * 100);

    const earthIsVisible = effectiveEarthElevation > 0;
    const nextEarthsetHours = (site.lat < -80 && effectiveEarthElevation < 2.5 && effectiveEarthElevation > 0)
      ? Math.round(effectiveEarthElevation * 24)
      : null;
    const nextEarthriseHours = (site.lat < -80 && effectiveEarthElevation <= 0)
      ? Math.round(Math.abs(effectiveEarthElevation) * 28)
      : null;

    const dteMargin = earthIsVisible
      ? `+${(effectiveEarthElevation * 1.4 + 6.2).toFixed(1)} dB (Nominal)`
      : 'No Line-of-Sight';

    return {
      site,
      epochIso,
      epochTimestamp: timestamp,
      observerDipDeg: Number(dipDeg.toFixed(2)),
      isSunLit: sunIsVisible,
      isDirectToEarthViable: earthIsVisible,
      statusLabel: 'DEMONSTRATION DATA (SPICE PRE-INTEGRATION)',
      sun: {
        name: 'Sun',
        azimuthDeg: Number(sunAngles.azimuthDeg.toFixed(1)),
        elevationDeg: Number(effectiveSunElevation.toFixed(2)),
        rawElevationDeg: Number(sunAngles.elevationDeg.toFixed(2)),
        distanceKm: Math.round(sunDistanceKm),
        apparentDiameterDeg: Number(sunDiameterDeg.toFixed(3)),
        isVisible: sunIsVisible,
        phasePct: 100,
        subBodyLat: Number(subSunLat.toFixed(2)),
        subBodyLon: Number(subSunLon.toFixed(2)),
        nextRiseHours: nextSunriseHours,
        nextSetHours: nextSunsetHours,
        fluxOrMargin: `${solarFlux} W/m²`,
      },
      earth: {
        name: 'Earth',
        azimuthDeg: Number(earthAngles.azimuthDeg.toFixed(1)),
        elevationDeg: Number(effectiveEarthElevation.toFixed(2)),
        rawElevationDeg: Number(earthAngles.elevationDeg.toFixed(2)),
        distanceKm: Math.round(earthDistanceKm),
        apparentDiameterDeg: Number(earthDiameterDeg.toFixed(3)),
        isVisible: earthIsVisible,
        phasePct: earthPhasePct,
        subBodyLat: Number(subEarthLat.toFixed(2)),
        subBodyLon: Number(subEarthLon.toFixed(2)),
        nextRiseHours: nextEarthriseHours,
        nextSetHours: nextEarthsetHours,
        fluxOrMargin: dteMargin,
      },
    };
  }

  /**
   * Spherical trigonometry for topocentric Azimuth & Elevation
   */
  private computeAzimuthElevation(
    obsLatDeg: number,
    obsLonDeg: number,
    targetLatDeg: number,
    targetLonDeg: number
  ): { azimuthDeg: number; elevationDeg: number } {
    const latRad = (obsLatDeg * Math.PI) / 180;
    const lonRad = (obsLonDeg * Math.PI) / 180;
    const tgtLatRad = (targetLatDeg * Math.PI) / 180;
    const tgtLonRad = (targetLonDeg * Math.PI) / 180;

    const deltaLon = tgtLonRad - lonRad;

    // Zenith angle using spherical law of cosines
    const cosZenith =
      Math.sin(latRad) * Math.sin(tgtLatRad) +
      Math.cos(latRad) * Math.cos(tgtLatRad) * Math.cos(deltaLon);

    const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
    const elevationDeg = 90 - (zenithRad * 180) / Math.PI;

    // Azimuth using spherical law
    const y = Math.sin(deltaLon) * Math.cos(tgtLatRad);
    const x =
      Math.cos(latRad) * Math.sin(tgtLatRad) -
      Math.sin(latRad) * Math.cos(tgtLatRad) * Math.cos(deltaLon);

    let azimuthDeg = (Math.atan2(y, x) * 180) / Math.PI;
    azimuthDeg = (azimuthDeg + 360) % 360;

    return { azimuthDeg, elevationDeg };
  }

  /**
   * Helper to convert Azimuth and Elevation into 3D Cartesian coordinates on a sky dome
   * Radius R: 10 units
   * Y = Up (Zenith)
   * -Z = North (Azimuth = 0°)
   * +X = East (Azimuth = 90°)
   * +Z = South (Azimuth = 180°)
   * -X = West (Azimuth = 270°)
   */
  skyAnglesToVector3(azimuthDeg: number, elevationDeg: number, radius = 10): [number, number, number] {
    const azRad = (azimuthDeg * Math.PI) / 180;
    const elRad = (elevationDeg * Math.PI) / 180;

    const rCosEl = radius * Math.cos(elRad);
    const x = rCosEl * Math.sin(azRad);
    const y = radius * Math.sin(elRad);
    const z = -rCosEl * Math.cos(azRad);

    return [x, y, z];
  }
}

export const astronomicalService = new AstronomicalService();
