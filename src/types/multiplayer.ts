import { DecisionAction } from './decision';

export type TeamRole =
  | 'LAND_COMMANDER'
  | 'AIR_RECON_UAS'
  | 'CYBER_EW_DEFENSE'
  | 'TOC_LEAD_COMMANDER';

export type OperationalDomain = 'LAND' | 'AIR' | 'CYBER' | 'ELECTRONIC_WARFARE' | 'JOINT_HQ';

export interface TeamMember {
  role: TeamRole;
  callsign: string;
  domain: OperationalDomain;
  assignedNet: string;
  status: 'NOMINAL' | 'DEGRADED_NET' | 'PARTITIONED' | 'JAMMED';
  isLocalPlayer: boolean;
  activeObservationsCount: number;
  claimedByPeerId?: string;
  claimedByIp?: string;
}

export interface TeamMessage {
  id: string;
  senderRole: TeamRole;
  senderName: string;
  timestampTick: number;
  content: string;
  priority: 'ROUTINE' | 'PRIORITY' | 'FLASH';
  domain: OperationalDomain;
  status: 'DELIVERED' | 'DELAYED' | 'JAMMED' | 'DROPPED';
  peerId?: string;
}

export interface TeamProposal {
  id: string;
  proposedBy: TeamRole;
  action: DecisionAction;
  rationale: string;
  timestampTick: number;
  votes: Partial<Record<TeamRole, 'CONCUR' | 'OBJECT' | 'PENDING'>>;
  consensusPercentage: number;
  status: 'PROPOSED' | 'CONSENSUS_REACHED' | 'DISCORDANT' | 'COMMITTED';
}

export interface LanPeer {
  peerId: string;
  callsign: string;
  role: TeamRole;
  domain: OperationalDomain;
  ip: string;
  lastSeen: number;
  isHost: boolean;
  pingMs?: number;
}

export interface LanHostInfo {
  hostIps: string[];
  primaryIp: string;
  port: number;
  joinUrl: string;
  hostName: string;
  interfaces?: { name: string; ip: string; isVirtual?: boolean }[];
}

export interface LanDrillSyncPayload {
  drillId: string;
  scenarioId: string;
  tick: number;
  isRunning: boolean;
  commHealth: number;
  infoIntegrity: number;
  overallDegradationState: string;
  peers: LanPeer[];
  messages: TeamMessage[];
  activeProposal: TeamProposal | null;
  members: Record<TeamRole, TeamMember>;
  updatedAt: number;
}
