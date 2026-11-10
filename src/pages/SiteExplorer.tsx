// ============================================================================
// Lunar Horizon — 3D Site Explorer (100% Immersive Full-Bleed NASA Topography)
// Real LROC 8K/4K Texture & NASA LOLA 16-bit DEM Surface Displacements
// Pure White Primary Interface (#FFFFFF) with solid Black Buttons (#000000)
// Fully responsive across mobile, tablet, and desktop displays.
// ============================================================================

import React, { useState, useMemo, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import {
  MapPin,
  Search,
  Compass,
  RotateCcw,
  Eye,
  Mountain,
  Globe2,
  Sliders,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';
import { SITES, CATEGORIES, getSitesByCategory, formatCoordinates } from '../data/sites';
import type { LunarSite, SiteCategory } from '../types';
import { getMissionMetrics } from '../data/solar-data';
import { formatDegrees } from '../utils/formatters';
import NasaMoonGlobe from '../components/three/NasaMoonGlobe';
import { lunarTerrainService } from '../services/lunarTerrainService';

export default function SiteExplorer() {
  const { selectedSite, setSelectedSite, selectedDate } = useMissionStore();
  const [categoryFilter, setCategoryFilter] = useState<SiteCategory | 'all'>('all');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [search, setSearch] = useState('');
  const [explorationMode, setExplorationMode] = useState<'orbital' | 'surface'>('orbital');
  const [autoRotate, setAutoRotate] = useState(false);
  const [dispScale, setDispScale] = useState(0.1); // default visible relief
  const [siteElevation, setSiteElevation] = useState<number | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const metrics = useMemo(
    () => getMissionMetrics(selectedDate, selectedSite),
    [selectedDate, selectedSite]
  );

  const handleElevationChange = useCallback((elevMeters: number) => {
    setSiteElevation(elevMeters);
  }, []);

  const filteredSites = useMemo(() => {
    let sites = categoryFilter === 'all' ? SITES : getSitesByCategory(categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      sites = sites.filter(
        (s) => s.name.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
      );
    }
    return sites;
  }, [categoryFilter, search]);

  const handleCustomCoords = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const realElev = lunarTerrainService.getElevation(lat, lon);
      setSelectedSite({
        id: `custom-${Date.now()}`,
        name: 'Custom Target Location',
        subtitle: formatCoordinates(lat, lon),
        lat,
        lon,
        elevation: realElev,
        category: 'scientific',
        status: 'poi',
        description: `Custom landing coordinate. Real NASA LOLA elevation: ${realElev.toFixed(0)} meters (${(
          realElev / 1000
        ).toFixed(2)} km).`,
      });
      setCustomLat('');
      setCustomLon('');
    }
  };

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-[#04060B] text-white flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''
      }`}
    >
      {/* ================================================================== */}
      {/* 1. FLOATING TOP HUD BAR (Blanc Principal & Boutons Noirs)           */}
      {/* ================================================================== */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Active Site Info Badge (Fond Blanc) */}
        <div className="flex items-center gap-2.5 bg-[#FFFFFF]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#E2E8F0] shadow-xl pointer-events-auto text-[#0F172A]">
          <div className="w-7 h-7 rounded-xl bg-[#000000] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Compass size={14} className="text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-extrabold text-[#0F172A] leading-none">
                {selectedSite.name}
              </span>
              <span className="bg-[#000000] text-white px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
                {siteElevation !== null
                  ? `LOLA ${siteElevation > 0 ? '+' : ''}${siteElevation.toFixed(0)} m`
                  : 'LOLA'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#64748B] block mt-0.5">
              {formatCoordinates(selectedSite.lat, selectedSite.lon, 1)} · {selectedSite.category.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher (Orbital Globe vs Ground Surface) */}
        <div className="flex items-center gap-1 bg-[#FFFFFF]/95 backdrop-blur-md p-1 rounded-2xl border border-[#E2E8F0] shadow-xl pointer-events-auto">
          <button
            onClick={() => setExplorationMode('orbital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              explorationMode === 'orbital'
                ? 'bg-[#000000] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Globe2 size={13} />
            <span>Orbital Globe</span>
          </button>
          <button
            onClick={() => setExplorationMode('surface')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              explorationMode === 'surface'
                ? 'bg-[#000000] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Mountain size={13} />
            <span>Surface Mesh</span>
          </button>
        </div>

        {/* Right: Controls & Target Catalog Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#FFFFFF]/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-[#E2E8F0] shadow-xl text-[#0F172A]">
          {explorationMode === 'orbital' && (
            <>
              {/* Auto-rotate button (Bouton Noir) */}
              <button
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1 ${
                  autoRotate
                    ? 'bg-[#000000] text-white shadow-sm'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
                }`}
                onClick={() => setAutoRotate(!autoRotate)}
                title="Toggle continuous planetary spin"
              >
                {autoRotate ? <Pause size={11} /> : <Play size={11} />}
                <span className="hidden sm:inline">Spin</span>
              </button>

              <div className="hidden sm:block w-px h-5 bg-[#E2E8F0]" />

              {/* Relief Multipliers */}
              <span className="hidden sm:inline text-[9.5px] text-[#64748B] font-bold">Relief:</span>
              {[
                { label: '1×', val: 0.05 },
                { label: '2×', val: 0.1 },
                { label: '4×', val: 0.2 },
              ].map((r) => (
                <button
                  key={r.label}
                  className={`px-1.5 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all ${
                    dispScale === r.val
                      ? 'bg-[#000000] text-white shadow-sm'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
                  }`}
                  onClick={() => setDispScale(r.val)}
                  title={`Surface elevation displacement: ${r.label}`}
                >
                  {r.label}
                </button>
              ))}

              <div className="w-px h-5 bg-[#E2E8F0]" />
            </>
          )}

          {/* Toggle Target Catalog Drawer (Bouton Noir) */}
          <button
            onClick={() => setIsCatalogOpen(!isCatalogOpen)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              isCatalogOpen
                ? 'bg-[#000000] text-white shadow-sm ring-2 ring-[#000000]/20'
                : 'bg-[#000000] text-white hover:bg-[#1E293B]'
            }`}
          >
            <Sliders size={12} className="text-[#38BDF8]" />
            <span>Sites ({SITES.length})</span>
          </button>

          {/* Fullscreen Button (Bouton Noir) */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-7 h-7 rounded-xl bg-[#000000] text-white flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-all hidden sm:flex shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. 3D CANVAS — 100% FULL BLEED VIEWPORT (Lune 8K & Ciel Étoilé)     */}
      {/* ================================================================== */}
      <div className="flex-1 w-full h-full relative">
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-bold">STREAMING NASA MOON 8K & LOLA RELIEF…</span>
            </div>
          }
        >
          <Canvas camera={{ position: [0, 0, 4.6], fov: 42 }} style={{ background: '#04060B' }} shadows>
            {/* Deep space starfield */}
            <Stars radius={80} depth={50} count={3500} factor={4} saturation={0} fade speed={0.2} />

            <NasaMoonGlobe
              mode={explorationMode}
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              autoRotate={autoRotate}
              displacementScale={dispScale}
              onElevationChange={handleElevationChange}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* ================================================================== */}
      {/* 3. FLOATING SLIDE-OUT TARGET CATALOG DRAWER (Fond Blanc)           */}
      {/* ================================================================== */}
      {isCatalogOpen && (
        <div className="fixed sm:absolute top-16 right-3 bottom-20 w-[calc(100vw-24px)] sm:w-[380px] max-w-sm z-30 flex flex-col bg-[#FFFFFF]/98 backdrop-blur-md border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all animate-in fade-in slide-in-from-right duration-200 text-[#0F172A]">
          {/* Drawer Header */}
          <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#000000] text-white flex items-center justify-center shadow-sm">
                <MapPin size={13} className="text-[#38BDF8]" />
              </div>
              <h3 className="text-xs font-extrabold text-[#0F172A]">Target Catalog & Sampler</h3>
            </div>
            <button
              onClick={() => setIsCatalogOpen(false)}
              className="w-7 h-7 rounded-xl bg-[#000000] text-white flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-[#E2E8F0] space-y-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-[11.5px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#000000] transition-colors"
                placeholder="Search crater, massif, mission…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Badges */}
            <div className="flex flex-wrap gap-1">
              <button
                className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-[#000000] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
                onClick={() => setCategoryFilter('all')}
              >
                All ({SITES.length})
              </button>
              {(Object.entries(CATEGORIES) as [SiteCategory, (typeof CATEGORIES)['apollo']][]).map(
                ([key, cat]) => (
                  <button
                    key={key}
                    className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all flex items-center gap-1 ${
                      categoryFilter === key
                        ? 'bg-[#000000] text-white shadow-sm'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    onClick={() => setCategoryFilter(key)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                    {cat.name.split(' ')[0]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Site List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 bg-[#FFFFFF]">
            {filteredSites.map((site) => {
              const isSel = site.id === selectedSite.id;
              const catColor = CATEGORIES[site.category]?.color || '#000000';
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#000000] text-white border-[#000000] shadow-md'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor }} />
                      <h4 className="text-[12px] font-extrabold">{site.name}</h4>
                    </div>
                    <span className={`font-mono text-[9px] ${isSel ? 'text-[#38BDF8]' : 'text-[#64748B]'}`}>
                      {formatCoordinates(site.lat, site.lon, 1)}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ml-4 ${isSel ? 'text-slate-300' : 'text-[#64748B]'}`}>
                    {site.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Custom Coordinates Sampler */}
          <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] block">
              Sample Custom Coordinate (NASA LOLA)
            </span>
            <div className="flex gap-1.5">
              <input
                className="w-1/2 bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-2.5 py-1 text-[11px] text-[#0F172A] outline-none focus:border-[#000000]"
                placeholder="Lat (-90 to +90)"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
              />
              <input
                className="w-1/2 bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl px-2.5 py-1 text-[11px] text-[#0F172A] outline-none focus:border-[#000000]"
                placeholder="Lon (-180 to +180)"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
              />
            </div>
            {/* Bouton Noir: Sample LOLA Elevation */}
            <button
              onClick={handleCustomCoords}
              className="w-full bg-[#000000] text-white hover:bg-[#1E293B] text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm"
            >
              Sample LOLA Elevation
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 4. FLOATING BOTTOM TELEMETRY DOCK (Fond Blanc & Bouton Noir)        */}
      {/* ================================================================== */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF]/95 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-2xl border border-[#E2E8F0] shadow-xl pointer-events-auto text-[#0F172A]">
        {/* Left Telemetry Group */}
        <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-[11.5px] overflow-x-auto py-0.5">
          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-[#64748B] block font-bold">
              Target
            </span>
            <span className="text-[#0F172A] font-extrabold whitespace-nowrap">{selectedSite.name}</span>
          </div>

          <div className="w-px h-6 bg-[#E2E8F0] shrink-0" />

          <div className="hidden sm:block">
            <span className="text-[8.5px] uppercase tracking-wider text-[#64748B] block font-bold">
              Coordinates
            </span>
            <span className="font-mono text-[#0F172A] font-bold whitespace-nowrap">
              {formatCoordinates(selectedSite.lat, selectedSite.lon)}
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-[#E2E8F0] shrink-0" />

          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-[#64748B] block font-bold">
              LOLA Altitude
            </span>
            <span className="font-mono text-[#0F172A] font-extrabold whitespace-nowrap">
              {siteElevation !== null
                ? `${siteElevation > 0 ? '+' : ''}${siteElevation.toFixed(0)} m (${(
                    siteElevation / 1000
                  ).toFixed(2)} km)`
                : 'Sampling…'}
            </span>
          </div>

          <div className="w-px h-6 bg-[#E2E8F0] shrink-0" />

          <div>
            <span className="text-[8.5px] uppercase tracking-wider text-[#64748B] block font-bold">
              Solar Angle
            </span>
            <span className="font-mono text-[#0F172A] font-bold whitespace-nowrap">
              {formatDegrees(metrics.solarElevation)}
            </span>
          </div>
        </div>

        {/* Right Action Button: Descend to Surface / Return to Orbit (Bouton Noir) */}
        <div className="flex items-center gap-2 shrink-0">
          {explorationMode === 'orbital' ? (
            <button
              onClick={() => setExplorationMode('surface')}
              className="bg-[#000000] text-white hover:bg-[#1E293B] text-[11px] font-bold px-3.5 py-1.5 shadow-md flex items-center gap-1.5 rounded-xl transition-all"
            >
              <Eye size={13} className="text-[#38BDF8]" />
              <span>Descend to Surface</span>
            </button>
          ) : (
            <button
              onClick={() => setExplorationMode('orbital')}
              className="bg-[#000000] text-white hover:bg-[#1E293B] text-[11px] font-bold px-3.5 py-1.5 shadow-md flex items-center gap-1.5 rounded-xl transition-all"
            >
              <RotateCcw size={13} className="text-[#38BDF8]" />
              <span>Return to Orbit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
