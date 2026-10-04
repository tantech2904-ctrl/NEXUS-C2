'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TacticalMap } from '@/components/map/TacticalMap';
import { InformationFeed } from '@/components/feed/InformationFeed';
import { DecisionPanel } from '@/components/decision/DecisionPanel';
import { AfterActionReview } from '@/components/aar/AfterActionReview';
import { ReplayModal } from '@/components/replay/ReplayModal';
import { JudgeTourModal } from '@/components/guide/JudgeTourModal';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { validateScenario } from '@/lib/simulation/scenario';
import { tacticalAudio } from '@/lib/audio';
import { VirtualCommanderCursor } from '@/components/guide/VirtualCommanderCursor';

import scn01 from '@/../data/scenarios/scn-01-maria.json';
import scn02 from '@/../data/scenarios/scn-02-anatolia.json';
import scn03 from '@/../data/scenarios/scn-03-chile.json';
import scn04 from '@/../data/scenarios/scn-04-storm-corridor.json';
import scn05 from '@/../data/scenarios/scn-05-seismic-window.json';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';
import scn07 from '@/../data/scenarios/scn-07-fukushima.json';
import scn08 from '@/../data/scenarios/scn-08-ladakh.json';
import scn09 from '@/../data/scenarios/scn-09-cyber-spoof.json';

