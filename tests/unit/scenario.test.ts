import { describe, it, expect } from 'vitest';
import { validateScenario } from '@/lib/simulation/scenario';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';

describe('Scenario Validation', () => {
  it('validates SCN-06 successfully against Zod schema', () => {
    const validated = validateScenario(scn06);
    expect(validated.id).toBe('SCN-06');
    expect(validated.events.length).toBeGreaterThan(0);
    expect(validated.decisionWindows.length).toBeGreaterThan(0);
  });

  it('throws a descriptive error when required field is missing', () => {
    const broken = { ...scn06, id: undefined };
    expect(() => validateScenario(broken)).toThrow(/Scenario validation failed/);
  });
});
