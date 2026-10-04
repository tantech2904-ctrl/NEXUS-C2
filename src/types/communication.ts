export type CommunicationDegradationState =
  | 'NORMAL'
  | 'MINOR_DELAY'
  | 'HIGH_LATENCY'
  | 'PARTIAL_DROPOUT'
  | 'SEVERE_DROPOUT'
  | 'STALE_INFORMATION'
  | 'CONTRADICTORY_REPORTS'
  | 'PARTIAL_SENSOR_LOSS'
  | 'RELAY_FAILURE'
  | 'BANDWIDTH_CONGESTION'
  | 'RECOVERY'
  | 'RECOVERED';

export type ChannelType =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'RADIO'
  | 'SATELLITE'
  | 'FALLBACK'
  | 'FIELD';

export interface CommunicationChannel {
  id: string;
  name: string;
  type: ChannelType;
  availability: number; // [0, 1]
  packetLoss: number; // [0, 1]
  latencyMs: number; // ms
  bandwidthFactor: number; // [0, 1]
  channelQuality: number; // [0, 1] (computed Q)
  status: CommunicationDegradationState;
  lastSuccessfulContactTick: number;
}
