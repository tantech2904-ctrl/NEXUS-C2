'use client';

import React from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { formatPercent } from '@/lib/utils';

export const Footer: React.FC = () => {
  const {
    isRunning,
    speedMultiplier,
    channels,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSpeedMultiplier,
    eventLog,
  } = useSimulationStore();

  const channelList = Object.values(channels);
  const latestLog = eventLog.length > 0 ? eventLog[0] : null;

  return (
    <footer className="bg-[#141618] border-t border-[#2a2d30] px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono select-none z-30 print:hidden">
      {/* Simulation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={isRunning ? pauseSimulation : startSimulation}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all border ${
            isRunning
              ? 'bg-[#d4860a]/20 text-[#d4860a] border-[#d4860a]/50 hover:bg-[#d4860a]/30'
              : 'bg-[#2ecc71]/20 text-[#2ecc71] border-[#2ecc71]/50 hover:bg-[#2ecc71]/30 animate-pulse'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE SIM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>RUN SIM</span>
            </>
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1f21] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0]/40 transition-colors"
          title="Reset Scenario to T+00:00"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">RESET</span>
        </button>

        <div className="h-4 w-[1px] bg-[#2a2d30] mx-1" />

        {/* Speed multiplier selection */}
        <div className="flex items-center bg-[#0d0f10] border border-[#2a2d30] rounded p-0.5">
          <FastForward className="w-3 h-3 text-[#8a9099] mx-1" />
          {[0.5, 1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeedMultiplier(speed)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                speedMultiplier === speed
                  ? 'bg-[#4fc3d0] text-black'
                  : 'text-[#8a9099] hover:text-[#e8eaec]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Channel Mini Health Meters */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-full">
        {channelList.map((ch) => {
          const qColor =
            ch.channelQuality >= 0.75
              ? 'bg-[#2ecc71]'
              : ch.channelQuality >= 0.45
              ? 'bg-[#d4860a]'
              : 'bg-[#c0392b]';
          return (
            <div
              key={ch.id}
              className="flex items-center gap-2 bg-[#1c1f21] border border-[#2a2d30] px-2 py-0.5 rounded text-[10px]"
            >
              <span className="text-[#8a9099] uppercase truncate max-w-[100px]">{ch.name.replace('TACTICAL ', '').replace('EMERGENCY ', '')}</span>
              <div className="w-10 h-1.5 bg-[#0d0f10] rounded-sm overflow-hidden border border-[#2a2d30]/60">
                <div
                  className={`h-full transition-all duration-300 ${qColor}`}
                  style={{ width: `${ch.channelQuality * 100}%` }}
                />
              </div>
              <span className="font-semibold text-[#e8eaec]">{formatPercent(ch.channelQuality)}</span>
              <span className="text-[9px] text-[#8a9099] hidden lg:inline">{ch.latencyMs}ms / {Math.round(ch.packetLoss * 100)}%PL</span>
            </div>
          );
        })}
      </div>

      {/* Live Event Ticker */}
      <div className="hidden xl:flex items-center gap-2 text-[10px] text-[#8a9099] max-w-xs truncate">
        <span className="text-[#4fc3d0] font-bold">LATEST:</span>
        <span className="text-[#e8eaec] truncate">{latestLog ? latestLog.message : 'Telemetry nominal.'}</span>
      </div>
    </footer>
  );
};
