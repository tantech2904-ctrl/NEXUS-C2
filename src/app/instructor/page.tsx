'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TacticalMap } from '@/components/map/TacticalMap';
import { useSimulationStore } from '@/stores/simulationStore';
import { useInstructorStore } from '@/stores/instructorStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatPercent, formatTime } from '@/lib/utils';
import {
  Layers,
  Radio,
  AlertTriangle,
  Zap,
  Activity,
  RotateCcw,
  Flame,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

export default function InstructorPage() {
  const {
    scenario,
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
  const channelList = Object.values(channels);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none">
      <Header />

      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* Top Control Room Title */}
        <div className="bg-[#141618] border border-[#2a2d30] p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#d4860a]/20 border border-[#d4860a] flex items-center justify-center text-[#d4860a]">
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
                Active Scenario: {scenario?.title || 'BLACKOUT // INFORMATION FOG'} &bull; Clock: {formatTime(tick)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerDecisionWindow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#d4860a] text-black font-bold text-xs hover:bg-[#d4860a]/90 transition-colors shadow-[0_0_12px_rgba(212,134,10,0.3)]"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TRIGGER DECISION WINDOW</span>
            </button>
          </div>
        </div>

        {/* 3 Column Grid: Inject Panel, Live Trainee View, Metrics & Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Column 1: Event Injection Station (Left 4 cols) */}
          <div className="lg:col-span-4 bg-[#141618] border border-[#2a2d30] p-4 rounded space-y-4">
            <div className="font-bold text-xs text-[#d4860a] flex items-center gap-1.5 border-b border-[#2a2d30] pb-2">
              <Zap className="w-4 h-4" />
              <span>DYNAMIC DEGRADATION INJECTS</span>
            </div>

            {/* Target Channel Selector */}
            <div>
              <label className="text-[10px] text-[#8a9099] font-bold block mb-1">TARGET TELEMETRY CHANNEL:</label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full bg-[#0d0f10] border border-[#2a2d30] text-[#e8eaec] rounded p-2 text-xs focus:outline-none focus:border-[#4fc3d0]"
              >
                {channelList.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({Math.round(ch.channelQuality * 100)}% Q)
                  </option>
                ))}
              </select>
            </div>

            {/* Injection Buttons Grid */}
            <div className="space-y-2">
              <button
                onClick={() => injectLatency(selectedChannelId)}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#d4860a] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#e8eaec]">INJECT LATENCY SPIKE</div>
                  <div className="text-[10px] text-[#8a9099]">Induces +450ms carrier jitter & packet delay</div>
                </div>
                <Activity className="w-4 h-4 text-[#d4860a]" />
              </button>

              <button
                onClick={() => injectPacketLoss(selectedChannelId)}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#d4860a] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#e8eaec]">INJECT PACKET LOSS (+40%)</div>
                  <div className="text-[10px] text-[#8a9099]">Degrades telemetry consistency & Q factor</div>
                </div>
                <Flame className="w-4 h-4 text-[#d4860a]" />
              </button>

              <button
                onClick={() => injectDropout(selectedChannelId)}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#c0392b]">TRIGGER COMPLETE DROPOUT</div>
                  <div className="text-[10px] text-[#8a9099]">Drops availability to 5% (severe blackout)</div>
                </div>
                <AlertTriangle className="w-4 h-4 text-[#c0392b]" />
              </button>

              <button
                onClick={injectContradiction}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#c0392b]">INJECT CONTRADICTION</div>
                  <div className="text-[10px] text-[#8a9099]">Sends conflicting observation & relay reports</div>
                </div>
                <ShieldAlert className="w-4 h-4 text-[#c0392b]" />
              </button>

              <button
                onClick={() => injectRelayFailure(selectedChannelId)}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#c0392b] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#c0392b]">SEVER RELAY COUPLING</div>
                  <div className="text-[10px] text-[#8a9099]">Physical relay node power failure</div>
                </div>
                <AlertTriangle className="w-4 h-4 text-[#c0392b]" />
              </button>

              <button
                onClick={() => triggerRecovery(selectedChannelId)}
                className="w-full text-left p-2.5 rounded bg-[#1c1f21] border border-[#2a2d30] hover:border-[#2ecc71] transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#2ecc71]">TRIGGER AUXILIARY RECOVERY</div>
                  <div className="text-[10px] text-[#8a9099]">Restores transmission carrier link to nominal</div>
                </div>
                <RotateCcw className="w-4 h-4 text-[#2ecc71]" />
              </button>
            </div>
          </div>

          {/* Column 2: Live Trainee View Mirror (Center 5 cols) */}
          <div className="lg:col-span-5 bg-[#141618] border border-[#2a2d30] p-4 rounded flex flex-col justify-between">
            <div className="font-bold text-xs text-[#4fc3d0] flex items-center gap-1.5 border-b border-[#2a2d30] pb-2 mb-3">
              <Activity className="w-4 h-4" />
              <span>LIVE TRAINEE OPERATIONAL VIEW MIRROR</span>
            </div>

            <div className="h-64 mb-3">
              <TacticalMap interactive={false} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded">
                <span className="text-[#8a9099] text-[10px]">CURRENT COMMS HEALTH:</span>
                <div className="font-bold text-[#4fc3d0] text-sm">{formatPercent(commHealth)}</div>
              </div>
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded">
                <span className="text-[#8a9099] text-[10px]">INFO INTEGRITY:</span>
                <div className="font-bold text-[#4fc3d0] text-sm">{formatPercent(infoIntegrity)}</div>
              </div>
            </div>
          </div>

          {/* Column 3: Live Evaluation & Formula Inspector (Right 3 cols) */}
          <div className="lg:col-span-3 bg-[#141618] border border-[#2a2d30] p-4 rounded space-y-4">
            <div className="font-bold text-xs text-[#e8eaec] flex items-center gap-1.5 border-b border-[#2a2d30] pb-2">
              <Activity className="w-4 h-4 text-[#4fc3d0]" />
              <span>REAL-TIME METRICS</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between">
                <span className="text-[#8a9099]">DECISIONS COMMITTED:</span>
                <span className="font-bold text-[#e8eaec]">{decisions.length}</span>
              </div>
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between">
                <span className="text-[#8a9099]">CONTRADICTIONS ACTIVE:</span>
                <span className="font-bold text-[#c0392b]">
                  {informationItems.filter((i) => i.verification === 'CONTRADICTED').length}
                </span>
              </div>
              <div className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between">
                <span className="text-[#8a9099]">STALE REPORTS:</span>
                <span className="font-bold text-[#d4860a]">
                  {informationItems.filter((i) => i.verification === 'STALE').length}
                </span>
              </div>
            </div>

            {/* Formula Inspector */}
            <div className="border border-[#2a2d30] p-3 rounded bg-[#0d0f10]">
              <div className="font-bold text-[10px] text-[#4fc3d0] mb-1">ICE HEURISTIC AUDIT FORMULA</div>
              <div className="text-[11px] text-[#e8eaec] mb-2 font-mono">
                Conf = Rel × Q × Fresh × Cons
              </div>
              <div className="text-[10px] text-[#8a9099] leading-relaxed">
                Q = Availability × (1 - PacketLoss) × LatencyFactor × BandwidthFactor
              </div>
            </div>

            {/* Event Audit Stream */}
            <div>
              <div className="text-[10px] text-[#8a9099] font-bold mb-1">RECENT EXERCISE EVENTS</div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-[10px] text-[#8a9099]">
                {eventLog.slice(0, 6).map((log) => (
                  <div key={log.id} className="truncate bg-[#1c1f21] p-1 rounded">
                    <span className="text-[#4fc3d0]">{formatTime(log.tick)}:</span> {log.message}
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
