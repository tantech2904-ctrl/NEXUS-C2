import { NextRequest, NextResponse } from 'next/server';
import {
  TeamRole,
  OperationalDomain,
  TeamMember,
  TeamMessage,
  TeamProposal,
  LanPeer,
  LanDrillSyncPayload,
} from '@/types/multiplayer';
import { DecisionAction } from '@/types/decision';

export const dynamic = 'force-dynamic';

interface GlobalLanState {
  drillId: string;
  scenarioId: string;
  tick: number;
  isRunning: boolean;
  commHealth: number;
  infoIntegrity: number;
  overallDegradationState: string;
  peers: Map<string, LanPeer>;
  messages: TeamMessage[];
  activeProposal: TeamProposal | null;
  proposalsHistory: TeamProposal[];
  members: Record<TeamRole, TeamMember>;
  updatedAt: number;
}

const DEFAULT_MEMBERS: Record<TeamRole, TeamMember> = {
  TOC_LEAD_COMMANDER: {
    role: 'TOC_LEAD_COMMANDER',
    callsign: 'TOC EAGLE-LEAD',
    domain: 'JOINT_HQ',
    assignedNet: 'NET-ALPHA [PRI-UHF]',
    status: 'NOMINAL',
    isLocalPlayer: false,
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
    content: 'All stations, this is TOC Eagle. Joint LAN multi-domain net is live. Report readiness.',
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

// In-memory global singleton shared across all LAN clients connecting to this Next.js server
const g = globalThis as unknown as { __nexus_lan_drill_state?: GlobalLanState };

function getLanState(): GlobalLanState {
  if (!g.__nexus_lan_drill_state) {
    g.__nexus_lan_drill_state = {
      drillId: `DRILL-${Date.now().toString(36).toUpperCase()}`,
      scenarioId: 'SCN-06',
      tick: 0,
      isRunning: false,
      commHealth: 0.95,
      infoIntegrity: 0.92,
      overallDegradationState: 'NORMAL',
      peers: new Map<string, LanPeer>(),
      messages: [...INITIAL_MESSAGES],
      activeProposal: null,
      proposalsHistory: [],
      members: JSON.parse(JSON.stringify(DEFAULT_MEMBERS)),
      updatedAt: Date.now(),
    };
  }
  return g.__nexus_lan_drill_state;
}

function pruneInactivePeers(state: GlobalLanState) {
  const now = Date.now();
  const timeoutMs = 25000; // 25 seconds inactivity timeout
  state.peers.forEach((peer, id) => {
    if (now - peer.lastSeen > timeoutMs) {
      state.peers.delete(id);
      // Release any claimed role
      for (const roleKey of Object.keys(state.members) as TeamRole[]) {
        if (state.members[roleKey].claimedByPeerId === id) {
          state.members[roleKey].claimedByPeerId = undefined;
          state.members[roleKey].claimedByIp = undefined;
        }
      }
    }
  });
}

export async function GET() {
  const state = getLanState();
  pruneInactivePeers(state);

  const payload: LanDrillSyncPayload = {
    drillId: state.drillId,
    scenarioId: state.scenarioId,
    tick: state.tick,
    isRunning: state.isRunning,
    commHealth: state.commHealth,
    infoIntegrity: state.infoIntegrity,
    overallDegradationState: state.overallDegradationState,
    peers: Array.from(state.peers.values()),
    messages: state.messages,
    activeProposal: state.activeProposal,
    members: state.members,
    updatedAt: state.updatedAt,
  };

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const state = getLanState();
  pruneInactivePeers(state);

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { action, payload, peerId, callsign, role, domain } = body;

  switch (action) {
    case 'HEARTBEAT':
    case 'JOIN': {
      if (peerId && role) {
        state.peers.set(peerId, {
          peerId,
          callsign: callsign || state.members[role as TeamRole]?.callsign || 'OPERATOR',
          role: role as TeamRole,
          domain: (domain as OperationalDomain) || state.members[role as TeamRole]?.domain || 'JOINT_HQ',
          ip: clientIp,
          lastSeen: Date.now(),
          isHost: Boolean(payload?.isHost),
          pingMs: payload?.pingMs || 0,
        });

        // Reserve role if not claimed
        if (state.members[role as TeamRole]) {
          state.members[role as TeamRole].claimedByPeerId = peerId;
          state.members[role as TeamRole].claimedByIp = clientIp;
        }
      }
      break;
    }

    case 'CLAIM_ROLE': {
      const targetRole = payload?.role as TeamRole;
      if (peerId && targetRole && state.members[targetRole]) {
        // Release previous role claimed by this peer
        for (const r of Object.keys(state.members) as TeamRole[]) {
          if (state.members[r].claimedByPeerId === peerId) {
            state.members[r].claimedByPeerId = undefined;
            state.members[r].claimedByIp = undefined;
          }
        }
        state.members[targetRole].claimedByPeerId = peerId;
        state.members[targetRole].claimedByIp = clientIp;

        const existingPeer = state.peers.get(peerId);
        if (existingPeer) {
          existingPeer.role = targetRole;
          existingPeer.domain = state.members[targetRole].domain;
          existingPeer.lastSeen = Date.now();
        }
      }
      break;
    }

    case 'SEND_MESSAGE': {
      if (payload?.content) {
        const senderRole = (role as TeamRole) || 'TOC_LEAD_COMMANDER';
        const senderMember = state.members[senderRole];
        let msgStatus: TeamMessage['status'] = 'DELIVERED';

        if (senderMember?.status === 'JAMMED') {
          msgStatus = 'JAMMED';
        } else if (senderMember?.status === 'DEGRADED_NET') {
          msgStatus = Math.random() < 0.35 ? 'DELAYED' : 'DELIVERED';
        }

        const newMsg: TeamMessage = {
          id: `lan-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          senderRole,
          senderName: callsign || senderMember?.callsign || 'OPERATOR',
          timestampTick: state.tick,
          content: payload.content.trim(),
          priority: payload.priority || 'ROUTINE',
          domain: (domain as OperationalDomain) || senderMember?.domain || 'JOINT_HQ',
          status: msgStatus,
          peerId,
        };

        state.messages.push(newMsg);
        // Keep last 100 messages
        if (state.messages.length > 100) {
          state.messages.shift();
        }
      }
      break;
    }

    case 'PROPOSE_ACTION': {
      if (payload?.action && payload?.rationale) {
        const proposingRole = (role as TeamRole) || 'TOC_LEAD_COMMANDER';
        const proposal: TeamProposal = {
          id: `lan-prop-${Date.now()}`,
          proposedBy: proposingRole,
          action: payload.action as DecisionAction,
          rationale: payload.rationale,
          timestampTick: state.tick,
          votes: {
            [proposingRole]: 'CONCUR',
          },
          consensusPercentage: 25,
          status: 'PROPOSED',
        };
        state.activeProposal = proposal;
      }
      break;
    }

    case 'VOTE_PROPOSAL': {
      const { proposalId, vote } = payload || {};
      const votingRole = role as TeamRole;
      if (state.activeProposal && state.activeProposal.id === proposalId && votingRole) {
        state.activeProposal.votes[votingRole] = vote;
        const concurs = Object.values(state.activeProposal.votes).filter((v) => v === 'CONCUR').length;
        const consensus = Math.round((concurs / 4) * 100);
        state.activeProposal.consensusPercentage = consensus;
        state.activeProposal.status = consensus >= 75 ? 'CONSENSUS_REACHED' : 'PROPOSED';
      }
      break;
    }

    case 'UPDATE_HOST_SIM': {
      if (payload) {
        if (typeof payload.tick === 'number') state.tick = payload.tick;
        if (typeof payload.isRunning === 'boolean') state.isRunning = payload.isRunning;
        if (typeof payload.commHealth === 'number') state.commHealth = payload.commHealth;
        if (typeof payload.infoIntegrity === 'number') state.infoIntegrity = payload.infoIntegrity;
        if (payload.overallDegradationState) state.overallDegradationState = payload.overallDegradationState;
        if (payload.scenarioId) state.scenarioId = payload.scenarioId;
        if (payload.membersStatus) {
          for (const [r, s] of Object.entries(payload.membersStatus)) {
            if (state.members[r as TeamRole]) {
              state.members[r as TeamRole].status = s as any;
            }
          }
        }
      }
      break;
    }

    case 'RESET_DRILL': {
      state.drillId = `DRILL-${Date.now().toString(36).toUpperCase()}`;
      state.tick = 0;
      state.messages = [...INITIAL_MESSAGES];
      state.activeProposal = null;
      state.members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
      break;
    }

    default:
      break;
  }

  state.updatedAt = Date.now();

  const syncResponse: LanDrillSyncPayload = {
    drillId: state.drillId,
    scenarioId: state.scenarioId,
    tick: state.tick,
    isRunning: state.isRunning,
    commHealth: state.commHealth,
    infoIntegrity: state.infoIntegrity,
    overallDegradationState: state.overallDegradationState,
    peers: Array.from(state.peers.values()),
    messages: state.messages,
    activeProposal: state.activeProposal,
    members: state.members,
    updatedAt: state.updatedAt,
  };

  return NextResponse.json(syncResponse);
}
