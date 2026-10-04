'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { ReplayModal } from '@/components/replay/ReplayModal';
import { formatTime } from '@/lib/utils';
import { Shield, Award, RotateCcw, AlertTriangle, CheckCircle, TrendingUp, Clock, Layers } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const AfterActionReview: React.FC = () => {
  const { decisions, latestScore, sessionId } = useSessionStore();
  const { scenario } = useSimulationStore();
  const [isReplayOpen, setIsReplayOpen] = useState(false);

  // If no decision recorded yet
  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#141618] border border-[#2a2d30] rounded-sm font-mono">
        <Award className="w-12 h-12 text-[#2a2d30] mb-3" />
        <div className="font-bold text-base text-[#e8eaec]">AFTER-ACTION REVIEW PENDING</div>
        <div className="text-xs text-[#8a9099] max-w-md mt-1 mb-4">
          Complete at least one tactical decision window during the scenario to generate multi-dimensional scoring and immutable replay analytics.
        </div>
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

  return (
    <div className="bg-[#141618] border border-[#2a2d30] rounded-sm font-mono text-xs select-none p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#2a2d30] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4fc3d0] font-bold text-sm tracking-wider">
            <Award className="w-5 h-5" />
            AFTER-ACTION REVIEW (AAR)
          </div>
          <div className="text-xs text-[#8a9099] mt-0.5">
            Scenario: <span className="text-[#e8eaec] font-semibold">{scenario?.title || 'BLACKOUT // INFORMATION FOG'}</span> &bull; Session: <span className="text-[#4fc3d0]">{sessionId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReplayOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#4fc3d0] text-black font-bold text-xs hover:bg-[#4fc3d0]/90 transition-all shadow-[0_0_15px_rgba(79,195,208,0.3)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY DECISIONS</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between">
          <div className="text-[11px] text-[#8a9099] font-bold">OVERALL TRAINING SCORE</div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl font-bold text-[#4fc3d0]">{overallScore}</span>
            <span className="text-[#8a9099] text-sm">/ 100</span>
          </div>
          <div className="text-[11px] font-semibold text-[#2ecc71]">
            OUTCOME: {latestScore?.outcomeClass || latestDecision.outcomeClass}
          </div>
        </div>

        {/* Decisions Recorded */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between">
          <div className="text-[11px] text-[#8a9099] font-bold">DECISIONS EVALUATED</div>
          <div className="text-3xl font-bold text-[#e8eaec] my-2">{decisions.length}</div>
          <div className="text-[10px] text-[#8a9099]">All snapshots immutably preserved</div>
        </div>

        {/* Information Discipline */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between">
          <div className="text-[11px] text-[#8a9099] font-bold">INFORMATION DISCIPLINE</div>
          <div className="text-3xl font-bold text-[#2ecc71] my-2">{dimensions.informationDiscipline}%</div>
          <div className="text-[10px] text-[#8a9099]">Verification vs reflexive action</div>
        </div>

        {/* Comm Resilience */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded flex flex-col justify-between">
          <div className="text-[11px] text-[#8a9099] font-bold">COMM RESILIENCE</div>
          <div className="text-3xl font-bold text-[#4fc3d0] my-2">{dimensions.communicationResilience}%</div>
          <div className="text-[10px] text-[#8a9099]">Adaptation to channel failure</div>
        </div>
      </div>

      {/* Radar Chart & Dimension Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Radar Visualization */}
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded h-72 flex flex-col items-center justify-center">
          <div className="text-[11px] font-bold text-[#8a9099] self-start mb-2">EVALUATION DIMENSION RADAR</div>
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
        <div className="bg-[#1c1f21] border border-[#2a2d30] p-4 rounded">
          <div className="text-[11px] font-bold text-[#8a9099] mb-3">DIMENSION SCORE MATRIX</div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {radarData.map((d) => (
              <div key={d.dimension} className="bg-[#0d0f10] border border-[#2a2d30] p-2 rounded flex justify-between items-center">
                <span className="text-[#8a9099] text-[11px]">{d.dimension}:</span>
                <span className="font-bold text-[#e8eaec]">{d.score} / 100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Timeline List */}
      <div className="border border-[#2a2d30] rounded overflow-hidden">
        <div className="bg-[#1c1f21] px-4 py-2 border-b border-[#2a2d30] font-bold text-xs text-[#e8eaec]">
          RECORDED DECISION TIMELINE
        </div>
        <div className="divide-y divide-[#2a2d30]">
          {decisions.map((dec, idx) => (
            <div key={dec.id} className="p-4 bg-[#141618] hover:bg-[#1c1f21]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-[#4fc3d0]">DECISION #{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-[#0d0f10] border border-[#2a2d30] text-[#8a9099] text-[10px]">
                    {formatTime(dec.tick)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#2ecc71]/20 text-[#2ecc71] font-bold text-[10px]">
                    {dec.selectedAction}
                  </span>
                </div>
                <div className="text-xs text-[#8a9099] font-sans">
                  &ldquo;{dec.rationale}&rdquo;
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#e8eaec]">{dec.overallScore} / 100</div>
                  <div className="text-[10px] text-[#2ecc71]">{dec.outcomeClass}</div>
                </div>
                <button
                  onClick={() => setIsReplayOpen(true)}
                  className="px-3 py-1.5 rounded border border-[#4fc3d0]/60 text-[#4fc3d0] hover:bg-[#4fc3d0]/10 text-xs font-semibold"
                >
                  REPLAY
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-[10px] text-[#8a9099] border-t border-[#2a2d30] pt-4">
        This report describes performance within a synthetic training simulation. It does not represent an operational military assessment.
      </div>

      {/* Modal */}
      <ReplayModal isOpen={isReplayOpen} onClose={() => setIsReplayOpen(false)} />
    </div>
  );
};
