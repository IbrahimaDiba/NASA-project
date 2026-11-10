// ============================================================================
// Lunar Horizon — 3D Celestial Simulator (Sun, Earth & Lunar Sky Horizon)
// High-Fidelity 100% Immersive NASA Mission Simulation
// Pure White Primary Interface (#FFFFFF) with solid Black Buttons (#000000)
// Fully responsive across mobile, tablet, and desktop displays.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Sun,
  Globe2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  Calendar,
  Layers,
  Sparkles,
  Mountain,
  Radio,
  Eye,
} from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';
import { SITES, formatCoordinates } from '../data/sites';
import { astronomicalService } from '../services/astronomicalService';
import { formatDegrees, formatElevation } from '../utils/formatters';

// 3D Visualizer Components
import ImmersiveLunarSky from '../components/three/ImmersiveLunarSky';
import SunSkyView from '../components/three/SunSkyView';
import EarthSkyView from '../components/three/EarthSkyView';
import LunarSkyDome from '../components/three/LunarSkyDome';

type SimulatorMode = 'immersive' | 'split' | 'celestial-dome';

export default function Simulator() {
  const { selectedSite, setSelectedSite, selectedDate, setSelectedDate } = useMissionStore();

  const [simulatorMode, setSimulatorMode] = useState<SimulatorMode>('immersive');
  const [viewpoint, setViewpoint] = useState<'ground' | 'orbital'>('ground');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTelemetryHud, setShowTelemetryHud] = useState<boolean>(true);

  // Time state tracked as Unix ms timestamp for sub-second smooth orbital animation
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => {
    return new Date(selectedDate || '2026-11-20T12:00:00Z').getTime();
  });

  // Keep internal timestamp synchronized when user picks a date via global navbar
  useEffect(() => {
    if (selectedDate) {
      const parsed = new Date(selectedDate).getTime();
      if (!isNaN(parsed) && Math.abs(parsed - currentTimestamp) > 60000) {
        setCurrentTimestamp(parsed);
      }
    }
  }, [selectedDate]);

  // Animated orbital simulation playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimestamp((prev) => prev + playbackSpeed * 60 * 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const currentDate = useMemo(() => new Date(currentTimestamp), [currentTimestamp]);
  const currentIsoString = useMemo(() => currentDate.toISOString().slice(0, 16), [currentDate]);

  const observation = useMemo(() => {
    return astronomicalService.calculateSkyPositions(selectedSite, currentDate);
  }, [currentDate, selectedSite]);

  const sun = observation.sun;
  const earth = observation.earth;
  const observerDipDeg = observation.observerDipDeg.toFixed(2);

  const handleStep = (hours: number) => {
    const next = currentTimestamp + hours * 3600 * 1000;
    setCurrentTimestamp(next);
    setSelectedDate(new Date(next).toISOString().slice(0, 16));
  };

  const handleDateChange = (iso: string) => {
    setSelectedDate(iso);
    const parsed = new Date(iso).getTime();
    if (!isNaN(parsed)) setCurrentTimestamp(parsed);
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
        {/* Left: Mission & Target Location Badge (Fond Blanc) */}
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
                LOLA {formatElevation(selectedSite.elevation)}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#64748B] block mt-0.5">
              {formatCoordinates(selectedSite.lat, selectedSite.lon, 1)} · Dip: -{observerDipDeg}°
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-[#E2E8F0]" />

          {/* Quick Target Switcher */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#64748B]">
            <Mountain size={13} className="text-[#000000]" />
            <select
              value={selectedSite.id}
              onChange={(e) => {
                const s = SITES.find((x) => x.id === e.target.value);
                if (s) setSelectedSite(s);
              }}
              className="bg-transparent border-none text-[11px] font-extrabold text-[#0F172A] outline-none cursor-pointer"
            >
              {SITES.map((site) => (
                <option key={site.id} value={site.id} className="bg-white text-[#0F172A]">
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Viewpoint, Mode & Fullscreen Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#FFFFFF]/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-[#E2E8F0] shadow-xl text-[#0F172A]">
          {/* Mode Selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSimulatorMode('immersive')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                simulatorMode === 'immersive'
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>360° Observatory</span>
            </button>
            <button
              onClick={() => setSimulatorMode('split')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                simulatorMode === 'split'
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>Split Celestial</span>
            </button>
          </div>

          <div className="w-px h-5 bg-[#E2E8F0]" />

          {/* Viewpoint Ground / Orbital (Boutons Noirs) */}
          {simulatorMode === 'immersive' && (
            <button
              onClick={() => setViewpoint(viewpoint === 'ground' ? 'orbital' : 'ground')}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
                viewpoint === 'ground'
                  ? 'bg-[#000000] text-white shadow-sm'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
              }`}
              title="Toggle between First-Person Astronaut Ground View and Orbital Overview"
            >
              <Eye size={12} className="text-[#38BDF8]" />
              <span className="hidden sm:inline">{viewpoint === 'ground' ? 'Astronaut View' : 'Orbital View'}</span>
            </button>
          )}

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
      {/* 2. 3D CANVAS — 100% FULL BLEED VIEWPORT                            */}
      {/* ================================================================== */}
      <div className="flex-1 w-full h-full relative">
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-bold">INITIALIZING CELESTIAL EPHEMERIS SIMULATION…</span>
            </div>
          }
        >
          {simulatorMode === 'immersive' ? (
            <Canvas
              camera={{
                position: viewpoint === 'ground' ? [2.8, 1.6, 3.2] : [0, 16, 32],
                fov: viewpoint === 'ground' ? 72 : 55,
              }}
              style={{ background: '#04060B' }}
              shadows
            >
              <ImmersiveLunarSky
                site={selectedSite}
                sun={sun}
                earth={earth}
                viewMode={viewpoint}
                showHud={showTelemetryHud}
              />
            </Canvas>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
              <div className="relative border-b md:border-b-0 md:border-r border-[#1E293B]/60">
                <div className="absolute top-16 left-4 z-10 bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-[#0F172A] border border-[#E2E8F0] shadow-md flex items-center gap-1.5">
                  <Sun size={13} className="text-[#E8A838]" />
                  <span>Solar Ephemeris Vector</span>
                </div>
                <Canvas camera={{ position: [0, 6, 14], fov: 45 }} style={{ background: '#04060B' }}>
                  <SunSkyView
                    azimuthDeg={sun.azimuthDeg}
                    elevationDeg={sun.elevationDeg}
                    apparentDiameterDeg={sun.apparentDiameterDeg}
                  />
                </Canvas>
              </div>

              <div className="relative">
                <div className="absolute top-16 left-4 z-10 bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-[#0F172A] border border-[#E2E8F0] shadow-md flex items-center gap-1.5">
                  <Globe2 size={13} className="text-[#2563EB]" />
                  <span>Direct-to-Earth Vector & Phase</span>
                </div>
                <Canvas camera={{ position: [0, 6, 14], fov: 45 }} style={{ background: '#04060B' }}>
                  <EarthSkyView
                    azimuthDeg={earth.azimuthDeg}
                    elevationDeg={earth.elevationDeg}
                    phasePct={earth.phasePct}
                    apparentDiameterDeg={earth.apparentDiameterDeg}
                    sunAzimuthDeg={sun.azimuthDeg}
                    sunElevationDeg={sun.elevationDeg}
                  />
                </Canvas>
              </div>
            </div>
          )}
        </Suspense>
      </div>

      {/* ================================================================== */}
      {/* 3. FLOATING BOTTOM DOCK: SOLAR VECTOR & TIME CONTROLS (Fond Blanc)  */}
      {/* ================================================================== */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 bg-[#FFFFFF]/95 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-2xl border border-[#E2E8F0] shadow-xl pointer-events-auto text-[#0F172A]">
        {/* Top Row: Solar Vector | Embedded Time Controls | DTE */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 1. Solar Vector Telemetry */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#000000] text-[#E8A838] flex items-center justify-center shrink-0 shadow-sm">
              <Sun size={17} />
            </div>
            <div className="text-[11.5px]">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#0F172A] text-[12px]">Solar Vector</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase font-mono ${
                    sun.isVisible ? 'bg-[#15803D] text-white' : 'bg-[#DC2626] text-white'
                  }`}
                >
                  {sun.isVisible ? 'Above Rim' : 'Below Horizon'}
                </span>
              </div>
              <div className="font-mono text-[#64748B] space-x-2 text-[10px] sm:text-[10.5px]">
                <span>Az: <strong className="text-[#0F172A]">{sun.azimuthDeg}°</strong></span>
                <span>El: <strong className={sun.elevationDeg >= 0 ? 'text-[#0F172A]' : 'text-[#EF4444]'}>{formatDegrees(sun.elevationDeg, 2)}</strong></span>
                <span>Flux: <strong className="text-[#0F172A]">{sun.fluxOrMargin}</strong></span>
              </div>
            </div>
          </div>

          {/* 2. Embedded Time & Playback Controls (Boutons Noirs) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause Button: Noir */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-[#000000] text-white hover:bg-[#1E293B] px-3 py-1.5 gap-1.5 text-xs font-bold shadow-md rounded-xl flex items-center transition-all"
            >
              {isPlaying ? <Pause size={12} className="text-[#38BDF8]" /> : <Play size={12} className="text-[#38BDF8]" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Stepper Buttons: Noirs */}
            <button
              onClick={() => handleStep(-1)}
              className="px-2 py-1.5 rounded-xl bg-[#000000] text-white hover:bg-[#1E293B] text-xs font-bold shadow-sm transition-all flex items-center gap-0.5"
              title="Step -1 hour"
            >
              <SkipBack size={11} />
              <span>-1h</span>
            </button>

            <button
              onClick={() => handleStep(1)}
              className="px-2 py-1.5 rounded-xl bg-[#000000] text-white hover:bg-[#1E293B] text-xs font-bold shadow-sm transition-all flex items-center gap-0.5"
              title="Step +1 hour"
            >
              <span>+1h</span>
              <SkipForward size={11} />
            </button>

            <button
              onClick={() => handleStep(24)}
              className="px-2 py-1.5 rounded-xl bg-[#000000] text-white hover:bg-[#1E293B] text-xs font-bold shadow-sm transition-all hidden sm:flex"
              title="Step +24 hours"
            >
              <span>+24h</span>
            </button>

            <div className="w-px h-4 bg-[#E2E8F0] mx-0.5" />

            {/* Speeds: 1x, 10x, 100x */}
            <div className="flex items-center gap-0.5 bg-[#F8FAFC] border border-[#CBD5E1] p-0.5 rounded-xl">
              {([1, 10, 100] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-[#000000] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-[#E2E8F0] mx-0.5 hidden sm:block" />

            {/* Date Picker Input */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-1 rounded-xl text-[11px] text-[#0F172A] font-mono">
              <Calendar size={12} className="text-[#000000]" />
              <input
                type="datetime-local"
                value={currentIsoString}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent border-none text-[11px] font-mono font-bold text-[#0F172A] outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Direct-to-Earth (DTE) Telemetry */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#000000] text-[#38BDF8] flex items-center justify-center shrink-0 shadow-sm">
              <Globe2 size={17} />
            </div>
            <div className="text-[11.5px]">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#0F172A] text-[12px]">Direct-to-Earth</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase font-mono ${
                    earth.isVisible ? 'bg-[#2563EB] text-white' : 'bg-[#DC2626] text-white'
                  }`}
                >
                  {earth.isVisible ? 'Link Active' : 'Blocked'}
                </span>
              </div>
              <div className="font-mono text-[#64748B] space-x-2 text-[10px] sm:text-[10.5px]">
                <span>Az: <strong className="text-[#0F172A]">{earth.azimuthDeg}°</strong></span>
                <span>El: <strong className={earth.elevationDeg >= 0 ? 'text-[#0F172A]' : 'text-[#EF4444]'}>{formatDegrees(earth.elevationDeg, 2)}</strong></span>
                <span>Phase: <strong className="text-[#0F172A]">{earth.phasePct}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Full-width scrub slider */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#E2E8F0]">
          <span className="text-[10px] font-mono font-bold text-[#64748B] shrink-0">Scrub (±14d):</span>
          <input
            type="range"
            min={currentTimestamp - 14 * 86400 * 1000}
            max={currentTimestamp + 14 * 86400 * 1000}
            value={currentTimestamp}
            onChange={(e) => setCurrentTimestamp(Number(e.target.value))}
            className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#000000]"
          />
          <span className="text-[10px] font-mono font-bold text-[#0F172A] shrink-0 hidden sm:inline">
            Sun: {formatDegrees(sun.elevationDeg, 1)} | Earth: {formatDegrees(earth.elevationDeg, 1)}
          </span>
        </div>
      </div>
    </div>
  );
}
