'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import sourcesManifest from '@/../data/sources/manifest.json';
import { Eye, ExternalLink, Shield, Database, CheckCircle2 } from 'lucide-react';

export default function DataSourcesPage() {
  const sources = sourcesManifest;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono select-none">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div className="border-b border-[#2a2d30] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#4fc3d0] font-bold text-sm tracking-wider">
              <Database className="w-5 h-5" />
              DATA PROVENANCE & PUBLIC SOURCES REGISTRY
            </div>
            <div className="text-xs text-[#8a9099] mt-0.5">
              Transparent attribution of public crisis datasets calibrating environmental degradation heuristics
            </div>
          </div>
          <div className="bg-[#1c1f21] border border-[#2a2d30] px-3 py-1.5 rounded text-xs text-[#8a9099]">
            {sources.length} CANONICAL SOURCES DOCUMENTED
          </div>
        </div>

        {/* Boundary Notice */}
        <div className="bg-[#141618] border border-[#4fc3d0]/40 p-4 rounded text-xs space-y-2">
          <div className="font-bold text-[#4fc3d0] flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" />
            SYNTHETIC COMMAND VS. HISTORICAL CALIBRATION BOUNDARY
          </div>
          <p className="text-[#8a9099] leading-relaxed font-sans text-xs">
            NEXUS-C2 is an educational and synthetic command decision trainer. Public historical datasets (FCC, NOAA, USGS, ITU) are used solely to calibrate environmental stress curves, RF atmospheric degradation, and communication outage patterns. All tactical callsigns, positions, units, decisions, and outcomes are strictly fictional.
          </p>
        </div>

        {/* Source Cards List */}
        <div className="space-y-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="bg-[#141618] border border-[#2a2d30] p-4 rounded hover:border-[#4fc3d0]/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2a2d30] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#e8eaec]">{src.sourceName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#4fc3d0]">
                    {src.category}
                  </span>
                </div>
                {src.sourceURL.startsWith('http') && (
                  <a
                    href={src.sourceURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#4fc3d0] hover:underline text-xs"
                  >
                    <span>OFFICIAL SOURCE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold">ORGANIZATION:</div>
                  <div className="text-[#e8eaec] font-semibold">{src.organization}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold">PURPOSE IN SIMULATOR:</div>
                  <div className="text-[#e8eaec]">{src.purpose}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold">PROCESSING / NORMALIZATION:</div>
                  <div className="text-[#8a9099] font-sans">{src.processingMethod}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8a9099] font-bold">LICENSE & USAGE:</div>
                  <div className="text-[#8a9099] font-sans">{src.license}</div>
                </div>
              </div>

              {src.note && (
                <div className="mt-3 pt-2 border-t border-[#2a2d30] text-[11px] text-[#d4860a] font-sans">
                  &bull; {src.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
