'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { ReplayModal } from '@/components/replay/ReplayModal';
import { formatTime } from '@/lib/utils';
import { tacticalAudio } from '@/lib/audio';
import { Shield, Award, RotateCcw, Printer } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface AfterActionReviewProps {
  onReturnToConsole?: () => void;
  onChooseScenario?: () => void;
}

export const AfterActionReview: React.FC<AfterActionReviewProps> = ({
  onReturnToConsole,
  onChooseScenario,
}) => {
  const { decisions, latestScore, sessionId } = useSessionStore();
  const { scenario } = useSimulationStore();
  const [isReplayOpen, setIsReplayOpen] = useState(false);

  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#141618] border border-[#2a2d30] rounded-sm font-mono print:bg-white print:text-black">
        <Award className="w-12 h-12 text-[#2a2d30] mb-3 print:hidden" />
        <div className="font-bold text-base text-[#e8eaec] print:text-black">AFTER-ACTION REVIEW PENDING</div>
        <div className="text-xs text-[#8a9099] max-w-md mt-1 mb-4 font-sans print:text-gray-600">
          Complete at least one tactical decision window during the scenario to generate multi-dimensional scoring and immutable replay analytics.
        </div>
        {onReturnToConsole && (
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onReturnToConsole();
            }}
            className="px-4 py-2 bg-[#4fc3d0] text-black font-bold text-xs rounded hover:bg-[#4fc3d0]/90 transition-all print:hidden"
          >
            ← RETURN TO COMMAND CONSOLE
          </button>
        )}
      </div>
    );
  }

  const latestDecision = decisions[decisions.length - 1];
  const overallScore = latestScore ? latestScore.overallScore : latestDecision.overallScore;
  const dimensions = latestScore ? latestScore.dimensions : latestDecision.scoreComponents;

  const radarData = [
    { dimension: 'Quality', score: dimensions.decisionQuality },
    { dimension: 'Timeliness', score: dimensions.timeliness },
    { dimension: 'Discipline', score: dimensions.informationDiscipline },
    { dimension: 'Source Eval', score: dimensions.sourceEvaluation },
    { dimension: 'Resilience', score: dimensions.communicationResilience },
    { dimension: 'Coordination', score: dimensions.coordination },
    { dimension: 'Risk Mgmt', score: dimensions.riskManagement },
    { dimension: 'Adaptability', score: dimensions.adaptability },
  ];

  const handlePrint = () => {
    tacticalAudio.playClick();
    // Small timeout ensures any dynamic layouts are settled before opening browser print preview
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="bg-[#141618] border border-[#2a2d30] rounded-sm font-mono text-xs select-none p-4 sm:p-6 space-y-6 print:bg-white print:border-none print:text-black print:p-2 print:space-y-4 print:w-full print:overflow-visible">
      {/* Official Printable Defense / Training Letterhead (Printed only) */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-black">NEXUS-C2 COMMAND SIMULATOR</h1>
            <h2 className="text-xs font-bold text-gray-800 tracking-wide mt-0.5">
              OFFICIAL AFTER-ACTION REVIEW & PERFORMANCE EVALUATION
            </h2>
            <p className="text-[10px] text-gray-600 mt-1">
              Smart India Hackathon 2026 &bull; Problem Statement SIH26248 &bull; Degraded Comms Trainer
            </p>
          </div>
          <div className="text-right text-[10px] text-gray-700 font-mono">
            <div><strong>SESSION ID:</strong> {sessionId}</div>
            <div><strong>EVALUATION DATE:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>SECURITY LEVEL:</strong> SYNTHETIC EXERCISE</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between text-xs text-gray-900">
          <div>
            <strong>SCENARIO:</strong> {scenario?.id} &mdash; {scenario?.title}
          </div>
          <div>
            <strong>OUTCOME:</strong> <span className="font-bold underline">{latestScore?.outcomeClass || latestDecision.outcomeClass}</span>
          </div>
        </div>
      </div>

      {/* Screen Header Banner (Interactive only, hidden in print) */}
      <div className="border-b border-[#2a2d30] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-[#4fc3d0] font-bold text-sm tracking-wider">
            <Award className="w-5 h-5" />
            AFTER-ACTION REVIEW (AAR EVALUATION)
          </div>
          <div className="text-xs text-[#8a9099] mt-0.5">
            Scenario: <span className="text-[#e8eaec] font-semibold">{scenario?.title || 'BLACKOUT // INFORMATION FOG'}</span> &bull; Session ID: <span className="text-[#4fc3d0]">{sessionId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onReturnToConsole && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onReturnToConsole();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#e8eaec] hover:border-[#4fc3d0] text-xs font-semibold transition-colors"
              title="Return to Command Console"
            >
              <span>← CONSOLE</span>
            </button>
          )}

          {onChooseScenario && (
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onChooseScenario();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-semibold transition-colors"
              title="Browse all 9 training scenarios"
            >
              <span>SCENARIO LIBRARY →</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#1c1f21] border border-[#4fc3d0]/60 text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-bold transition-all shadow-sm"
            title="Print or Export AAR to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT / PRINT PDF</span>
          </button>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              setIsReplayOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#4fc3d0] text-black font-bold text-xs hover:bg-[#4fc3d0]/90 transition-all shadow-[0_0_15px_rgba(79,195,208,0.3)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY DECISIONS</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-3 break-inside-avoid">
        {/* Overall Score */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between print:bg-gray-50 print:border-gray-300 print:text-black">
          <div className="text-[11px] text-[#8a9099] font-bold print:text-gray-700">OVERALL SCORE</div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl font-bold text-[#4fc3d0] print:text-black">{overallScore}</span>
            <span className="text-[#8a9099] text-sm print:text-gray-600">/ 100</span>
          </div>
          <div className="text-[11px] font-semibold text-[#2ecc71] print:text-green-800">
            OUTCOME: {latestScore?.outcomeClass || latestDecision.outcomeClass}
          </div>
        </div>

        {/* Decisions Recorded */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between print:bg-gray-50 print:border-gray-300 print:text-black">
          <div className="text-[11px] text-[#8a9099] font-bold print:text-gray-700">DECISIONS COMMITTED</div>
          <div className="text-3xl font-bold text-[#e8eaec] my-2 print:text-black">{decisions.length}</div>
          <div className="text-[10px] text-[#8a9099] print:text-gray-600">Immutable Zero-Leak Snapshots</div>
        </div>

        {/* Information Discipline */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between print:bg-gray-50 print:border-gray-300 print:text-black">
          <div className="text-[11px] text-[#8a9099] font-bold print:text-gray-700">INFO DISCIPLINE</div>
          <div className="text-3xl font-bold text-[#2ecc71] my-2 print:text-black">{dimensions.informationDiscipline}%</div>
          <div className="text-[10px] text-[#8a9099] print:text-gray-600">Verification before action</div>
        </div>

        {/* Comm Resilience */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between print:bg-gray-50 print:border-gray-300 print:text-black">
          <div className="text-[11px] text-[#8a9099] font-bold print:text-gray-700">COMM RESILIENCE</div>
          <div className="text-3xl font-bold text-[#4fc3d0] my-2 print:text-black">{dimensions.communicationResilience}%</div>
          <div className="text-[10px] text-[#8a9099] print:text-gray-600">Adaptation to channel failure</div>
        </div>
      </div>

      {/* Radar Chart & Dimension Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center print:grid-cols-2 print:gap-4 break-inside-avoid">
        {/* Radar Visualization */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded h-72 flex flex-col items-center justify-center print:bg-white print:border-gray-300 print:h-60">
          <div className="text-[11px] font-bold text-[#8a9099] self-start mb-2 print:text-gray-800">
            8-DIMENSIONAL PERFORMANCE RADAR
          </div>
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a2d30" />
                <PolarAngleAxis dataKey="dimension" stroke="#8a9099" tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#4fc3d0" fill="#4fc3d0" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Breakdown Table */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded print:bg-white print:border-gray-300">
          <div className="text-[11px] font-bold text-[#8a9099] mb-3 print:text-gray-800">
            DIMENSION SCORE MATRIX
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {radarData.map((d) => (
              <div
                key={d.dimension}
                className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center print:bg-gray-50 print:border-gray-300 print:text-black"
              >
                <span className="text-[#8a9099] text-[11px] print:text-gray-700">{d.dimension}:</span>
                <span className="font-bold text-[#e8eaec] print:text-black">{d.score} / 100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Timeline List */}
      <div className="border border-[#2a2d30] rounded overflow-hidden print:border-gray-300 print:bg-white break-inside-avoid">
        <div className="bg-[#1c1f21] px-4 py-2 border-b border-[#2a2d30] font-bold text-xs text-[#e8eaec] print:bg-gray-100 print:text-black print:border-gray-300">
          RECORDED DECISION TIMELINE & MANDATORY RATIONALES
        </div>
        <div className="divide-y divide-[#2a2d30] print:divide-gray-300">
          {decisions.map((dec, idx) => (
            <div
              key={dec.id}
              className="p-4 bg-[#141618] hover:bg-[#1c1f21]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 print:bg-white print:text-black break-inside-avoid"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-[#4fc3d0] print:text-black">DECISION #{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0f10] border border-[#2a2d30] text-[#8a9099] text-[10px] print:bg-gray-100 print:border-gray-300 print:text-gray-700">
                    TICK: {formatTime(dec.tick)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#2ecc71]/20 text-[#2ecc71] font-bold text-[10px] print:bg-green-100 print:text-green-900 print:border print:border-green-300">
                    ACTION: {dec.selectedAction}
                  </span>
                </div>
                <div className="text-xs text-[#8a9099] font-sans print:text-gray-800 print:mt-1.5 print:leading-relaxed">
                  <span className="font-bold print:inline hidden">COMMANDER RATIONALE: </span>
                  &ldquo;{dec.rationale}&rdquo;
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#e8eaec] print:text-black">{dec.overallScore} / 100</div>
                  <div className="text-[10px] text-[#2ecc71] print:text-green-800 font-semibold">{dec.outcomeClass}</div>
                </div>
                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    setIsReplayOpen(true);
                  }}
                  className="px-3 py-1.5 rounded border border-[#4fc3d0]/60 text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-semibold print:hidden"
                >
                  REPLAY
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Sign-off Block for Print Output */}
      <div className="hidden print:grid grid-cols-2 gap-10 pt-8 mt-6 border-t border-gray-400 text-xs text-gray-800 break-inside-avoid">
        <div>
          <div className="border-b border-gray-400 pb-10 mb-2"></div>
          <div className="font-bold">EXERCISE CONTROLLER / PROCTOR SIGN-OFF</div>
          <div className="text-[10px] text-gray-500">Validation of degraded communication exercise completion</div>
        </div>
        <div>
          <div className="border-b border-gray-400 pb-10 mb-2"></div>
          <div className="font-bold">TRAINEE / CANDIDATE ACKNOWLEDGEMENT</div>
          <div className="text-[10px] text-gray-500">Performance review and rationale debrief acknowledged</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-[10px] text-[#8a9099] border-t border-[#2a2d30] pt-4 print:text-gray-500 print:border-gray-300">
        This report describes performance within a synthetic training simulation (NEXUS-C2). It does not represent an operational military assessment. Calibrated with public crisis telemetry.
      </div>

      {/* Modal */}
      <ReplayModal isOpen={isReplayOpen} onClose={() => setIsReplayOpen(false)} />
    </div>
  );
};
