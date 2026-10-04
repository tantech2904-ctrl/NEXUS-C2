import { describe, it, expect } from 'vitest';
import {
  calculateConfidence,
  calculateConsistency,
  calculateFreshness,
  deriveStatus,
  explainConfidenceChange,
} from '@/lib/simulation/confidence';

describe('Information Confidence Engine (ICE)', () => {
  it('calculates deterministic baseline confidence', () => {
    // 0.9 * 0.9 * 0.9 * 0.9 = 0.6561
    const conf = calculateConfidence(0.9, 0.9, 0.9, 0.9);
    expect(conf).toBeCloseTo(0.6561, 4);
  });

  it('clamps confidence within [0, 1]', () => {
    expect(calculateConfidence(1.5, 2.0, 1.0, 1.0)).toBe(1.0);
    expect(calculateConfidence(-0.5, 0.8, 0.8, 0.8)).toBe(0.0);
  });

  it('decays freshness over age', () => {
    const fresh0 = calculateFreshness(0);
    const fresh10 = calculateFreshness(10);
    const fresh40 = calculateFreshness(40);
    expect(fresh0).toBe(1.0);
    expect(fresh10).toBeLessThan(fresh0);
    expect(fresh40).toBeLessThan(fresh10);
  });

  it('drops consistency on contradiction', () => {
    expect(calculateConsistency(false)).toBe(1.0);
    expect(calculateConsistency(true, 1)).toBe(0.5);
    expect(calculateConsistency(true, 3)).toBe(0.25);
  });

  it('derives correct status tags', () => {
    expect(deriveStatus(0.9, 5, 30, false, false)).toBe('CONFIRMED');
    expect(deriveStatus(0.68, 5, 30, false, false)).toBe('LIKELY');
    expect(deriveStatus(0.45, 5, 30, false, false)).toBe('UNCERTAIN');
    expect(deriveStatus(0.85, 35, 30, false, false)).toBe('STALE');
    expect(deriveStatus(0.85, 5, 30, true, false)).toBe('CONTRADICTED');
    expect(deriveStatus(0.85, 5, 30, false, true)).toBe('UNAVAILABLE');
  });

  it('generates transparent explanation reasons', () => {
    const explanation = explainConfidenceChange(
      0.85, // sourceReliability
      0.50, // channelQuality
      0.60, // freshness
      0.50, // consistency (contradicted)
      35,   // ageSeconds (stale)
      30,   // threshold
      true, // hasContradiction
      false // isOffline
    );
    expect(explanation.reasons.length).toBeGreaterThan(1);
    expect(explanation.reasons.some((r) => r.includes('contradiction'))).toBe(true);
    expect(explanation.reasons.some((r) => r.includes('staleness'))).toBe(true);
  });
});
