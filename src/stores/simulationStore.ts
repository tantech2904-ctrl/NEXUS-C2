import { create } from 'zustand';
import { CommunicationChannel, CommunicationDegradationState } from '@/types/communication';
import { DecisionAction, DecisionWindow, StateSnapshot } from '@/types/decision';
import { Scenario, ScenarioInject } from '@/types/scenario';
import { EnvironmentState, InformationItem, MissionPhase, TacticalEntity } from '@/types/simulation';
import { calculateAggregateCommHealth, calculateChannelQuality } from '@/lib/simulation/communication';
import { calculateConfidence, calculateConsistency, calculateFreshness, deriveStatus, explainConfidenceChange } from '@/lib/simulation/confidence';
import { applyDegradationState } from '@/lib/simulation/degradation';
import { evaluateDecision } from '@/lib/simulation/scoring';
import { createDecisionSnapshot } from '@/lib/simulation/replay';
import { useSessionStore } from './sessionStore';

import scn06 from '@/../data/scenarios/scn-06-blackout.json';
import { validateScenario } from '@/lib/simulation/scenario';

export interface SimulationStore {
  scenario: Scenario | null;
  tick: number; // millisecond simulation clock
  isRunning: boolean;
  speedMultiplier: number; // 0.5, 1, 2, 5
  missionPhase: MissionPhase;
  commHealth: number; // [0, 1]
  infoIntegrity: number; // [0, 1]
  overallDegradationState: CommunicationDegradationState;
  channels: Record<string, CommunicationChannel>;
  entities: Record<string, TacticalEntity>;
  informationItems: InformationItem[];
  eventLog: Array<{ id: string; tick: number; category: string; message: string }>;
  activeDecisionWindow: DecisionWindow | null;
  historicalSnapshots: StateSnapshot[];
  processedEventIds: Set<string>;

  // Actions
  loadScenario: (scenario: Scenario) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setSpeedMultiplier: (mult: number) => void;
  advanceTick: (deltaMs: number) => void;
  injectEvent: (inject: ScenarioInject) => void;
  submitDecision: (action: DecisionAction, rationale: string) => void;
}

const buildInitialScenarioData = (rawScenario: any) => {
  const validated = validateScenario(rawScenario);
  const channelsMap: Record<string, CommunicationChannel> = {};
  validated.communicationChannels.forEach((ch) => {
    channelsMap[ch.id] = { ...ch, channelQuality: calculateChannelQuality(ch) };
  });

  const entitiesMap: Record<string, TacticalEntity> = {};
  validated.entities.forEach((ent) => {
    entitiesMap[ent.id] = { ...ent };
  });

  const initialCommHealth = calculateAggregateCommHealth(channelsMap);
  const initialChannelId = Object.keys(channelsMap)[0] || 'ch-primary';

  const baselineItem: InformationItem = {
    id: `base-${validated.id}-0`,
    sourceName: 'COMMAND OPERATIONS DESK',
    sourceType: 'COMMAND',
    channelId: initialChannelId,
    timestamp: 0,
    receivedAt: 0,
    content: `OPERATIONAL COMMENCEMENT: ${validated.title}. Environment: ${validated.environment.type} (${validated.environment.weatherDescription}). All forward assets reporting baseline telemetry.`,
    sourceReliability: 0.95,
    freshness: 1.0,
    consistency: 1.0,
    channelQuality: initialCommHealth,
    confidence: initialCommHealth * 0.95,
    verification: 'CONFIRMED',
    ageSeconds: 0,
    explanation: {
      sourceReliability: 0.95,
      channelQuality: initialCommHealth,
      freshness: 1.0,
      consistency: 1.0,
      compositeConfidence: initialCommHealth * 0.95,
      reasons: ['Baseline initial operational dispatch under nominal telemetry status.'],
    },
  };

  return {
    scenario: validated,
    channels: channelsMap,
    entities: entitiesMap,
    commHealth: initialCommHealth,
    informationItems: [baselineItem],
    eventLog: [
      {
        id: `init-log-${validated.id}`,
        tick: 0,
        category: 'SYSTEM',
        message: `Simulation initialized with scenario: ${validated.title}.`,
      },
    ],
  };
};

