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
