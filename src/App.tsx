// ============================================================================
// Lunar Horizon — Application Root Component & Router
// ============================================================================

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages
import MissionOverview from './pages/MissionOverview';
import SiteExplorer from './pages/SiteExplorer';
import Simulator from './pages/Simulator';
import ScenarioComparison from './pages/ScenarioComparison';
import MissionTimeline from './pages/MissionTimeline';
import AiAdvisor from './pages/AiAdvisor';
import DataSources from './pages/DataSources';
import Settings from './pages/Settings';
import { lunarTerrainService } from './services/lunarTerrainService';

export default function App() {
  useEffect(() => {
    // Warm up NASA LOLA elevation service in the background
    lunarTerrainService.init().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FFFFFF] text-[#0F172A]">
        {/* Persistent Top Navigation Bar */}
        <Navbar />

        {/* Main Body Area: Persistent Sidebar + Content */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          <Sidebar />

          <main className="flex-1 min-w-0 h-full overflow-hidden relative">
            <Routes>
              <Route path="/" element={<MissionOverview />} />
              <Route path="/explorer" element={<SiteExplorer />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/comparison" element={<ScenarioComparison />} />
              <Route path="/timeline" element={<MissionTimeline />} />
              <Route path="/advisor" element={<AiAdvisor />} />
              <Route path="/data" element={<DataSources />} />
              <Route path="/settings" element={<Settings />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
