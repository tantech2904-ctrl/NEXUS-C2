import { CommunicationChannel, CommunicationDegradationState } from './communication';
import { EnvironmentState, InformationItem, TacticalEntity } from './simulation';
import { ScoreComponents } from './scoring';

export type DecisionAction =
  | 'ASSESS'
  | 'VERIFY'
  | 'CONTINUE'
  | 'PAUSE'
  | 'REQUEST_UPDATE'
  | 'SWITCH_INFORMATION_CHANNEL'
  | 'ESCALATE'
  | 'RECONFIGURE_TEAM_COORDINATION'
  | 'STAND_BY'
  | 'ADAPT_PLAN';

export interface DecisionOption {
  action: DecisionAction;
  label: string;
  description: string;
  category: 'ASSESSMENT' | 'ACTION' | 'COMMUNICATION' | 'ADAPTATION';
}

export interface DecisionWindow {
  id: string;
  openAtTick: number; // simulation milliseconds
  durationMs: number;
  situation: string;
  urgency: 'MODERATE' | 'CRITICAL';
  recommendedActions?: DecisionAction[];
  closedAtTick?: number;
}

export interface StateSnapshot {
  tick: number;
  commHealth: number;
  infoIntegrity: number;
  channels: Record<string, CommunicationChannel>;
  entities: Record<string, TacticalEntity>;
  availableInformationItems: InformationItem[];
  unavailableItemIds: string[];
  degradationState: CommunicationDegradationState;
  environment: EnvironmentState;
}

export interface DecisionSnapshot {
  id: string;
  decisionWindowId: string;
  tick: number; // exact simulation millisecond when decided
  selectedAction: DecisionAction;
  rationale: string;
  stateAtDecision: StateSnapshot; // immutable frozen snapshot
  scoreComponents: ScoreComponents;
  overallScore: number;
  outcomeAssessment: string;
  outcomeClass: 'POSITIVE' | 'NEUTRAL' | 'SUBOPTIMAL' | 'HIGH_RISK';
}
