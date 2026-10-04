import { DecisionAction, DecisionSnapshot, StateSnapshot } from '@/types/decision';
import { ScoreComponents } from '@/types/scoring';
import { InformationItem } from '@/types/simulation';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = (obj as any)[prop];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });
  return obj;
}

export function createDecisionSnapshot(
  decisionWindowId: string,
  tick: number,
  selectedAction: DecisionAction,
  rationale: string,
  currentState: StateSnapshot,
  scoreComponents: ScoreComponents,
  overallScore: number,
  outcomeAssessment: string,
  outcomeClass: 'POSITIVE' | 'NEUTRAL' | 'SUBOPTIMAL' | 'HIGH_RISK'
): DecisionSnapshot {
  // Clone state strictly at this tick
  const stateClone: StateSnapshot = {
    tick,
    commHealth: currentState.commHealth,
    infoIntegrity: currentState.infoIntegrity,
    channels: JSON.parse(JSON.stringify(currentState.channels)),
    entities: JSON.parse(JSON.stringify(currentState.entities)),
    availableInformationItems: filterFutureItems(currentState.availableInformationItems, tick),
    unavailableItemIds: [...currentState.unavailableItemIds],
    degradationState: currentState.degradationState,
    environment: { ...currentState.environment },
  };

  const snapshot: DecisionSnapshot = {
    id: `snap-${tick}-${Math.random().toString(36).substr(2, 6)}`,
    decisionWindowId,
    tick,
    selectedAction,
    rationale,
    stateAtDecision: stateClone,
    scoreComponents: { ...scoreComponents },
    overallScore,
    outcomeAssessment,
    outcomeClass,
  };

  return deepFreeze(snapshot) as DecisionSnapshot;
}

/**
 * STRICT TEMPORAL FILTER:
 * Never returns any information item that was received after targetTick.
 */
export function filterFutureItems(items: InformationItem[], targetTick: number): InformationItem[] {
  return items.filter((item) => item.receivedAt <= targetTick);
}

/**
 * Reconstructs the exact information state at a given tick from snapshot sequence.
 */
export function reconstructStateAtTick(
  historicalSnapshots: StateSnapshot[],
  targetTick: number
): StateSnapshot | null {
  if (!historicalSnapshots || historicalSnapshots.length === 0) return null;

  // Find nearest snapshot at or immediately preceding targetTick
  const eligible = historicalSnapshots
    .filter((s) => s.tick <= targetTick)
    .sort((a, b) => b.tick - a.tick);

  if (eligible.length === 0) {
    return historicalSnapshots[0];
  }

  const base = eligible[0];
  return {
    ...base,
    tick: targetTick,
    availableInformationItems: filterFutureItems(base.availableInformationItems, targetTick),
  };
}
