export interface ScoreComponents {
  decisionQuality: number; // [0, 100]
  timeliness: number; // [0, 100]
  informationDiscipline: number; // [0, 100]
  sourceEvaluation: number; // [0, 100]
  communicationResilience: number; // [0, 100]
  coordination: number; // [0, 100]
  riskManagement: number; // [0, 100]
  adaptability: number; // [0, 100]
}

export interface ScoringWeights {
  decisionQuality: number;
  timeliness: number;
  informationDiscipline: number;
  sourceEvaluation: number;
  communicationResilience: number;
  coordination: number;
  riskManagement: number;
  adaptability: number;
}

export interface ScoreResult {
  overallScore: number;
  dimensions: ScoreComponents;
  weights: ScoringWeights;
  outcomeClass: 'POSITIVE' | 'NEUTRAL' | 'SUBOPTIMAL' | 'HIGH_RISK';
  feedback: {
    strengths: string[];
    improvements: string[];
    missedUncertainties: string[];
  };
}
