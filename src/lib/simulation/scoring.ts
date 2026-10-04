import { DecisionAction } from '@/types/decision';
import { ScoreComponents, ScoreResult, ScoringWeights } from '@/types/scoring';
import { InformationItem } from '@/types/simulation';
import { CommunicationChannel } from '@/types/communication';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  decisionQuality: 0.25,
  timeliness: 0.10,
  informationDiscipline: 0.20,
  sourceEvaluation: 0.10,
  communicationResilience: 0.15,
  coordination: 0.05,
  riskManagement: 0.10,
  adaptability: 0.05,
};

export function evaluateDecision(
  action: DecisionAction,
  rationale: string,
  decisionLatencyMs: number,
  availableItems: InformationItem[],
  channels: Record<string, CommunicationChannel>,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoreResult {
  const normRationale = rationale.toLowerCase();

  // Check state conditions
  const hasContradiction = availableItems.some((i) => i.verification === 'CONTRADICTED');
  const hasStale = availableItems.some((i) => i.verification === 'STALE');
  const avgConfidence = availableItems.length > 0
    ? availableItems.reduce((acc, i) => acc + i.confidence, 0) / availableItems.length
    : 0.5;

  const degradedChannels = Object.values(channels).filter((c) => c.channelQuality < 0.6);
  const isSeverelyDegraded = degradedChannels.length > 0;

  // 1. Decision Quality (0-100)
  let decisionQuality = 70;
  if (hasContradiction) {
    if (['VERIFY', 'REQUEST_UPDATE', 'ASSESS', 'PAUSE'].includes(action)) {
      decisionQuality += 20;
    } else if (action === 'CONTINUE') {
      decisionQuality -= 35;
    }
  } else if (avgConfidence >= 0.75) {
    if (['CONTINUE', 'ADAPT_PLAN'].includes(action)) {
      decisionQuality += 20;
    }
  } else {
    // Low confidence without explicit contradiction
    if (['VERIFY', 'REQUEST_UPDATE', 'SWITCH_INFORMATION_CHANNEL'].includes(action)) {
      decisionQuality += 15;
    }
  }

  // 2. Timeliness (0-100)
  // Reasonable decision window is 4s - 25s
  let timeliness = 85;
  if (decisionLatencyMs < 3000) {
    // Reflexive haste penalty if information was degraded
    if (hasContradiction || avgConfidence < 0.6) {
      timeliness = 55;
    } else {
      timeliness = 95;
    }
  } else if (decisionLatencyMs > 25000) {
    timeliness = Math.max(30, 85 - Math.floor((decisionLatencyMs - 25000) / 1000) * 4);
  } else {
    timeliness = 90;
  }

  // 3. Information Discipline (0-100)
  let informationDiscipline = 65;
  if (hasContradiction && ['VERIFY', 'REQUEST_UPDATE', 'PAUSE'].includes(action)) {
    informationDiscipline += 25;
  }
  if (hasStale && ['REQUEST_UPDATE', 'SWITCH_INFORMATION_CHANNEL'].includes(action)) {
    informationDiscipline += 15;
  }
  if (['CONTINUE', 'ESCALATE'].includes(action) && avgConfidence < 0.5) {
    informationDiscipline -= 25;
  }

  // 4. Source Evaluation (0-100)
  let sourceEvaluation = 60;
  const sourceKeywords = ['source', 'relay', 'sensor', 'field team', 'reliable', 'reliability', 'unconfirmed', 'telemetry', 'corroborat'];
  const mentionsSource = sourceKeywords.some((kw) => normRationale.includes(kw));
  if (mentionsSource) {
    sourceEvaluation += 25;
  }
  if (normRationale.length >= 35) {
    sourceEvaluation += 10;
  }

  // 5. Communication Resilience (0-100)
  let communicationResilience = 70;
  if (isSeverelyDegraded) {
    if (['SWITCH_INFORMATION_CHANNEL', 'RECONFIGURE_TEAM_COORDINATION', 'REQUEST_UPDATE'].includes(action)) {
      communicationResilience += 20;
    }
    const commKeywords = ['channel', 'latency', 'loss', 'packet', 'bandwidth', 'dropout', 'fallback', 'uplink'];
    if (commKeywords.some((kw) => normRationale.includes(kw))) {
      communicationResilience += 10;
    }
  }

  // 6. Coordination (0-100)
  let coordination = 75;
  if (['RECONFIGURE_TEAM_COORDINATION', 'ESCALATE', 'REQUEST_UPDATE'].includes(action)) {
    coordination += 15;
  }

  // 7. Risk Management (0-100)
  let riskManagement = 70;
  const riskKeywords = ['risk', 'uncertain', 'hazard', 'safety', 'stale', 'conflict', 'verify', 'precaution'];
  if (riskKeywords.some((kw) => normRationale.includes(kw))) {
    riskManagement += 15;
  }
  if (action === 'CONTINUE' && (hasContradiction || avgConfidence < 0.45)) {
    riskManagement -= 35;
  }

  // 8. Adaptability (0-100)
  let adaptability = 70;
  if (['ADAPT_PLAN', 'SWITCH_INFORMATION_CHANNEL', 'RECONFIGURE_TEAM_COORDINATION'].includes(action)) {
    adaptability += 20;
  }

  // Clamp all to [0, 100]
  const dimensions: ScoreComponents = {
    decisionQuality: Math.max(10, Math.min(100, decisionQuality)),
    timeliness: Math.max(10, Math.min(100, timeliness)),
    informationDiscipline: Math.max(10, Math.min(100, informationDiscipline)),
    sourceEvaluation: Math.max(10, Math.min(100, sourceEvaluation)),
    communicationResilience: Math.max(10, Math.min(100, communicationResilience)),
    coordination: Math.max(10, Math.min(100, coordination)),
    riskManagement: Math.max(10, Math.min(100, riskManagement)),
    adaptability: Math.max(10, Math.min(100, adaptability)),
  };

  // Weighted overall
  const overall =
    dimensions.decisionQuality * weights.decisionQuality +
    dimensions.timeliness * weights.timeliness +
    dimensions.informationDiscipline * weights.informationDiscipline +
    dimensions.sourceEvaluation * weights.sourceEvaluation +
    dimensions.communicationResilience * weights.communicationResilience +
    dimensions.coordination * weights.coordination +
    dimensions.riskManagement * weights.riskManagement +
    dimensions.adaptability * weights.adaptability;

  const roundedOverall = Math.round(overall);

  let outcomeClass: 'POSITIVE' | 'NEUTRAL' | 'SUBOPTIMAL' | 'HIGH_RISK';
  if (roundedOverall >= 75) outcomeClass = 'POSITIVE';
  else if (roundedOverall >= 55) outcomeClass = 'NEUTRAL';
  else if (roundedOverall >= 38) outcomeClass = 'SUBOPTIMAL';
  else outcomeClass = 'HIGH_RISK';

  const strengths: string[] = [];
  const improvements: string[] = [];
  const missedUncertainties: string[] = [];

  if (dimensions.informationDiscipline >= 80) strengths.push('Strong information discipline: prioritized verification over impulse.');
  if (dimensions.sourceEvaluation >= 80) strengths.push('Explicitly evaluated source reliability and integrity in rationale.');
  if (dimensions.communicationResilience >= 80) strengths.push('Successfully recognized channel degradation and adapted information pathway.');

  if (hasContradiction && action === 'CONTINUE') {
    missedUncertainties.push('Contradictory route/hazard reports were active but unverified when action was ordered.');
    improvements.push('Pause or verify when conflicting observation nodes report divergent status.');
  }
  if (hasStale && !normRationale.includes('stale')) {
    missedUncertainties.push('Report age had exceeded acceptable operational staleness threshold.');
  }
  if (decisionLatencyMs < 2500 && (hasContradiction || avgConfidence < 0.6)) {
    improvements.push('Reflexive command timing under severe uncertainty degrades mission outcome.');
  }

  return {
    overallScore: roundedOverall,
    dimensions,
    weights,
    outcomeClass,
    feedback: {
      strengths,
      improvements,
      missedUncertainties,
    },
  };
}
