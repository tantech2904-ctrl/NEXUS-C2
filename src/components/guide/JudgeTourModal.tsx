'use client';

import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { tacticalAudio } from '@/lib/audio';
import {
  Compass,
  Layers,
  Activity,
  ShieldAlert,
  Award,
  RotateCcw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface JudgeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchAutoDemo: () => void;
}

export const JudgeTourModal: React.FC<JudgeTourModalProps> = ({
  isOpen,
  onClose,
  onLaunchAutoDemo,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'core-philosophy',
      title: '1. CORE PHILOSOPHY // DECIDE UNDER UNCERTAINTY',
      badge: 'SIH26248 MANDATE',
      icon: <Compass className="w-5 h-5 text-[#4fc3d0]" />,
      summary:
        'Why NEXUS-C2 exists and how it fundamentally transforms military decision training.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            Traditional military simulators train commanders when information is{' '}
            <strong className="text-[#e8eaec]">perfect, instantaneous, and complete</strong>. In actual
            combat and disaster theaters, communication links get severed, weather degrades RF bands,
            and automated telemetry contradicts on-ground scout reports.
          </p>
          <div className="bg-[#1c1f21] border border-[#4fc3d0]/30 p-3 rounded text-[11px] space-y-1.5">
            <div className="font-bold text-[#4fc3d0]">HOW THE DECISION TRAINER WORKS:</div>
            <p className="text-[#e8eaec]">
              NEXUS-C2 places the trainee in a degraded environment where information becomes delayed,
              stale, contradictory, or absent. Trainees are judged not by raw speed, but by their{' '}
              <span className="text-[#2ecc71] font-bold">information discipline</span>, source
              verification, and communication resilience.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#141618] border border-[#2a2d30] p-2 rounded">
              <span className="text-[#c0392b] font-bold">TRADITIONAL TRAINING:</span>
              <p>Assumes 100% reliable feeds. Rewards fastest click.</p>
            </div>
            <div className="bg-[#141618] border border-[#4fc3d0]/40 p-2 rounded">
              <span className="text-[#4fc3d0] font-bold">NEXUS-C2 TRAINER:</span>
              <p>Simulates fog-of-war. Rewards verifying trust before action.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'topographic-map',
      title: '2. OFFLINE TOPOGRAPHIC TACTICAL MAP',
      badge: '1:50,000 USGS CARTOGRAPHY',
      icon: <Layers className="w-5 h-5 text-[#4fc3d0]" />,
      summary:
        'Tactical physical terrain rendered 100% offline with dynamic RF degradation overlays.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            The operational map uses a{' '}
            <strong className="text-[#e8eaec]">high-contrast offline topographic engine</strong> with
            multi-elevation hypsometric shading, 3D analytical hillshading, 50m/100m contour isolines,
            and military transit corridors.
          </p>
          <div className="bg-[#1c1f21] border border-[#2a2d30] p-3 rounded space-y-2 text-[11px]">
            <div className="font-bold text-[#e8eaec]">DYNAMIC COMMUNICATION VISUALIZATION:</div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <span className="text-[#4fc3d0] font-bold">Cyan Links:</span> Healthy channel; smooth
                high-speed multi-packet comet trails.
              </li>
              <li>
                <span className="text-[#d4860a] font-bold">Amber Links:</span> High latency / rain-fade;
                packet trails visibly slow down and drop.
              </li>
              <li>
                <span className="text-[#c0392b] font-bold">Dashed Red Links:</span> Total link severance
                or relay power collapse.
              </li>
              <li>
                <span className="text-[#c0392b] font-bold">Pulsing Red Reticles:</span> Active
                contradiction between intelligence feeds.
              </li>
            </ul>
          </div>
          <p className="text-[10px] text-[#8a9099]">
            Trainees can click and drag to pan, use the mouse wheel to zoom (down to 30% for broad
            regional overview), and click any node for a live telemetry inspector.
          </p>
        </div>
      ),
    },
    {
      id: 'confidence-engine',
      title: '3. INFORMATION CONFIDENCE ENGINE (ICE)',
      badge: 'SIGNATURE ALGORITHM',
      icon: <Activity className="w-5 h-5 text-[#4fc3d0]" />,
      summary:
        'Continuous heuristic evaluation of intelligence trustworthiness in degraded channels.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            Every piece of incoming information is continuously scored using the NEXUS-C2 confidence
            formulation:
          </p>
          <div className="bg-[#1c1f21] border border-[#4fc3d0]/40 p-2.5 rounded font-mono text-center text-[12px] text-[#4fc3d0] font-bold">
            Confidence = SourceReliability × CommQuality × Freshness × Consistency
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between border-b border-[#2a2d30] pb-1">
              <span className="font-bold text-[#2ecc71]">CONFIRMED (85-100%):</span>
              <span>Fresh, reliable, channel clear, consistent</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2d30] pb-1">
              <span className="font-bold text-[#4fc3d0]">LIKELY (65-84%):</span>
              <span>Minor channel delay, acceptable reliability</span>
            </div>
            <div className="flex justify-between border-b border-[#2a2d30] pb-1">
              <span className="font-bold text-[#d4860a]">STALE (&gt;35s Age):</span>
              <span>Old report, transmitter offline, cannot verify</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[#c0392b]">CONTRADICTED:</span>
              <span>Discordant field report received; both flagged</span>
            </div>
          </div>
          <p className="text-[10px] text-[#8a9099]">
            Clicking any intelligence card displays a transparent audit explanation showing exactly why
            trust rose or fell.
          </p>
        </div>
      ),
    },
    {
      id: 'decision-rationale',
      title: '4. TACTICAL DECISION WINDOW & MANDATORY RATIONALE',
      badge: 'CORE EVALUATION',
      icon: <ShieldAlert className="w-5 h-5 text-[#d4860a]" />,
      summary:
        'Committing operational action under time pressure with required military rationale.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            When environmental or communication degradation triggers an operational crisis, a strict{' '}
            <strong className="text-[#e8eaec]">Decision Window</strong> opens with a ticking countdown.
          </p>
          <div className="bg-[#1c1f21] border border-[#d4860a]/30 p-3 rounded text-[11px] space-y-2">
            <div className="font-bold text-[#d4860a]">HOW TRAINEES ARE TESTED:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong className="text-[#e8eaec]">Select Action:</strong> Choose from abstract tactical
                actions (e.g. <code>SWITCH_CHANNEL</code>, <code>VERIFY</code>, <code>ADAPT_PLAN</code>,{' '}
                <code>PAUSE</code>).
              </li>
              <li>
                <strong className="text-[#e8eaec]">Mandatory Rationale:</strong> The trainee must type at
                least 10 characters justifying their decision based on surviving feeds.
              </li>
              <li>
                <strong className="text-[#e8eaec]">Speed vs Discipline:</strong> Submitting instantly
                based on a stale report results in heavy scoring penalties!
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'aar-scoring',
      title: '5. AFTER-ACTION REVIEW & 8-DIMENSION SCORING',
      badge: 'OBJECTIVE EVALUATION',
      icon: <Award className="w-5 h-5 text-[#2ecc71]" />,
      summary:
        'Multi-axis performance breakdown with zero-blind-speed bias and instant PDF export.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            Upon mission completion, the After-Action Review (AAR) grades the commander across 8
            orthogonal dimensions:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#141618] border border-[#2a2d30] p-2 rounded">
              <span className="text-[#4fc3d0] font-bold">DECISION QUALITY:</span>
              <p>Suitability of action chosen for the crisis.</p>
            </div>
            <div className="bg-[#141618] border border-[#2a2d30] p-2 rounded">
              <span className="text-[#4fc3d0] font-bold">INFO DISCIPLINE:</span>
              <p>Rejection of stale & contradicted data.</p>
            </div>
            <div className="bg-[#141618] border border-[#2a2d30] p-2 rounded">
              <span className="text-[#4fc3d0] font-bold">COMM RESILIENCE:</span>
              <p>Timely transition to secondary/fallback nets.</p>
            </div>
            <div className="bg-[#141618] border border-[#2a2d30] p-2 rounded">
              <span className="text-[#4fc3d0] font-bold">TIMELINESS:</span>
              <p>Deciding before the window closes without rush.</p>
            </div>
          </div>
          <p className="text-[10px] text-[#8a9099]">
            Includes an <strong className="text-[#e8eaec]">[EXPORT / PRINT PDF]</strong> button for
            military evaluation records.
          </p>
        </div>
      ),
    },
    {
      id: 'decision-replay',
      title: '6. DECISION REPLAY // STATE RECONSTRUCTION',
      badge: 'SIGNATURE REPLAY',
      icon: <RotateCcw className="w-5 h-5 text-[#4fc3d0]" />,
      summary:
        'Reconstructing exactly what the trainee knew at the moment of decision.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            The defining question of command training is:{' '}
            <em className="text-[#4fc3d0]">"What did the trainee know when they decided?"</em>
          </p>
          <div className="bg-[#1c1f21] border border-[#4fc3d0]/30 p-3 rounded text-[11px] space-y-1.5">
            <div className="font-bold text-[#e8eaec]">ZERO FUTURE-INFORMATION LEAKAGE:</div>
            <p>
              Decision Replay restores the immutable state snapshot recorded at the decision tick:
              active channel status, report staleness, contradiction alerts, and map positions. Any
              report received even 1 millisecond after the decision timestamp is strictly omitted!
            </p>
          </div>
          <p className="text-[10px] text-[#8a9099]">
            Instructors can scrub the timeline back and forth to inspect the trainee’s mental model
            during the crisis.
          </p>
        </div>
      ),
    },
    {
      id: 'instructor-stress',
      title: '7. INSTRUCTOR CONTROL & STRESS INJECTION',
      badge: 'HUMAN-IN-THE-LOOP',
      icon: <Sliders className="w-5 h-5 text-[#4fc3d0]" />,
      summary:
        'Real-time stress injection console for human evaluators and proctors.',
      content: (
        <div className="space-y-3 text-xs text-[#8a9099] leading-relaxed">
          <p>
            In the <strong className="text-[#e8eaec]">/instructor</strong> room, instructors can inject
            real-time stress vectors to test trainee adaptability:
          </p>
          <ul className="space-y-1.5 text-[11px] list-disc list-inside bg-[#141618] border border-[#2a2d30] p-3 rounded">
            <li>
              <span className="text-[#d4860a] font-bold">Inject High Latency:</span> Quadruples carrier
              delay (+450ms).
            </li>
            <li>
              <span className="text-[#c0392b] font-bold">Inject Packet Dropout:</span> Induces 60%
              telemetry loss.
            </li>
            <li>
              <span className="text-[#c0392b] font-bold">Sever Relay Power:</span> Instantly takes
              secondary tactical radio links offline.
            </li>
            <li>
              <span className="text-[#d4860a] font-bold">Inject Contradiction:</span> Sends conflicting
              drone vs ground observations.
            </li>
            <li>
              <span className="text-[#2ecc71] font-bold">Trigger Channel Recovery:</span> Restores
              satellite or wireline fallback.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="bg-[#141618] border border-[#4fc3d0]/60 max-w-2xl w-full rounded-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Top Modal Header */}
        <div className="bg-[#1c1f21] border-b border-[#2a2d30] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4fc3d0] animate-pulse" />
            <span className="text-xs font-bold text-[#e8eaec] tracking-wider">
              NEXUS-C2 &bull; HACKATHON EVALUATOR & JUDGE GUIDE
            </span>
          </div>
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="text-[#8a9099] hover:text-[#e8eaec] p-1 rounded hover:bg-[#2a2d30]"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pill Stepper */}
        <div className="bg-[#0d0f10] border-b border-[#2a2d30] px-4 py-2 flex items-center justify-between overflow-x-auto gap-1">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                tacticalAudio.playClick();
                setCurrentStep(idx);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
                currentStep === idx
                  ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] font-bold border border-[#4fc3d0]/50'
                  : 'text-[#8a9099] hover:text-[#e8eaec] hover:bg-[#1c1f21]'
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="hidden sm:inline">{s.id.split('-')[0].toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Main Content Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-start justify-between border-b border-[#2a2d30] pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {current.icon}
                <h3 className="font-bold text-sm text-[#e8eaec]">{current.title}</h3>
              </div>
              <p className="text-xs text-[#4fc3d0]">{current.summary}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1c1f21] border border-[#4fc3d0]/40 text-[#4fc3d0]">
              {current.badge}
            </span>
          </div>

          {current.content}
        </div>

        {/* Bottom Modal Actions */}
        <div className="bg-[#1c1f21] border-t border-[#2a2d30] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick 3-Min Automated Evaluation Run Button */}
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onLaunchAutoDemo();
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-[#4fc3d0] hover:bg-[#4fc3d0]/90 text-[#0d0f10] text-xs font-bold transition-all shadow-lg shadow-[#4fc3d0]/20 group"
          >
            <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
            <span>START 3-MIN LIVE EVALUATION</span>
          </button>

          {/* Previous / Next Stepper Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setCurrentStep((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#141618] border border-[#2a2d30] text-xs text-[#8a9099] hover:text-[#e8eaec] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            <span className="text-[11px] text-[#8a9099] px-2 font-mono">
              {currentStep + 1} / {steps.length}
            </span>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  tacticalAudio.playClick();
                  setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#141618] border border-[#4fc3d0]/40 text-xs text-[#4fc3d0] hover:bg-[#4fc3d0]/10 font-bold"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  tacticalAudio.playClick();
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#2ecc71] hover:bg-[#2ecc71]/90 text-[#0d0f10] text-xs font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>FINISH TOUR</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
