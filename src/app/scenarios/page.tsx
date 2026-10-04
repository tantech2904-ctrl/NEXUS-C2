'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSimulationStore } from '@/stores/simulationStore';
import { validateScenario } from '@/lib/simulation/scenario';
import { BookOpen, Shield, Play, Layers, ExternalLink, Activity } from 'lucide-react';

import scn01 from '@/../data/scenarios/scn-01-maria.json';
import scn02 from '@/../data/scenarios/scn-02-anatolia.json';
import scn03 from '@/../data/scenarios/scn-03-chile.json';
import scn04 from '@/../data/scenarios/scn-04-storm-corridor.json';
import scn05 from '@/../data/scenarios/scn-05-seismic-window.json';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';

const ALL_SCENARIOS = [scn06, scn01, scn02, scn03, scn04, scn05];

export default function ScenariosPage() {
  const router = useRouter();
  const { loadScenario, startSimulation } = useSimulationStore();

  const handleLaunchScenario = (rawScenario: any) => {
    const validated = validateScenario(rawScenario);
    loadScenario(validated);
    startSimulation();
    router.push('/console');
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'FOUNDATION':
        return <span className="px-2 py-0.5 rounded bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/40 text-[10px] font-bold">FOUNDATION</span>;
      case 'ADVANCED':
        return <span className="px-2 py-0.5 rounded bg-[#d4860a]/20 text-[#d4860a] border border-[#d4860a]/40 text-[10px] font-bold">ADVANCED</span>;
      case 'EXPERT':
        return <span className="px-2 py-0.5 rounded bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/40 text-[10px] font-bold">EXPERT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner */}
        <div className="border-b border-[#2a2d30] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#4fc3d0] font-bold text-sm tracking-wider">
              <BookOpen className="w-5 h-5" />
              TACTICAL SCENARIO LIBRARY
            </div>
            <div className="text-xs text-[#8a9099] mt-0.5">
              Deterministic Training Injects Calibrated with Public Historical Crisis Telemetry
            </div>
          </div>
          <div className="text-xs text-[#8a9099] bg-[#141618] border border-[#2a2d30] px-3 py-1.5 rounded">
            6 PRE-CONFIGURED SCENARIOS &bull; 100% OFFLINE READY
          </div>
        </div>

        {/* Grid of Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SCENARIOS.map((scn) => {
            const isHistorical = Boolean(scn.historicalBasis);
            return (
              <div
                key={scn.id}
                className="bg-[#141618] border border-[#2a2d30] hover:border-[#4fc3d0]/60 p-4 rounded-sm flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#4fc3d0]">
                      {scn.id}
                    </span>
                    {getDifficultyBadge(scn.difficulty)}
                  </div>

                  <div className="font-bold text-sm text-[#e8eaec] group-hover:text-[#4fc3d0] transition-colors mb-2">
                    {scn.title}
                  </div>

                  {/* Historical vs Synthetic Tag */}
                  <div className="mb-3">
                    {isHistorical ? (
                      <div className="bg-[#1c1f21] border border-[#d4860a]/40 p-2 rounded text-[10px] space-y-1">
                        <div className="font-bold text-[#d4860a]">HISTORICAL BASIS — PUBLIC DATA</div>
                        <div className="text-[#8a9099] text-[9px] font-sans line-clamp-2">
                          {scn.historicalBasis}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1c1f21] border border-[#4fc3d0]/30 p-2 rounded text-[10px]">
                        <div className="font-bold text-[#4fc3d0]">SYNTHETIC BENCHMARK SCENARIO</div>
                        <div className="text-[#8a9099] text-[9px] font-sans">
                          Deterministic stress test for live hackathon evaluation.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11px] text-[#8a9099] mb-4">
                    <div className="flex justify-between">
                      <span>CHANNELS:</span>
                      <span className="text-[#e8eaec]">{scn.communicationChannels.length} active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TACTICAL ENTITIES:</span>
                      <span className="text-[#e8eaec]">{scn.entities.length} nodes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TIMED INJECTS:</span>
                      <span className="text-[#e8eaec]">{scn.events.length} events</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DECISION WINDOWS:</span>
                      <span className="text-[#4fc3d0] font-bold">{scn.decisionWindows.length} windows</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2a2d30] flex items-center justify-between">
                  <div className="text-[10px] text-[#8a9099]">EST. DURATION: ~3 MIN</div>
                  <button
                    onClick={() => handleLaunchScenario(scn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4fc3d0] text-black font-bold text-xs hover:bg-[#4fc3d0]/90 transition-all shadow-[0_0_10px_rgba(79,195,208,0.3)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>LAUNCH</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Footer */}
        <div className="p-4 bg-[#141618] border border-[#2a2d30] rounded text-center text-xs text-[#8a9099]">
          <span className="text-[#e8eaec] font-semibold">LEGAL & ETHICAL BOUNDARY:</span> All tactical formations, routes, callsigns, and events are synthetic training constructs. No sensitive military dispositions, classified facilities, or operational weapon procedures are represented.
        </div>
      </main>

      <Footer />
    </div>
  );
}
