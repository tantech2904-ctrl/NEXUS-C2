import { z } from 'zod';
import { CommunicationDegradationState } from './communication';
import { EnvironmentState, TacticalEntity } from './simulation';
import { CommunicationChannel } from './communication';
import { DecisionWindow } from './decision';
import { ScoringWeights } from './scoring';

export type InjectType =
  | 'LATENCY'
  | 'PACKET_LOSS'
  | 'DROPOUT'
  | 'RELAY_FAILURE'
  | 'SENSOR_LOSS'
  | 'CONTRADICTION'
  | 'STALE_INFORMATION'
  | 'BANDWIDTH_CONGESTION'
  | 'RECOVERY'
  | 'REPORT_INCOMING'
  | 'WEATHER_SHIFT'
  | 'CUSTOM';

export interface ScenarioInject {
  id: string;
  time: number; // millisecond trigger in simulation time
  type: InjectType;
  target?: string; // target channelId or entityId
  severity?: number; // [0, 1]
  durationMs?: number;
  message?: string;
  payload?: any;
}

export interface Scenario {
  id: string;
  version: string;
  title: string;
  historicalBasis?: string | null;
  syntheticDisclaimer: string;
  difficulty: 'FOUNDATION' | 'ADVANCED' | 'EXPERT';
  seed: number;
  durationMs: number;
  stalenessThresholdSeconds: number;
  environment: EnvironmentState;
  entities: TacticalEntity[];
  communicationChannels: CommunicationChannel[];
  initialConditions: {
    commHealth: number;
    infoIntegrity: number;
    initialDegradationState: CommunicationDegradationState;
  };
  events: ScenarioInject[];
  decisionWindows: DecisionWindow[];
  scoringWeights: ScoringWeights;
  sources: {
    name: string;
    organization: string;
    url: string;
    usage: string;
  }[];
}

export const ScenarioInjectSchema = z.object({
  id: z.string(),
  time: z.number(),
  type: z.enum([
    'LATENCY',
    'PACKET_LOSS',
    'DROPOUT',
    'RELAY_FAILURE',
    'SENSOR_LOSS',
    'CONTRADICTION',
    'STALE_INFORMATION',
    'BANDWIDTH_CONGESTION',
    'RECOVERY',
    'REPORT_INCOMING',
    'WEATHER_SHIFT',
    'CUSTOM'
  ]),
  target: z.string().optional(),
  severity: z.number().min(0).max(1).optional(),
  durationMs: z.number().optional(),
  message: z.string().optional(),
  payload: z.any().optional(),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  historicalBasis: z.string().nullable().optional(),
  syntheticDisclaimer: z.string(),
  difficulty: z.enum(['FOUNDATION', 'ADVANCED', 'EXPERT']),
  seed: z.number(),
  durationMs: z.number(),
  stalenessThresholdSeconds: z.number().default(40),
  environment: z.object({
    type: z.enum(['NOMINAL', 'SEVERE_WEATHER', 'ELECTROMAGNETIC_STORM', 'SEISMIC_SHOCK', 'INFRASTRUCTURE_BLACKOUT']),
    severity: z.number(),
    weatherDescription: z.string(),
    visibilityKm: z.number(),
  }),
  entities: z.array(z.any()),
  communicationChannels: z.array(z.any()),
  initialConditions: z.object({
    commHealth: z.number(),
    infoIntegrity: z.number(),
    initialDegradationState: z.string(),
  }),
  events: z.array(ScenarioInjectSchema),
  decisionWindows: z.array(z.any()),
  scoringWeights: z.object({
    decisionQuality: z.number(),
    timeliness: z.number(),
    informationDiscipline: z.number(),
    sourceEvaluation: z.number(),
    communicationResilience: z.number(),
    coordination: z.number(),
    riskManagement: z.number(),
    adaptability: z.number(),
  }),
  sources: z.array(z.object({
    name: z.string(),
    organization: z.string(),
    url: z.string(),
    usage: z.string(),
  })),
});
