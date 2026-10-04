import { describe, it, expect } from 'vitest';
import { createDecisionSnapshot, filterFutureItems, reconstructStateAtTick } from '@/lib/simulation/replay';
import { StateSnapshot } from '@/types/decision';
import { InformationItem } from '@/types/simulation';

describe('Decision Replay & Information-State Reconstruction', () => {
  const dummyItemPast: InformationItem = {
    id: 'item-past',
    sourceName: 'Team Alpha',
    sourceType: 'FIELD_REPORT',
    channelId: 'ch1',
    timestamp: 10000,
    receivedAt: 10000,
    content: 'All clear at Alpha',
    sourceReliability: 0.9,
    freshness: 0.9,
    consistency: 1.0,
    channelQuality: 0.9,
    confidence: 0.8,
    verification: 'CONFIRMED',
    ageSeconds: 5,
  };

  const dummyItemFuture: InformationItem = {
    id: 'item-future',
    sourceName: 'Observation Drone',
    sourceType: 'OBSERVATION',
    channelId: 'ch1',
    timestamp: 30000,
    receivedAt: 30000, // Arrived at T+30s
    content: 'Contradiction! Smoke detected',
    sourceReliability: 0.8,
    freshness: 1.0,
    consistency: 0.5,
    channelQuality: 0.7,
    confidence: 0.5,
    verification: 'CONTRADICTED',
    ageSeconds: 0,
  };

  it('strictly filters future information items', () => {
    const items = [dummyItemPast, dummyItemFuture];
    // At T+20s, the T+30s item MUST NOT appear
    const filteredAt20 = filterFutureItems(items, 20000);
    expect(filteredAt20.length).toBe(1);
    expect(filteredAt20[0].id).toBe('item-past');

    // At T+35s, both are visible
    const filteredAt35 = filterFutureItems(items, 35000);
    expect(filteredAt35.length).toBe(2);
  });

  it('creates an immutable frozen DecisionSnapshot', () => {
    const mockState: StateSnapshot = {
      tick: 20000,
      commHealth: 0.8,
      infoIntegrity: 0.75,
      channels: {},
      entities: {},
      availableInformationItems: [dummyItemPast],
      unavailableItemIds: [],
      degradationState: 'HIGH_LATENCY',
      environment: { type: 'NOMINAL', severity: 0, weatherDescription: 'Clear', visibilityKm: 10 },
    };

    const snapshot = createDecisionSnapshot(
      'dw-1',
      20000,
      'VERIFY',
      'Observation degraded, verifying before moving',
      mockState,
      {
        decisionQuality: 85,
        timeliness: 90,
        informationDiscipline: 95,
        sourceEvaluation: 80,
        communicationResilience: 80,
        coordination: 70,
        riskManagement: 90,
        adaptability: 75,
      },
      85,
      'Good information discipline.',
      'POSITIVE'
    );

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.stateAtDecision)).toBe(true);

    // Attempting to mutate throws in strict mode
    expect(() => {
      (snapshot as any).selectedAction = 'CONTINUE';
    }).toThrow();
  });

  it('reconstructs historical state correctly without future leak', () => {
    const snap1: StateSnapshot = {
      tick: 15000,
      commHealth: 0.95,
      infoIntegrity: 0.9,
      channels: {},
      entities: {},
      availableInformationItems: [dummyItemPast],
      unavailableItemIds: [],
      degradationState: 'NORMAL',
      environment: { type: 'NOMINAL', severity: 0, weatherDescription: 'Clear', visibilityKm: 10 },
    };

    const snap2: StateSnapshot = {
      tick: 35000,
      commHealth: 0.45,
      infoIntegrity: 0.5,
      channels: {},
      entities: {},
      availableInformationItems: [dummyItemPast, dummyItemFuture],
      unavailableItemIds: [],
      degradationState: 'SEVERE_DROPOUT',
      environment: { type: 'NOMINAL', severity: 0, weatherDescription: 'Clear', visibilityKm: 10 },
    };

    const reconstructed = reconstructStateAtTick([snap1, snap2], 20000);
    expect(reconstructed).not.toBeNull();
    expect(reconstructed?.commHealth).toBe(0.95);
    // At T+20s, only past item should be present even if snap2 had future
    expect(reconstructed?.availableInformationItems.length).toBe(1);
    expect(reconstructed?.availableInformationItems[0].id).toBe('item-past');
  });
});
