'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { DecisionSnapshot } from '@/types/decision';
import { formatPercent, formatTime } from '@/lib/utils';
import { Shield, Clock, RotateCcw, X, Radio, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ isOpen, onClose }) => {
  const { decisions } = useSessionStore();
  const [selectedDecisionIndex, setSelectedDecisionIndex] = useState(0);

  if (!isOpen || decisions.length === 0) return null;

  const currentSnapshot: DecisionSnapshot = decisions[selectedDecisionIndex] || decisions[0];
  const state = currentSnapshot.stateAtDecision;
  const channelList = Object.values(state.channels);

  const prevDecision = () => {
    if (selectedDecisionIndex > 0) setSelectedDecisionIndex(selectedDecisionIndex - 1);
  };

  const nextDecision = () => {
    if (selectedDecisionIndex < decisions.length - 1) setSelectedDecisionIndex(selectedDecisionIndex + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none font-mono">
      <div className="bg-[#141618] border border-[#4fc3d0]/60 rounded-md w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1c1f21] border-b border-[#2a2d30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[#4fc3d0] bg-[#4fc3d0]/20 flex items-center justify-center text-[#4fc3d0]">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#e8eaec] tracking-wider flex items-center gap-2">
                DECISION REPLAY // INFORMATION-STATE RECONSTRUCTION
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#4fc3d0]/20 text-[#4fc3d0] font-semibold border border-[#4fc3d0]/40">
                  IMMUTABLE SNAPSHOT
                </span>
              </div>
              <div className="text-[10px] text-[#8a9099]">
                Zero Future-Information Leakage Guarantee &bull; Snapshot ID: {currentSnapshot.id}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8a9099] hover:text-[#e8eaec] hover:bg-[#2a2d30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="bg-[#0d0f10] border-b border-[#2a2d30] px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={prevDecision}
              disabled={selectedDecisionIndex === 0}
              className="p-1 rounded border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[#e8eaec]">
              DECISION {selectedDecisionIndex + 1} OF {decisions.length}
            </span>
            <button
              onClick={nextDecision}
              disabled={selectedDecisionIndex === decisions.length - 1}
              className="p-1 rounded border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#8a9099]">DECISION TIMESTAMP:</span>
            <span className="bg-[#1c1f21] px-2.5 py-1 rounded text-[#4fc3d0] font-bold border border-[#2a2d30]">
              {formatTime(currentSnapshot.tick)}
            </span>
          </div>
        </div>

        {/* Reconstructed State Panels */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2a2d30] overflow-y-auto">
          {/* Column 1: What was Known (Available Reports at this Tick) */}
          <div className="p-4 flex flex-col overflow-y-auto">
            <div className="text-[11px] font-bold text-[#4fc3d0] tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
              WHAT WAS KNOWN (AVAILABLE REPORTS)
            </div>
            <div className="text-[10px] text-[#8a9099] mb-3">
              Only information received on or before {formatTime(currentSnapshot.tick)}:
            </div>

            <div className="space-y-2.5 flex-1">
              {state.availableInformationItems.length === 0 ? (
                <div className="text-xs text-[#8a9099] italic p-4 text-center">No reports ingested at this moment.</div>
              ) : (
                state.availableInformationItems.map((item) => (
                  <div key={item.id} className="bg-[#1c1f21] border border-[#2a2d30] p-2.5 rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#e8eaec]">{item.sourceName}</span>
                      <span className="text-[10px] text-[#4fc3d0] font-semibold">{formatPercent(item.confidence)} CONF</span>
                    </div>
                    <div className="text-[11px] text-[#8a9099] font-sans mb-1.5">&ldquo;{item.content}&rdquo;</div>
                    <div className="text-[10px] text-[#8a9099] flex justify-between border-t border-[#2a2d30] pt-1">
                      <span>STATUS: {item.verification}</span>
                      <span>AGE: {item.ageSeconds.toFixed(1)}s</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: What was Uncertain / Comms State */}
          <div className="p-4 flex flex-col overflow-y-auto">
            <div className="text-[11px] font-bold text-[#d4860a] tracking-wider mb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#d4860a]" />
              COMMUNICATION NETWORK AT DECISION
            </div>
            <div className="text-[10px] text-[#8a9099] mb-3">
              Telemetry link health active when command was issued:
            </div>

            <div className="space-y-2.5 mb-4">
              {channelList.map((ch) => (
                <div key={ch.id} className="bg-[#1c1f21] border border-[#2a2d30] p-2 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#e8eaec] text-[11px]">{ch.name}</span>
                    <span className="text-[10px] font-semibold text-[#4fc3d0]">{formatPercent(ch.channelQuality)} Q</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-[#8a9099]">
                    <div>STATUS: <span className="text-[#e8eaec] font-semibold">{ch.status}</span></div>
                    <div>LATENCY: <span className="text-[#e8eaec]">{ch.latencyMs}ms</span></div>
                    <div>LOSS: <span className="text-[#e8eaec]">{Math.round(ch.packetLoss * 100)}%</span></div>
                    <div>AVAIL: <span className="text-[#e8eaec]">{Math.round(ch.availability * 100)}%</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0d0f10] border border-[#2a2d30] p-2.5 rounded text-xs">
              <div className="text-[10px] text-[#8a9099] font-bold mb-1">GLOBAL TELEMETRY INTEGRITY</div>
              <div className="flex justify-between items-center mb-1">
                <span>COMMUNICATION HEALTH:</span>
                <span className="font-bold text-[#4fc3d0]">{formatPercent(state.commHealth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>INFORMATION INTEGRITY:</span>
                <span className="font-bold text-[#4fc3d0]">{formatPercent(state.infoIntegrity)}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Command Decision & Score Audit */}
          <div className="p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="text-[11px] font-bold text-[#e8eaec] tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#4fc3d0]" />
                TRAINEE COMMAND & RATIONALE
              </div>

              {/* Action Badge */}
              <div className="bg-[#4fc3d0]/10 border border-[#4fc3d0]/50 p-2.5 rounded mb-3">
                <div className="text-[10px] text-[#8a9099]">EXECUTED ACTION:</div>
                <div className="font-bold text-sm text-[#4fc3d0]">{currentSnapshot.selectedAction}</div>
              </div>

              {/* Rationale */}
              <div className="mb-3">
                <div className="text-[10px] text-[#8a9099] mb-1">RECORDED RATIONALE:</div>
                <div className="bg-[#0d0f10] border border-[#2a2d30] p-2.5 rounded text-xs text-[#e8eaec] font-sans leading-relaxed">
                  &ldquo;{currentSnapshot.rationale}&rdquo;
                </div>
              </div>

              {/* Score Assessment */}
              <div className="bg-[#1c1f21] border border-[#2a2d30] p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[#8a9099]">DECISION SCORE:</span>
                  <span className="text-base font-bold text-[#4fc3d0]">{currentSnapshot.overallScore} / 100</span>
                </div>
                <div className="text-[11px] text-[#2ecc71] font-semibold mb-2">
                  CLASSIFICATION: {currentSnapshot.outcomeClass}
                </div>
                <div className="text-[11px] text-[#8a9099] font-sans">
                  {currentSnapshot.outcomeAssessment}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2a2d30] text-[10px] text-[#8a9099] text-center">
              Replay strictly reconstructs the trainee&apos;s information state at this moment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
