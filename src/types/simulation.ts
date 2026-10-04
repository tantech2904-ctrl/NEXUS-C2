export type MissionPhase =
  | 'PHASE 01 / NOMINAL OBSERVATION'
  | 'PHASE 02 / DEGRADED INFORMATION'
  | 'PHASE 03 / SEVERE INTERFERENCE'
  | 'PHASE 04 / RECOVERY & STABILIZATION';

export type InformationStatus =
  | 'CONFIRMED'
  | 'LIKELY'
  | 'UNCERTAIN'
  | 'STALE'
  | 'CONTRADICTED'
  | 'UNAVAILABLE';

export interface ConfidenceExplanation {
  sourceReliability: number;
  channelQuality: number;
  freshness: number;
  consistency: number;
  compositeConfidence: number;
  reasons: string[];
}

export interface InformationItem {
  id: string;
  sourceName: string;
  sourceType: 'FIELD_REPORT' | 'OBSERVATION' | 'RELAY' | 'SENSOR' | 'COMMAND';
  channelId: string;
  timestamp: number; // simulation millisecond when generated
  receivedAt: number; // simulation millisecond when arrived at trainee console
  content: string;
  location?: { lat: number; lng: number };
  sourceReliability: number; // [0, 1]
  freshness: number; // [0, 1]
  consistency: number; // [0, 1]
  channelQuality: number; // [0, 1]
  confidence: number; // [0, 1]
  verification: InformationStatus;
  contradictionGroupId?: string;
  ageSeconds: number;
  explanation?: ConfidenceExplanation;
}

export type EntityType =
  | 'COMMAND_NODE'
  | 'RELAY_NODE'
  | 'FIELD_TEAM'
  | 'OBSERVATION_NODE'
  | 'SUPPORT_NODE';

export interface TacticalEntity {
  id: string;
  name: string;
  type: EntityType;
  coordinates: [number, number]; // [lng, lat]
  status: 'NOMINAL' | 'DEGRADED' | 'DISRUPTED' | 'OFFLINE' | 'UNCERTAIN';
  activeChannelId: string;
  health: number; // [0, 1]
  lastContactTick: number;
  haloFlicker?: boolean;
}

export interface EnvironmentState {
  type: 'NOMINAL' | 'SEVERE_WEATHER' | 'ELECTROMAGNETIC_STORM' | 'SEISMIC_SHOCK' | 'INFRASTRUCTURE_BLACKOUT';
  severity: number; // [0, 1]
  weatherDescription: string;
  visibilityKm: number;
}
