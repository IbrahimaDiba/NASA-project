// ============================================================================
// Lunar Horizon — Fully Responsive Aerospace Mission Control Command Bar (Navbar)
// Primary White aesthetic (#FFFFFF) with solid Black buttons (#000000)
// Fully adaptive from mobile (320px) to ultra-wide displays (4K)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Calendar,
  MapPin,
  Rocket,
  Clock,
  ChevronDown,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Check,
  Search,
  Menu,
} from 'lucide-react';
import { useMissionStore } from '../../stores/useMissionStore';
import { SITES, formatCoordinates } from '../../data/sites';
import { formatElevation } from '../../utils/formatters';

interface MissionPreset {
  id: string;
  name: string;
  agency: string;
  target: string;
  badge: string;
}

const PRESET_MISSIONS: MissionPreset[] = [
  {
    id: 'clps-nova-c',
    name: 'CLPS Nova-C / Artemis Recon',
    agency: 'NASA / Intuitive Machines',
    target: 'Malapert Mountain (South Pole)',
    badge: 'ACTIVE',
  },
  {
    id: 'viper-griffin',
    name: 'VIPER Rover Deployment',
    agency: 'NASA / Astrobotic',
    target: 'Nobile Rim (Permanently Shadowed)',
    badge: 'ACTIVE',
  },
  {
    id: 'artemis-3',
    name: 'Artemis III Crewed Landing',
    agency: 'NASA / Artemis Program',
    target: 'Connecting Ridge / Shackleton',
    badge: 'PLANNED',
  },
  {
    id: 'prism-clps',
    name: 'PRISM Science Delivery',
    agency: 'NASA CLPS Directorate',
    target: 'Haworth Crater Rim',
    badge: 'TEST',
  },
];

