'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MultiplayerTeamStation } from '@/components/team/MultiplayerTeamStation';
import { useSimulationStore } from '@/stores/simulationStore';
import { Users, Shield, Radio, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function TeamPage() {
  const { scenario } = useSimulationStore();

  return (
    <div className="flex flex-col h-screen bg-[#0d0f10] text-[#e8eaec] overflow-hidden select-none font-mono">
      {/* Top Universal Header */}
      <Header />

      {/* Breadcrumb / Station Info Bar */}
      <div className="bg-[#141618] border-b border-[#2a2d30] px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Link href="/console" className="text-[#8a9099] hover:text-[#e8eaec]">
            CONSOLE
          </Link>
          <span className="text-[#4d5560]">/</span>
          <span className="text-[#4fc3d0] font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            MULTI-DOMAIN TEAM STATION
          </span>
          <span className="text-[#8a9099] hidden md:inline">&bull;</span>
          <span className="text-[#8a9099] hidden md:inline">
            SIH26248: Land-Air-Cyber-EW Small-Team Coordination
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-[#8a9099]">
            SCENARIO: <strong className="text-[#4fc3d0]">{scenario?.id || 'SCN-06'}</strong>
          </div>
          <Link
            href="/console"
            className="px-2.5 py-1 rounded bg-[#1c1f21] hover:bg-[#2a2d30] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] text-[11px] transition-colors"
          >
            ← BACK TO CONSOLE
          </Link>
        </div>
      </div>

      {/* Main Team Command Station */}
      <main className="flex-1 p-3 overflow-hidden">
        <MultiplayerTeamStation />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
