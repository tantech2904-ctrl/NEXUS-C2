'use client';

import { create } from 'zustand';
import {
  TeamRole,
  OperationalDomain,
  TeamMember,
  TeamMessage,
  TeamProposal,
} from '@/types/multiplayer';
import { DecisionAction } from '@/types/decision';

export interface MultiplayerStore {
  myRole: TeamRole;
  members: Record<TeamRole, TeamMember>;
  messages: TeamMessage[];
  activeProposal: TeamProposal | null;
  proposalsHistory: TeamProposal[];
  isSyntheticBotsActive: boolean;

  setMyRole: (role: TeamRole) => void;
  sendTeamMessage: (content: string, priority?: 'ROUTINE' | 'PRIORITY' | 'FLASH', currentTick?: number) => void;
  proposeTeamAction: (action: DecisionAction, rationale: string, currentTick: number) => void;
  voteProposal: (proposalId: string, role: TeamRole, vote: 'CONCUR' | 'OBJECT') => void;
  updateMemberStatus: (role: TeamRole, status: TeamMember['status']) => void;
  syncTickBots: (tick: number, commHealth: number) => void;
  resetTeamSession: () => void;
}

const DEFAULT_MEMBERS: Record<TeamRole, TeamMember> = {
  TOC_LEAD_COMMANDER: {
    role: 'TOC_LEAD_COMMANDER',
    callsign: 'TOC EAGLE-LEAD',
    domain: 'JOINT_HQ',
    assignedNet: 'NET-ALPHA [PRI-UHF]',
    status: 'NOMINAL',
    isLocalPlayer: true,
    activeObservationsCount: 14,
  },
  LAND_COMMANDER: {
    role: 'LAND_COMMANDER',
    callsign: 'STRIKER-01 [LAND]',
    domain: 'LAND',
    assignedNet: 'NET-BRAVO [VHF-TAC]',
    status: 'NOMINAL',
    isLocalPlayer: false,
    activeObservationsCount: 6,
  },
  AIR_RECON_UAS: {
    role: 'AIR_RECON_UAS',
    callsign: 'HAWK-EYE [UAS]',
    domain: 'AIR',
    assignedNet: 'SAT-LINK-04 [KA-BAND]',
    status: 'NOMINAL',
    isLocalPlayer: false,
    activeObservationsCount: 8,
  },
  CYBER_EW_DEFENSE: {
    role: 'CYBER_EW_DEFENSE',
    callsign: 'SPECTRE [EW/CYBER]',
    domain: 'CYBER',
    assignedNet: 'FIBER-TRUNK-01 [CRYPTO]',
    status: 'NOMINAL',
    isLocalPlayer: false,
    activeObservationsCount: 3,
  },
};

const INITIAL_MESSAGES: TeamMessage[] = [
  {
    id: 'msg-init-1',
    senderRole: 'TOC_LEAD_COMMANDER',
    senderName: 'TOC EAGLE-LEAD',
    timestampTick: 0,
    content: 'All stations, this is TOC Eagle. Joint multi-domain net is live. Report readiness.',
    priority: 'ROUTINE',
    domain: 'JOINT_HQ',
    status: 'DELIVERED',
  },
  {
    id: 'msg-init-2',
    senderRole: 'LAND_COMMANDER',
    senderName: 'STRIKER-01 [LAND]',
    timestampTick: 2500,
    content: 'Striker-01 mobile on route Alpha. VHF tactical net clear.',
    priority: 'ROUTINE',
    domain: 'LAND',
    status: 'DELIVERED',
  },
  {
    id: 'msg-init-3',
    senderRole: 'AIR_RECON_UAS',
    senderName: 'HAWK-EYE [UAS]',
    timestampTick: 5000,
    content: 'Hawk-Eye 01 established holding pattern over sector 4. Electro-optical stream active.',
    priority: 'ROUTINE',
    domain: 'AIR',
    status: 'DELIVERED',
  },
  {
    id: 'msg-init-4',
    senderRole: 'CYBER_EW_DEFENSE',
    senderName: 'SPECTRE [EW/CYBER]',
    timestampTick: 7500,
    content: 'Spectre monitoring spectrum. Baseline RF noise floor nominal at -92 dBm.',
    priority: 'ROUTINE',
    domain: 'CYBER',
    status: 'DELIVERED',
  },
];

let globalBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    globalBroadcastChannel = new BroadcastChannel('nexus_multiplayer_c2_net');
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => {
  // Listen for broadcast messages across tabs
  if (globalBroadcastChannel) {
    globalBroadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'NEW_MESSAGE') {
        set((state) => {
          if (state.messages.some((m) => m.id === data.message.id)) return state;
          return { messages: [...state.messages, data.message] };
        });
      } else if (data.type === 'NEW_PROPOSAL') {
        set({ activeProposal: data.proposal });
      } else if (data.type === 'PROPOSAL_VOTE') {
        const { proposalId, role, vote } = data;
        const current = get().activeProposal;
        if (current && current.id === proposalId) {
          const nextVotes = { ...current.votes, [role]: vote };
          const concurs = Object.values(nextVotes).filter((v) => v === 'CONCUR').length;
          const totalRoles = 4;
          const consensus = (concurs / totalRoles) * 100;
          set({
            activeProposal: {
              ...current,
              votes: nextVotes,
              consensusPercentage: consensus,
              status: consensus >= 75 ? 'CONSENSUS_REACHED' : 'PROPOSED',
            },
          });
        }
      }
    };
  }

  return {
    myRole: 'TOC_LEAD_COMMANDER',
    members: DEFAULT_MEMBERS,
    messages: INITIAL_MESSAGES,
    activeProposal: null,
    proposalsHistory: [],
    isSyntheticBotsActive: true,

    setMyRole: (role: TeamRole) => {
      set((state) => {
        const updatedMembers = { ...state.members };
        Object.keys(updatedMembers).forEach((r) => {
          updatedMembers[r as TeamRole] = {
            ...updatedMembers[r as TeamRole],
            isLocalPlayer: r === role,
          };
        });
        return { myRole: role, members: updatedMembers };
      });
    },

    sendTeamMessage: (content: string, priority = 'ROUTINE', currentTick = 0) => {
      const state = get();
      const myMember = state.members[state.myRole];
      let msgStatus: TeamMessage['status'] = 'DELIVERED';

      if (myMember.status === 'JAMMED') {
        msgStatus = 'JAMMED';
      } else if (myMember.status === 'DEGRADED_NET') {
        msgStatus = Math.random() < 0.35 ? 'DELAYED' : 'DELIVERED';
      }

      const newMsg: TeamMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        senderRole: state.myRole,
        senderName: myMember.callsign,
        timestampTick: currentTick,
        content: content.trim(),
        priority,
        domain: myMember.domain,
        status: msgStatus,
      };

      set((prev) => ({ messages: [...prev.messages, newMsg] }));

      if (globalBroadcastChannel) {
        globalBroadcastChannel.postMessage({ type: 'NEW_MESSAGE', message: newMsg });
      }
    },

    proposeTeamAction: (action: DecisionAction, rationale: string, currentTick: number) => {
      const state = get();
      const proposal: TeamProposal = {
        id: `prop-${Date.now()}`,
        proposedBy: state.myRole,
        action,
        rationale,
        timestampTick: currentTick,
        votes: {
          [state.myRole]: 'CONCUR',
        },
        consensusPercentage: 25,
        status: 'PROPOSED',
      };

      set({ activeProposal: proposal });

      if (globalBroadcastChannel) {
        globalBroadcastChannel.postMessage({ type: 'NEW_PROPOSAL', proposal });
      }

      // If synthetic bots are active, have other roles vote after a brief delay
      if (state.isSyntheticBotsActive) {
        setTimeout(() => {
          get().voteProposal(proposal.id, 'LAND_COMMANDER', 'CONCUR');
        }, 1200);

        setTimeout(() => {
          // If action is SWITCH_INFORMATION_CHANNEL or REQUEST_UPDATE, Air concurs; otherwise pauses
          get().voteProposal(proposal.id, 'AIR_RECON_UAS', 'CONCUR');
        }, 2200);

        setTimeout(() => {
          get().voteProposal(proposal.id, 'CYBER_EW_DEFENSE', 'CONCUR');
        }, 3000);
      }
    },

    voteProposal: (proposalId: string, role: TeamRole, vote: 'CONCUR' | 'OBJECT') => {
      const current = get().activeProposal;
      if (!current || current.id !== proposalId) return;

      const nextVotes = { ...current.votes, [role]: vote };
      const concurs = Object.values(nextVotes).filter((v) => v === 'CONCUR').length;
      const totalRoles = 4;
      const consensus = Math.round((concurs / totalRoles) * 100);
      const isConsensusReached = consensus >= 75;

      const updatedProposal: TeamProposal = {
        ...current,
        votes: nextVotes,
        consensusPercentage: consensus,
        status: isConsensusReached ? 'CONSENSUS_REACHED' : 'PROPOSED',
      };

      set({ activeProposal: updatedProposal });

      if (globalBroadcastChannel) {
        globalBroadcastChannel.postMessage({
          type: 'PROPOSAL_VOTE',
          proposalId,
          role,
          vote,
        });
      }
    },

    updateMemberStatus: (role: TeamRole, status: TeamMember['status']) => {
      set((state) => ({
        members: {
          ...state.members,
          [role]: { ...state.members[role], status },
        },
      }));
    },

    syncTickBots: (tick: number, commHealth: number) => {
      const state = get();
      if (!state.isSyntheticBotsActive) return;

      // Update domain member health based on comms
      if (commHealth < 0.4) {
        if (state.members.LAND_COMMANDER.status !== 'JAMMED') {
          get().updateMemberStatus('LAND_COMMANDER', 'JAMMED');
        }
        if (state.members.CYBER_EW_DEFENSE.status !== 'DEGRADED_NET') {
          get().updateMemberStatus('CYBER_EW_DEFENSE', 'DEGRADED_NET');
        }
      } else if (commHealth < 0.7) {
        if (state.members.LAND_COMMANDER.status !== 'DEGRADED_NET') {
          get().updateMemberStatus('LAND_COMMANDER', 'DEGRADED_NET');
        }
      } else {
        if (state.members.LAND_COMMANDER.status !== 'NOMINAL') {
          get().updateMemberStatus('LAND_COMMANDER', 'NOMINAL');
        }
      }

      // Injects synchronized multi-domain chatter at key exercise milestones
      const existsMsg = (contentSnippet: string) =>
        state.messages.some((m) => m.content.includes(contentSnippet));

      if (tick >= 22000 && tick < 25000 && !existsMsg('High noise floor on VHF')) {
        const msg: TeamMessage = {
          id: `bot-land-${tick}`,
          senderRole: 'LAND_COMMANDER',
          senderName: 'STRIKER-01 [LAND]',
          timestampTick: tick,
          content: 'High noise floor on VHF Net Bravo. Packet latency jumping over 450ms. Switching to secondary hop.',
          priority: 'PRIORITY',
          domain: 'LAND',
          status: 'DELAYED',
        };
        set((prev) => ({ messages: [...prev.messages, msg] }));
      }

      if (tick >= 38000 && tick < 42000 && !existsMsg('Contradiction detected')) {
        const msg: TeamMessage = {
          id: `bot-air-${tick}`,
          senderRole: 'AIR_RECON_UAS',
          senderName: 'HAWK-EYE [UAS]',
          timestampTick: tick,
          content: 'FLASH TRAFFIC: Optical sensors show sector clear, but relay node is broadcasting hostile motion alert. Contradiction detected.',
          priority: 'FLASH',
          domain: 'AIR',
          status: 'DELIVERED',
        };
        set((prev) => ({ messages: [...prev.messages, msg] }));
      }

      if (tick >= 46000 && tick < 50000 && !existsMsg('Barrage jamming')) {
        const msg: TeamMessage = {
          id: `bot-ew-${tick}`,
          senderRole: 'CYBER_EW_DEFENSE',
          senderName: 'SPECTRE [EW/CYBER]',
          timestampTick: tick,
          content: 'EW ALERT: Directed RF barrage jamming localized on Relay 02 microwave link. Advise all sub-units verify ICE confidence before maneuvers.',
          priority: 'FLASH',
          domain: 'ELECTRONIC_WARFARE',
          status: 'DELIVERED',
        };
        set((prev) => ({ messages: [...prev.messages, msg] }));
      }
    },

    resetTeamSession: () => {
      set({
        myRole: 'TOC_LEAD_COMMANDER',
        members: DEFAULT_MEMBERS,
        messages: INITIAL_MESSAGES,
        activeProposal: null,
        proposalsHistory: [],
      });
    },
  };
});
