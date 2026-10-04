import { create } from 'zustand';

export interface SettingsStore {
  audioEnabled: boolean;
  reducedMotion: boolean;
  showConfidenceBreakdownDefault: boolean;

  toggleAudio: () => void;
  toggleReducedMotion: () => void;
  toggleConfidenceBreakdown: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  audioEnabled: true,
  reducedMotion: false,
  showConfidenceBreakdownDefault: true,

  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  toggleConfidenceBreakdown: () => set((s) => ({ showConfidenceBreakdownDefault: !s.showConfidenceBreakdownDefault })),
}));
