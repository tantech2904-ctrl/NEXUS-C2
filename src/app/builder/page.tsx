'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSimulationStore } from '@/stores/simulationStore';
import { Scenario, ScenarioInject } from '@/types/scenario';
import { validateScenario } from '@/lib/simulation/scenario';
import { tacticalAudio } from '@/lib/audio';
import { Sliders, Plus, Trash2, Download, Upload, Play, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';

export default function ScenarioBuilderPage() {
  const router = useRouter();
  const { loadScenario, startSimulation } = useSimulationStore();

  const [title, setTitle] = useState('CUSTOM TACTICAL SCENARIO // SIH2026');
  const [difficulty, setDifficulty] = useState<'FOUNDATION' | 'ADVANCED' | 'EXPERT'>('ADVANCED');
  const [envType, setEnvType] = useState<'NOMINAL' | 'SEVERE_WEATHER' | 'ELECTROMAGNETIC_STORM' | 'SEISMIC_SHOCK' | 'INFRASTRUCTURE_BLACKOUT'>('INFRASTRUCTURE_BLACKOUT');
  const [stalenessSec, setStalenessSec] = useState(35);

  const [events, setEvents] = useState<ScenarioInject[]>([
    {
      id: 'custom-ev-1',
      time: 15000,
      type: 'LATENCY',
      target: 'ch-primary',
      severity: 0.6,
      message: 'Microwave backhaul latency spike (+450ms).',
    },
    {
      id: 'custom-ev-2',
      time: 30000,
      type: 'PACKET_LOSS',
      target: 'ch-primary',
      severity: 0.45,
      message: 'Packet loss elevated to 45% on primary data link.',
    },
    {
      id: 'custom-ev-3',
      time: 45000,
      type: 'CONTRADICTION',
      target: 'ch-secondary',
      severity: 0.8,
      message: 'Direct contradiction between drone reconnaissance and relay acoustic feed.',
      payload: {
        id: 'c-rep-1',
        sourceName: 'TACTICAL RECON 01',
        sourceType: 'OBSERVATION',
        channelId: 'ch-secondary',
        content: 'Grid Bravo is contested and obstructed.',
        sourceReliability: 0.85,
        freshness: 1.0,
        consistency: 0.5,
        contradictionGroupId: 'cg-custom-1',
      },
    },
  ]);

  const addEvent = () => {
    tacticalAudio.playClick();
    const newEv: ScenarioInject = {
      id: `ev-${Date.now()}`,
      time: (events.length + 1) * 20000,
      type: 'LATENCY',
      target: 'ch-primary',
      severity: 0.5,
      message: 'Custom degradation inject.',
    };
    setEvents([...events, newEv]);
  };

  const removeEvent = (index: number) => {
    tacticalAudio.playClick();
    setEvents(events.filter((_, i) => i !== index));
  };

  const buildScenarioObject = (): Scenario => {
    return {
      id: `SCN-CUSTOM-${Math.floor(Math.random() * 900 + 100)}`,
      version: '1.0.0',
      title,
      historicalBasis: null,
      syntheticDisclaimer: 'Command entities, scenario injects, and tactical units are synthetic training constructs.',
      difficulty,
      seed: 42,
      durationMs: 180000,
      stalenessThresholdSeconds: stalenessSec,
      environment: {
        type: envType,
        severity: 0.8,
        weatherDescription: 'Custom calibrated training exercise environment.',
        visibilityKm: 5.0,
      },
      entities: scn06.entities as any,
      communicationChannels: scn06.communicationChannels as any,
      initialConditions: {
        commHealth: 0.95,
        infoIntegrity: 0.92,
        initialDegradationState: 'NORMAL',
      },
      events,
      decisionWindows: [
        {
          id: 'dw-custom-1',
          openAtTick: 60000,
          durationMs: 35000,
          urgency: 'CRITICAL',
          situation: 'Degraded telemetry and contradictory reports detected on transit route. Issue command action.',
          recommendedActions: ['VERIFY', 'SWITCH_INFORMATION_CHANNEL', 'PAUSE'],
        },
      ],
      scoringWeights: {
        decisionQuality: 0.25,
        timeliness: 0.10,
        informationDiscipline: 0.20,
        sourceEvaluation: 0.10,
        communicationResilience: 0.15,
        coordination: 0.05,
        riskManagement: 0.10,
        adaptability: 0.05,
      },
      sources: [
        {
          name: 'NEXUS-C2 Custom Exercise Builder',
          organization: 'SIH 2026 Exercise Control',
          url: 'local://nexus-c2/builder',
          usage: 'Authoring custom training scenario injects',
        },
      ],
    };
  };

  const handleLaunch = () => {
    try {
      tacticalAudio.playCommitChime();
      const customScn = buildScenarioObject();
      const validated = validateScenario(customScn);
      loadScenario(validated);
      startSimulation();
      router.push('/console');
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  const handleExport = () => {
    tacticalAudio.playClick();
    const customScn = buildScenarioObject();
    const blob = new Blob([JSON.stringify(customScn, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-c2-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Banner */}
        <div className="border-b border-[#2a2d30] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#4fc3d0] font-bold text-sm tracking-wider">
              <Sliders className="w-5 h-5" />
              SCENARIO BUILDER & TIMELINE EDITOR
            </div>
            <div className="text-xs text-[#8a9099] mt-0.5">
              Author deterministic degradation sequences, timed injects, and custom decision windows
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#e8eaec] hover:border-[#4fc3d0] text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>
            <button
              onClick={handleLaunch}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#4fc3d0] text-black font-bold text-xs hover:bg-[#4fc3d0]/90 shadow-[0_0_12px_rgba(79,195,208,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>LAUNCH SCENARIO</span>
            </button>
          </div>
        </div>

        {/* Configuration Parameters */}
        <div className="bg-[#141618] border border-[#2a2d30] p-4 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[10px] text-[#8a9099] font-bold block mb-1">SCENARIO TITLE:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-[#e8eaec] focus:outline-none focus:border-[#4fc3d0]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#8a9099] font-bold block mb-1">DIFFICULTY PRESET:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-[#e8eaec] focus:outline-none focus:border-[#4fc3d0]"
            >
              <option value="FOUNDATION">FOUNDATION (Mild delay, 60s windows)</option>
              <option value="ADVANCED">ADVANCED (Intermittent loss, 35s windows)</option>
              <option value="EXPERT">EXPERT (Contradictions, Relay failure, 20s windows)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#8a9099] font-bold block mb-1">ENVIRONMENTAL STRESSOR:</label>
            <select
              value={envType}
              onChange={(e) => setEnvType(e.target.value as any)}
              className="w-full bg-[#0d0f10] border border-[#2a2d30] rounded p-2 text-[#e8eaec] focus:outline-none focus:border-[#4fc3d0]"
            >
              <option value="INFRASTRUCTURE_BLACKOUT">INFRASTRUCTURE BLACKOUT (Tower power failure)</option>
              <option value="SEVERE_WEATHER">SEVERE WEATHER (Rain fade, UHF attenuation)</option>
              <option value="SEISMIC_SHOCK">SEISMIC SHOCK (Fiber optic severance)</option>
              <option value="ELECTROMAGNETIC_STORM">ELECTROMAGNETIC STORM (Atmospheric noise)</option>
              <option value="NOMINAL">NOMINAL (Controlled benchmark test)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#8a9099] font-bold block mb-1">STALENESS THRESHOLD: {stalenessSec} SECONDS</label>
            <input
              type="range"
              min={15}
              max={60}
              value={stalenessSec}
              onChange={(e) => setStalenessSec(Number(e.target.value))}
              className="w-full accent-[#4fc3d0]"
            />
          </div>
        </div>

        {/* Master Scenario Event List (MSEL) Timeline Editor */}
        <div className="bg-[#141618] border border-[#2a2d30] p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#2a2d30] pb-2">
            <div className="font-bold text-xs text-[#e8eaec]">MASTER SCENARIO EVENT LIST (MSEL TIMELINE)</div>
            <button
              onClick={addEvent}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD INJECT</span>
            </button>
          </div>

          <div className="space-y-2">
            {events.map((ev, index) => (
              <div
                key={ev.id}
                className="bg-[#0d0f10] border border-[#2a2d30] p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#4fc3d0] bg-[#1c1f21] px-2 py-0.5 rounded border border-[#2a2d30]">
                    T+{(ev.time / 1000).toFixed(0)}s
                  </span>
                  <select
                    value={ev.type}
                    onChange={(e) => {
                      const updated = [...events];
                      updated[index].type = e.target.value as any;
                      setEvents(updated);
                    }}
                    className="bg-[#1c1f21] border border-[#2a2d30] rounded p-1 text-[#e8eaec]"
                  >
                    <option value="LATENCY">LATENCY SPIKE</option>
                    <option value="PACKET_LOSS">PACKET LOSS</option>
                    <option value="DROPOUT">TOTAL DROPOUT</option>
                    <option value="CONTRADICTION">CONTRADICTION</option>
                    <option value="RELAY_FAILURE">RELAY FAILURE</option>
                    <option value="RECOVERY">RECOVERY</option>
                  </select>
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    value={ev.message || ''}
                    onChange={(e) => {
                      const updated = [...events];
                      updated[index].message = e.target.value;
                      setEvents(updated);
                    }}
                    placeholder="Event inject description..."
                    className="w-full bg-[#1c1f21] border border-[#2a2d30] rounded p-1.5 text-xs text-[#e8eaec]"
                  />
                </div>

                <button
                  onClick={() => removeEvent(index)}
                  className="p-1.5 text-[#8a9099] hover:text-[#c0392b] hover:bg-[#1c1f21] rounded"
                  title="Remove Inject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
