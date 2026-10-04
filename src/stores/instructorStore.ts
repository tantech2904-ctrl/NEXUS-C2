import { create } from 'zustand';
import { useSimulationStore } from './simulationStore';

export interface InstructorStore {
  selectedChannelId: string;
  isInjecting: boolean;

  setSelectedChannelId: (id: string) => void;
  injectLatency: (channelId: string, severity?: number) => void;
  injectPacketLoss: (channelId: string, severity?: number) => void;
  injectDropout: (channelId: string) => void;
  injectContradiction: () => void;
  injectRelayFailure: (channelId: string) => void;
  triggerRecovery: (channelId: string) => void;
  triggerDecisionWindow: () => void;
}

export const useInstructorStore = create<InstructorStore>((set, get) => ({
  selectedChannelId: 'ch-primary',
  isInjecting: false,

  setSelectedChannelId: (id: string) => set({ selectedChannelId: id }),

  injectLatency: (channelId: string, severity = 0.6) => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-lat-${Date.now()}`,
      time: sim.tick,
      type: 'LATENCY',
      target: channelId,
      severity,
      message: `[INSTRUCTOR INJECT] Induced latency spike on channel ${channelId}.`,
    });
  },

  injectPacketLoss: (channelId: string, severity = 0.45) => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-loss-${Date.now()}`,
      time: sim.tick,
      type: 'PACKET_LOSS',
      target: channelId,
      severity,
      message: `[INSTRUCTOR INJECT] Packet loss elevated to +${Math.round(severity * 100)}% on ${channelId}.`,
    });
  },

  injectDropout: (channelId: string) => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-drop-${Date.now()}`,
      time: sim.tick,
      type: 'DROPOUT',
      target: channelId,
      severity: 0.95,
      message: `[INSTRUCTOR INJECT] Complete carrier dropout triggered on ${channelId}.`,
    });
  },

  injectContradiction: () => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-contra-${Date.now()}`,
      time: sim.tick,
      type: 'CONTRADICTION',
      target: 'ch-secondary',
      severity: 0.8,
      message: '[INSTRUCTOR INJECT] Synthetic conflict injected: Recon and Relay reports diverge.',
      payload: {
        id: `inst-rep-${Date.now()}`,
        sourceName: 'INSTRUCTOR INJECT OBSERVER',
        sourceType: 'OBSERVATION',
        channelId: 'ch-secondary',
        content: 'ALERT: Sector transit point is CONTESTED / BLOCKED. Hostile or physical obstruction present.',
        sourceReliability: 0.82,
        freshness: 1.0,
        consistency: 0.5,
        contradictionGroupId: 'cg-instructor-injected',
      },
    });
  },

  injectRelayFailure: (channelId: string) => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-relay-${Date.now()}`,
      time: sim.tick,
      type: 'RELAY_FAILURE',
      target: channelId,
      severity: 1.0,
      message: `[INSTRUCTOR INJECT] Catastrophic Relay Power Loss on ${channelId}.`,
    });
  },

  triggerRecovery: (channelId: string) => {
    const sim = useSimulationStore.getState();
    sim.injectEvent({
      id: `inst-rec-${Date.now()}`,
      time: sim.tick,
      type: 'RECOVERY',
      target: channelId,
      severity: 0.2,
      message: `[INSTRUCTOR INJECT] Auxiliary signal restoration initiated on ${channelId}.`,
    });
  },

  triggerDecisionWindow: () => {
    const sim = useSimulationStore.getState();
    useSimulationStore.setState({
      activeDecisionWindow: {
        id: `dw-inst-${Date.now()}`,
        openAtTick: sim.tick,
        durationMs: 35000,
        urgency: 'CRITICAL',
        situation: 'Instructor has triggered an immediate tactical decision window. Environmental telemetry is degraded; select command posture.',
        recommendedActions: ['VERIFY', 'REQUEST_UPDATE', 'SWITCH_INFORMATION_CHANNEL', 'PAUSE'],
      },
    });
  },
}));
