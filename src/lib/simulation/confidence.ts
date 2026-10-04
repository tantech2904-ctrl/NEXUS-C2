import { ConfidenceExplanation, InformationStatus } from '@/types/simulation';

export function calculateFreshness(ageSeconds: number, lambda: number = 0.012): number {
  if (ageSeconds <= 0) return 1.0;
  const f = Math.exp(-lambda * ageSeconds);
  return Math.max(0, Math.min(1, parseFloat(f.toFixed(4))));
}

export function calculateConsistency(hasContradiction: boolean, contradictionCount: number = 0): number {
  if (!hasContradiction) return 1.0;
  if (contradictionCount >= 2) return 0.25;
  return 0.50;
}

export function calculateConfidence(
  sourceReliability: number,
  channelQuality: number,
  freshness: number,
  consistency: number
): number {
  const sr = Math.max(0, Math.min(1, sourceReliability));
  const cq = Math.max(0, Math.min(1, channelQuality));
  const f = Math.max(0, Math.min(1, freshness));
  const c = Math.max(0, Math.min(1, consistency));

  const comp = sr * cq * f * c;
  return Math.max(0, Math.min(1, parseFloat(comp.toFixed(4))));
}

export function deriveStatus(
  confidence: number,
  ageSeconds: number,
  stalenessThresholdSeconds: number,
  hasContradiction: boolean,
  isChannelOffline: boolean
): InformationStatus {
  if (isChannelOffline) return 'UNAVAILABLE';
  if (hasContradiction) return 'CONTRADICTED';
  if (ageSeconds >= stalenessThresholdSeconds) return 'STALE';
  if (confidence >= 0.78) return 'CONFIRMED';
  if (confidence >= 0.60) return 'LIKELY';
  return 'UNCERTAIN';
}

export function explainConfidenceChange(
  sourceReliability: number,
  channelQuality: number,
  freshness: number,
  consistency: number,
  ageSeconds: number,
  stalenessThresholdSeconds: number,
  hasContradiction: boolean,
  isChannelOffline: boolean
): ConfidenceExplanation {
  const confidence = calculateConfidence(sourceReliability, channelQuality, freshness, consistency);
  const reasons: string[] = [];

  if (isChannelOffline) {
    reasons.push('Transmission channel is completely offline (0% availability)');
  }
  if (hasContradiction) {
    reasons.push(`Direct contradiction detected with another active sensor/field report (consistency penalty: ${Math.round((1 - consistency) * 100)}%)`);
  }
  if (ageSeconds >= stalenessThresholdSeconds) {
    reasons.push(`Information has exceeded staleness threshold (${ageSeconds.toFixed(1)}s elapsed; limit ${stalenessThresholdSeconds}s)`);
  } else if (freshness < 0.75) {
    reasons.push(`Report staleness increasing with age (${ageSeconds.toFixed(1)}s since origin; freshness at ${Math.round(freshness * 100)}%)`);
  }
  if (channelQuality < 0.60) {
    reasons.push(`Carrier degradation: high latency or packet loss on uplink channel (channel quality at ${Math.round(channelQuality * 100)}%)`);
  }
  if (sourceReliability < 0.75) {
    reasons.push(`Source historical reliability baseline is discounted (${Math.round(sourceReliability * 100)}%)`);
  }

  if (reasons.length === 0) {
    reasons.push('Telemetry nominal: verified high-reliability source over healthy transmission link');
  }

  return {
    sourceReliability,
    channelQuality,
    freshness,
    consistency,
    compositeConfidence: confidence,
    reasons,
  };
}
