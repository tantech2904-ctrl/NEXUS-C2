'use client';

import React, { useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { InformationItem, InformationStatus } from '@/types/simulation';
import { formatPercent } from '@/lib/utils';
import { Shield, AlertTriangle, Clock, Radio, ChevronDown, ChevronUp, Layers, CheckCircle2, XCircle } from 'lucide-react';

export const InformationFeed: React.FC = () => {
  const { informationItems, channels } = useSimulationStore();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const getStatusBadge = (status: InformationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-1.5 py-0.5 rounded bg-[#2ecc71]/20 text-[#2ecc71] border border-[#2ecc71]/40 text-[9px] font-bold">CONFIRMED</span>;
      case 'LIKELY':
        return <span className="px-1.5 py-0.5 rounded bg-[#4fc3d0]/20 text-[#4fc3d0] border border-[#4fc3d0]/40 text-[9px] font-bold">LIKELY</span>;
      case 'UNCERTAIN':
        return <span className="px-1.5 py-0.5 rounded bg-[#d4860a]/20 text-[#d4860a] border border-[#d4860a]/40 text-[9px] font-bold">UNCERTAIN</span>;
      case 'STALE':
        return <span className="px-1.5 py-0.5 rounded bg-[#4d5560]/30 text-[#8a9099] border border-[#4d5560] text-[9px] font-bold">STALE</span>;
      case 'CONTRADICTED':
        return <span className="px-1.5 py-0.5 rounded bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/40 text-[9px] font-bold animate-pulse">CONTRADICTED</span>;
      case 'UNAVAILABLE':
        return <span className="px-1.5 py-0.5 rounded bg-[#1c1f21] text-[#8a9099] border border-[#2a2d30] text-[9px] font-bold">UNAVAILABLE</span>;
      default:
        return null;
    }
  };

  const getConfidenceBarColor = (conf: number) => {
    if (conf >= 0.75) return 'bg-[#2ecc71]';
    if (conf >= 0.50) return 'bg-[#d4860a]';
    return 'bg-[#c0392b]';
  };

  return (
    <div className="flex flex-col h-full bg-[#141618] border border-[#2a2d30] rounded-sm overflow-hidden font-mono text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2 bg-[#1c1f21] border-b border-[#2a2d30] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#4fc3d0]" />
          <span className="font-bold text-[#e8eaec] tracking-wider text-[11px]">INFORMATION FEED (ICE STREAM)</span>
        </div>
        <div className="text-[10px] text-[#8a9099]">
          ACTIVE REPORTS: <span className="text-[#4fc3d0] font-semibold">{informationItems.length}</span>
        </div>
      </div>

      {/* Feed Stream */}
      <div data-tour="feed-stream" className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {informationItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8a9099]">
            <Radio className="w-8 h-8 text-[#2a2d30] mb-2 animate-pulse" />
            <div className="font-semibold text-xs text-[#e8eaec]">AWAITING TELEMETRY INGESTION</div>
            <div className="text-[11px] mt-1 max-w-xs">
              Forward reconnaissance and sensor telemetry will appear as scenario timeline unfolds.
            </div>
          </div>
        ) : (
          informationItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const channel = channels[item.channelId];
            const isContradicted = item.verification === 'CONTRADICTED';
            const isStale = item.verification === 'STALE';

            return (
              <div
                key={item.id}
                data-tour={isContradicted ? 'feed-item-CONTRADICTED' : undefined}
                onClick={() => toggleExpand(item.id)}
                className={`border rounded p-2.5 cursor-pointer transition-all ${
                  isContradicted
                    ? 'border-[#c0392b]/60 bg-[#c0392b]/5 hover:bg-[#c0392b]/10'
                    : isStale
                    ? 'border-[#4d5560]/40 bg-[#1c1f21]/40 opacity-75'
                    : 'border-[#2a2d30] bg-[#1c1f21] hover:border-[#4fc3d0]/40'
                }`}
              >
                {/* Top Row: Source, Status, Age */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#4fc3d0] text-xs">{item.sourceName}</span>
                    <span className="text-[9px] text-[#8a9099] px-1 py-0.2 bg-[#0d0f10] rounded border border-[#2a2d30]">
                      {item.sourceType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.verification)}
                    <span className="text-[10px] text-[#8a9099] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.ageSeconds.toFixed(1)}s ago
                    </span>
                  </div>
                </div>

                {/* Report Content */}
                <div className="text-[#e8eaec] text-[11px] leading-relaxed mb-2 font-sans">
                  &ldquo;{item.content}&rdquo;
                </div>

                {/* Confidence Bar Row */}
                <div className="flex items-center justify-between gap-3 bg-[#0d0f10] p-1.5 rounded border border-[#2a2d30]/60">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8a9099]">
                    <Shield className="w-3 h-3 text-[#4fc3d0]" />
                    <span>CONFIDENCE:</span>
                    <span className="font-bold text-[#e8eaec]">{formatPercent(item.confidence)}</span>
                  </div>
                  <div className="flex-1 max-w-[140px] h-2 bg-[#1c1f21] rounded overflow-hidden border border-[#2a2d30]">
                    <div
                      className={`h-full transition-all duration-300 ${getConfidenceBarColor(item.confidence)}`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <button className="text-[#8a9099] hover:text-[#4fc3d0]">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded ICE Breakdown & "Why It Fell" Explanation */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#2a2d30] space-y-2 text-[10px] animate-in fade-in slide-in-from-top-1">
                    {/* Heuristic Factors Table */}
                    <div className="grid grid-cols-2 gap-2 bg-[#0d0f10] p-2 rounded border border-[#2a2d30]">
                      <div>
                        <span className="text-[#8a9099]">CHANNEL:</span>
                        <div className="font-semibold text-[#e8eaec] truncate">{channel ? channel.name : 'Unknown Link'}</div>
                      </div>
                      <div>
                        <span className="text-[#8a9099]">CHANNEL QUALITY (Q):</span>
                        <div className="font-semibold text-[#4fc3d0]">{formatPercent(item.channelQuality)}</div>
                      </div>
                      <div>
                        <span className="text-[#8a9099]">SOURCE RELIABILITY:</span>
                        <div className="font-semibold text-[#e8eaec]">{formatPercent(item.sourceReliability)}</div>
                      </div>
                      <div>
                        <span className="text-[#8a9099]">FRESHNESS (exp decay):</span>
                        <div className="font-semibold text-[#e8eaec]">{formatPercent(item.freshness)}</div>
                      </div>
                      <div>
                        <span className="text-[#8a9099]">CONSISTENCY:</span>
                        <div className={`font-semibold ${item.consistency < 1 ? 'text-[#c0392b]' : 'text-[#2ecc71]'}`}>
                          {formatPercent(item.consistency)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a9099]">HEURISTIC FORMULA:</span>
                        <div className="text-[9px] text-[#8a9099]">Q × Rel × Fresh × Cons</div>
                      </div>
                    </div>

                    {/* Explanatory Reasons: Why Confidence Degraded */}
                    {item.explanation && item.explanation.reasons.length > 0 && (
                      <div className="bg-[#1c1f21] p-2 rounded border border-[#2a2d30]">
                        <div className="font-bold text-[#d4860a] mb-1 flex items-center gap-1.5 text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-[#d4860a]" />
                          CONFIDENCE DEGRADATION AUDIT:
                        </div>
                        <ul className="space-y-1 list-disc list-inside text-[#8a9099] text-[10px]">
                          {item.explanation.reasons.map((reason, idx) => (
                            <li key={idx} className="leading-tight">
                              <span className="text-[#e8eaec]">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
