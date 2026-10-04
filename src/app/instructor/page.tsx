'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TacticalMap } from '@/components/map/TacticalMap';
import { useSimulationStore } from '@/stores/simulationStore';
import { useInstructorStore } from '@/stores/instructorStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { formatPercent, formatTime } from '@/lib/utils';
import { validateScenario } from '@/lib/simulation/scenario';
import { tacticalAudio } from '@/lib/audio';

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
  Layers,
  Radio,
  AlertTriangle,
  Zap,
  Activity,
  RotateCcw,
  Flame,
  ShieldAlert,
  Play,
  Pause,
  ChevronLeft,
  Sparkles,
  Sliders,
  Users,
  CheckCircle2,
  XCircle,
  Vote,
} from 'lucide-react';

const SCENARIOS = [
  { id: 'SCN-06', title: 'SCN-06: BLACKOUT // CASCADE COLLAPSE', data: scn06 },
  { id: 'SCN-01', title: 'SCN-01: HURRICANE MARIA // COMM DROPOUT', data: scn01 },
  { id: 'SCN-02', title: 'SCN-02: ANATOLIA QUAKE // HIGH LATENCY', data: scn02 },
  { id: 'SCN-03', title: 'SCN-03: ATACAMA SUBDUCTION // TSUNAMI CONTRADICTION', data: scn03 },
  { id: 'SCN-04', title: 'SCN-04: TYPHOON HAIYAN // STORM SURGE DROPOUT', data: scn04 },
  { id: 'SCN-05', title: 'SCN-05: HIMALAYAN SEISMIC // AVALANCHE RELAY LOSS', data: scn05 },
  { id: 'SCN-07', title: 'SCN-07: FUKUSHIMA DAIICHI // STATION BLACKOUT', data: scn07 },
  { id: 'SCN-08', title: 'SCN-08: LADAKH SIEL // HIGH-ALTITUDE RF ATTENUATION', data: scn08 },
  { id: 'SCN-09', title: 'SCN-09: URBAN GRID // CYBER-PHYSICAL SPOOF INJECT', data: scn09 },
];

