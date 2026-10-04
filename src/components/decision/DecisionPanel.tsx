'use client';

import React, { useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSessionStore } from '@/stores/sessionStore';
import { DecisionAction } from '@/types/decision';
import { ShieldAlert, Send, Clock, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

const DECISION_ACTIONS: Array<{ action: DecisionAction; label: string; desc: string }> = [
  { action: 'ASSESS', label: 'ASSESS SITUATION', desc: 'Hold order to analyze discordant telemetry and sensor confidence' },
  { action: 'VERIFY', label: 'VERIFY TELEMETRY', desc: 'Cross-check divergent reports through auxiliary confirmation paths' },
  { action: 'CONTINUE', label: 'CONTINUE MISSION', desc: 'Maintain current movement vector despite telemetry uncertainty' },
  { action: 'PAUSE', label: 'PAUSE TRANSIT', desc: 'Halt forward field elements until critical communications stabilize' },
  { action: 'REQUEST_UPDATE', label: 'REQUEST UPDATE', desc: 'Dispatch priority ping for refreshed field and observation reports' },
  { action: 'SWITCH_INFORMATION_CHANNEL', label: 'SWITCH CHANNEL', desc: 'Reroute critical command uplink to fallback radio or satcom link' },
  { action: 'ESCALATE', label: 'ESCALATE TIER', desc: 'Elevate degraded operating conditions to higher headquarters' },
  { action: 'RECONFIGURE_TEAM_COORDINATION', label: 'RECONFIGURE TEAM', desc: 'Reassign command roles and direct point-to-point mesh relay' },
  { action: 'STAND_BY', label: 'STAND BY', desc: 'Maintain tactical posture in defensive observation status' },
  { action: 'ADAPT_PLAN', label: 'ADAPT ROUTE / PLAN', desc: 'Modify transit corridor or tactical objective to bypass degraded zone' },
];

export const DecisionPanel: React.FC = () => {
  const { activeDecisionWindow, submitDecision } = useSimulationStore();
  const { decisions } = useSessionStore();

  const [selectedAction, setSelectedAction] = useState<DecisionAction | null>(null);
  const [rationale, setRationale] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !rationale.trim() || !activeDecisionWindow) return;

    submitDecision(selectedAction, rationale.trim());
    setSelectedAction(null);
    setRationale('');
    setHasSubmitted(true);
    setTimeout(() => setHasSubmitted(false), 4000);
  };

  const isWindowActive = Boolean(activeDecisionWindow);

  return (
    <div className="flex flex-col h-full bg-[#141618] border border-[#2a2d30] rounded-sm overflow-hidden font-mono text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2 bg-[#1c1f21] border-b border-[#2a2d30] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isWindowActive ? 'text-[#d4860a] animate-pulse' : 'text-[#8a9099]'}`} />
          <span className="font-bold text-[#e8eaec] tracking-wider text-[11px]">DECISION & RATIONALE CAPTURE</span>
        </div>
        <div>
          {isWindowActive ? (
            <span className="px-2 py-0.5 rounded bg-[#d4860a]/20 border border-[#d4860a]/50 text-[#d4860a] text-[10px] font-bold animate-pulse">
              DECISION WINDOW ACTIVE
            </span>
          ) : (
            <span className="text-[10px] text-[#8a9099]">MONITORING</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col justify-between">
        {/* Situation Briefing */}
        <div className="mb-3">
          <div className="text-[10px] text-[#8a9099] font-bold tracking-wider mb-1">TACTICAL SITUATION CONTEXT</div>
          <div className="bg-[#0d0f10] border border-[#2a2d30] p-2.5 rounded text-[11px] leading-relaxed text-[#e8eaec] font-sans">
            {activeDecisionWindow ? (
              activeDecisionWindow.situation
            ) : (
              <span className="text-[#8a9099] italic">
                No active decision window. The command station is currently in passive surveillance posture. Evaluate telemetry feeds and channel health while awaiting scenario injects.
              </span>
            )}
          </div>
        </div>

        {/* Action Selection Matrix */}
        <div className="flex-1 mb-3">
          <div className="text-[10px] text-[#8a9099] font-bold tracking-wider mb-1.5 flex items-center justify-between">
            <span>SELECT COMMAND ACTION</span>
            {selectedAction && <span className="text-[#4fc3d0] font-bold">SELECTED: {selectedAction}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {DECISION_ACTIONS.map(({ action, label, desc }) => {
              const isSelected = selectedAction === action;
              const isRecommended = activeDecisionWindow?.recommendedActions?.includes(action);

              return (
                <button
                  key={action}
                  type="button"
                  disabled={!isWindowActive}
                  onClick={() => setSelectedAction(action)}
                  className={`text-left p-2 rounded border transition-all text-[11px] flex flex-col justify-between ${
                    !isWindowActive
                      ? 'opacity-40 cursor-not-allowed border-[#2a2d30] bg-[#1c1f21]'
                      : isSelected
                      ? 'bg-[#4fc3d0]/20 border-[#4fc3d0] text-[#e8eaec] shadow-[0_0_10px_rgba(79,195,208,0.2)]'
                      : 'border-[#2a2d30] bg-[#1c1f21] hover:border-[#4fc3d0]/40 text-[#8a9099] hover:text-[#e8eaec]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${isSelected ? 'text-[#4fc3d0]' : 'text-[#e8eaec]'}`}>{label}</span>
                    {isRecommended && (
                      <span className="text-[9px] px-1 rounded bg-[#2ecc71]/20 text-[#2ecc71] font-semibold border border-[#2ecc71]/40">
                        REC
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8a9099] font-sans line-clamp-2">{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mandatory Rationale Capture */}
        <form onSubmit={handleSubmit} className="border-t border-[#2a2d30] pt-2.5">
          <div className="text-[10px] text-[#8a9099] font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>COMMAND RATIONALE (MANDATORY)</span>
            <span className="text-[9px] text-[#8a9099]">MIN 15 CHARS</span>
          </div>
          <textarea
            value={rationale}
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
              {decisions.length > 0 && (
                <span>DECISIONS RECORDED: <span className="text-[#4fc3d0] font-bold">{decisions.length}</span></span>
              )}
            </div>
            <button
              type="submit"
              disabled={!isWindowActive || !selectedAction || rationale.trim().length < 15}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded font-bold text-xs transition-all ${
                !isWindowActive || !selectedAction || rationale.trim().length < 15
                  ? 'bg-[#1c1f21] border border-[#2a2d30] text-[#4d5560] cursor-not-allowed'
                  : 'bg-[#4fc3d0] text-black hover:bg-[#4fc3d0]/90 shadow-[0_0_12px_rgba(79,195,208,0.4)]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>COMMIT DECISION</span>
            </button>
          </div>
        </form>

        {/* Success confirmation toast */}
        {hasSubmitted && (
          <div className="mt-2 bg-[#2ecc71]/10 border border-[#2ecc71]/50 text-[#2ecc71] p-2 rounded text-[11px] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Decision and immutable state snapshot captured successfully. Proceeding with simulation.</span>
          </div>
        )}
      </div>
    </div>
  );
};
