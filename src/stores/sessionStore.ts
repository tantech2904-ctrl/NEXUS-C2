import { create } from 'zustand';
import { DecisionSnapshot } from '@/types/decision';
import { ScoreResult } from '@/types/scoring';

export interface SessionStore {
  sessionId: string;
  decisions: DecisionSnapshot[];
  latestScore: ScoreResult | null;
  replayActiveSnapshot: DecisionSnapshot | null;
  replayTargetTick: number | null;

  recordDecision: (snapshot: DecisionSnapshot, score: ScoreResult) => void;
  setReplaySnapshot: (snapshot: DecisionSnapshot | null) => void;
  setReplayTargetTick: (tick: number | null) => void;
  resetSession: () => void;
}

function generateSessionId(): string {
  return `SES-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: generateSessionId(),
  decisions: [],
  latestScore: null,
  replayActiveSnapshot: null,
  replayTargetTick: null,

  recordDecision: (snapshot: DecisionSnapshot, score: ScoreResult) => {
    set((state) => ({
      decisions: [...state.decisions, snapshot],
      latestScore: score,
    }));
  },

  setReplaySnapshot: (snapshot: DecisionSnapshot | null) => {
    set({
      replayActiveSnapshot: snapshot,
      replayTargetTick: snapshot ? snapshot.tick : null,
    });
  },

  setReplayTargetTick: (tick: number | null) => {
    set({ replayTargetTick: tick });
  },

  resetSession: () => {
    set({
      sessionId: generateSessionId(),
      decisions: [],
      latestScore: null,
      replayActiveSnapshot: null,
      replayTargetTick: null,
    });
  },
}));