export default function InstructorPage() {
  const router = useRouter();
  const {
    scenario,
    loadScenario,
    isRunning,
    startSimulation,
    pauseSimulation,
    speedMultiplier,
    advanceTick,
    tick,
    commHealth,
    infoIntegrity,
    channels,
    overallDegradationState,
    informationItems,
    eventLog,
  } = useSimulationStore();

  const {
    selectedChannelId,
    setSelectedChannelId,
    injectLatency,
    injectPacketLoss,
    injectDropout,
    injectContradiction,
    injectRelayFailure,
    triggerRecovery,
    triggerDecisionWindow,
  } = useInstructorStore();

  const { decisions } = useSessionStore();
  const { members, activeProposal, messages } = useMultiplayerStore();
  const channelList = Object.values(channels);

  const [leftTab, setLeftTab] = useState<'INJECTS' | 'VARIABLES'>('INJECTS');
  const [rightTab, setRightTab] = useState<'TRAINEE_TEAM' | 'AUDIT'>('TRAINEE_TEAM');
  const [varLatency, setVarLatency] = useState<number>(450);
  const [varPacketLoss, setVarPacketLoss] = useState<number>(40);
  const [isEwJamming, setIsEwJamming] = useState<boolean>(false);

  // Guarantee scenario initialization even if direct navigation or page refresh occurs
  useEffect(() => {
    if (!scenario) {
      const validated = validateScenario(scn06);
      loadScenario(validated);
    }
  }, [scenario, loadScenario]);

  // Ensure selectedChannelId matches an active channel in the current scenario
  useEffect(() => {
    if (channelList.length > 0 && (!selectedChannelId || !channels[selectedChannelId])) {
      setSelectedChannelId(channelList[0].id);
    }
  }, [channels, channelList, selectedChannelId, setSelectedChannelId]);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 100;
    const timer = setInterval(() => {
      advanceTick(intervalMs * speedMultiplier);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier, advanceTick]);

  const handleSwitchScenario = (scenarioId: string) => {
    const item = SCENARIOS.find((s) => s.id === scenarioId);
    if (!item) return;
    pauseSimulation();
    const validated = validateScenario(item.data);
    loadScenario(validated);
    useSessionStore.getState().resetSession();
    tacticalAudio.playClick();
  };

  const handleResetSimulation = () => {
    pauseSimulation();
    const currentId = scenario?.id || 'SCN-06';
    const item = SCENARIOS.find((s) => s.id === currentId) || SCENARIOS[0];
    const validated = validateScenario(item.data);
    loadScenario(validated);
    useSessionStore.getState().resetSession();
    tacticalAudio.playClick();
  };

  const handleApplyVariables = () => {
    tacticalAudio.playWarningTone();
    injectLatency(selectedChannelId, varLatency / 1000);
    injectPacketLoss(selectedChannelId, varPacketLoss / 100);
  };

  const handleToggleEwJamming = () => {
    const nextState = !isEwJamming;
    setIsEwJamming(nextState);
    if (nextState) {
      tacticalAudio.playAlertChime();
      injectPacketLoss(selectedChannelId, 0.70);
    } else {
      tacticalAudio.playCommitChime();
      triggerRecovery(selectedChannelId);
    }
  };

  const handleInjectLatency = () => {
    tacticalAudio.playWarningTone();
    injectLatency(selectedChannelId);
  };

  const handleInjectPacketLoss = () => {
    tacticalAudio.playWarningTone();
    injectPacketLoss(selectedChannelId);
  };

  const handleInjectDropout = () => {
    tacticalAudio.playWarningTone();
    injectDropout(selectedChannelId);
  };

  const handleInjectContradiction = () => {
    tacticalAudio.playAlertChime();
    injectContradiction();
  };

  const handleInjectRelayFailure = () => {
    tacticalAudio.playWarningTone();
    injectRelayFailure(selectedChannelId);
  };

  const handleTriggerRecovery = () => {
    tacticalAudio.playCommitChime();
    triggerRecovery(selectedChannelId);
  };

  const handleTriggerDecision = () => {
    tacticalAudio.playAlertChime();
    triggerDecisionWindow();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none">
      <Header />

      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Top Control Room Title Bar */}
        <div className="bg-[#141618] border border-[#2a2d30] p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            {/* Back to Console Button */}
            <button
              onClick={() => {
                tacticalAudio.playClick();
                router.push('/console');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0]/50 transition-colors text-xs font-semibold"
              title="Return to Trainee Command Console"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CONSOLE</span>
            </button>

            <div className="w-8 h-8 rounded bg-[#d4860a]/20 border border-[#d4860a] flex items-center justify-center text-[#d4860a] shrink-0">
              <Layers className="w-4 h-4" />
            </div>

            <div>
              <div className="font-bold text-sm text-[#e8eaec] tracking-wider flex items-center gap-2">
                INSTRUCTOR EXERCISE CONTROL ROOM
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#d4860a]/20 text-[#d4860a] font-semibold border border-[#d4860a]/40">
                  LIVE INJECT INTERFACE
                </span>
              </div>
              <div className="text-[10px] text-[#8a9099]">
                Active Scenario: <span className="text-[#e8eaec] font-semibold">{scenario?.title || 'BLACKOUT // INFORMATION FOG'}</span> &bull; Clock: <span className="text-[#4fc3d0] font-bold">{formatTime(tick)}</span>
              </div>
            </div>
          </div>

          {/* Scenario Selector & Control Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Scenario Selector */}
            <div className="flex items-center gap-1.5 bg-[#1c1f21] border border-[#2a2d30] px-2 py-1 rounded text-xs">
              <span className="text-[#8a9099] font-bold text-[10px] hidden xl:inline">MISSION:</span>
              <select
                value={scenario?.id || 'SCN-06'}
                onChange={(e) => handleSwitchScenario(e.target.value)}
                className="bg-transparent text-[#e8eaec] font-semibold text-xs border-none outline-none cursor-pointer max-w-[190px] sm:max-w-[240px] truncate"
                title="Select active scenario for degradation testing"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#141618] text-[#e8eaec]">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Simulation Run / Pause Toggle */}
            <button
              onClick={() => {
                tacticalAudio.playClick();
                isRunning ? pauseSimulation() : startSimulation();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                isRunning
                  ? 'bg-[#d4860a]/20 text-[#d4860a] border-[#d4860a]/50 hover:bg-[#d4860a]/30'
                  : 'bg-[#2ecc71]/20 text-[#2ecc71] border-[#2ecc71]/50 hover:bg-[#2ecc71]/30 animate-pulse'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>RUN</span>
                </>
              )}
            </button>

            {/* Reset Simulation */}
            <button
              onClick={handleResetSimulation}
              className="p-1.5 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0] transition-colors"
              title="Reset current simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Trigger Tactical Decision Window */}
            <button
              onClick={handleTriggerDecision}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#d4860a] text-black font-bold text-xs hover:bg-[#d4860a]/90 transition-colors shadow-[0_0_12px_rgba(212,134,10,0.3)]"
              title="Force open the tactical decision countdown window for the trainee"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TRIGGER DECISION</span>
            </button>
          </div>
        </div>

        {/* 3 Column Grid: Inject & Variables Panel (Left), Live Trainee Map View (Center), Trainee/Team & Audit (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Column 1: Event Injection & Scenario Variables Station (Left 4 cols) */}
          <div className="lg:col-span-4 bg-[#141618] border border-[#2a2d30] p-3 sm:p-4 rounded space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              {/* Tab Selector: Degradation Injects vs Scenario Variables */}
              <div className="flex items-center gap-1 border-b border-[#2a2d30] pb-2">
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setLeftTab('INJECTS');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    leftTab === 'INJECTS'
                      ? 'bg-[#d4860a]/20 text-[#d4860a] border border-[#d4860a]/50 shadow-sm'
                      : 'text-[#8a9099] hover:text-[#e8eaec] bg-[#1c1f21]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>INJECTS</span>
                </button>
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setLeftTab('VARIABLES');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    leftTab === 'VARIABLES'
                      ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50 shadow-sm'
                      : 'text-[#8a9099] hover:text-[#e8eaec] bg-[#1c1f21]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>SCENARIO VARIABLES</span>
                </button>
              </div>

              {/* Target Channel Selector */}
              <div>
                <label className="text-[10px] text-[#8a9099] font-bold block mb-1">TARGET TELEMETRY CHANNEL:</label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full bg-[#0d0f10] border border-[#2a2d30] text-[#e8eaec] p-2 rounded text-xs font-semibold outline-none focus:border-[#4fc3d0]"
                >
                  {channelList.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.type}) &bull; Q: {Math.round(ch.channelQuality * 100)}%
                    </option>
                  ))}
                </select>
              </div>

              {leftTab === 'INJECTS' ? (
                /* Preset Degradation Injects */
                <div className="space-y-2">
                  <button
                    onClick={handleInjectLatency}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#d4860a] hover:bg-[#d4860a]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#e8eaec] group-hover:text-[#d4860a] transition-colors">INJECT HIGH LATENCY (+450ms)</div>
                      <div className="text-[10px] text-[#8a9099]">Spikes microwave backhaul propagation delay</div>
                    </div>
                    <Zap className="w-4 h-4 text-[#d4860a] shrink-0" />
                  </button>

                  <button
                    onClick={handleInjectPacketLoss}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#d4860a] hover:bg-[#d4860a]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#e8eaec] group-hover:text-[#d4860a] transition-colors">INJECT PACKET LOSS (45%)</div>
                      <div className="text-[10px] text-[#8a9099]">Degrades telemetry consistency & Q factor</div>
                    </div>
                    <Flame className="w-4 h-4 text-[#d4860a] shrink-0" />
                  </button>

                  <button
                    onClick={handleInjectDropout}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] hover:bg-[#c0392b]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#c0392b]">TRIGGER COMPLETE DROPOUT</div>
                      <div className="text-[10px] text-[#8a9099]">Drops availability to 5% (severe blackout)</div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-[#c0392b] shrink-0" />
                  </button>

                  <button
                    onClick={handleInjectContradiction}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] hover:bg-[#c0392b]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#c0392b]">INJECT CONTRADICTION</div>
                      <div className="text-[10px] text-[#8a9099]">Sends conflicting observation & relay reports</div>
                    </div>
                    <ShieldAlert className="w-4 h-4 text-[#c0392b] shrink-0" />
                  </button>

                  <button
                    onClick={handleInjectRelayFailure}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] hover:bg-[#c0392b]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#c0392b]">SEVER RELAY COUPLING</div>
                      <div className="text-[10px] text-[#8a9099]">Physical relay node power failure</div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-[#c0392b] shrink-0" />
                  </button>

                  <button
                    onClick={handleTriggerRecovery}
                    className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#2ecc71] hover:bg-[#2ecc71]/10 transition-all flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="font-bold text-[#2ecc71]">TRIGGER AUXILIARY RECOVERY</div>
                      <div className="text-[10px] text-[#8a9099]">Restores transmission carrier link to nominal</div>
                    </div>
                    <RotateCcw className="w-4 h-4 text-[#2ecc71] shrink-0" />
                  </button>
                </div>
              ) : (
                /* Configurable Scenario Variables (Sliders & EW Jamming) */
                <div className="space-y-3 bg-[#0d0f10] p-3 rounded border border-[#2a2d30]">
                  {/* Latency Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a9099] font-bold">CARRIER LATENCY:</span>
                      <span className="text-[#4fc3d0] font-bold">{varLatency} ms</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1200"
                      step="25"
                      value={varLatency}
                      onChange={(e) => setVarLatency(Number(e.target.value))}
                      className="w-full accent-[#4fc3d0] bg-[#1c1f21] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#8a9099]">
                      <span>50ms (Nominal)</span>
                      <span>600ms (High)</span>
                      <span>1200ms (Extreme)</span>
                    </div>
                  </div>

                  {/* Packet Loss Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8a9099] font-bold">PACKET LOSS RATE:</span>
                      <span className="text-[#d4860a] font-bold">{varPacketLoss}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="85"
                      step="5"
                      value={varPacketLoss}
                      onChange={(e) => setVarPacketLoss(Number(e.target.value))}
                      className="w-full accent-[#d4860a] bg-[#1c1f21] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#8a9099]">
                      <span>0% (Clean)</span>
                      <span>40% (Degraded)</span>
                      <span>85% (Critical)</span>
                    </div>
                  </div>

                  {/* EW Jamming Toggle */}
                  <div className="border-t border-[#2a2d30] pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-[#e8eaec]">EW RF JAMMING</div>
                      <div className="text-[9px] text-[#8a9099]">Barrage electronic attack on carrier spectrum</div>
                    </div>
                    <button
                      onClick={handleToggleEwJamming}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        isEwJamming
                          ? 'bg-[#c0392b] text-white animate-pulse shadow-[0_0_10px_rgba(192,57,43,0.5)]'
                          : 'bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec]'
                      }`}
                    >
                      {isEwJamming ? 'JAMMING ON' : 'JAMMING OFF'}
                    </button>
                  </div>

                  {/* Apply Variables Button */}
                  <button
                    onClick={handleApplyVariables}
                    className="w-full py-2 rounded bg-[#4fc3d0] hover:bg-[#4fc3d0]/90 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>APPLY VARIABLES TO NET</span>
                  </button>
                </div>
              )}
            </div>

            <div className="text-[10px] text-[#8a9099] border-t border-[#2a2d30] pt-2 mt-2">
              Injects and variable adjustments directly modify channel quality matrices in real time.
            </div>
          </div>

          {/* Column 2: Live Trainee View Mirror with FULL MAP FUNCTIONALITY (Center 5 cols) */}
          <div className="lg:col-span-5 bg-[#141618] border border-[#2a2d30] p-3 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between border-b border-[#2a2d30] pb-2 mb-2">
              <div className="font-bold text-xs text-[#4fc3d0] flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>LIVE OPERATIONAL MAP MIRROR (INTERACTIVE)</span>
              </div>
              <span className="text-[10px] text-[#8a9099]">FULL PAN & ZOOM ENABLED</span>
            </div>

            {/* FULLY FUNCTIONAL TACTICAL MAP */}
            <div className="h-[380px] lg:h-[460px] w-full min-h-0 rounded overflow-hidden border border-[#2a2d30] relative mb-2">
              <TacticalMap interactive={true} />
            </div>

            {/* Live Metrics Under Map */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                <span className="text-[#8a9099] text-[10px]">COMMS HEALTH:</span>
                <span className={`font-bold text-sm ${commHealth > 0.7 ? 'text-[#2ecc71]' : commHealth > 0.4 ? 'text-[#d4860a]' : 'text-[#c0392b]'}`}>
                  {formatPercent(commHealth)}
                </span>
              </div>
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                <span className="text-[#8a9099] text-[10px]">ICE INTEGRITY:</span>
                <span className={`font-bold text-sm ${infoIntegrity > 0.7 ? 'text-[#2ecc71]' : infoIntegrity > 0.4 ? 'text-[#d4860a]' : 'text-[#c0392b]'}`}>
                  {formatPercent(infoIntegrity)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Live Trainee/Team Monitoring & Audit (Right 3 cols) */}
          <div className="lg:col-span-3 bg-[#141618] border border-[#2a2d30] p-3 sm:p-4 rounded space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              {/* Tab Selector: Trainee & Team Monitoring vs System Audit */}
              <div className="flex items-center gap-1 border-b border-[#2a2d30] pb-2">
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setRightTab('TRAINEE_TEAM');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    rightTab === 'TRAINEE_TEAM'
                      ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/50 shadow-sm'
                      : 'text-[#8a9099] hover:text-[#e8eaec] bg-[#1c1f21]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>TRAINEE & TEAM</span>
                </button>
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setRightTab('AUDIT');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    rightTab === 'AUDIT'
                      ? 'bg-[#d4860a]/20 text-[#d4860a] border border-[#d4860a]/50 shadow-sm'
                      : 'text-[#8a9099] hover:text-[#e8eaec] bg-[#1c1f21]'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>AUDIT</span>
                </button>
              </div>

              {rightTab === 'TRAINEE_TEAM' ? (
                /* Real-Time Trainee Decisions & Multi-Domain Team Consensus */
                <div className="space-y-3">
                  {/* Trainee Decision Monitor */}
                  <div className="bg-[#0d0f10] border border-[#2a2d30] p-2.5 rounded space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[#8a9099] font-bold">
                      <span>TRAINEE DECISION MONITOR:</span>
                      <span className="text-[#4fc3d0]">
                        {decisions.length > 0 ? `${decisions.length} COMMITTED` : 'PENDING'}
                      </span>
                    </div>

                    {decisions.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2ecc71] bg-[#2ecc71]/15 px-2 py-0.5 rounded border border-[#2ecc71]/40">
                            {decisions[decisions.length - 1].selectedAction}
                          </span>
                          <span className="text-[10px] text-[#8a9099]">
                            {formatTime(decisions[decisions.length - 1].tick)}
                          </span>
                        </div>
                        <div className="text-[11px] font-sans text-[#e8eaec] bg-[#141618] p-2 rounded border border-[#2a2d30] leading-relaxed max-h-24 overflow-y-auto">
                          &ldquo;{decisions[decisions.length - 1].rationale}&rdquo;
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#8a9099] py-2 text-center">
                        Trainee is observing telemetry. Decision rationale will populate in real time once submitted.
                      </div>
                    )}
                  </div>

                  {/* Multi-Domain Team Net Status */}
                  <div className="bg-[#0d0f10] border border-[#2a2d30] p-2.5 rounded space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[#8a9099] font-bold">
                      <span>MULTI-DOMAIN SUB-UNITS:</span>
                      <span className="text-[#2ecc71]">4 STATIONS ACTIVE</span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      {(Object.keys(members) as (keyof typeof members)[]).map((role) => {
                        const m = members[role];
                        return (
                          <div key={role} className="flex justify-between items-center bg-[#141618] px-2 py-1 rounded border border-[#2a2d30]">
                            <span className="text-[#e8eaec] font-semibold text-[10px]">{m.callsign}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              m.status === 'NOMINAL' ? 'text-[#2ecc71] bg-[#2ecc71]/10' : m.status === 'DEGRADED_NET' ? 'text-[#d4860a] bg-[#d4860a]/10' : 'text-[#c0392b] bg-[#c0392b]/10'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team Consensus Status */}
                  {activeProposal && (
                    <div className="bg-[#0d0f10] border border-[#4fc3d0]/40 p-2.5 rounded space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#8a9099] font-bold">TEAM CONSENSUS:</span>
                        <span className="font-bold text-[#4fc3d0]">{activeProposal.consensusPercentage}%</span>
                      </div>
                      <div className="w-full bg-[#141618] h-1.5 rounded overflow-hidden">
                        <div
                          className="bg-[#2ecc71] h-full transition-all"
                          style={{ width: `${activeProposal.consensusPercentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[#8a9099] truncate">
                        Proposal: <strong className="text-[#e8eaec]">{activeProposal.action}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* System Audit Metrics & ICE Formula */
                <div className="space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                      <span className="text-[#8a9099]">DECISIONS COMMITTED:</span>
                      <span className="font-bold text-[#e8eaec]">{decisions.length}</span>
                    </div>
                    <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                      <span className="text-[#8a9099]">CONTRADICTIONS ACTIVE:</span>
                      <span className="font-bold text-[#c0392b]">
                        {informationItems.filter((i) => i.verification === 'CONTRADICTED').length}
                      </span>
                    </div>
                    <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                      <span className="text-[#8a9099]">STALE REPORTS:</span>
                      <span className="font-bold text-[#d4860a]">
                        {informationItems.filter((i) => i.verification === 'STALE').length}
                      </span>
                    </div>
                    <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                      <span className="text-[#8a9099]">OVERALL STATE:</span>
                      <span className="font-bold text-[#4fc3d0]">{overallDegradationState}</span>
                    </div>
                  </div>

                  {/* Formula Inspector */}
                  <div className="border border-[#2a2d30] p-2.5 rounded bg-[#0d0f10] text-[11px]">
                    <div className="font-bold text-[10px] text-[#4fc3d0] mb-1">ICE HEURISTIC AUDIT FORMULA</div>
                    <div className="text-[#e8eaec] mb-1 font-mono">
                      Conf = Rel × Q × Fresh × Cons
                    </div>
                    <div className="text-[10px] text-[#8a9099] leading-tight">
                      Q = Avail × (1 - Loss) × LatencyF × BwF
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event Audit Stream */}
            <div>
              <div className="text-[10px] text-[#8a9099] font-bold mb-1">RECENT AUDIT EVENTS</div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-[10px] text-[#8a9099] pr-1">
                {eventLog.slice(0, 6).map((log) => (
                  <div key={log.id} className="truncate bg-[#1c1f21] p-1.5 rounded border border-[#2a2d30]">
                    <span className="text-[#4fc3d0] font-bold">{formatTime(log.tick)}:</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
