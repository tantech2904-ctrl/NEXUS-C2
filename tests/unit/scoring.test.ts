import { describe, it, expect } from 'vitest';
import { evaluateDecision } from '@/lib/simulation/scoring';
import { InformationItem } from '@/types/simulation';
import { CommunicationChannel } from '@/types/communication';

describe('Deterministic Scoring Engine', () => {
  const contradictedItem: InformationItem = {
    id: 'c1',
    sourceName: 'Drone',
    sourceType: 'OBSERVATION',
    channelId: 'ch1',
    timestamp: 1000,
    receivedAt: 1000,
    content: 'Contradiction',
    sourceReliability: 0.8,
    freshness: 0.8,
    consistency: 0.5,
    channelQuality: 0.7,
    confidence: 0.5,
    verification: 'CONTRADICTED',
    ageSeconds: 5,
  };

  const channels: Record<string, CommunicationChannel> = {
    ch1: {
      id: 'ch1',
      name: 'Primary',
      type: 'PRIMARY',
      availability: 0.4,
      packetLoss: 0.3,
      latencyMs: 1200,
      bandwidthFactor: 0.5,
      channelQuality: 0.35,
      status: 'PARTIAL_DROPOUT',
      lastSuccessfulContactTick: 0,
    },
  };

  it('rewards VERIFY and rationale with source keywords under contradiction', () => {
    const result = evaluateDecision(
      'VERIFY',
      'Observation sensor reports conflict with relay telemetry; requesting independent confirmation.',
      8000,
      [contradictedItem],
      channels
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.outcomeClass).toBe('POSITIVE');
    expect(result.dimensions.decisionQuality).toBeGreaterThanOrEqual(80);
    expect(result.dimensions.sourceEvaluation).toBeGreaterThanOrEqual(80);
  });

  it('penalizes blind CONTINUE when reports contradict', () => {
    const result = evaluateDecision(
      'CONTINUE',
      'Moving forward despite warning.',
      2000, // hasty reflex
      [contradictedItem],
      channels
    );

    expect(result.overallScore).toBeLessThan(60);
    expect(result.dimensions.decisionQuality).toBeLessThanOrEqual(45);
    expect(result.feedback.missedUncertainties.length).toBeGreaterThan(0);
  });
});
