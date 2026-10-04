'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatPercent, formatTime } from '@/lib/utils';
import { tacticalAudio } from '@/lib/audio';
import { JudgeTourModal } from '@/components/guide/JudgeTourModal';
import {
  Shield,
  Radio,
  Terminal,
  Layers,
  BookOpen,
  Database,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sliders,
  Zap,
} from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { scenario, tick, commHealth, infoIntegrity, overallDegradationState } = useSimulationStore();
  const { sessionId } = useSessionStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    tacticalAudio.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleAudio = () => {
    const nextState = !audioMuted;
    setAudioMuted(nextState);
    tacticalAudio.enabled = !nextState;
    if (!nextState) tacticalAudio.playClick();
  };

  // Format long degradation state strings into concise, readable badges
  const formatStateBadge = (state: string) => {
    switch (state) {
      case 'NORMAL':
        return { label: 'NOMINAL', color: 'text-[#2ecc71] border-[#2ecc71]/40 bg-[#2ecc71]/10' };
      case 'MINOR_DELAY':
        return { label: 'MINOR DELAY', color: 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10' };
      case 'HIGH_LATENCY':
        return { label: 'HIGH LATENCY', color: 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10' };
      case 'PARTIAL_DROPOUT':
        return { label: 'DROPOUT', color: 'text-[#c0392b] border-[#c0392b]/40 bg-[#c0392b]/10' };
      case 'SEVERE_DROPOUT':
        return { label: 'SEVERE DROPOUT', color: 'text-[#c0392b] border-[#c0392b]/40 bg-[#c0392b]/10 animate-pulse' };
      case 'STALE_INFORMATION':
        return { label: 'STALE INFO', color: 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10' };
      case 'CONTRADICTORY_REPORTS':
        return { label: 'CONTRADICTION', color: 'text-[#c0392b] border-[#c0392b]/50 bg-[#c0392b]/15 animate-pulse' };
      case 'PARTIAL_SENSOR_LOSS':
        return { label: 'SENSOR LOSS', color: 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10' };
      case 'RELAY_FAILURE':
        return { label: 'RELAY FAIL', color: 'text-[#c0392b] border-[#c0392b]/40 bg-[#c0392b]/10 animate-pulse' };
      case 'BANDWIDTH_CONGESTION':
        return { label: 'CONGESTION', color: 'text-[#d4860a] border-[#d4860a]/40 bg-[#d4860a]/10' };
      case 'RECOVERY':
        return { label: 'RECOVERING', color: 'text-[#4fc3d0] border-[#4fc3d0]/40 bg-[#4fc3d0]/10' };
      case 'RECOVERED':
        return { label: 'RECOVERED', color: 'text-[#2ecc71] border-[#2ecc71]/40 bg-[#2ecc71]/10' };
      default:
        return { label: state, color: 'text-[#8a9099] border-[#2a2d30] bg-[#1c1f21]' };
    }
  };

  const currentStatus = formatStateBadge(overallDegradationState);

  const navLinks = [
    { href: '/console', label: 'CONSOLE', icon: Terminal },
    { href: '/instructor', label: 'INSTRUCTOR', icon: Layers },
    { href: '/scenarios', label: 'SCENARIOS', icon: BookOpen },
    { href: '/builder', label: 'BUILDER', icon: Sliders },
    { href: '/data-sources', label: 'DATA', icon: Database },
  ];

  return (
    <header className="bg-[#141618] border-b border-[#2a2d30] h-12 px-3 sm:px-4 flex items-center justify-between gap-3 text-xs font-mono select-none z-30 shadow-md whitespace-nowrap overflow-x-auto print:hidden">
      {/* Left: Brand & Mission ID */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded border border-[#4fc3d0]/60 bg-[#4fc3d0]/10 flex items-center justify-center text-[#4fc3d0] group-hover:border-[#4fc3d0] group-hover:scale-105 transition-all">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-[#e8eaec] text-sm">NEXUS-C2</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2d30] text-[#4fc3d0] font-normal border border-[#4fc3d0]/30 hidden sm:inline">
              SIH26248
            </span>
          </div>
        </Link>

        {/* Compact Scenario & Session Meta */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-[#2a2d30] text-[11px]">
          <span className="bg-[#1c1f21] px-2 py-0.5 rounded border border-[#2a2d30] text-[#4fc3d0] font-semibold">
            {scenario?.id || 'SCN-06'}
          </span>
          <span className="bg-[#1c1f21] px-2 py-0.5 rounded border border-[#2a2d30] text-[#8a9099] hidden lg:inline">
            {sessionId}
          </span>
        </div>
      </div>

      {/* Center: Live Telemetry Indicators (Clean, Fixed, Non-Wrapping) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Clock */}
        <div className="bg-[#0d0f10] border border-[#2a2d30] px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4fc3d0] animate-pulse" />
          <span className="text-[#8a9099] text-[10px]">T:</span>
          <span className="text-[#4fc3d0] font-bold text-xs">{formatTime(tick)}</span>
        </div>

        {/* Comms Quality */}
        <div className="flex items-center gap-1.5 bg-[#1c1f21] border border-[#2a2d30] px-2 py-1 rounded">
          <Radio className="w-3 h-3 text-[#4fc3d0]" />
          <span className="text-[#8a9099] text-[10px]">COMMS</span>
          <span className={`text-[11px] font-bold ${commHealth > 0.7 ? 'text-[#2ecc71]' : commHealth > 0.4 ? 'text-[#d4860a]' : 'text-[#c0392b]'}`}>
            {formatPercent(commHealth)}
          </span>
        </div>

        {/* ICE Integrity */}
        <div className="flex items-center gap-1.5 bg-[#1c1f21] border border-[#2a2d30] px-2 py-1 rounded">
          <Shield className="w-3 h-3 text-[#4fc3d0]" />
          <span className="text-[#8a9099] text-[10px]">ICE</span>
          <span className={`text-[11px] font-bold ${infoIntegrity > 0.7 ? 'text-[#2ecc71]' : infoIntegrity > 0.4 ? 'text-[#d4860a]' : 'text-[#c0392b]'}`}>
            {formatPercent(infoIntegrity)}
          </span>
        </div>

        {/* Status Badge */}
        <div className={`px-2 py-1 rounded border text-[10px] font-bold ${currentStatus.color}`}>
          {currentStatus.label}
        </div>
      </div>

      {/* Right: Station Nav Links & Utility Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50 shadow-[0_0_8px_rgba(79,195,208,0.2)]'
                    : 'text-[#8a9099] hover:text-[#e8eaec] hover:bg-[#1c1f21] border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Interactive Tour Button */}
        <button
          onClick={() => {
            tacticalAudio.playClick();
            setIsTourOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4fc3d0]/15 hover:bg-[#4fc3d0]/25 text-[#4fc3d0] border border-[#4fc3d0]/50 font-bold transition-all text-[11px] shadow-sm shadow-[#4fc3d0]/10 shrink-0"
          title="Open Interactive Hackathon Judge Tour & Evaluation Guide"
        >
          <Zap className="w-3 h-3 fill-current animate-pulse text-[#4fc3d0]" />
          <span>TOUR</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-1.5 rounded border transition-colors shrink-0 ${
            audioMuted
              ? 'border-[#c0392b]/40 text-[#c0392b] bg-[#c0392b]/10'
              : 'border-[#2a2d30] text-[#8a9099] hover:text-[#4fc3d0] bg-[#1c1f21]'
          }`}
          title={audioMuted ? 'Unmute Tactical Audio' : 'Mute Tactical Audio'}
        >
          {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded border border-[#2a2d30] hover:border-[#4fc3d0]/50 text-[#8a9099] hover:text-[#4fc3d0] bg-[#1c1f21] transition-colors shrink-0"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Interactive Hackathon Evaluator & Judge Tour Modal */}
      <JudgeTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onLaunchAutoDemo={() => {
          router.push('/console?autodemo=1');
        }}
      />
    </header>
  );
};
