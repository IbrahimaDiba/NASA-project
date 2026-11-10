// ============================================================================
// Lunar Horizon — Page 6: AI Mission Advisor
// AI analysis and operational recommendations for lunar landing scenarios
// ============================================================================

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Bot } from 'lucide-react';
import { useMissionStore } from '../stores/useMissionStore';
import { getMissionMetrics } from '../data/solar-data';
import { formatCoordinates } from '../data/sites';

export default function AiAdvisor() {
  const { selectedSite, selectedDate } = useMissionStore();
  const metrics = getMissionMetrics(selectedDate, selectedSite);

  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello, Mission Planner. I have evaluated candidate site ${selectedSite.name} (${formatCoordinates(
        selectedSite.lat,
        selectedSite.lon
      )}) at epoch ${selectedDate}. It offers ${metrics.solarElevation > 0 ? 'positive solar elevation of +' + metrics.solarElevation + '°' : 'sub-horizon solar elevation'} and an elevation of ${selectedSite.elevation}m based on NASA LOLA altimetry. How can I assist with your trajectory or mission trade study?`,
    },
  ]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userText = question;
    setQuestion('');
    setConversation((prev) => [...prev, { sender: 'user', text: userText }]);

    setTimeout(() => {
      let reply = `Based on high-resolution LOLA DEM topography and JPL SPICE orbital ephemeris, ${selectedSite.name} provides viable direct-to-Earth communication margin (${metrics.earthElevation > 0 ? '+' + metrics.earthElevation + '° elevation' : 'blocked'}). To maximize power reserve, consider aligning solar panel orientation towards azimuth ${metrics.sunAzimuth}°.`;
      setConversation((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FFFFFF] p-6 space-y-6 max-w-[1550px] mx-auto">
      <div>
        <h2 className="page-title">AI Mission Advisor</h2>
        <p className="page-subtitle">
          Automated scenario synthesis, constraint reconciliation, and mission recommendation engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat & Reasoning Interface */}
        <div className="card lg:col-span-2 flex flex-col h-[600px] p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#000000] text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Lunar Horizon Autonomous Co-Pilot</h3>
                <span className="text-[10px] text-[#64748B]">Trained on NASA SPICE, LOLA DEM, and LROC Datasets</span>
              </div>
            </div>
            <span className="badge badge-demo text-[9px]">Active Engine</span>
          </div>

          {/* Conversation history */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#000000] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-[12.5px] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#000000] text-white'
                      : 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Prompt input */}
          <form onSubmit={handleAsk} className="p-3 border-t border-[#E2E8F0] flex gap-2 bg-[#FFFFFF]">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about illumination windows, communication blackouts, or alternate dates…"
              className="input-field text-[12px] flex-1 bg-white border-[#CBD5E1]"
            />
            <button
              type="submit"
              className="btn btn-sm bg-[#000000] text-white px-4 text-[12px] font-bold"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Right: Automated Recommendations */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
              Automated Site Recommendations
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-center gap-1.5 text-[#15803D] font-bold text-xs">
                  <CheckCircle2 size={13} />
                  <span>Optimal High-Illumination Candidate</span>
                </div>
                <p className="text-[11px] text-[#166534] mt-1 leading-snug">
                  Malapert Massif provides over 90% peak solar illumination during southern summer and unblocked DTE line-of-sight.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FEFCE8] border border-[#FEF08A]">
                <div className="flex items-center gap-1.5 text-[#854D0E] font-bold text-xs">
                  <AlertTriangle size={13} />
                  <span>VIPER Volatile Trade-off</span>
                </div>
                <p className="text-[11px] text-[#713F12] mt-1 leading-snug">
                  Nobile Rim provides superior access to cold trap volatile deposits but requires strict energy conservation during low solar azimuth.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-xs">
                  <ShieldCheck size={13} />
                  <span>Relief Elevation Advantage</span>
                </div>
                <p className="text-[11px] text-[#475569] mt-1 leading-snug">
                  Site elevation of {selectedSite.elevation}m lowers topographical horizon blockage by approximately {(Math.sqrt(Math.max(0, selectedSite.elevation) * 2 / 1737400) * 180 / Math.PI).toFixed(2)}°.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
