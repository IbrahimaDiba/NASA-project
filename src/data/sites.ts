// ============================================================================
// Lunar Horizon — Curated Lunar Landing Sites & Topographic Data
// Real coordinates and verified NASA LOLA DEM elevations
// ============================================================================

import { LunarSite, SiteCategory } from '../types';

export const CATEGORIES: Record<SiteCategory, { label: string; name: string; color: string; description: string }> = {
  clps: {
    label: 'NASA CLPS Missions',
    name: 'NASA CLPS Missions',
    color: '#000000',
    description: 'Commercial Lunar Payload Services commercial lander delivery targets',
  },
  artemis: {
    label: 'Artemis Exploration Zone',
    name: 'Artemis Exploration Zone',
    color: '#2563EB',
    description: 'NASA Artemis candidate human and robotic landing sites at the South Pole',
  },
  apollo: {
    label: 'Historic Apollo Sites',
    name: 'Historic Apollo Sites',
    color: '#D97706',
    description: 'Historical Apollo lunar landings for benchmark comparisons',
  },
  international: {
    label: 'International Landers',
    name: 'International Landers',
    color: '#059669',
    description: 'Chang’e, Chandrayaan, SLIM and international exploration touchdowns',
  },
  scientific: {
    label: 'High-Priority Science Targets',
    name: 'High-Priority Science Targets',
    color: '#7C3AED',
    description: 'Permanently Shadowed Regions (PSRs) and peak illumination massifs',
  },
};

