'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatPercent, formatTime } from '@/lib/utils';
import { Shield, Radio, Activity, Eye, Terminal, BookOpen, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { scenario, tick, missionPhase, commHealth, infoIntegrity, overallDegradationState } = useSimulationStore();
  const { sessionId } = useSessionStore();

  const getStatusColor = (health: number) => {
    if (health >= 0.75) return 'text-[#2ecc71] border-[#2ecc71]/40 bg-[#2ecc71]/10';
    if (health >= 0.45) return 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10';
    return 'text-[#c0392b] border-[#c0392b]/40 bg-[#c0392b]/10 animate-pulse';
  };

  const navLinks = [
    { href: '/console', label: 'TRAINEE CONSOLE', icon: Terminal },
    { href: '/instructor', label: 'INSTRUCTOR CONTROL', icon: Layers },
    { href: '/scenarios', label: 'SCENARIO LIBRARY', icon: BookOpen },
    { href: '/data-sources', label: 'DATA PROVENANCE', icon: Eye },
  ];

  return (
    <header className="bg-[#141618] border-b border-[#2a2d30] px-4 py-2 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs font-mono select-none z-30">
      {/* Brand & Mission Identification */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded border border-[#4fc3d0]/60 bg-[#4fc3d0]/10 flex items-center justify-center text-[#4fc3d0] group-hover:border-[#4fc3d0] transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold tracking-widest text-[#e8eaec] text-sm flex items-center gap-2">
              NEXUS-C2
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2a2d30] text-[#8a9099] font-normal">SIH26248</span>
            </div>
            <div className="text-[10px] text-[#8a9099] tracking-wider">DECIDE UNDER UNCERTAINTY</div>
          </div>
        </Link>

        <div className="h-6 w-[1px] bg-[#2a2d30] hidden sm:block" />

        {/* Scenario & Session Meta */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1c1f21] px-2 py-1 rounded border border-[#2a2d30]">
            <span className="text-[#8a9099] mr-1">SCN:</span>
            <span className="text-[#4fc3d0] font-semibold">{scenario?.id || 'SCN-06'}</span>
          </div>
          <div className="bg-[#1c1f21] px-2 py-1 rounded border border-[#2a2d30] hidden md:block">
            <span className="text-[#8a9099] mr-1">SESSION:</span>
            <span className="text-[#e8eaec]">{sessionId}</span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Indicators */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Training Clock */}
        <div className="bg-[#0d0f10] border border-[#2a2d30] px-3 py-1 rounded flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4fc3d0] animate-pulse" />
          <span className="text-[#8a9099]">CLOCK:</span>
          <span className="text-[#4fc3d0] font-bold text-sm">{formatTime(tick)}</span>
        </div>

        {/* Mission Phase */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] px-3 py-1 rounded hidden lg:flex items-center gap-2 text-[11px]">
          <Activity className="w-3.5 h-3.5 text-[#8a9099]" />
          <span className="text-[#8a9099]">PHASE:</span>
          <span className="text-[#e8eaec] font-medium">{missionPhase}</span>
        </div>

        {/* Comms Health Bar */}
        <div className="flex items-center gap-2 bg-[#1c1f21] border border-[#2a2d30] px-2.5 py-1 rounded">
          <Radio className="w-3.5 h-3.5 text-[#4fc3d0]" />
          <span className="text-[#8a9099] text-[10px]">COMMS</span>
          <div className="w-16 h-2 bg-[#0d0f10] rounded-sm overflow-hidden border border-[#2a2d30]">
            <div
              className={`h-full transition-all duration-300 ${commHealth > 0.7 ? 'bg-[#2ecc71]' : commHealth > 0.4 ? 'bg-[#d4860a]' : 'bg-[#c0392b]'}`}
              style={{ width: `${commHealth * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-[#e8eaec] min-w-[32px]">{formatPercent(commHealth)}</span>
        </div>

        {/* Info Integrity Bar */}
        <div className="flex items-center gap-2 bg-[#1c1f21] border border-[#2a2d30] px-2.5 py-1 rounded">
          <Shield className="w-3.5 h-3.5 text-[#4fc3d0]" />
          <span className="text-[#8a9099] text-[10px]">INTEGRITY</span>
          <div className="w-16 h-2 bg-[#0d0f10] rounded-sm overflow-hidden border border-[#2a2d30]">
            <div
              className={`h-full transition-all duration-300 ${infoIntegrity > 0.7 ? 'bg-[#2ecc71]' : infoIntegrity > 0.4 ? 'bg-[#d4860a]' : 'bg-[#c0392b]'}`}
              style={{ width: `${infoIntegrity * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-[#e8eaec] min-w-[32px]">{formatPercent(infoIntegrity)}</span>
        </div>

        {/* Overall Status Badge */}
        <div className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusColor(commHealth)}`}>
          {overallDegradationState}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-1.5 overflow-x-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50'
                  : 'text-[#8a9099] hover:text-[#e8eaec] hover:bg-[#1c1f21] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