import {
  Award,
  RotateCcw,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
  Play,
  Pause,
  FastForward,
  Compass,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

const SCENARIO_CATALOG = [
  { id: 'SCN-06', code: 'SCN-06', title: 'BLACKOUT // CASCADE COLLAPSE', difficulty: 'FOUNDATION', data: scn06 },
  { id: 'SCN-01', code: 'SCN-01', title: 'HURRICANE MARIA // COMM DROPOUT', difficulty: 'ADVANCED', data: scn01 },
  { id: 'SCN-02', code: 'SCN-02', title: 'ANATOLIA QUAKE // HIGH LATENCY', difficulty: 'EXPERT', data: scn02 },
  { id: 'SCN-03', code: 'SCN-03', title: 'ATACAMA SUBDUCTION // TSUNAMI CONTRADICTION', difficulty: 'ADVANCED', data: scn03 },
  { id: 'SCN-04', code: 'SCN-04', title: 'TYPHOON HAIYAN // STORM SURGE DROPOUT', difficulty: 'EXPERT', data: scn04 },
  { id: 'SCN-05', code: 'SCN-05', title: 'HIMALAYAN SEISMIC // AVALANCHE RELAY LOSS', difficulty: 'FOUNDATION', data: scn05 },
  { id: 'SCN-07', code: 'SCN-07', title: 'FUKUSHIMA DAIICHI // STATION BLACKOUT', difficulty: 'EXPERT', data: scn07 },
  { id: 'SCN-08', code: 'SCN-08', title: 'LADAKH SIEL // HIGH-ALTITUDE RF ATTENUATION', difficulty: 'ADVANCED', data: scn08 },
  { id: 'SCN-09', code: 'SCN-09', title: 'URBAN GRID // CYBER-PHYSICAL SPOOF INJECT', difficulty: 'EXPERT', data: scn09 },
];

export default function ConsolePage() {
  const router = useRouter();
  const {
    scenario,
    loadScenario,
    isRunning,
    speedMultiplier,
    advanceTick,
    tick,
    startSimulation,
    pauseSimulation,
    setSpeedMultiplier,
    activeDecisionWindow,
    submitDecision,
  } = useSimulationStore();
  const { decisions } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'AAR'>('CONSOLE');
  const [consoleLayout, setConsoleLayout] = useState<'3-PANE' | 'MAP' | 'FEED' | 'DECISION'>('3-PANE');
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState(false);
  const [isTourHudMinimized, setIsTourHudMinimized] = useState(false);
  const autoDecisionMadeRef = useRef(false);

  // Initialize scenario if not loaded
  useEffect(() => {
    if (!scenario) {
      const validated = validateScenario(scn06);
      loadScenario(validated);
    }
  }, [scenario, loadScenario]);

  // Check URL query parameter for ?autodemo=1 or auto-open on initial visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autodemo') === '1') {
        handleStartAutoDemo();
        window.history.replaceState({}, '', '/console');
      } else {
        // Auto-open site tour modal on initial arrival so judges immediately see the evaluation guide
        const hasSeenTour = sessionStorage.getItem('nexus_judge_tour_prompted');
        if (!hasSeenTour) {
          sessionStorage.setItem('nexus_judge_tour_prompted', 'true');
          const timer = setTimeout(() => {
            setIsTourModalOpen(true);
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 100;
    const timer = setInterval(() => {
      advanceTick(intervalMs * speedMultiplier);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier, advanceTick]);

  // Sound triggers on events
  useEffect(() => {
    if (tick === 8000 || tick === 38000) {
      tacticalAudio.playReportChirp();
    } else if (tick === 18000 || tick === 28000 || tick === 44000 || tick === 56000) {
      tacticalAudio.playWarningTone();
    }
  }, [tick]);

  // Switch scenario directly from console
  const handleSwitchScenario = (scenarioId: string) => {
    const item = SCENARIO_CATALOG.find((s) => s.id === scenarioId);
    if (!item) return;
    autoDecisionMadeRef.current = false;
    setIsAutoDemoRunning(false);
    pauseSimulation();
    const validated = validateScenario(item.data);
    loadScenario(validated);
    useSessionStore.getState().resetSession();
    setActiveTab('CONSOLE');
    tacticalAudio.playClick();
  };

  // Reset current scenario
  const handleResetSimulation = () => {
    autoDecisionMadeRef.current = false;
    setIsAutoDemoRunning(false);
    pauseSimulation();
    const currentId = scenario?.id || 'SCN-06';
    const item = SCENARIO_CATALOG.find((s) => s.id === currentId) || SCENARIO_CATALOG[0];
    const validated = validateScenario(item.data);
    loadScenario(validated);
    useSessionStore.getState().resetSession();
    setActiveTab('CONSOLE');
    tacticalAudio.playClick();
  };

  // Automated 3-Minute Live Evaluation Runner
  const handleStartAutoDemo = () => {
    autoDecisionMadeRef.current = false;
    const validated = validateScenario(scn06);
    loadScenario(validated);
    useSessionStore.getState().resetSession();
    setSpeedMultiplier(2); // 2x speed for 90-second run into AAR
    startSimulation();
    setIsAutoDemoRunning(true);
    setIsTourHudMinimized(false);
    setActiveTab('CONSOLE');
    tacticalAudio.playClick();
  };

  // Automated decision and AAR progression during live demo
  useEffect(() => {
    if (!isAutoDemoRunning) return;

    // At T+70000, auto-submit decision window
    if (tick >= 68000 && !autoDecisionMadeRef.current) {
      autoDecisionMadeRef.current = true;
      submitDecision(
        'SWITCH_INFORMATION_CHANNEL',
        'Switching forward units to fallback satellite net due to 42% packet loss and conflicting drone observations on corridor Alpha-7.'
      );
      tacticalAudio.playCommitChime();
    }

    // At T+85000, automatically transition to AAR
    if (tick >= 85000 && activeTab === 'CONSOLE') {
      setActiveTab('AAR');
      pauseSimulation();
      setIsAutoDemoRunning(false);
    }
  }, [isAutoDemoRunning, tick, activeTab, submitDecision, pauseSimulation]);

  // Jump handlers for fast demonstration
  const handleJumpToContradiction = () => {
    const diff = 38500 - tick;
    if (diff > 0) advanceTick(diff);
    tacticalAudio.playClick();
  };

  const handleJumpToDecision = () => {
    const diff = 68500 - tick;
    if (diff > 0) advanceTick(diff);
    tacticalAudio.playClick();
  };

  const handleJumpToAar = () => {
    if (!autoDecisionMadeRef.current) {
      autoDecisionMadeRef.current = true;
      submitDecision(
        'SWITCH_INFORMATION_CHANNEL',
        'Demonstration fast-forward: Fallback satcom activated under severe relay severance.'
      );
      tacticalAudio.playCommitChime();
    }
    const diff = 86000 - tick;
    if (diff > 0) advanceTick(diff);
    pauseSimulation();
    setIsAutoDemoRunning(false);
    setActiveTab('AAR');
  };

  // Guided Demo Walkthrough Step Calculator
  const getDemoStep = () => {
    if (tick < 18000) {
      return {
        step: 1,
        total: 5,
        title: 'NOMINAL TRANSMISSION FLOW',
        targetPanel: 'MAP' as const,
        timeWindow: 'T+00:00 - T+00:18',
        action: 'Observe baseline telemetry: 98% availability, green packet comets along mountain corridors on the 1:50,000 topographic map.',
        pedagogy: 'Commanders establish baseline confidence before environmental anomalies trigger.',
        alert: false,
      };
    }
    if (tick < 38000) {
      return {
        step: 2,
        total: 5,
        title: 'CARRIER DEGRADATION INJECTED',
        targetPanel: 'MAP' as const,
        timeWindow: 'T+00:18 - T+00:38',
        action: 'Microwave link experiences +450ms latency spike and 24% packet drop. Note slowing packet trails and amber link alerts.',
        pedagogy: 'Information Freshness factor decays as transmission delays accumulate.',
        alert: true,
      };
    }
    if (tick < 65000) {
      return {
        step: 3,
        total: 5,
        title: 'CONTRADICTION DETECTED & ICE COLLAPSE',
        targetPanel: 'FEED' as const,
        timeWindow: 'T+00:38 - T+01:05',
        action: 'Drone Alpha reports roadblock on Alpha-7 while Relay Beta claims clear. NEXUS-C2 ICE formula penalizes inconsistency: confidence drops to 45%.',
        pedagogy: 'ICE Formula: Confidence = Source × CommQuality × Freshness × Consistency.',
        alert: true,
      };
    }
    if (activeDecisionWindow || tick < 85000) {
      return {
        step: 4,
        total: 5,
        title: 'TACTICAL DECISION WINDOW OPEN',
        targetPanel: 'DECISION' as const,
        timeWindow: 'T+01:05 - T+01:40',
        action: 'Mandatory military rationale required. The trainer scores operational discipline and penalizes rushing on contradicted telemetry.',
        pedagogy: 'Decide under uncertainty: switching channels restores resilience under high fog.',
        alert: true,
      };
    }
    return {
      step: 5,
      total: 5,
      title: 'AAR EVALUATION & ZERO-LEAK REPLAY',
      targetPanel: 'AAR' as const,
      timeWindow: 'T+01:40+',
      action: 'Mission concluded. Multi-dimensional 8-axis radar score computed. Click REPLAY DECISIONS to inspect immutable snapshot with zero future leakage.',
      pedagogy: 'Evaluators verify: What did the commander actually know at the decision moment?',
      alert: false,
    };
  };

  const currentGuide = getDemoStep();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black">
      {/* Top Header */}
      <Header />

      {/* Guided Walkthrough Banner for Evaluators & Judges */}
      {showDemoGuide && activeTab === 'CONSOLE' && (
        <div
          className={`px-3 sm:px-4 py-1.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs transition-colors z-20 print:hidden ${
            isAutoDemoRunning
              ? 'bg-[#4fc3d0]/15 border-[#4fc3d0]/50 text-[#4fc3d0]'
              : currentGuide.alert
              ? 'bg-[#d4860a]/15 border-[#d4860a]/40 text-[#d4860a]'
              : 'bg-[#1c1f21] border-[#2a2d30] text-[#4fc3d0]'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                isAutoDemoRunning
                  ? 'bg-[#4fc3d0] text-black animate-pulse'
                  : currentGuide.alert
                  ? 'bg-[#d4860a] text-black'
                  : 'bg-[#4fc3d0] text-black'
              }`}
            >
              {isAutoDemoRunning ? 'AUTO DEMO ACTIVE' : `STEP ${currentGuide.step} OF ${currentGuide.total}`}
            </span>
            <span className="font-bold text-[#e8eaec] shrink-0 hidden sm:inline">
              {currentGuide.title}:
            </span>
            <span className="text-[#8a9099] truncate font-sans text-xs">
              {currentGuide.action}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            {/* Interactive Site Tour Button */}
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setIsTourModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1f21] border border-[#4fc3d0]/40 text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-[10px] font-bold transition-all"
              title="Open Interactive Judge Tour with Visual Explanations"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>JUDGE TOUR GUIDE</span>
            </button>

            {/* Quick 3-Min Live Evaluation Trigger */}
            {!isAutoDemoRunning ? (
              <button
                onClick={handleStartAutoDemo}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4fc3d0] text-black font-bold text-[10px] hover:bg-[#4fc3d0]/90 transition-all shadow-sm"
                title="Launch Automated 3-Minute Live Demonstration"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>3-MIN AUTO RUN</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  pauseSimulation();
                  setIsAutoDemoRunning(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#c0392b] text-white font-bold text-[10px] hover:bg-[#c0392b]/90 transition-all"
                title="Pause Automated Evaluation"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span>PAUSE AUTO RUN</span>
              </button>
            )}

            <button
              onClick={() => setShowDemoGuide(false)}
              className="text-[#8a9099] hover:text-[#e8eaec] p-1"
              title="Dismiss Guide Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Navbar: Operational Views, Scenario Switcher & Layout Controls */}
      <div className="bg-[#141618] border-b border-[#2a2d30] px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs z-10 print:hidden">
        {/* Navigation & Scenario Selector */}
        <div className="flex items-center gap-2">
          {/* Back to Scenarios */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              router.push('/scenarios');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0]/50 transition-colors text-xs font-semibold"
            title="Return to Scenario Library"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SCENARIOS</span>
          </button>

          {/* Quick Scenario Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#1c1f21] border border-[#2a2d30] px-2 py-0.5 rounded text-xs">
            <span className="text-[#8a9099] font-bold text-[10px] hidden md:inline">MISSION:</span>
            <select
              value={scenario?.id || 'SCN-06'}
              onChange={(e) => handleSwitchScenario(e.target.value)}
              className="bg-transparent text-[#e8eaec] font-semibold text-xs border-none outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
              title="Switch directly between all 9 training scenarios"
            >
              {SCENARIO_CATALOG.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#141618] text-[#e8eaec]">
                  {s.id}: {s.title} ({s.difficulty})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Current Simulation */}
          <button
            onClick={handleResetSimulation}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] text-xs transition-colors"
            title="Reset current simulation to T+00:00"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden lg:inline text-[11px]">RESET</span>
          </button>
        </div>

        {/* Center: Main View Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveTab('CONSOLE');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all text-xs font-semibold ${
              activeTab === 'CONSOLE'
                ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50 shadow-[0_0_10px_rgba(79,195,208,0.2)]'
                : 'text-[#8a9099] hover:text-[#e8eaec]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>COMMAND CONSOLE</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setActiveTab('AAR');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all text-xs font-semibold ${
              activeTab === 'AAR'
                ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50 shadow-[0_0_10px_rgba(79,195,208,0.2)]'
                : 'text-[#8a9099] hover:text-[#e8eaec]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#d4860a]" />
            <span>AFTER-ACTION REVIEW</span>
            {decisions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#d4860a] animate-ping" />
            )}
          </button>
        </div>

        {/* Right: Layout Switcher & Replay Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'CONSOLE' && (
            <div className="flex items-center gap-0.5 bg-[#1c1f21] border border-[#2a2d30] p-0.5 rounded text-[11px]">
              <button
                onClick={() => setConsoleLayout('3-PANE')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  consoleLayout === '3-PANE' ? 'bg-[#4fc3d0] text-black font-bold' : 'text-[#8a9099] hover:text-[#e8eaec]'
                }`}
                title="Full 3-Pane Tactical View"
              >
                3-PANE
              </button>
              <button
                onClick={() => setConsoleLayout('MAP')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  consoleLayout === 'MAP' ? 'bg-[#4fc3d0] text-black font-bold' : 'text-[#8a9099] hover:text-[#e8eaec]'
                }`}
                title="Maximize Tactical Topographic Map"
              >
                MAP
              </button>
              <button
                onClick={() => setConsoleLayout('FEED')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  consoleLayout === 'FEED' ? 'bg-[#4fc3d0] text-black font-bold' : 'text-[#8a9099] hover:text-[#e8eaec]'
                }`}
                title="Maximize Intelligence Feed & Confidence Engine"
              >
                INTEL
              </button>
              <button
                onClick={() => setConsoleLayout('DECISION')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  consoleLayout === 'DECISION' ? 'bg-[#4fc3d0] text-black font-bold' : 'text-[#8a9099] hover:text-[#e8eaec]'
                }`}
                title="Maximize Decision Panel & Rationale"
              >
                DECISION
              </button>
            </div>
          )}

          {decisions.length > 0 && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setIsReplayOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1f21] hover:bg-[#2a2d30] text-[#4fc3d0] border border-[#4fc3d0]/40 transition-colors text-xs font-semibold"
              title="Inspect zero-information-leakage replay snapshot"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">REPLAY</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden p-2 sm:p-3 relative print:h-auto print:w-full print:overflow-visible print:p-0 print:m-0">
        {activeTab === 'CONSOLE' ? (
          <div className="h-full w-full">
            {/* 3-PANE LAYOUT */}
            {consoleLayout === '3-PANE' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 h-full w-full">
                {/* Left: Operational Topographic Map (5 Cols) */}
                <div
                  className={`lg:col-span-5 h-[320px] lg:h-full flex flex-col min-h-0 rounded transition-all duration-500 relative ${
                    isAutoDemoRunning && currentGuide.targetPanel === 'MAP'
                      ? 'ring-2 ring-[#4fc3d0] shadow-[0_0_25px_rgba(79,195,208,0.4)] z-20'
                      : isAutoDemoRunning
                      ? 'opacity-85'
                      : ''
                  }`}
                >
                  {isAutoDemoRunning && currentGuide.targetPanel === 'MAP' && (
                    <div className="bg-[#4fc3d0] text-black font-bold text-[10px] px-2.5 py-0.5 rounded-t flex items-center justify-between animate-pulse shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>TOUR SPOTLIGHT: 1:50,000 TOPOGRAPHIC MAP & TRANSMISSIONS</span>
                      </div>
                      <span>STAGE {currentGuide.step}/5</span>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <TacticalMap />
                  </div>
                </div>

                {/* Center: Information Feed & Confidence Engine (4 Cols) */}
                <div
                  className={`lg:col-span-4 h-[320px] lg:h-full flex flex-col min-h-0 rounded transition-all duration-500 relative ${
                    isAutoDemoRunning && currentGuide.targetPanel === 'FEED'
                      ? 'ring-2 ring-[#c0392b] shadow-[0_0_25px_rgba(192,57,43,0.45)] z-20'
                      : isAutoDemoRunning
                      ? 'opacity-85'
                      : ''
                  }`}
                >
                  {isAutoDemoRunning && currentGuide.targetPanel === 'FEED' && (
                    <div className="bg-[#c0392b] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-t flex items-center justify-between animate-pulse shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>TOUR SPOTLIGHT: CONTRADICTION & ICE ENGINE</span>
                      </div>
                      <span>STAGE {currentGuide.step}/5</span>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <InformationFeed />
                  </div>
                </div>

                {/* Right: Tactical Decision Panel & Rationale (3 Cols) */}
                <div
                  className={`lg:col-span-3 h-[320px] lg:h-full flex flex-col min-h-0 rounded transition-all duration-500 relative ${
                    isAutoDemoRunning && currentGuide.targetPanel === 'DECISION'
                      ? 'ring-2 ring-[#d4860a] shadow-[0_0_30px_rgba(212,134,10,0.6)] z-20 animate-pulse'
                      : isAutoDemoRunning
                      ? 'opacity-85'
                      : ''
                  }`}
                >
                  {isAutoDemoRunning && currentGuide.targetPanel === 'DECISION' && (
                    <div className="bg-[#d4860a] text-black font-bold text-[10px] px-2.5 py-0.5 rounded-t flex items-center justify-between animate-pulse shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>TOUR SPOTLIGHT: TACTICAL DECISION & RATIONALE</span>
                      </div>
                      <span>STAGE {currentGuide.step}/5</span>
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <DecisionPanel />
                  </div>
                </div>
              </div>
            )}

            {/* FOCUSED VIEWS */}
            {consoleLayout === 'MAP' && (
              <div className="h-full w-full">
                <TacticalMap />
              </div>
            )}

            {consoleLayout === 'FEED' && (
              <div className="h-full w-full max-w-4xl mx-auto">
                <InformationFeed />
              </div>
            )}

            {consoleLayout === 'DECISION' && (
              <div className="h-full w-full max-w-3xl mx-auto">
                <DecisionPanel />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto print:h-auto print:w-full print:overflow-visible">
            <AfterActionReview
              onReturnToConsole={() => setActiveTab('CONSOLE')}
              onChooseScenario={() => router.push('/scenarios')}
            />
          </div>
        )}

        {/* Live Evaluation Tour HUD Overlay (Runs at bottom-left so the right Decision Center is completely unblocked!) */}
        {isAutoDemoRunning && activeTab === 'CONSOLE' && (
          <div className="absolute bottom-3 left-3 sm:left-4 z-30 max-w-sm sm:max-w-md w-full pointer-events-auto print:hidden">
            <div className="bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0]/60 rounded-md shadow-2xl p-3 sm:p-4 text-xs font-mono space-y-2.5 animate-fadeIn">
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-[#2a2d30] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4fc3d0] animate-ping" />
                  <span className="font-bold text-[#4fc3d0] text-xs">
                    3-MIN EVALUATION TOUR (STAGE {currentGuide.step}/{currentGuide.total})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsTourHudMinimized(!isTourHudMinimized)}
                    className="text-[#8a9099] hover:text-[#e8eaec] px-1 py-0.5 text-[10px] rounded hover:bg-[#1c1f21]"
                  >
                    {isTourHudMinimized ? 'EXPAND' : 'MIN'}
                  </button>
                  <button
                    onClick={() => {
                      pauseSimulation();
                      setIsAutoDemoRunning(false);
                    }}
                    className="text-[#8a9099] hover:text-[#c0392b] p-0.5"
                    title="Stop Tour"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!isTourHudMinimized && (
                <>
                  {/* Current Title & Time Window */}
                  <div>
                    <div className="font-bold text-[#e8eaec] text-xs">
                      {currentGuide.title}
                    </div>
                    <div className="text-[10px] text-[#4fc3d0] mt-0.5">
                      WINDOW: {currentGuide.timeWindow} &bull; SPEED: {speedMultiplier}x
                    </div>
                  </div>

                  {/* Operational Action Description */}
                  <div className="text-[11px] text-[#8a9099] font-sans leading-relaxed bg-[#0d0f10] p-2 rounded border border-[#2a2d30]">
                    {currentGuide.action}
                  </div>

                  {/* Directional Callout pointing to the unblocked Decision Center when active */}
                  {currentGuide.targetPanel === 'DECISION' && (
                    <div className="text-[11px] font-bold text-[#d4860a] bg-[#d4860a]/15 p-2 rounded border border-[#d4860a]/40 flex items-center gap-2">
                      <span className="text-base animate-bounce">👉</span>
                      <span className="font-sans leading-tight">
                        <strong>OBSERVE RIGHT PANEL:</strong> Active decision window open. System is assessing adaptation & committing required military rationale!
                      </span>
                    </div>
                  )}

                  {/* Core Evaluation Note */}
                  <div className="text-[10px] text-[#d4860a] bg-[#d4860a]/10 p-1.5 rounded border border-[#d4860a]/30">
                    <span className="font-bold">EVALUATOR FOCUS: </span>
                    <span className="font-sans">{currentGuide.pedagogy}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#1c1f21] h-1.5 rounded-full overflow-hidden border border-[#2a2d30]">
                    <div
                      className="bg-[#4fc3d0] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((tick / 85000) * 100))}%` }}
                    />
                  </div>

                  {/* Fast Jump Shortcuts for Judges */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <button
                      onClick={handleJumpToContradiction}
                      className="flex-1 py-1 px-1.5 rounded bg-[#1c1f21] hover:bg-[#2a2d30] border border-[#2a2d30] text-[10px] text-[#8a9099] hover:text-[#e8eaec] transition-colors"
                      title="Jump immediately to Contradiction phase (T+38s)"
                    >
                      ⏩ CONTRADICTION
                    </button>
                    <button
                      onClick={handleJumpToDecision}
                      className="flex-1 py-1 px-1.5 rounded bg-[#1c1f21] hover:bg-[#2a2d30] border border-[#2a2d30] text-[10px] text-[#8a9099] hover:text-[#e8eaec] transition-colors"
                      title="Jump immediately to Tactical Decision Window (T+68s)"
                    >
                      ⏩ DECISION
                    </button>
                    <button
                      onClick={handleJumpToAar}
                      className="flex-1 py-1 px-1.5 rounded bg-[#4fc3d0]/20 hover:bg-[#4fc3d0]/30 border border-[#4fc3d0]/50 text-[10px] text-[#4fc3d0] font-bold transition-colors"
                      title="Jump immediately to After-Action Review & Radar Scoring"
                    >
                      ⏩ AAR SCORE
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Footer & Simulator Controls */}
      <Footer />

      {/* Decision Replay Modal */}
      <ReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
      />

      {/* Interactive Hackathon Evaluator & Judge Tour Modal */}
      <JudgeTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onLaunchAutoDemo={handleStartAutoDemo}
      />

      {/* Animated Virtual Commander Cursor (Shows who is doing what during Auto-Demo) */}
      {isAutoDemoRunning && (
        <VirtualCommanderCursor
          tick={tick}
          isRunning={isAutoDemoRunning}
          onNavigateAar={handleJumpToAar}
        />
      )}
    </div>
  );
}
