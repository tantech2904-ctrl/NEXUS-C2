import { Scenario, ScenarioSchema } from '@/types/scenario';

export function validateScenario(data: unknown): Scenario {
  const result = ScenarioSchema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Scenario validation failed: ${errorDetails}`);
  }
  return result.data as Scenario;
}
