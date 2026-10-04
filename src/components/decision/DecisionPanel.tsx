'use client';

import React, { useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { DecisionAction } from '@/types/decision';
import { tacticalAudio } from '@/lib/audio';
import { ShieldAlert, Send, CheckCircle2, AlertOctagon, Filter, Check } from 'lucide-react';

const DECISION_ACTIONS: Array<{ action: DecisionAction; label: string; desc: string; category: 'EVALUATE' | 'COMM' | 'TACTICAL' }> = [
  { action: 'VERIFY', label: 'VERIFY TELEMETRY', desc: 'Cross-check divergent reports through auxiliary confirmation paths', category: 'EVALUATE' },
  { action: 'REQUEST_UPDATE', label: 'REQUEST UPDATE', desc: 'Dispatch priority ping for refreshed field and observation reports', category: 'EVALUATE' },
  { action: 'ASSESS', label: 'ASSESS SITUATION', desc: 'Hold order to analyze discordant telemetry and sensor confidence', category: 'EVALUATE' },
  { action: 'SWITCH_INFORMATION_CHANNEL', label: 'SWITCH CHANNEL', desc: 'Reroute critical command uplink to fallback radio or satcom link', category: 'COMM' },
  { action: 'RECONFIGURE_TEAM_COORDINATION', label: 'RECONFIGURE TEAM', desc: 'Reassign command roles and direct point-to-point mesh relay', category: 'COMM' },
  { action: 'ESCALATE', label: 'ESCALATE TIER', desc: 'Elevate degraded operating conditions to higher headquarters', category: 'COMM' },
  { action: 'ADAPT_PLAN', label: 'ADAPT ROUTE / PLAN', desc: 'Modify transit corridor or tactical objective to bypass degraded zone', category: 'TACTICAL' },
  { action: 'PAUSE', label: 'PAUSE TRANSIT', desc: 'Halt forward field elements until critical communications stabilize', category: 'TACTICAL' },
  { action: 'CONTINUE', label: 'CONTINUE MISSION', desc: 'Maintain current movement vector despite telemetry uncertainty', category: 'TACTICAL' },
  { action: 'STAND_BY', label: 'STAND BY', desc: 'Maintain tactical posture in defensive observation status', category: 'TACTICAL' },
];

export const DecisionPanel: React.FC = () => {
  const { activeDecisionWindow, submitDecision } = useSimulationStore();
  const { decisions } = useSessionStore();

  const [selectedAction, setSelectedAction] = useState<DecisionAction | null>(null);
  const [rationale, setRationale] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'EVALUATE' | 'COMM' | 'TACTICAL'>('ALL');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !rationale.trim() || !activeDecisionWindow) return;

    tacticalAudio.playCommitChime();
    submitDecision(selectedAction, rationale.trim());
    setSelectedAction(null);
    setRationale('');
    setHasSubmitted(true);
    setTimeout(() => setHasSubmitted(false), 4500);
  };

  const isWindowActive = Boolean(activeDecisionWindow);

  const filteredActions = filterCategory === 'ALL'
    ? DECISION_ACTIONS
    : DECISION_ACTIONS.filter((a) => a.category === filterCategory);

  return (
    <div className="flex flex-col h-full bg-[#141618] border border-[#2a2d30] rounded-sm overflow-hidden font-mono text-xs select-none shadow-sm">
      {/* Header */}
      <div className="px-3 py-2 bg-[#1c1f21] border-b border-[#2a2d30] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isWindowActive ? 'text-[#d4860a] animate-pulse' : 'text-[#8a9099]'}`} />
          <span className="font-bold text-[#e8eaec] tracking-wider text-[11px]">DECISION & RATIONALE CAPTURE</span>
        </div>
        <div>
          {isWindowActive ? (
            <span className="px-2 py-0.5 rounded bg-[#d4860a]/20 border border-[#d4860a]/60 text-[#d4860a] text-[10px] font-bold animate-pulse">
              WINDOW ACTIVE
            </span>
          ) : (
            <span className="text-[10px] text-[#8a9099]">MONITORING</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 flex flex-col justify-between space-y-3">
        {/* Situation Briefing */}
        <div>
          <div className="text-[10px] text-[#8a9099] font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>TACTICAL CONTEXT</span>
            {isWindowActive && <span className="text-[#d4860a] text-[9px] font-bold">DECISION REQUIRED</span>}
          </div>
          <div className={`p-2.5 rounded text-[11px] leading-relaxed font-sans border transition-all ${
            isWindowActive
              ? 'bg-[#d4860a]/10 border-[#d4860a]/40 text-[#e8eaec]'
              : 'bg-[#0d0f10] border-[#2a2d30] text-[#8a9099]'
          }`}>
            {activeDecisionWindow ? (
              activeDecisionWindow.situation
            ) : (
              <span>Awaiting decision window trigger. Evaluate incoming telemetry feeds while awaiting command injects.</span>
            )}
          </div>
        </div>

        {/* Action Selection Matrix */}
        <div className="flex-1 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8a9099] font-bold tracking-wider">COMMAND ACTIONS</span>
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 text-[9px]">
              {(['ALL', 'EVALUATE', 'COMM', 'TACTICAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    filterCategory === cat
                      ? 'bg-[#4fc3d0] text-black font-bold'
                      : 'text-[#8a9099] hover:text-[#e8eaec] bg-[#1c1f21]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[180px] pr-1">
            {filteredActions.map(({ action, label, desc }) => {
              const isSelected = selectedAction === action;
              const isRecommended = activeDecisionWindow?.recommendedActions?.includes(action);

              return (
                <button
                  key={action}
                  type="button"
                  data-tour={action === 'SWITCH_INFORMATION_CHANNEL' ? 'decision-action-SWITCH_INFORMATION_CHANNEL' : undefined}
                  disabled={!isWindowActive}
                  onClick={() => {
                    tacticalAudio.playClick();
                    setSelectedAction(action);
                  }}
                  className={`w-full text-left p-2 rounded border transition-all text-xs flex flex-col justify-between ${
                    !isWindowActive
                      ? 'opacity-40 cursor-not-allowed border-[#2a2d30] bg-[#1c1f21]'
                      : isSelected
                      ? 'bg-[#4fc3d0]/20 border-[#4fc3d0] text-[#e8eaec] shadow-[0_0_10px_rgba(79,195,208,0.25)]'
                      : 'border-[#2a2d30] bg-[#1c1f21] hover:border-[#4fc3d0]/40 text-[#8a9099] hover:text-[#e8eaec]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-bold text-[11px] ${isSelected ? 'text-[#4fc3d0]' : 'text-[#e8eaec]'}`}>
                      {label}
                    </span>
                    {isRecommended && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2ecc71]/20 text-[#2ecc71] font-semibold border border-[#2ecc71]/40">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8a9099] font-sans truncate">{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mandatory Rationale Capture */}
        <form onSubmit={handleSubmit} className="border-t border-[#2a2d30] pt-2.5">
          <div className="text-[10px] text-[#8a9099] font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>OPERATIONAL RATIONALE (MANDATORY)</span>
            <span className={`text-[9px] ${rationale.trim().length >= 15 ? 'text-[#2ecc71]' : 'text-[#d4860a]'}`}>
              {rationale.trim().length}/15 CHARS MIN
            </span>
          </div>

          <textarea
            value={rationale}
            data-tour="rationale-input"
            disabled={!isWindowActive}
            onChange={(e) => setRationale(e.target.value)}
            placeholder={
              isWindowActive
                ? 'Specify why you trust or distrust available reports, why this action mitigates uncertainty...'
                : 'Decision window closed.'
            }
            rows={2}
            className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-xs font-sans text-[#e8eaec] placeholder:text-[#4d5560] focus:outline-none focus:border-[#4fc3d0] transition-colors resize-none disabled:opacity-40"
          />

          <div className="mt-2 flex items-center justify-between">
            <div className="text-[10px] text-[#8a9099]">
              {selectedAction ? (
                <span className="text-[#4fc3d0] font-bold">{selectedAction}</span>
              ) : (
                <span>Pick action above</span>
              )}
            </div>

            <button
              type="submit"
              data-tour="commit-button"
              disabled={!isWindowActive || !selectedAction || rationale.trim().length < 15}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-bold text-xs transition-all ${
                !isWindowActive || !selectedAction || rationale.trim().length < 15
                  ? 'bg-[#1c1f21] border border-[#2a2d30] text-[#4d5560] cursor-not-allowed'
                  : 'bg-[#4fc3d0] text-black hover:bg-[#4fc3d0]/90 shadow-[0_0_12px_rgba(79,195,208,0.4)]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>COMMIT</span>
            </button>
          </div>
        </form>

        {/* Confirmation alert */}
        {hasSubmitted && (
          <div className="bg-[#2ecc71]/15 border border-[#2ecc71]/50 text-[#2ecc71] p-2 rounded text-[11px] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Decision recorded. Immutable snapshot frozen.</span>
          </div>
        )}
      </div>
    </div>
  );
};