const defaultInit = buildInitialScenarioData(scn06);

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  scenario: defaultInit.scenario,
  tick: 0,
  isRunning: false,
  speedMultiplier: 1,
  missionPhase: 'PHASE 01 / NOMINAL OBSERVATION',
  commHealth: defaultInit.commHealth,
  infoIntegrity: 0.94,
  overallDegradationState: 'NORMAL',
  channels: defaultInit.channels,
  entities: defaultInit.entities,
  informationItems: defaultInit.informationItems,
  eventLog: defaultInit.eventLog,
  activeDecisionWindow: null,
  historicalSnapshots: [],
  processedEventIds: new Set<string>(),

  loadScenario: (scenario: Scenario) => {
    const channelsMap: Record<string, CommunicationChannel> = {};
    scenario.communicationChannels.forEach((ch) => {
      channelsMap[ch.id] = { ...ch, channelQuality: calculateChannelQuality(ch) };
    });

    const entitiesMap: Record<string, TacticalEntity> = {};
    scenario.entities.forEach((ent) => {
      entitiesMap[ent.id] = { ...ent };
    });

    const initialCommHealth = calculateAggregateCommHealth(channelsMap);
    const initialChannelId = Object.keys(channelsMap)[0] || 'ch-primary';

    // Baseline Operational Telemetry Item so feed is never blank
    const baselineItem: InformationItem = {
      id: `base-${scenario.id}-0`,
      sourceName: 'COMMAND OPERATIONS DESK',
      sourceType: 'COMMAND',
      channelId: initialChannelId,
      timestamp: 0,
      receivedAt: 0,
      content: `OPERATIONAL COMMENCEMENT: ${scenario.title}. Environment: ${scenario.environment.type} (${scenario.environment.weatherDescription}). All forward assets reporting baseline telemetry.`,
      sourceReliability: 0.95,
      freshness: 1.0,
      consistency: 1.0,
      channelQuality: initialCommHealth,
      confidence: initialCommHealth * 0.95,
      verification: 'CONFIRMED',
      ageSeconds: 0,
      explanation: {
        sourceReliability: 0.95,
        channelQuality: initialCommHealth,
        freshness: 1.0,
        consistency: 1.0,
        compositeConfidence: initialCommHealth * 0.95,
        reasons: ['Initial operational baseline telemetry confirmed across active command channels.'],
      },
    };

    set({
      scenario,
      tick: 0,
      isRunning: false,
      speedMultiplier: 1,
      missionPhase: 'PHASE 01 / NOMINAL OBSERVATION',
      commHealth: initialCommHealth,
      infoIntegrity: scenario.initialConditions.infoIntegrity || 0.94,
      overallDegradationState: (scenario.initialConditions.initialDegradationState as CommunicationDegradationState) || 'NORMAL',
      channels: channelsMap,
      entities: entitiesMap,
      informationItems: [baselineItem],
      eventLog: [
        {
          id: `init-${scenario.id}`,
          tick: 0,
          category: 'SYSTEM',
          message: `Mission Loaded: ${scenario.title} [${scenario.difficulty}]`,
        },
      ],
      activeDecisionWindow: null,
      historicalSnapshots: [],
      processedEventIds: new Set<string>(),
    });
  },

  startSimulation: () => set({ isRunning: true }),
  pauseSimulation: () => set({ isRunning: false }),
  resumeSimulation: () => set({ isRunning: true }),

  resetSimulation: () => {
    const { scenario } = get();
    useSessionStore.getState().resetSession();
    if (scenario) {
      get().loadScenario(scenario);
    }
  },

  setSpeedMultiplier: (mult: number) => set({ speedMultiplier: mult }),

  injectEvent: (inject: ScenarioInject) => {
    const { channels, entities, informationItems, tick, eventLog } = get();
    const newChannels = { ...channels };
    const newEntities = { ...entities };
    let newItems = [...informationItems];
    let newDegradationState = get().overallDegradationState;

    // Apply degradation to target channel or all channels if unspecified
    const targetChannelIds = inject.target
      ? [inject.target]
      : Object.keys(newChannels);

    targetChannelIds.forEach((targetId) => {
      const ch = newChannels[targetId];
      if (!ch) return;

      if (inject.type === 'LATENCY') {
        ch.latencyMs = Math.round(ch.latencyMs * (1 + (inject.severity || 0.5) * 3));
        ch.status = 'HIGH_LATENCY';
        newDegradationState = 'HIGH_LATENCY';
      } else if (inject.type === 'PACKET_LOSS') {
        ch.packetLoss = Math.min(0.9, ch.packetLoss + (inject.severity || 0.4));
        ch.status = 'PARTIAL_DROPOUT';
        newDegradationState = 'PARTIAL_DROPOUT';
      } else if (inject.type === 'DROPOUT' || inject.type === 'RELAY_FAILURE') {
        ch.availability = 0.05;
        ch.packetLoss = 0.95;
        ch.latencyMs = 5000;
        ch.status = inject.type === 'RELAY_FAILURE' ? 'RELAY_FAILURE' : 'SEVERE_DROPOUT';
        newDegradationState = ch.status;
      } else if (inject.type === 'BANDWIDTH_CONGESTION') {
        ch.bandwidthFactor = Math.max(0.15, ch.bandwidthFactor - (inject.severity || 0.5));
        ch.latencyMs = Math.round(ch.latencyMs * 2.2);
        ch.status = 'BANDWIDTH_CONGESTION';
        newDegradationState = 'BANDWIDTH_CONGESTION';
      } else if (inject.type === 'WEATHER_SHIFT') {
        ch.packetLoss = Math.min(0.7, ch.packetLoss + (inject.severity || 0.35));
        ch.status = 'MINOR_DELAY';
      } else if (inject.type === 'SENSOR_LOSS') {
        ch.availability = Math.max(0.2, ch.availability - 0.5);
        ch.status = 'PARTIAL_SENSOR_LOSS';
      } else if (inject.type === 'RECOVERY') {
        ch.availability = 0.94;
        ch.packetLoss = 0.03;
        ch.latencyMs = 120;
        ch.bandwidthFactor = 0.92;
        ch.status = 'RECOVERY';
        newDegradationState = 'RECOVERY';
      }

      ch.channelQuality = calculateChannelQuality(ch);
      newChannels[targetId] = ch;
    });

    // Ingest Explicit Report Incoming
    if (inject.type === 'REPORT_INCOMING' && inject.payload) {
      const p = inject.payload;
      const targetChannel = newChannels[p.channelId] || Object.values(newChannels)[0];
      const cq = targetChannel ? targetChannel.channelQuality : 0.8;
      const conf = calculateConfidence(p.sourceReliability, cq, 1.0, p.consistency || 1.0);
      const explanation = explainConfidenceChange(
        p.sourceReliability,
        cq,
        1.0,
        p.consistency || 1.0,
        0,
        35,
        Boolean(p.contradictionGroupId),
        targetChannel ? targetChannel.availability < 0.1 : false
      );

      const newItem: InformationItem = {
        id: p.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sourceName: p.sourceName,
        sourceType: p.sourceType,
        channelId: p.channelId,
        timestamp: tick,
        receivedAt: tick,
        content: p.content,
        location: p.location,
        sourceReliability: p.sourceReliability,
        freshness: 1.0,
        consistency: p.consistency || 1.0,
        channelQuality: cq,
        confidence: conf,
        verification: deriveStatus(conf, 0, 35, Boolean(p.contradictionGroupId), false),
        contradictionGroupId: p.contradictionGroupId,
        ageSeconds: 0,
        explanation,
      };
      newItems = [newItem, ...newItems];
    } else if (inject.type === 'CONTRADICTION' && inject.payload) {
      // Ingest Explicit Contradiction
      const p = inject.payload;
      const targetChannel = newChannels[p.channelId] || Object.values(newChannels)[0];
      const cq = targetChannel ? targetChannel.channelQuality : 0.7;
      const conf = calculateConfidence(p.sourceReliability, cq, p.freshness || 0.8, 0.5);
      const explanation = explainConfidenceChange(
        p.sourceReliability,
        cq,
        p.freshness || 0.8,
        0.5,
        0,
        35,
        true,
        false
      );

      const newItem: InformationItem = {
        id: p.id || `contra-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sourceName: p.sourceName,
        sourceType: p.sourceType,
        channelId: p.channelId,
        timestamp: tick,
        receivedAt: tick,
        content: p.content,
        location: p.location,
        sourceReliability: p.sourceReliability,
        freshness: p.freshness || 0.8,
        consistency: 0.5,
        channelQuality: cq,
        confidence: conf,
        verification: 'CONTRADICTED',
        contradictionGroupId: p.contradictionGroupId,
        ageSeconds: 0,
        explanation,
      };

      // Also mark existing matching items as contradicted
      newItems = newItems.map((item) => {
        if (item.contradictionGroupId === p.contradictionGroupId) {
          const updatedConf = calculateConfidence(item.sourceReliability, item.channelQuality, item.freshness, 0.5);
          return {
            ...item,
            consistency: 0.5,
            confidence: updatedConf,
            verification: 'CONTRADICTED',
          };
        }
        return item;
      });

      newItems = [newItem, ...newItems];
      newDegradationState = 'CONTRADICTORY_REPORTS';
    } else if (inject.message) {
      // Automatic Intelligence Alert generated from operational events
      const defaultChannelId = inject.target || Object.keys(newChannels)[0] || 'ch-primary';
      const targetChannel = newChannels[defaultChannelId] || Object.values(newChannels)[0];
      const cq = targetChannel ? targetChannel.channelQuality : 0.75;
      const rel = 0.88;
      const conf = calculateConfidence(rel, cq, 1.0, 1.0);

      const alertItem: InformationItem = {
        id: `inject-alert-${tick}-${Math.random().toString(36).substr(2, 4)}`,
        sourceName: inject.type === 'RECOVERY' ? 'AUXILIARY SATCOM' : 'TACTICAL SENSOR MESH',
        sourceType: 'SENSOR',
        channelId: defaultChannelId,
        timestamp: tick,
        receivedAt: tick,
        content: inject.message,
        sourceReliability: rel,
        freshness: 1.0,
        consistency: 1.0,
        channelQuality: cq,
        confidence: conf,
        verification: deriveStatus(conf, 0, 35, false, targetChannel ? targetChannel.availability < 0.15 : false),
        ageSeconds: 0,
        explanation: {
          sourceReliability: rel,
          channelQuality: cq,
          freshness: 1.0,
          consistency: 1.0,
          compositeConfidence: conf,
          reasons: [`Operational Ingest: ${inject.type}`],
        },
      };

      newItems = [alertItem, ...newItems];
    }

    const updatedCommHealth = calculateAggregateCommHealth(newChannels);
    const updatedInfoIntegrity = newItems.length > 0
      ? newItems.reduce((acc, i) => acc + i.confidence, 0) / newItems.length
      : 0.85;

    const newLog = [
      {
        id: `ev-${tick}-${Math.random().toString(36).substr(2, 4)}`,
        tick,
        category: inject.type === 'REPORT_INCOMING' ? 'INFO' : 'ALERT',
        message: inject.message || `System Inject: ${inject.type}`,
      },
      ...eventLog,
    ].slice(0, 100);

    set({
      channels: newChannels,
      entities: newEntities,
      informationItems: newItems,
      overallDegradationState: newDegradationState,
      commHealth: updatedCommHealth,
      infoIntegrity: parseFloat(updatedInfoIntegrity.toFixed(4)),
      eventLog: newLog,
    });
  },

  advanceTick: (deltaMs: number) => {
    const {
      scenario,
      tick,
      isRunning,
      channels,
      entities,
      informationItems,
      activeDecisionWindow,
      processedEventIds,
      historicalSnapshots,
    } = get();

    if (!isRunning || !scenario) return;

    const newTick = tick + deltaMs;

    // Mission Phase Calculation
    let missionPhase: MissionPhase = 'PHASE 01 / NOMINAL OBSERVATION';
    if (newTick > 120000) {
      missionPhase = 'PHASE 04 / RECOVERY & STABILIZATION';
    } else if (newTick > 60000) {
      missionPhase = 'PHASE 03 / SEVERE INTERFERENCE';
    } else if (newTick > 20000) {
      missionPhase = 'PHASE 02 / DEGRADED INFORMATION';
    }

    // Process due MSEL events
    const newProcessedIds = new Set(processedEventIds);
    scenario.events.forEach((ev) => {
      if (ev.time <= newTick && !newProcessedIds.has(ev.id)) {
        newProcessedIds.add(ev.id);
        get().injectEvent(ev);
      }
    });

    // Check decision windows
    let currentDecisionWindow = activeDecisionWindow;
    scenario.decisionWindows.forEach((dw) => {
      if (newTick >= dw.openAtTick && newTick <= dw.openAtTick + dw.durationMs) {
        if (!currentDecisionWindow || currentDecisionWindow.id !== dw.id) {
          currentDecisionWindow = dw;
        }
      } else if (currentDecisionWindow && currentDecisionWindow.id === dw.id && newTick > dw.openAtTick + dw.durationMs) {
        currentDecisionWindow = null;
      }
    });

    // Dynamic ICE computation
    const stalenessThreshold = scenario.stalenessThresholdSeconds || 35;
    const currentChannels = get().channels;
    const updatedItems = informationItems.map((item) => {
      const ageSec = (newTick - item.timestamp) / 1000;
      const fresh = calculateFreshness(ageSec);
      const ch = currentChannels[item.channelId];
      const cq = ch ? ch.channelQuality : item.channelQuality;
      const hasContra = item.verification === 'CONTRADICTED' || item.consistency < 1.0;
      const isChOffline = ch ? ch.availability < 0.15 : false;
      const conf = calculateConfidence(item.sourceReliability, cq, fresh, item.consistency);
      const status = deriveStatus(conf, ageSec, stalenessThreshold, hasContra, isChOffline);
      const explanation = explainConfidenceChange(
        item.sourceReliability,
        cq,
        fresh,
        item.consistency,
        ageSec,
        stalenessThreshold,
        hasContra,
        isChOffline
      );

      return {
        ...item,
        ageSeconds: parseFloat(ageSec.toFixed(1)),
        freshness: fresh,
        channelQuality: cq,
        confidence: conf,
        verification: status,
        explanation,
      };
    });

    // Record historical snapshot every ~1000ms
    let newSnapshots = historicalSnapshots;
    const lastSnapTick = historicalSnapshots.length > 0
      ? historicalSnapshots[historicalSnapshots.length - 1].tick
      : -1000;

    if (newTick - lastSnapTick >= 1000) {
      const snap: StateSnapshot = {
        tick: newTick,
        commHealth: get().commHealth,
        infoIntegrity: get().infoIntegrity,
        channels: JSON.parse(JSON.stringify(currentChannels)),
        entities: JSON.parse(JSON.stringify(entities)),
        availableInformationItems: updatedItems.filter((i) => i.receivedAt <= newTick),
        unavailableItemIds: [],
        degradationState: get().overallDegradationState,
        environment: { ...scenario.environment },
      };
      newSnapshots = [...historicalSnapshots, snap];
    }

    const currentCommHealth = calculateAggregateCommHealth(currentChannels);
    const currentInfoIntegrity = updatedItems.length > 0
      ? updatedItems.reduce((acc, i) => acc + i.confidence, 0) / updatedItems.length
      : 0.88;

    set({
      tick: newTick,
      missionPhase,
      channels: currentChannels,
      informationItems: updatedItems,
      activeDecisionWindow: currentDecisionWindow,
      processedEventIds: newProcessedIds,
      historicalSnapshots: newSnapshots,
      commHealth: currentCommHealth,
      infoIntegrity: parseFloat(currentInfoIntegrity.toFixed(4)),
    });
  },

  submitDecision: (action: DecisionAction, rationale: string) => {
    const { tick, activeDecisionWindow, informationItems, channels, scenario, entities, commHealth, infoIntegrity, overallDegradationState } = get();
    if (!activeDecisionWindow) return;

    const availableItems = informationItems.filter((i) => i.receivedAt <= tick);
    const windowOpenTick = activeDecisionWindow.openAtTick;
    const latencyMs = Math.max(1000, tick - windowOpenTick);

    const scoreResult = evaluateDecision(
      action,
      rationale,
      latencyMs,
      availableItems,
      channels,
      scenario?.scoringWeights
    );

    const currentState: StateSnapshot = {
      tick,
      commHealth,
      infoIntegrity,
      channels,
      entities,
      availableInformationItems: availableItems,
      unavailableItemIds: [],
      degradationState: overallDegradationState,
      environment: scenario?.environment || {
        type: 'NOMINAL',
        severity: 0,
        weatherDescription: 'Clear',
        visibilityKm: 10,
      },
    };

    let outcomeAssessment = `Decision "${action}" processed under degraded comms. Assessment outcome: ${scoreResult.outcomeClass}.`;
    if (scoreResult.feedback.strengths.length > 0) {
      outcomeAssessment += ` ${scoreResult.feedback.strengths[0]}`;
    }

    const snapshot = createDecisionSnapshot(
      activeDecisionWindow.id,
      tick,
      action,
      rationale,
      currentState,
      scoreResult.dimensions,
      scoreResult.overallScore,
      outcomeAssessment,
      scoreResult.outcomeClass
    );

    useSessionStore.getState().recordDecision(snapshot, scoreResult);

    const newLog = [
      {
        id: `dec-${tick}`,
        tick,
        category: 'COMMAND',
        message: `Command Decision: [${action}] — Score: ${scoreResult.overallScore}/100 (${scoreResult.outcomeClass})`,
      },
      ...get().eventLog,
    ];

    set({
      eventLog: newLog,
      activeDecisionWindow: null,
    });
  },
}));
