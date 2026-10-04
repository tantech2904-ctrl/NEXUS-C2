'use client';

import React, { useEffect, useState, useRef } from 'react';
import { tacticalAudio } from '@/lib/audio';
import { Navigation, Sparkles, CheckCircle2, CornerDownLeft } from 'lucide-react';

interface VirtualCommanderCursorProps {
  tick: number;
  isRunning: boolean;
  onNavigateAar?: () => void;
}

interface CursorTarget {
  id: string;
  selector?: string;
  fallbackX: number; // percentage of viewport (0 - 100)
  fallbackY: number; // percentage of viewport (0 - 100)
  actionText: string;
  whoDoingWhat: string;
  clickAtTick?: number;
  typeText?: string;
}

export const VirtualCommanderCursor: React.FC<VirtualCommanderCursorProps> = ({
  tick,
  isRunning,
  onNavigateAar,
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number; id: number } | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>('Command Initializing...');
  const [actionDescription, setActionDescription] = useState<string>('Trainee Commander monitoring telemetry');
  const [isTyping, setIsTyping] = useState(false);
  const [typedChars, setTypedChars] = useState('');
  const clickCountRef = useRef(0);
  const lastClickTickRef = useRef(-1);

  // Scripted Timeline of Cursor Navigation Targets during 3-Minute Auto Run
  const getActiveTarget = (currentTick: number): CursorTarget => {
    // Stage 1: T+00 to T+18 (Topographic Map & Baseline Telemetry)
    if (currentTick < 10000) {
      return {
        id: 'map-nominal',
        selector: '.tactical-map-container',
        fallbackX: 25,
        fallbackY: 35,
        actionText: 'Inspecting 1:50,000 Topographic Map & Microwave Relays',
        whoDoingWhat: 'TRAINEE CMDR: Verifying nominal link availability (98%)',
        clickAtTick: 5000,
      };
    }
    if (currentTick < 18000) {
      return {
        id: 'map-node-click',
        fallbackX: 28,
        fallbackY: 45,
        actionText: 'Clicking Relay Tower 02 to check line-of-sight telemetry',
        whoDoingWhat: 'TRAINEE CMDR: Inspecting forward transmission node',
        clickAtTick: 14000,
      };
    }

    // Stage 2: T+18 to T+38 (Carrier Degradation & Latency)
    if (currentTick < 28000) {
      return {
        id: 'comms-bar-check',
        selector: '#header-comms-status',
        fallbackX: 42,
        fallbackY: 8,
        actionText: 'Noticing +450ms carrier delay spike & slowing packet trails',
        whoDoingWhat: 'TRAINEE CMDR: Detecting backhaul disruption in Header telemetry',
        clickAtTick: 22000,
      };
    }
    if (currentTick < 38000) {
      return {
        id: 'feed-monitoring',
        selector: '[data-tour="feed-stream"]',
        fallbackX: 52,
        fallbackY: 28,
        actionText: 'Watching incoming intelligence feed for field team reports',
        whoDoingWhat: 'TRAINEE CMDR: Monitoring intelligence queue for delay decay',
        clickAtTick: 32000,
      };
    }

    // Stage 3: T+38 to T+65 (Contradiction & ICE Confidence Engine)
    if (currentTick < 52000) {
      return {
        id: 'feed-contradiction-card',
        selector: '[data-tour="feed-item-CONTRADICTED"]',
        fallbackX: 55,
        fallbackY: 38,
        actionText: 'Clicking contradicted drone report vs relay feed',
        whoDoingWhat: 'TRAINEE CMDR: Investigating divergent reports on corridor Alpha-7',
        clickAtTick: 42000,
      };
    }
    if (currentTick < 65000) {
      return {
        id: 'feed-ice-audit',
        fallbackX: 55,
        fallbackY: 52,
        actionText: 'Auditing ICE Confidence formula: Source × Quality × Freshness × Consistency',
        whoDoingWhat: 'TRAINEE CMDR: Observing confidence collapse to 45%',
        clickAtTick: 58000,
      };
    }

    // Stage 4: T+65 to T+85 (Tactical Decision Window & Mandatory Rationale)
    if (currentTick < 72000) {
      return {
        id: 'decision-action-select',
        selector: '[data-tour="decision-action-SWITCH_INFORMATION_CHANNEL"]',
        fallbackX: 86,
        fallbackY: 48,
        actionText: 'Selecting tactical action: SWITCH_INFORMATION_CHANNEL',
        whoDoingWhat: 'TRAINEE CMDR: Choosing channel adaptation to mitigate relay loss',
        clickAtTick: 69000,
      };
    }
    if (currentTick < 80000) {
      return {
        id: 'decision-rationale-typing',
        selector: '[data-tour="rationale-input"]',
        fallbackX: 86,
        fallbackY: 76,
        actionText: 'Typing mandatory military rationale into defense console...',
        whoDoingWhat: 'TRAINEE CMDR: Articulating why action mitigates uncertainty without rushing',
        clickAtTick: 73000,
        typeText: 'Switching forward units to fallback satellite net due to 42% loss and conflicting drone observations on corridor Alpha-7.',
      };
    }
    if (currentTick < 85000) {
      return {
        id: 'decision-commit-click',
        selector: '[data-tour="commit-button"]',
        fallbackX: 92,
        fallbackY: 88,
        actionText: 'Committing tactical decision with immutable snapshot timestamp',
        whoDoingWhat: 'TRAINEE CMDR: Committing action under time pressure',
        clickAtTick: 83000,
      };
    }

    // Stage 5: T+85+ (After-Action Review & Replay)
    return {
      id: 'aar-inspection',
      selector: '[data-tour="aar-tab"]',
      fallbackX: 38,
      fallbackY: 10,
      actionText: 'Opening After-Action Review for multi-dimensional radar scoring',
      whoDoingWhat: 'TRAINEE CMDR: Reviewing 8-axis evaluation & zero-leak replay',
      clickAtTick: 86000,
    };
  };

  const target = getActiveTarget(tick);

  // Position interpolation & element detection
  useEffect(() => {
    if (!isRunning) return;

    setCurrentLabel(target.whoDoingWhat);
    setActionDescription(target.actionText);

    let targetX = (window.innerWidth * target.fallbackX) / 100;
    let targetY = (window.innerHeight * target.fallbackY) / 100;

    // Try finding live DOM element for pixel-exact targeting
    if (target.selector) {
      const el = document.querySelector(target.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        targetX = rect.left + Math.min(rect.width * 0.5, 120);
        targetY = rect.top + Math.min(rect.height * 0.5, 60);
      }
    }

    setCoords({ x: targetX, y: targetY });

    // Handle simulated click effects at specific tick milestones
    if (
      target.clickAtTick &&
      Math.abs(tick - target.clickAtTick) < 300 &&
      lastClickTickRef.current !== target.clickAtTick
    ) {
      lastClickTickRef.current = target.clickAtTick;
      clickCountRef.current += 1;
      setClickEffect({ x: targetX, y: targetY, id: clickCountRef.current });
      tacticalAudio.playClick();
      setTimeout(() => setClickEffect(null), 700);
    }

    // Handle typing simulation
    if (target.typeText) {
      setIsTyping(true);
      const progress = Math.min(
        target.typeText.length,
        Math.floor(((tick - 72000) / 7000) * target.typeText.length)
      );
      setTypedChars(target.typeText.substring(0, progress));
    } else {
      setIsTyping(false);
      setTypedChars('');
    }
  }, [tick, isRunning, target.id]);

  if (!isRunning) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none font-mono">
      {/* Click Ping Sonar Ripple */}
      {clickEffect && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: clickEffect.x, top: clickEffect.y }}
        >
          <span className="w-12 h-12 rounded-full border-2 border-[#4fc3d0] bg-[#4fc3d0]/20 animate-ping absolute -top-6 -left-6 inline-block" />
          <span className="w-6 h-6 rounded-full border border-[#e8eaec] bg-white/40 absolute -top-3 -left-3 inline-block" />
        </div>
      )}

      {/* Animated Tactical Cursor & Informational Beacon */}
      <div
        className="absolute transition-all duration-700 ease-out will-change-transform flex flex-col items-start gap-1"
        style={{
          transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
        }}
      >
        {/* Glowing Tactical Reticle Pointer */}
        <div className="relative">
          <Navigation className="w-6 h-6 text-[#4fc3d0] fill-[#4fc3d0]/80 -rotate-45 drop-shadow-[0_0_8px_rgba(79,195,208,0.8)] animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2ecc71] border border-black animate-ping" />
        </div>

        {/* Live Commander Action Tooltip Card */}
        <div className="bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0] shadow-2xl rounded p-2 text-xs max-w-xs text-[#e8eaec] space-y-1 animate-fadeIn">
          {/* Who is acting */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4fc3d0] border-b border-[#2a2d30] pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4fc3d0] animate-pulse" />
            <span>{currentLabel}</span>
          </div>

          {/* What they are doing right now */}
          <div className="text-[11px] text-[#e8eaec] font-sans font-medium leading-tight">
            {actionDescription}
          </div>

          {/* Typing preview bubble when typing rationale */}
          {isTyping && typedChars.length > 0 && (
            <div className="bg-[#0d0f10] p-1.5 rounded border border-[#4fc3d0]/40 text-[10px] text-[#2ecc71] font-mono leading-tight flex items-start gap-1 mt-1">
              <CornerDownLeft className="w-3 h-3 shrink-0 mt-0.5" />
              <span>&ldquo;{typedChars}&rdquo;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