export default function Navbar() {
  const {
    missionName,
    setMissionName,
    selectedSite,
    setSelectedSite,
    selectedDate,
    setSelectedDate,
    isSidebarCollapsed,
    toggleSidebar,
  } = useMissionStore();

  const [liveUtc, setLiveUtc] = useState<string>('');
  const [liveUtcShort, setLiveUtcShort] = useState<string>('');
  const [clockMode, setClockMode] = useState<'UTC' | 'MET'>('UTC');
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false);
  const [isMissionMenuOpen, setIsMissionMenuOpen] = useState(false);
  const [isEpochMenuOpen, setIsEpochMenuOpen] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Web Audio Context for Apollo Quindar tone and deep space carrier hum
  const audioCtxRef = useRef<AudioContext | null>(null);
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);

  // Live ticking clock (Aerospace Real-Time Sync)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (clockMode === 'UTC') {
        const h = String(now.getUTCHours()).padStart(2, '0');
        const m = String(now.getUTCMinutes()).padStart(2, '0');
        const s = String(now.getUTCSeconds()).padStart(2, '0');
        setLiveUtc(`${h}:${m}:${s} UTC`);
        setLiveUtcShort(`${h}:${m} Z`);
      } else {
        const metRef = new Date('2026-03-01T00:00:00Z').getTime();
        const diffMs = Math.max(0, now.getTime() - metRef);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setLiveUtc(`MET T+ ${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        setLiveUtcShort(`T+${days}d`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [clockMode]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Apollo Quindar Tone & Deep Space Audio Synthesizer
  const toggleAudioCarrier = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!isAudioActive) {
        const quindar = ctx.createOscillator();
        const qGain = ctx.createGain();
        quindar.type = 'sine';
        quindar.frequency.setValueAtTime(2524, ctx.currentTime);
        qGain.gain.setValueAtTime(0.04, ctx.currentTime);
        qGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
        quindar.connect(qGain);
        qGain.connect(ctx.destination);
        quindar.start();
        quindar.stop(ctx.currentTime + 0.25);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        humOscRef.current = osc;
        humGainRef.current = gain;
        setIsAudioActive(true);
      } else {
        if (humGainRef.current && audioCtxRef.current) {
          humGainRef.current.gain.exponentialRampToValueAtTime(0.00001, audioCtxRef.current.currentTime + 0.08);
          setTimeout(() => {
            humOscRef.current?.stop();
            humOscRef.current?.disconnect();
            humGainRef.current?.disconnect();
            humOscRef.current = null;
            humGainRef.current = null;
          }, 100);
        }
        setIsAudioActive(false);
      }
    } catch {
      setIsAudioActive(false);
    }
  };

  // Adjust simulation date by hours
  const shiftEpoch = (hours: number) => {
    const d = new Date(selectedDate);
    d.setHours(d.getHours() + hours);
    setSelectedDate(d.toISOString().slice(0, 16));
  };

  const formattedEpoch = selectedDate.replace('T', ' ') + ' UTC';

  // Filtered sites for target picker
  const filteredSites = SITES.filter(
    (s) =>
      s.name.toLowerCase().includes(siteSearchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(siteSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* Click-away backdrop for dropdowns */}
      {(isSiteMenuOpen || isMissionMenuOpen || isEpochMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[0.5px]"
          onClick={() => {
            setIsSiteMenuOpen(false);
            setIsMissionMenuOpen(false);
            setIsEpochMenuOpen(false);
          }}
        />
      )}

      {/* Main Header Container: Blanc comme couleur principale, responsive padding & layout */}
      <header className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] px-2.5 sm:px-4 lg:px-6 flex items-center justify-between text-[#0F172A] select-none sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] w-full">
        {/* =================================================================== */}
        {/* 1. Left Section: Sidebar Toggle, Brand Insignia & Mission Selector */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {/* Sidebar Toggle: Bouton Noir */}
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-colors shrink-0"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={16} />
          </button>

          {/* NASA CLPS Brand Emblem */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center shadow-md">
                <Moon size={16} className="text-[#38BDF8]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[12px] sm:text-[13px] font-black tracking-tight text-[#0F172A] leading-none whitespace-nowrap">
                  LUNAR HORIZON
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#000000] text-white tracking-widest uppercase">
                  CLPS · FDO
                </span>
              </div>
              <span className="hidden md:block text-[8.5px] uppercase tracking-wider font-mono font-bold text-[#64748B] mt-0.5">
                NASA PDS · LOLA 16-BIT TOPOGRAPHY
              </span>
            </div>
          </div>

          <div className="hidden xl:block w-px h-6 bg-[#E2E8F0]" />

          {/* Mission Selector Button: Bouton Noir (Visible on large screens) */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => {
                setIsMissionMenuOpen(!isMissionMenuOpen);
                setIsSiteMenuOpen(false);
                setIsEpochMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#000000] text-white text-[11px] font-bold hover:bg-[#1E293B] shadow-sm transition-all"
            >
              <Rocket size={13} className="text-[#38BDF8]" />
              <span className="text-slate-300 font-medium">Mission:</span>
              <span className="font-extrabold truncate max-w-[170px]">
                {missionName}
              </span>
              <ChevronDown size={12} className="text-slate-300" />
            </button>

            {/* Mission Dropdown Card: Blanc */}
            {isMissionMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-84 bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl shadow-2xl p-2 z-50 text-[11px] animate-in fade-in duration-100"
                onMouseLeave={() => setIsMissionMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9] mb-1">
                  Active Flight Programs
                </div>
                <div className="space-y-1">
                  {PRESET_MISSIONS.map((m) => {
                    const isCurrent = missionName.includes(m.name.slice(0, 10));
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setMissionName(m.name);
                          setIsMissionMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl cursor-pointer transition-all flex items-start justify-between ${
                          isCurrent
                            ? 'bg-[#000000] text-white shadow-sm'
                            : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                        }`}
                      >
                        <div className="flex-1 pr-2">
                          <div className="font-extrabold text-[11.5px]">{m.name}</div>
                          <div className={`text-[9.5px] font-mono mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-[#64748B]'}`}>
                            {m.agency} · {m.target}
                          </div>
                        </div>
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isCurrent
                              ? 'bg-white/20 text-[#38BDF8]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. Center: Active Target Landing Site Selector (Bouton Noir) */}
        {/* =================================================================== */}
        <div className="flex items-center justify-center px-1 shrink min-w-0">
          <div className="relative">
            <button
              onClick={() => {
                setIsSiteMenuOpen(!isSiteMenuOpen);
                setIsMissionMenuOpen(false);
                setIsEpochMenuOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#000000] text-white text-[11px] sm:text-[11.5px] font-bold hover:bg-[#1E293B] shadow-sm transition-all group max-w-[160px] sm:max-w-none"
            >
              <MapPin size={13} className="text-[#38BDF8] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold truncate max-w-[80px] sm:max-w-none">{selectedSite.name}</span>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#38BDF8] bg-white/10 px-1 sm:px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                LOLA {formatElevation(selectedSite.elevation)}
              </span>
              <span className="font-mono text-[10px] text-slate-300 hidden lg:inline shrink-0">
                {formatCoordinates(selectedSite.lat, selectedSite.lon, 1)}
              </span>
              <ChevronDown size={11} className="text-slate-300 shrink-0" />
            </button>

            {/* Target Catalog Dropdown: Blanc, Responsive Width */}
            {isSiteMenuOpen && (
              <div
                className="fixed sm:absolute left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 top-16 sm:top-auto sm:mt-2 w-auto sm:w-92 bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl shadow-2xl p-2.5 z-50 text-[11px] animate-in fade-in duration-100 max-w-sm mx-auto"
                onMouseLeave={() => setIsSiteMenuOpen(false)}
              >
                {/* Search Target Input */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-2.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search candidate targets (e.g. Malapert)..."
                    value={siteSearchQuery}
                    onChange={(e) => setSiteSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[11px] text-[#0F172A] outline-none focus:border-[#000000] transition-colors"
                  />
                </div>

                <div className="max-h-60 sm:max-h-72 overflow-y-auto space-y-1 pr-1">
                  {filteredSites.map((site) => {
                    const isSelected = selectedSite.id === site.id;
                    return (
                      <div
                        key={site.id}
                        onClick={() => {
                          setSelectedSite(site);
                          setIsSiteMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#000000] text-white font-bold shadow-sm'
                            : 'hover:bg-[#F8FAFC] text-[#0F172A]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[11.5px]">{site.name}</span>
                            {isSelected && <Check size={12} className="text-[#38BDF8]" />}
                          </div>
                          <div
                            className={`text-[9.5px] font-mono mt-0.5 ${
                              isSelected ? 'text-slate-300' : 'text-[#64748B]'
                            }`}
                          >
                            {formatCoordinates(site.lat, site.lon, 1)} · LOLA {formatElevation(site.elevation)}
                          </div>
                        </div>
                        <span
                          className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            isSelected
                              ? 'bg-white/20 text-[#38BDF8]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {site.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. Right: Epoch Controller, Live Clock & Utilities (Boutons Noirs) */}
        {/* =================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Epoch Controller Button: Bouton Noir (Responsive: Icon on mobile, full text on tablet/desktop) */}
          <div className="relative">
            {/* Desktop / Tablet Full Button */}
            <button
              onClick={() => {
                setIsEpochMenuOpen(!isEpochMenuOpen);
                setIsSiteMenuOpen(false);
                setIsMissionMenuOpen(false);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#000000] text-white font-mono text-[11px] font-bold hover:bg-[#1E293B] shadow-sm transition-all"
              title="Click to adjust simulation epoch"
            >
              <Calendar size={12} className="text-[#38BDF8]" />
              <span className="text-slate-300 text-[9px] uppercase font-bold tracking-wider hidden lg:inline">
                EPOCH:
              </span>
              <span className="font-extrabold">{formattedEpoch}</span>
              <ChevronDown size={11} className="text-slate-300" />
            </button>

            {/* Mobile Compact Icon Button */}
            <button
              onClick={() => {
                setIsEpochMenuOpen(!isEpochMenuOpen);
                setIsSiteMenuOpen(false);
                setIsMissionMenuOpen(false);
              }}
              className="md:hidden w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-all"
              title={`Epoch: ${formattedEpoch}`}
            >
              <Calendar size={14} className="text-[#38BDF8]" />
            </button>

            {/* Epoch Popover Card: Blanc, Responsive Positioning */}
            {isEpochMenuOpen && (
              <div
                className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-24px)] sm:w-76 max-w-xs bg-[#FFFFFF] border border-[#CBD5E1] rounded-2xl shadow-2xl p-3 z-50 text-[11px] animate-in fade-in duration-100"
                onMouseLeave={() => setIsEpochMenuOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-2.5">
                  <span className="font-mono text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    Simulation Epoch
                  </span>
                  {/* Bouton Noir: SET TO NOW */}
                  <button
                    onClick={() => {
                      const now = new Date();
                      setSelectedDate(now.toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#000000] text-white hover:bg-[#1E293B] font-mono text-[9px] font-bold transition-colors shadow-sm"
                  >
                    SET TO NOW
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-[9.5px] font-mono text-[#64748B] mb-1 font-bold">
                    TARGET DATE & TIME (UTC)
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-mono text-[11px] font-bold outline-none focus:border-[#000000]"
                  />
                </div>

                {/* Quick Stepper Boutons Noirs */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono text-[#64748B] uppercase font-bold">
                    Quick Time Scrub
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                    <button
                      onClick={() => shiftEpoch(-24)}
                      className="py-1 px-1.5 bg-[#000000] hover:bg-[#1E293B] text-white rounded-lg text-center font-bold transition-colors shadow-sm"
                    >
                      -24h
                    </button>
                    <button
                      onClick={() => shiftEpoch(-1)}
                      className="py-1 px-1.5 bg-[#000000] hover:bg-[#1E293B] text-white rounded-lg text-center font-bold transition-colors shadow-sm"
                    >
                      -1h
                    </button>
                    <button
                      onClick={() => shiftEpoch(1)}
                      className="py-1 px-1.5 bg-[#000000] hover:bg-[#1E293B] text-white rounded-lg text-center font-bold transition-colors shadow-sm"
                    >
                      +1h
                    </button>
                    <button
                      onClick={() => shiftEpoch(24)}
                      className="py-1 px-1.5 bg-[#000000] hover:bg-[#1E293B] text-white rounded-lg text-center font-bold transition-colors shadow-sm"
                    >
                      +24h
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Synchronous Clock Button: Bouton Noir (Responsive: full on sm+, compact on mobile) */}
          <button
            onClick={() => setClockMode(clockMode === 'UTC' ? 'MET' : 'UTC')}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#000000] text-white font-mono text-[10.5px] sm:text-[11px] font-bold hover:bg-[#1E293B] shadow-sm transition-all"
            title={`Click to switch between UTC and MET (Active: ${clockMode})`}
          >
            <Clock size={12} className="text-[#38BDF8] shrink-0" />
            <span className="hidden sm:inline">{liveUtc || 'SYNCING…'}</span>
            <span className="sm:hidden">{liveUtcShort || 'UTC'}</span>
          </button>

          {/* Audio Quindar Toggle Button: Bouton Noir */}
          <button
            onClick={toggleAudioCarrier}
            className={`w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-all shrink-0 ${
              isAudioActive ? 'ring-2 ring-[#38BDF8]' : ''
            }`}
            title={isAudioActive ? 'Mute Apollo Quindar Tone & Carrier' : 'Play Apollo Quindar Tone & Carrier'}
          >
            {isAudioActive ? <Volume2 size={13} className="text-[#38BDF8]" /> : <VolumeX size={13} />}
          </button>

          {/* Fullscreen Button: Bouton Noir (Hidden on mobile) */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-[#000000] text-white hidden lg:flex items-center justify-center hover:bg-[#1E293B] shadow-sm transition-all shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Flight Dynamics Officer Badge: Bouton Noir */}
          <div
            className="w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center font-mono font-black text-[10.5px] shadow-sm cursor-pointer hover:bg-[#1E293B] transition-colors shrink-0"
            title="Console: Flight Dynamics Officer (FDO)"
          >
            FDO
          </div>
        </div>
      </header>
    </>
  );
}
