import { describe, it, expect } from 'vitest';
import { calculateChannelQuality, calculateLatencyFactor, calculateAggregateCommHealth } from '@/lib/simulation/communication';
import { CommunicationChannel } from '@/types/communication';

describe('Communication Quality (Q)', () => {
  it('calculates nominal Q = 1.0 for perfect channel', () => {
    const q = calculateChannelQuality({
      availability: 1.0,
      packetLoss: 0.0,
      latencyMs: 50,
      bandwidthFactor: 1.0,
    });
    expect(q).toBe(1.0);
  });

  it('penalizes high latency properly', () => {
    expect(calculateLatencyFactor(80)).toBe(1.0);
    expect(calculateLatencyFactor(450)).toBe(0.75);
    expect(calculateLatencyFactor(1200)).toBe(0.40);
    expect(calculateLatencyFactor(3500)).toBe(0.20);
  });

  it('drops Q proportionally with packet loss', () => {
    const qNominal = calculateChannelQuality({ availability: 1.0, packetLoss: 0.0, latencyMs: 50, bandwidthFactor: 1.0 });
    const qDegraded = calculateChannelQuality({ availability: 1.0, packetLoss: 0.4, latencyMs: 50, bandwidthFactor: 1.0 });
    expect(qDegraded).toBeCloseTo(0.6, 2);
    expect(qDegraded).toBeLessThan(qNominal);
  });

  it('computes aggregate commHealth as mean of channels', () => {
    const channels: Record<string, CommunicationChannel> = {
      ch1: { id: 'ch1', name: 'Ch 1', type: 'PRIMARY', availability: 1, packetLoss: 0, latencyMs: 50, bandwidthFactor: 1, channelQuality: 1.0, status: 'NORMAL', lastSuccessfulContactTick: 0 },
      ch2: { id: 'ch2', name: 'Ch 2', type: 'RADIO', availability: 1, packetLoss: 0, latencyMs: 50, bandwidthFactor: 1, channelQuality: 0.6, status: 'NORMAL', lastSuccessfulContactTick: 0 },
    };
    expect(calculateAggregateCommHealth(channels)).toBe(0.8);
  });
});
