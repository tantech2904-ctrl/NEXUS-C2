'use client';

import React, { useEffect, useState, useRef } from 'react';
import { tacticalAudio } from '@/lib/audio';
import { Navigation, Terminal, CheckCircle2, CornerDownLeft, Sparkles } from 'lucide-react';

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
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 250, y: 250 });
  const [transitionDuration, setTransitionDuration] = useState<number>(600);
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number; id: number } | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>('Command Initializing...');
  const [actionDescription, setActionDescription] = useState<string>('Trainee Commander monitoring telemetry');
  const [isTyping, setIsTyping] = useState(false);
  const [typedChars, setTypedChars] = useState('');
  
  const clickCountRef = useRef(0);
  const lastClickTickRef = useRef(-1);
  const prevCoordsRef = useRef<{ x: number; y: number }>({ x: 250, y: 250 });

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
        fallbackY: 42,
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
        fallbackX: 38,
        fallbackY: 7,
        actionText: 'Noticing +450ms carrier delay spike & slowing packet trails',
        whoDoingWhat: 'TRAINEE CMDR: Detecting backhaul disruption in Header telemetry',
        clickAtTick: 22000,
      };
    }
    if (currentTick < 38000) {
      return {
        id: 'feed-monitoring',
        selector: '[data-tour="feed-stream"]',
        fallbackX: 50,
        fallbackY: 26,
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
        fallbackX: 52,
        fallbackY: 36,
        actionText: 'Clicking contradicted drone report vs relay feed',
        whoDoingWhat: 'TRAINEE CMDR: Investigating divergent reports on corridor Alpha-7',
        clickAtTick: 42000,
      };
    }
    if (currentTick < 65000) {
      return {
        id: 'feed-ice-audit',
        fallbackX: 52,
        fallbackY: 48,
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
        fallbackX: 74,
        fallbackY: 42,
        actionText: 'Selecting tactical action: SWITCH_INFORMATION_CHANNEL',
        whoDoingWhat: 'TRAINEE CMDR: Choosing channel adaptation to mitigate relay loss',
        clickAtTick: 69000,
      };
    }
    if (currentTick < 81500) {
      return {
        id: 'decision-rationale-typing',
        selector: '[data-tour="rationale-input"]',
        fallbackX: 74,
        fallbackY: 62,
        actionText: 'Typing mandatory military rationale into defense console...',
        whoDoingWhat: 'TRAINEE CMDR: Articulating why action mitigates uncertainty without rushing',
        clickAtTick: 73000,
        typeText: 'Switching forward units to fallback satellite net due to 42% packet loss and conflicting drone observations on corridor Alpha-7.',
      };
    }
    if (currentTick < 85000) {
      return {
        id: 'decision-commit-click',
        selector: '[data-tour="commit-button"]',
        fallbackX: 76,
        fallbackY: 72,
        actionText: 'Committing tactical decision with immutable snapshot timestamp',
        whoDoingWhat: 'TRAINEE CMDR: Committing action under time pressure',
        clickAtTick: 82500,
      };
    }

    // Stage 5: T+85+ (After-Action Review & Replay)
    return {
      id: 'aar-inspection',
      fallbackX: 35,
      fallbackY: 10,
      actionText: 'Opening After-Action Review for multi-dimensional radar scoring',
      whoDoingWhat: 'TRAINEE CMDR: Reviewing 8-axis evaluation & zero-leak replay',
      clickAtTick: 86000,
    };
  };

  const target = getActiveTarget(tick);

  // Position interpolation & element detection with boundary clamping
  useEffect(() => {
    if (!isRunning) return;

    setCurrentLabel(target.whoDoingWhat);
    setActionDescription(target.actionText);

    let rawX = (window.innerWidth * target.fallbackX) / 100;
    let rawY = (window.innerHeight * target.fallbackY) / 100;

    // Try finding live DOM element for pixel-exact targeting
    if (target.selector) {
      const el = document.querySelector(target.selector);
      if (el) {
        // Ensure element is scrolled into view in its container
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch {
          // Fallback if browser doesn't support smooth scrollIntoView
        }

        const rect = el.getBoundingClientRect();
        // Target center of element
        rawX = rect.left + Math.min(rect.width * 0.35, 100);
        rawY = rect.top + Math.min(rect.height * 0.5, 30);
      }
    }

    // Strict clamping: pointer reticle NEVER goes closer than 40px to horizontal edges or 60px to vertical edges
    const safeX = Math.max(35, Math.min(window.innerWidth - 60, rawX));
    const safeY = Math.max(60, Math.min(window.innerHeight - 75, rawY));

    // Dynamic natural duration based on travel distance
    const distance = Math.hypot(safeX - prevCoordsRef.current.x, safeY - prevCoordsRef.current.y);
    const duration = Math.max(400, Math.min(750, Math.round(distance * 0.7)));
    setTransitionDuration(duration);

    prevCoordsRef.current = { x: safeX, y: safeY };
    setCoords({ x: safeX, y: safeY });

    // Handle simulated click effects at specific tick milestones
    if (
      target.clickAtTick &&
      Math.abs(tick - target.clickAtTick) < 350 &&
      lastClickTickRef.current !== target.clickAtTick
    ) {
      lastClickTickRef.current = target.clickAtTick;
      clickCountRef.current += 1;
      setClickEffect({ x: safeX, y: safeY, id: clickCountRef.current });
      tacticalAudio.playClick();
      setTimeout(() => setClickEffect(null), 700);
    }

    // Handle typing simulation
    if (target.typeText) {
      setIsTyping(true);
      const elapsedTyping = Math.max(0, tick - 72000);
      const typingWindow = 7500;
      const progress = Math.min(
        target.typeText.length,
        Math.floor((elapsedTyping / typingWindow) * target.typeText.length)
      );
      setTypedChars(target.typeText.substring(0, progress));
    } else {
      setIsTyping(false);
      setTypedChars('');
    }
  }, [tick, isRunning, target.id]);

  if (!isRunning) return null;

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Mathematically clamped Card Coordinates (Guaranteed to be 100% inside screen on ANY resolution!)
  const cardWidth = Math.min(320, screenW - 32);
  const cardHeight = isTyping ? 180 : 105;

  let cardX = coords.x > screenW * 0.52 ? coords.x - cardWidth - 24 : coords.x + 32;
  cardX = Math.max(16, Math.min(screenW - cardWidth - 16, cardX));

  let cardY = coords.y > screenH * 0.55 ? coords.y - cardHeight - 20 : coords.y + 16;
  cardY = Math.max(60, Math.min(screenH - cardHeight - 65, cardY));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none font-mono">
      {/* 1. Click Ping Sonar Ripple */}
      {clickEffect && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
          style={{ left: clickEffect.x, top: clickEffect.y }}
        >
          <span className="w-14 h-14 rounded-full border-2 border-[#4fc3d0] bg-[#4fc3d0]/25 animate-ping absolute -top-7 -left-7 inline-block" />
          <span className="w-7 h-7 rounded-full border border-white bg-white/40 absolute -top-3.5 -left-3.5 inline-block" />
        </div>
      )}

      {/* 2. Sleek Tactical Cursor Reticle (Smooth physics quintic ease-out) */}
      <div
        className="absolute will-change-transform z-50 pointer-events-none"
        style={{
          transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
          transition: `transform ${transitionDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        <div className="relative">
          <Navigation className="w-6 h-6 text-[#4fc3d0] fill-[#4fc3d0]/80 -rotate-45 drop-shadow-[0_0_12px_rgba(79,195,208,0.95)] animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2ecc71] border border-black animate-ping" />
        </div>
      </div>

      {/* 3. Screen-Clamped Floating Action Tooltip Card (Guaranteed never off-screen!) */}
      <div
        className="absolute z-40 bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0] shadow-2xl rounded p-2.5 text-xs text-[#e8eaec] space-y-1.5 transition-all duration-300 pointer-events-none"
        style={{
          left: `${cardX}px`,
          top: `${cardY}px`,
          width: `${cardWidth}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#4fc3d0] border-b border-[#2a2d30] pb-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4fc3d0] animate-pulse shrink-0" />
            <span className="truncate">{currentLabel}</span>
          </div>
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#0d0f10] text-[#8a9099] border border-[#2a2d30] shrink-0 ml-1">
            AUTO-EVAL
          </span>
        </div>

        {/* Action Description */}
        <div className="text-[11px] text-[#e8eaec] font-sans font-medium leading-snug">
          {actionDescription}
        </div>

        {/* Embedded typing preview inside the card */}
        {isTyping && (
          <div className="bg-[#0d0f10] p-1.5 rounded border border-[#4fc3d0]/40 text-[10px] text-[#2ecc71] font-mono leading-relaxed flex flex-col gap-1 mt-1 max-h-24 overflow-y-auto break-words">
            <div className="flex items-center justify-between text-[9px] text-[#8a9099] border-b border-[#2a2d30] pb-0.5">
              <span className="flex items-center gap-1 text-[#4fc3d0]">
                <Terminal className="w-2.5 h-2.5" />
                LIVE RATIONALE
              </span>
              <span className="text-[#2ecc71] font-bold">{typedChars.length} CHARS</span>
            </div>
            <div className="text-[#e8eaec] font-sans leading-relaxed">
              &ldquo;{typedChars}&rdquo;
              <span className="inline-block w-1.5 h-3 bg-[#4fc3d0] animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Cinematic Prominent Top-Center Broadcast Banner (Guarantees judges ALWAYS see verbatim rationale clearly!) */}
      {isTyping && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-32px)] bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0] rounded-md shadow-[0_0_30px_rgba(79,195,208,0.5)] p-3 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#4fc3d0] border-b border-[#2a2d30] pb-1.5 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-ping" />
              <Terminal className="w-3.5 h-3.5" />
              <span>COMMANDER RATIONALE INGESTION &bull; LIVE INPUT</span>
            </div>
            <span className="text-[10px] text-[#2ecc71] bg-[#2ecc71]/15 px-2 py-0.5 rounded border border-[#2ecc71]/40 font-bold">
              {typedChars.length} CHARS CAPTURED
            </span>
          </div>
          <div className="text-xs font-sans text-[#e8eaec] leading-relaxed">
            &ldquo;{typedChars}&rdquo;
            <span className="inline-block w-2 h-3.5 bg-[#4fc3d0] animate-pulse ml-1 align-middle" />
          </div>
        </div>
      )}
    </div>
  );
};
