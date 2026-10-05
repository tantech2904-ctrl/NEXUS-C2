'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { TeamRole, OperationalDomain, TeamMessage } from '@/types/multiplayer';
import { DecisionAction } from '@/types/decision';
import { tacticalAudio } from '@/lib/audio';
import { formatTime } from '@/lib/utils';
import { LanBriefingModal } from './LanBriefingModal';
import {
  Users,
  Shield,
  Radio,
  Plane,
  Terminal,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Vote,
  Layers,
  Lock,
  Wifi,
  QrCode,
  Share2,
} from 'lucide-react';

export const MultiplayerTeamStation: React.FC = () => {
  const {
    myRole,
    members,
    messages,
    activeProposal,
    setMyRole,
    claimLanRole,
    sendTeamMessage,
    proposeTeamAction,
    voteProposal,
    syncTickBots,
    connectedPeers,
    isLanConnected,
    lanHostInfo,
    startLanSync,
    stopLanSync,
    peerId,
  } = useMultiplayerStore();

  const { tick, commHealth, activeDecisionWindow, submitDecision } = useSimulationStore();

  const [inputMessage, setInputMessage] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'PRIORITY' | 'FLASH'>('ROUTINE');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<'ALL' | OperationalDomain>('ALL');
  const [proposalAction, setProposalAction] = useState<DecisionAction>('SWITCH_INFORMATION_CHANNEL');
  const [proposalRationale, setProposalRationale] = useState('');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isLanModalOpen, setIsLanModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync autonomous synthetic bot team members on simulation ticks
  useEffect(() => {
    syncTickBots(tick, commHealth);
  }, [tick, commHealth, syncTickBots]);

  // Auto scroll messages to bottom on new transmission
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Start LAN synchronization loop on mount and clean up on unmount
  useEffect(() => {
    startLanSync();
    return () => {
      stopLanSync();
    };
  }, [startLanSync, stopLanSync]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    tacticalAudio.playReportChirp();
    sendTeamMessage(inputMessage, priority, tick);
    setInputMessage('');
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalRationale.trim()) return;
    tacticalAudio.playWarningTone();
    proposeTeamAction(proposalAction, proposalRationale, tick);
    setIsProposeModalOpen(false);
    setProposalRationale('');
  };

  const handleVote = (vote: 'CONCUR' | 'OBJECT') => {
    if (!activeProposal) return;
    tacticalAudio.playClick();
    voteProposal(activeProposal.id, myRole, vote);
  };

  const handleCommitConsensus = () => {
    if (!activeProposal || activeProposal.consensusPercentage < 75) return;
    tacticalAudio.playDecisionCommit();
    // Also submit to simulation store if a decision window is active
    if (activeDecisionWindow) {
      submitDecision(activeProposal.action, `[TEAM CONSENSUS ${activeProposal.consensusPercentage}%] ${activeProposal.rationale}`);
    }
  };

  const roleConfig: Record<TeamRole, { label: string; icon: React.ElementType; color: string; badge: string }> = {
    TOC_LEAD_COMMANDER: {
      label: 'TOC JOINT HQ',
      icon: Shield,
      color: 'text-[#4fc3d0] border-[#4fc3d0]',
      badge: 'JOINT CMD',
    },
    LAND_COMMANDER: {
      label: 'LAND CELL (STRIKER)',
      icon: Terminal,
      color: 'text-[#2ecc71] border-[#2ecc71]',
      badge: 'GROUND',
    },
    AIR_RECON_UAS: {
      label: 'AIR RECON (HAWK-EYE)',
      icon: Plane,
      color: 'text-[#9b59b6] border-[#9b59b6]',
      badge: 'AIR/UAS',
    },
    CYBER_EW_DEFENSE: {
      label: 'CYBER/EW (SPECTRE)',
      icon: Zap,
      color: 'text-[#e67e22] border-[#e67e22]',
      badge: 'CYBER-EW',
    },
  };

  const myMember = members[myRole];
  const filteredMessages = messages.filter((m) => {
    if (selectedDomainFilter === 'ALL') return true;
    return m.domain === selectedDomainFilter;
  });

  return (
    <div className="flex flex-col h-full bg-[#141618] border border-[#2a2d30] rounded-sm font-mono text-xs select-none overflow-hidden">
      {/* Station Header */}
      <div className="bg-[#1c1f21] border-b border-[#2a2d30] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#4fc3d0]" />
          <span className="font-bold text-[#e8eaec] tracking-wider text-[11px]">
            MULTI-DOMAIN TEAM NET &bull; SMALL-TEAM C2
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#4fc3d0]/15 text-[#4fc3d0] border border-[#4fc3d0]/40 font-bold hidden sm:inline">
            LAND &bull; AIR &bull; CYBER &bull; EW
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#0d0f10] px-2 py-1 rounded border border-[#2a2d30]">
            <span
              className={`w-2 h-2 rounded-full ${
                isLanConnected ? 'bg-[#2ecc71] animate-pulse' : 'bg-[#d4860a]'
              }`}
            />
            <span className="text-[10px] text-[#8a9099]">
              {isLanConnected
                ? `LAN SYNCED (${connectedPeers.length || 1} OPERATOR${connectedPeers.length === 1 ? '' : 'S'})`
                : 'LOCAL STANDALONE'}
            </span>
          </div>

          <button
            onClick={() => setIsLanModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-[10px] tracking-wide transition shadow-sm"
          >
            <Wifi className="w-3 h-3 text-cyan-400 animate-pulse" />
            <QrCode className="w-3 h-3 text-cyan-400" />
            <span>LAN MULTIPLAYER DRILL</span>
          </button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-[#0d0f10] border-b border-[#2a2d30] p-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[#8a9099] font-bold mr-1">OPERATIONAL ROLE:</span>
        {(Object.keys(roleConfig) as TeamRole[]).map((role) => {
          const cfg = roleConfig[role];
          const member = members[role];
          const isSelected = myRole === role;
          const isClaimedByOther = member.claimedByPeerId && member.claimedByPeerId !== peerId;
          const Icon = cfg.icon;

          return (
            <button
              key={role}
              onClick={() => {
                tacticalAudio.playClick();
                claimLanRole(role);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition-all ${
                isSelected
                  ? 'bg-[#1c1f21] border-[#4fc3d0] text-[#e8eaec] shadow-[0_0_8px_rgba(79,195,208,0.3)] ring-1 ring-cyan-500/40'
                  : isClaimedByOther
                  ? 'bg-[#141618] border-[#2a2d30] text-[#8a9099] opacity-75'
                  : 'bg-[#141618] border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0]/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="font-semibold">{cfg.label}</span>
              {isSelected ? (
                <span className="text-[9px] px-1 py-0.2 rounded font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40">
                  YOU
                </span>
              ) : isClaimedByOther ? (
                <span className="text-[9px] px-1 py-0.2 rounded font-bold text-amber-400 bg-amber-950/60 border border-amber-600/30">
                  {member.claimedByIp ? member.claimedByIp.split('.').slice(-2).join('.') : 'PEER'}
                </span>
              ) : null}
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  member.status === 'NOMINAL'
                    ? 'text-[#2ecc71] bg-[#2ecc71]/15'
                    : member.status === 'DEGRADED_NET'
                    ? 'text-[#d4860a] bg-[#d4860a]/15'
                    : 'text-[#c0392b] bg-[#c0392b]/15 animate-pulse'
                }`}
              >
                {member.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Net Stream (65%), Right Team Consensus Panel (35%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Radio Traffic Net */}
        <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[#2a2d30] overflow-hidden">
          {/* Subheader: Domain Filter Pills */}
          <div className="px-3 py-1.5 bg-[#141618] border-b border-[#2a2d30] flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-[#8a9099] mr-1">FILTER DOMAIN:</span>
              {(['ALL', 'LAND', 'AIR', 'CYBER', 'JOINT_HQ'] as const).map((dom) => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomainFilter(dom)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedDomainFilter === dom
                      ? 'bg-[#4fc3d0] text-black font-bold'
                      : 'bg-[#1c1f21] text-[#8a9099] hover:text-[#e8eaec]'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
            <span className="text-[#8a9099]">NET: <strong className="text-[#e8eaec]">{myMember.assignedNet}</strong></span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0d0f10]">
            {filteredMessages.map((msg) => {
              const isMine = msg.senderRole === myRole;
              const isFlash = msg.priority === 'FLASH';
              const isDelayed = msg.status === 'DELAYED';
              const isJammed = msg.status === 'JAMMED';

              return (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded border transition-all ${
                    isFlash
                      ? 'border-[#c0392b]/60 bg-[#c0392b]/10'
                      : isMine
                      ? 'border-[#4fc3d0]/40 bg-[#1c1f21]'
                      : 'border-[#2a2d30] bg-[#141618]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#4fc3d0]">{msg.senderName}</span>
                      <span className="px-1 py-0.2 rounded bg-[#0d0f10] text-[#8a9099] border border-[#2a2d30]">
                        {msg.domain}
                      </span>
                      {msg.priority !== 'ROUTINE' && (
                        <span className={`px-1 py-0.2 rounded font-bold ${
                          isFlash ? 'bg-[#c0392b] text-white animate-pulse' : 'bg-[#d4860a] text-black'
                        }`}>
                          {msg.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[#8a9099]">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(msg.timestampTick)}
                      </span>
                      {isDelayed && (
                        <span className="text-[#d4860a] font-bold">[DELAYED IN FLIGHT]</span>
                      )}
                      {isJammed && (
                        <span className="text-[#c0392b] font-bold">[PACKET CORRUPTED/JAMMED]</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-[11px] font-sans leading-relaxed ${
                    isJammed ? 'text-[#8a9099] italic line-through' : 'text-[#e8eaec]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Radio Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-[#141618] border-t border-[#2a2d30] flex items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-[#1c1f21] border border-[#2a2d30] text-[#4fc3d0] rounded px-2 py-1.5 text-[11px] focus:outline-none"
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="FLASH">FLASH</option>
            </select>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Transmit to ${myMember.assignedNet} as ${myMember.callsign}...`}
              className="flex-1 bg-[#0d0f10] border border-[#2a2d30] rounded px-2.5 py-1.5 text-xs text-[#e8eaec] placeholder:text-[#4d5560] focus:outline-none focus:border-[#4fc3d0]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4fc3d0] text-black font-bold hover:bg-[#4fc3d0]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND</span>
            </button>
          </form>
        </div>

        {/* Right Column: Team Coordination & Consensus Decision Engine */}
        <div className="lg:col-span-4 p-3 flex flex-col justify-between bg-[#141618] overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2a2d30] mb-3">
              <span className="font-bold text-[#e8eaec] text-xs flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-[#4fc3d0]" />
                JOINT DECISION CONSENSUS
              </span>
              <button
                onClick={() => setIsProposeModalOpen(true)}
                className="px-2 py-1 rounded bg-[#4fc3d0]/15 hover:bg-[#4fc3d0]/25 text-[#4fc3d0] border border-[#4fc3d0]/40 text-[10px] font-bold"
              >
                + PROPOSE ACTION
              </button>
            </div>

            {/* Active Proposal Card */}
            {activeProposal ? (
              <div className="bg-[#1c1f21] border border-[#4fc3d0]/40 rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8a9099]">PROPOSED BY:</span>
                  <span className="text-[10px] font-bold text-[#4fc3d0]">
                    {members[activeProposal.proposedBy]?.callsign}
                  </span>
                </div>

                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold mb-0.5">ACTION:</div>
                  <div className="text-xs font-bold text-[#e8eaec] bg-[#0d0f10] p-1.5 rounded border border-[#2a2d30]">
                    {activeProposal.action}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold mb-0.5">RATIONALE:</div>
                  <div className="text-[11px] text-[#8a9099] font-sans bg-[#0d0f10] p-2 rounded border border-[#2a2d30] leading-relaxed">
                    {activeProposal.rationale}
                  </div>
                </div>

                {/* Consensus Gauge */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#8a9099]">TEAM CONSENSUS:</span>
                    <span className={`font-bold ${
                      activeProposal.consensusPercentage >= 75 ? 'text-[#2ecc71]' : 'text-[#d4860a]'
                    }`}>
                      {activeProposal.consensusPercentage}% (3/4 REQD)
                    </span>
                  </div>
                  <div className="w-full bg-[#0d0f10] h-2 rounded overflow-hidden border border-[#2a2d30]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeProposal.consensusPercentage >= 75 ? 'bg-[#2ecc71]' : 'bg-[#d4860a]'
                      }`}
                      style={{ width: `${activeProposal.consensusPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Unit Vote Matrix */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(Object.keys(roleConfig) as TeamRole[]).map((role) => {
                    const vote = activeProposal.votes[role];
                    const cfg = roleConfig[role];
                    return (
                      <div
                        key={role}
                        className="bg-[#0d0f10] p-1.5 rounded border border-[#2a2d30] flex items-center justify-between text-[10px]"
                      >
                        <span className="text-[#8a9099] truncate">{cfg.badge}:</span>
                        {vote === 'CONCUR' ? (
                          <span className="text-[#2ecc71] font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> CONCUR
                          </span>
                        ) : vote === 'OBJECT' ? (
                          <span className="text-[#c0392b] font-bold flex items-center gap-0.5">
                            <XCircle className="w-3 h-3" /> OBJECT
                          </span>
                        ) : (
                          <span className="text-[#8a9099] animate-pulse">PENDING...</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Trainee Vote Controls */}
                <div className="border-t border-[#2a2d30] pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleVote('CONCUR')}
                    className="flex-1 py-1.5 rounded bg-[#2ecc71]/20 hover:bg-[#2ecc71]/30 border border-[#2ecc71]/50 text-[#2ecc71] font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONCUR
                  </button>
                  <button
                    onClick={() => handleVote('OBJECT')}
                    className="flex-1 py-1.5 rounded bg-[#c0392b]/20 hover:bg-[#c0392b]/30 border border-[#c0392b]/50 text-[#c0392b] font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    OBJECT
                  </button>
                </div>

                {/* Commit Button if Consensus Reached */}
                {activeProposal.consensusPercentage >= 75 && (
                  <button
                    onClick={handleCommitConsensus}
                    className="w-full py-2 rounded bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-black font-bold text-xs shadow-[0_0_12px_rgba(46,204,113,0.4)] transition-all flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    COMMIT JOINT TEAM DECISION
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#0d0f10] border border-[#2a2d30] rounded text-center text-[#8a9099] space-y-2">
                <Vote className="w-6 h-6 mx-auto text-[#2a2d30]" />
                <div className="font-semibold text-xs text-[#e8eaec]">NO ACTIVE TEAM PROPOSAL</div>
                <div className="text-[11px]">
                  When tactical injects occur, any sub-unit commander can propose a shared action to coordinate under degraded comms.
                </div>
              </div>
            )}
          </div>

          {/* Sub-Unit Roster Status */}
          <div className="border-t border-[#2a2d30] pt-3">
            <span className="text-[10px] text-[#8a9099] font-bold block mb-2">SUB-UNIT COMMS STATUS</span>
            <div className="space-y-1.5">
              {(Object.keys(members) as TeamRole[]).map((role) => {
                const member = members[role];
                return (
                  <div key={role} className="flex items-center justify-between text-[11px] bg-[#1c1f21] px-2 py-1 rounded border border-[#2a2d30]">
                    <span className="text-[#e8eaec] font-semibold">{member.callsign}</span>
                    <span className={`text-[10px] font-bold ${
                      member.status === 'NOMINAL' ? 'text-[#2ecc71]' : member.status === 'DEGRADED_NET' ? 'text-[#d4860a]' : 'text-[#c0392b]'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Propose Action Modal */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141618] border border-[#4fc3d0] rounded-lg max-w-md w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2d30] pb-2">
              <span className="font-bold text-[#e8eaec] text-sm flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-[#4fc3d0]" />
                PROPOSE TEAM ACTION
              </span>
              <button
                onClick={() => setIsProposeModalOpen(false)}
                className="text-[#8a9099] hover:text-[#e8eaec]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8a9099] font-bold block mb-1">
                  ACTION SELECTION:
                </label>
                <select
                  value={proposalAction}
                  onChange={(e) => setProposalAction(e.target.value as DecisionAction)}
                  className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-xs text-[#e8eaec] focus:outline-none focus:border-[#4fc3d0]"
                >
                  <option value="SWITCH_INFORMATION_CHANNEL">SWITCH_INFORMATION_CHANNEL (Mitigate relay loss)</option>
                  <option value="VERIFY">VERIFY (Cross-reference secondary sensor)</option>
                  <option value="REQUEST_UPDATE">REQUEST_UPDATE (Request ping from field node)</option>
                  <option value="PAUSE">PAUSE (Halt advance until RF stabilizes)</option>
                  <option value="ADAPT_PLAN">ADAPT_PLAN (Reroute via alternate corridor)</option>
                  <option value="RECONFIGURE_TEAM_COORDINATION">RECONFIGURE_TEAM_COORDINATION (Decentralize authority)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8a9099] font-bold block mb-1">
                  TACTICAL RATIONALE:
                </label>
                <textarea
                  value={proposalRationale}
                  onChange={(e) => setProposalRationale(e.target.value)}
                  placeholder="Explain why the sub-units should adopt this action..."
                  rows={3}
                  className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-xs text-[#e8eaec] focus:outline-none focus:border-[#4fc3d0] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposeModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!proposalRationale.trim()}
                  className="px-4 py-1.5 rounded bg-[#4fc3d0] text-black font-bold text-xs hover:bg-[#4fc3d0]/90 disabled:opacity-40"
                >
                  BROADCAST TO TEAM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAN Drill Briefing & Joining Room Modal */}
      <LanBriefingModal
        isOpen={isLanModalOpen}
        onClose={() => setIsLanModalOpen(false)}
      />
    </div>
  );
};
