'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TacticalMap } from '@/components/map/TacticalMap';
import { InformationFeed } from '@/components/feed/InformationFeed';
import { DecisionPanel } from '@/components/decision/DecisionPanel';
import { AfterActionReview } from '@/components/aar/AfterActionReview';
import { ReplayModal } from '@/components/replay/ReplayModal';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';
import { validateScenario } from '@/lib/simulation/scenario';
import { Award, RotateCcw, LayoutGrid, Terminal } from 'lucide-react';

export default function ConsolePage() {
  const { scenario, loadScenario, isRunning, speedMultiplier, advanceTick } = useSimulationStore();
  const { decisions } = useSessionStore();
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'AAR'>('CONSOLE');
  const [isReplayOpen, setIsReplayOpen] = useState(false);

  // Initialize scenario if not loaded
  useEffect(() => {
    if (!scenario) {
      const validated = validateScenario(scn06);
      loadScenario(validated);
    }
  }, [scenario, loadScenario]);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 100; // 100ms real time
    const timer = setInterval(() => {
      // 100ms * speedMultiplier of simulation time
      advanceTick(intervalMs * speedMultiplier);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier, advanceTick]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec]">
      {/* Top Header */}
      <Header />

      {/* Mode Sub-Navbar */}
      <div className="bg-[#141618] border-b border-[#2a2d30] px-4 py-1.5 flex items-center justify-between font-mono text-xs z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CONSOLE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all text-xs font-semibold ${
              activeTab === 'CONSOLE'
                ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/40'
                : 'text-[#8a9099] hover:text-[#e8eaec]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>OPERATIONAL CONSOLE</span>
          </button>

          <button
            onClick={() => setActiveTab('AAR')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all text-xs font-semibold ${
              activeTab === 'AAR'
                ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/40'
                : 'text-[#8a9099] hover:text-[#e8eaec]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>AFTER-ACTION REVIEW ({decisions.length})</span>
          </button>
        </div>

        {decisions.length > 0 && (
          <button
            onClick={() => setIsReplayOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#4fc3d0]/50 text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>REPLAY LAST DECISION</span>
          </button>
        )}
      </div>

      {/* Main Tactical Screen */}
      <main className="flex-1 overflow-hidden p-2 sm:p-3">
        {activeTab === 'CONSOLE' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 h-full">
            {/* Operational Map (Left) */}
            <div className="lg:col-span-5 h-[320px] lg:h-full">
              <TacticalMap />
            </div>

            {/* Information Feed (Middle) */}
            <div className="lg:col-span-4 h-[320px] lg:h-full">
              <InformationFeed />
            </div>

            {/* Decision Panel (Right) */}
            <div className="lg:col-span-3 h-[320px] lg:h-full">
              <DecisionPanel />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <AfterActionReview />
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      <Footer />

      {/* Decision Replay Modal */}
      <ReplayModal isOpen={isReplayOpen} onClose={() => setIsReplayOpen(false)} />
    </div>
  );
}