export const SITES: LunarSite[] = [
  {
    id: 'shackleton-connecting-ridge',
    name: 'Shackleton Connecting Ridge',
    subtitle: 'Artemis III Candidate / South Pole Peak',
    lat: -89.78,
    lon: 128.5,
    elevation: 4120, // LOLA meters
    category: 'artemis',
    status: 'candidate',
    primaryMission: 'Artemis III / CLPS',
    targetDate: '2026-09-15',
    sunVisibilityPct: 86,
    earthVisibilityPct: 62,
    maxSolarElevation: 1.8,
    maxEarthElevation: 6.4,
    temperatureRangeK: [95, 230],
    waterIcePotential: 'High',
    significance: 'Site cible pour Artemis III (Retour des astronautes)',
    simpleSummary:
      'Crête élevée au pôle Sud avec 86% de soleil et d’immenses réserves de glace d’eau piégées dans l’ombre éternelle du cratère voisin.',
    description:
      'High-altitude ridge adjacent to Shackleton Crater crater rim. Provides near-continuous solar illumination during southern lunar summer with direct line-of-sight to Earth for direct-to-Earth (DTE) communication.',
  },
  {
    id: 'malapert-massif',
    name: 'Malapert Massif',
    subtitle: 'Peak of Eternal Light Candidate / IM-1 Vicinity',
    lat: -85.99,
    lon: 2.85,
    elevation: 5013,
    category: 'clps',
    status: 'candidate',
    primaryMission: 'Intuitive Machines IM-1 / CLPS PRISM',
    targetDate: '2026-11-20',
    sunVisibilityPct: 91,
    earthVisibilityPct: 78,
    maxSolarElevation: 2.4,
    maxEarthElevation: 8.2,
    temperatureRangeK: [110, 240],
    waterIcePotential: 'High',
    significance: 'Sommet le plus haut du pôle Sud (+5 013 m)',
    simpleSummary:
      'Montagne géante avec 91% d’ensoleillement quasi permanent et contact direct continu avec la Terre. Idéal pour installer des panneaux solaires.',
    description:
      'Spectacular 5 km elevation prominence near the South Pole. Among the most illuminated sites on the Moon, offering continuous direct-to-Earth visibility for high-bandwidth telemetry and power stability.',
  },
  {
    id: 'nobile-rim-1',
    name: 'Nobile Crater Rim (VIPER Site)',
    subtitle: 'VIPER Rover Scientific Target / Volatile Hunt',
    lat: -85.2,
    lon: 35.8,
    elevation: 3450,
    category: 'clps',
    status: 'candidate',
    primaryMission: 'NASA VIPER / Griffin CLPS',
    targetDate: '2026-10-10',
    sunVisibilityPct: 79,
    earthVisibilityPct: 68,
    maxSolarElevation: 2.1,
    maxEarthElevation: 7.1,
    temperatureRangeK: [40, 225],
    waterIcePotential: 'High',
    significance: 'Zone d’exploration du rover VIPER de la NASA',
    simpleSummary:
      'Bordure de cratère riche en hydrogène où un rover robotique va rouler pour chercher des poches de glace d’eau sous la surface.',
    description:
      'Mountainous rim bordering deeply shadowed craters rich in neutron spectrometer hydrogen signatures. Selected for mobile surface volatile exploration.',
  },
  {
    id: 'de-gerlache-rim',
    name: 'De Gerlache Rim 2',
    subtitle: 'Permanently Shadowed Boundary',
    lat: -88.3,
    lon: -68.4,
    elevation: 2890,
    category: 'artemis',
    status: 'candidate',
    primaryMission: 'Artemis Exploration Zone',
    targetDate: '2026-12-05',
    sunVisibilityPct: 74,
    earthVisibilityPct: 58,
    maxSolarElevation: 1.6,
    maxEarthElevation: 5.9,
    temperatureRangeK: [85, 215],
    waterIcePotential: 'High',
    significance: 'Piège à froid polaire & Glace ancienne',
    simpleSummary:
      'Bord de cratère à 2 890 m d’altitude où les températures descendent à -230°C, conservant de la glace intacte depuis des milliards d’années.',
    description:
      'Elevated crater edge overlooking one of the deepest cold traps at the lunar south pole, ideal for evaluating volatile migration models.',
  },
  {
    id: 'haworth-crater-rim',
    name: 'Haworth Crater Rim',
    subtitle: 'Extreme PSR Volatile Basin',
    lat: -87.4,
    lon: -5.1,
    elevation: 3100,
    category: 'scientific',
    status: 'candidate',
    primaryMission: 'LOLA / LROC Science Evaluation',
    targetDate: '2027-01-15',
    sunVisibilityPct: 68,
    earthVisibilityPct: 65,
    maxSolarElevation: 1.4,
    maxEarthElevation: 5.2,
    temperatureRangeK: [45, 210],
    waterIcePotential: 'High',
    significance: 'Bassin d’eau glacée le plus froid de la Lune',
    simpleSummary:
      'Cratère plongé dans la nuit absolue abritant d’importants dépôts de glace d’eau indispensables pour fabriquer du carburant spatial.',
    description:
      'Rim overlooking an ultra-cold basin with temperatures below 40 Kelvin, harboring subsurface water ice deposits detected by LEND and Diviner.',
  },
  {
    id: 'amundsen-rim',
    name: 'Amundsen Crater Rim',
    subtitle: 'Volatile-Rich Highland Terrace',
    lat: -84.5,
    lon: 82.8,
    elevation: 2150,
    category: 'scientific',
    status: 'candidate',
    primaryMission: 'Future CLPS Science Payload',
    targetDate: '2027-03-22',
    sunVisibilityPct: 72,
    earthVisibilityPct: 71,
    maxSolarElevation: 2.6,
    maxEarthElevation: 8.9,
    temperatureRangeK: [100, 235],
    waterIcePotential: 'Medium',
    significance: 'Cratère géant d’impact du pôle Sud',
    simpleSummary:
      'Rempart de cratère imposant offrant une vue panoramique sur les hauts plateaux et les zones d’ombres permanentes.',
    description:
      'Massive impact crater rim containing central peak complexes and accessible permanent shadow boundaries.',
  },
  {
    id: 'chandrayaan-3-point',
    name: 'Shiv Shakti Point (Chandrayaan-3)',
    subtitle: 'ISRO Historic South Pole Touchdown',
    lat: -69.37,
    lon: 32.35,
    elevation: -2410,
    category: 'international',
    status: 'success',
    primaryMission: 'Chandrayaan-3 Vikram Lander',
    targetDate: '2023-08-23',
    sunVisibilityPct: 50,
    earthVisibilityPct: 88,
    maxSolarElevation: 18.5,
    maxEarthElevation: 19.2,
    temperatureRangeK: [130, 360],
    waterIcePotential: 'Medium',
    significance: 'Atterrissage historique de l’Inde (Août 2023)',
    simpleSummary:
      'Site où le module indien Vikram et le rover Pragyan se sont posés avec succès pour la première fois près du pôle Sud.',
    description:
      'Site of India’s historic first soft landing near the lunar high-latitude southern region between Manzinus C and Simpelius N.',
  },
  {
    id: 'change-4-von-karman',
    name: 'Von Kármán Crater (Chang’e 4)',
    subtitle: 'First Lunar Far Side Landing',
    lat: -45.46,
    lon: 177.59,
    elevation: -5930,
    category: 'international',
    status: 'success',
    primaryMission: 'CNSA Chang’e 4 & Yutu-2 Rover',
    targetDate: '2019-01-03',
    sunVisibilityPct: 50,
    earthVisibilityPct: 0, // Far side requires Queqiao relay
    maxSolarElevation: 42.1,
    maxEarthElevation: 0,
    temperatureRangeK: [100, 390],
    waterIcePotential: 'Low',
    significance: 'Premier atterrissage sur la face cachée (Chine 2019)',
    simpleSummary:
      'Exploit mondial : premier engin humain à s’être posé sur la face cachée, communiquant avec la Terre via un satellite relais.',
    description:
      'Located within the giant South Pole-Aitken (SPA) basin on the lunar far side. Requires Queqiao halo-orbit relay satellite at Earth-Moon L2 for communications.',
  },
  {
    id: 'apollo-11-tranquility',
    name: 'Statio Tranquillitatis (Apollo 11)',
    subtitle: 'First Human Lunar Landing',
    lat: 0.67,
    lon: 23.47,
    elevation: -1888,
    category: 'apollo',
    status: 'success',
    primaryMission: 'Apollo 11 Eagle LM',
    targetDate: '1969-07-20',
    sunVisibilityPct: 50,
    earthVisibilityPct: 100,
    maxSolarElevation: 88.5,
    maxEarthElevation: 63.8,
    temperatureRangeK: [100, 385],
    waterIcePotential: 'Negligible',
    significance: 'Le premier pas de l’Homme sur la Lune (1969)',
    simpleSummary:
      'Site légendaire où Neil Armstrong a prononcé ‘Un petit pas pour l’homme...’ et planté le drapeau dans la Mer de la Tranquillité.',
    description:
      'Historic site where Neil Armstrong and Buzz Aldrin stepped onto the lunar surface in Mare Tranquillitatis. Equatorial, planar mare basalt terrain.',
  },
  {
    id: 'apollo-17-taurus-littrow',
    name: 'Taurus-Littrow Valley (Apollo 17)',
    subtitle: 'Deep Geologic Exploration',
    lat: 20.19,
    lon: 30.77,
    elevation: -2480,
    category: 'apollo',
    status: 'success',
    primaryMission: 'Apollo 17 Challenger LM',
    targetDate: '1972-12-11',
    sunVisibilityPct: 50,
    earthVisibilityPct: 100,
    maxSolarElevation: 68.2,
    maxEarthElevation: 56.4,
    temperatureRangeK: [95, 380],
    waterIcePotential: 'Negligible',
    significance: 'Dernière mission habitée du programme Apollo (1972)',
    simpleSummary:
      'Vallée volcanique où le géologue Harrison Schmitt a découvert le sol orange et parcouru 35 km en jeep lunaire.',
    description:
      'Valley bounded by the North and South Massifs. Final Apollo mission featuring geologist Harrison Schmitt discovering orange pyroclastic soil.',
  },
];

export function getSitesByCategory(category: SiteCategory): LunarSite[] {
  return SITES.filter(s => s.category === category);
}

export function formatCoordinates(lat: number, lon: number, decimals = 2): string {
  const latStr = `${Math.abs(lat).toFixed(decimals)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(decimals)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}
