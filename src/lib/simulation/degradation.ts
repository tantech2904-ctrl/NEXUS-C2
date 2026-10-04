import { CommunicationChannel, CommunicationDegradationState } from '@/types/communication';
import { calculateChannelQuality } from './communication';

export interface DegradationPreset {
  availability: number;
  packetLoss: number;
  latencyMs: number;
  bandwidthFactor: number;
}

export const DEGRADATION_PRESETS: Record<CommunicationDegradationState, DegradationPreset> = {
  NORMAL: {
    availability: 0.98,
    packetLoss: 0.01,
    latencyMs: 75,
    bandwidthFactor: 0.98,
  },
  MINOR_DELAY: {
    availability: 0.95,
    packetLoss: 0.05,
    latencyMs: 220,
    bandwidthFactor: 0.90,
  },
  HIGH_LATENCY: {
    availability: 0.90,
    packetLoss: 0.12,
    latencyMs: 850,
    bandwidthFactor: 0.75,
  },
  PARTIAL_DROPOUT: {
    availability: 0.65,
    packetLoss: 0.35,
    latencyMs: 1400,
    bandwidthFactor: 0.50,
  },
  SEVERE_DROPOUT: {
    availability: 0.28,
    packetLoss: 0.68,
    latencyMs: 2800,
    bandwidthFactor: 0.20,
  },
  STALE_INFORMATION: {
    availability: 0.85,
    packetLoss: 0.08,
    latencyMs: 420,
    bandwidthFactor: 0.80,
  },
  CONTRADICTORY_REPORTS: {
    availability: 0.92,
    packetLoss: 0.04,
    latencyMs: 150,
    bandwidthFactor: 0.95,
  },
  PARTIAL_SENSOR_LOSS: {
    availability: 0.60,
    packetLoss: 0.22,
    latencyMs: 650,
    bandwidthFactor: 0.65,
  },
  RELAY_FAILURE: {
    availability: 0.10,
    packetLoss: 0.82,
    latencyMs: 4500,
    bandwidthFactor: 0.10,
  },
  BANDWIDTH_CONGESTION: {
    availability: 0.88,
    packetLoss: 0.26,
    latencyMs: 950,
    bandwidthFactor: 0.35,
  },
  RECOVERY: {
    availability: 0.80,
    packetLoss: 0.15,
    latencyMs: 380,
    bandwidthFactor: 0.75,
  },
  RECOVERED: {
    availability: 0.98,
    packetLoss: 0.01,
    latencyMs: 80,
    bandwidthFactor: 0.98,
  },
};

export function applyDegradationState(
  channel: CommunicationChannel,
  state: CommunicationDegradationState
): CommunicationChannel {
  const preset = DEGRADATION_PRESETS[state] || DEGRADATION_PRESETS.NORMAL;
  const updated: CommunicationChannel = {
    ...channel,
    status: state,
    availability: preset.availability,
    packetLoss: preset.packetLoss,
    latencyMs: preset.latencyMs,
    bandwidthFactor: preset.bandwidthFactor,
    channelQuality: 0,
  };
  updated.channelQuality = calculateChannelQuality(updated);
  return updated;
}
