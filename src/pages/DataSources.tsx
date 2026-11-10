// ============================================================================
// Lunar Horizon — Page 7: Data & Sources
// Documentation of official NASA datasets, ephemeris sources, and processing
// ============================================================================

import React from 'react';
import { Database, ExternalLink, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function DataSources() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1550px] mx-auto">
      <div>
        <h2 className="page-title">Data & Scientific Sources</h2>
        <p className="page-subtitle">
          Official NASA datasets, planetary ephemerides, and lunar coordinate models integrated into Lunar Horizon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source 1: NASA CGI Moon Kit */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="badge badge-demo">NASA SVS</span>
            <span className="text-[10px] font-mono text-[#64748B]">NASA Scientific Visualization Studio</span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">NASA CGI Moon Kit 2.0</h3>
          <p className="text-[12px] text-[#475569] leading-relaxed">
            The global lunar color mosaic is derived from NASA’s Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera (WAC) data. It provides true-scale lunar albedo and mare/highland color distinction across all lunar latitudes.
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1 text-[11px] font-mono">
            <div>Texture: <span className="font-bold text-[#0F172A]">lroc_color_16bit_srgb_4k.tif</span></div>
            <div>Resolution: <span className="font-bold text-[#0F172A]">4096 × 2048 pixels (equirectangular)</span></div>
            <div>Generated: <span className="font-bold text-[#0F172A]">lroc_color_4k.webp (1.6 MB)</span></div>
          </div>
        </div>

        {/* Source 2: LOLA Elevation Model */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="badge badge-demo">NASA PDS</span>
            <span className="text-[10px] font-mono text-[#64748B]">NASA Planetary Data System</span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">LOLA Global Elevation Map (LDEM_16)</h3>
          <p className="text-[12px] text-[#475569] leading-relaxed">
            Acquired by the Lunar Orbiter Laser Altimeter (LOLA) aboard NASA’s Lunar Reconnaissance Orbiter (LRO). Unsigned 16-bit integer format where <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">elevation_m = raw_uint16 * 0.5 - 10000.0</code> relative to the 1,737.4 km lunar sphere.
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1 text-[11px] font-mono">
            <div>Source: <span className="font-bold text-[#0F172A]">ldem_16_uint.tif (5760 × 2880, 16-bit)</span></div>
            <div>Displacement: <span className="font-bold text-[#0F172A]">ldem_displacement_4k.webp (546 KB)</span></div>
            <div>Elevation Grid: <span className="font-bold text-[#0F172A]">ldem_elevation_720x360.bin (506 KB)</span></div>
            <div>Elevation Range: <span className="font-bold text-[#0F172A]">-8,981.5 m to +10,685.5 m</span></div>
          </div>
        </div>

        {/* Source 3: JPL Horizons Ephemeris */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="badge badge-demo">NASA JPL</span>
            <span className="text-[10px] font-mono text-[#64748B]">Solar System Dynamics</span>
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">JPL Horizons Ephemeris System</h3>
          <p className="text-[12px] text-[#475569] leading-relaxed">
            Provides sub-solar and sub-Earth coordinate solutions taking into account the Moon’s 1.543° axial inclination to the ecliptic, lunar diurnal cycles (29.53059 solar synodic days), and physical and optical librations (up to ±7.9° in longitude and ±6.7° in latitude).
          </p>
        </div>

        {/* Source 4: Scientific Disclaimer */}
        <div className="card space-y-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0F172A]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Scientific Resolution & Scope Notice</h3>
          </div>
          <p className="text-[12px] text-[#475569] leading-relaxed">
            The global 3D model and elevation queries are based on LOLA LDEM_16 data (16 pixels/degree, approximately 1.89 km/pixel at the equator). This is suitable for regional horizon blockage, macro-slope assessment, and mission comparison. High-resolution localized micro-hazard planning can be extended with targeted LOLA 128 px/deg polar DEM tiles.
          </p>
        </div>
      </div>
    </div>
  );
}
