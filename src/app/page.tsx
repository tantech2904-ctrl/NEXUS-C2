'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/stores/simulationStore';
import scn06 from '@/../data/scenarios/scn-06-blackout.json';
import { validateScenario } from '@/lib/simulation/scenario';
import { Shield, Play, Layers, BookOpen, Database, Radio, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { loadScenario, startSimulation } = useSimulationStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleStartLiveDemo = () => {
    const validated = validateScenario(scn06);
    loadScenario(validated);
    startSimulation();
    router.push('/console');
  };

  // Ambient interactive canvas background: Animated tactical network nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const nodeCount = 28;
    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby nodes with glowing links
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.25;
            ctx.strokeStyle = `rgba(79, 195, 208, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw node points
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.fillStyle = '#4fc3d0';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#0d0f10] text-[#e8eaec] font-mono flex flex-col justify-between select-none">
      {/* Interactive Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

      {/* Subtle Scanlines & Tactical Grid */}
      <div className="absolute inset-0 tactical-grid pointer-events-none z-0" />
      <div className="absolute inset-0 scanlines pointer-events-none z-0" />

      {/* Top Bar */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b border-[#2a2d30]/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-[#4fc3d0] bg-[#4fc3d0]/15 flex items-center justify-center text-[#4fc3d0] shadow-[0_0_15px_rgba(79,195,208,0.3)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-widest text-[#e8eaec]">NEXUS-C2</div>
            <div className="text-[10px] text-[#8a9099] tracking-wider">SIH26248 &bull; DEFENCE TRAINING SIMULATOR</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#8a9099] bg-[#141618]/80 border border-[#2a2d30] px-3 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
          <span>READY FOR EVALUATION</span>
        </div>
      </header>

      {/* Center Hero Box */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 flex flex-col items-center text-center">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4fc3d0]/40 bg-[#4fc3d0]/10 text-[#4fc3d0] text-xs font-semibold mb-6 shadow-[0_0_20px_rgba(79,195,208,0.2)]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>IMMERSIVE MULTI-DOMAIN DECISION-MAKING TRAINER</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#e8eaec] mb-4">
          DECIDE UNDER <span className="text-[#4fc3d0] drop-shadow-[0_0_25px_rgba(79,195,208,0.5)]">UNCERTAINTY.</span>
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-[#8a9099] font-sans leading-relaxed mb-8">
          A deterministic browser-based command simulator for high-stakes decisions when telemetry becomes delayed, incomplete, stale, contradictory, or severed.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <button
            onClick={handleStartLiveDemo}
            className="flex items-center gap-2 px-6 py-3 rounded bg-[#4fc3d0] text-black font-bold text-sm hover:bg-[#4fc3d0]/90 transition-all shadow-[0_0_25px_rgba(79,195,208,0.5)] hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START LIVE 3-MIN DEMO</span>
          </button>

          <Link
            href="/console"
            className="flex items-center gap-2 px-5 py-3 rounded bg-[#141618] border border-[#4fc3d0]/60 text-[#e8eaec] hover:bg-[#1c1f21] hover:border-[#4fc3d0] font-semibold text-sm transition-all"
          >
            <span>ENTER TRAINING CONSOLE</span>
            <ChevronRight className="w-4 h-4 text-[#4fc3d0]" />
          </Link>

          <Link
            href="/instructor"
            className="flex items-center gap-2 px-5 py-3 rounded bg-[#141618] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#d4860a]/60 font-semibold text-sm transition-all"
          >
            <Layers className="w-4 h-4 text-[#d4860a]" />
            <span>INSTRUCTOR ROOM</span>
          </Link>

          <Link
            href="/scenarios"
            className="flex items-center gap-2 px-5 py-3 rounded bg-[#141618] border border-[#2a2d30] text-[#8a9099] hover:text-[#e8eaec] hover:border-[#4fc3d0]/40 font-semibold text-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>SCENARIO LIBRARY</span>
          </Link>
        </div>

        {/* System Readiness Terminal Board */}
        <div className="w-full max-w-lg bg-[#141618]/90 border border-[#2a2d30] rounded-sm p-4 text-xs font-mono text-left shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#2a2d30] pb-2 mb-3">
            <span className="text-[#8a9099] font-bold">SYSTEM TELEMETRY BOARD</span>
            <span className="text-[10px] text-[#2ecc71] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> READY
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#8a9099]">SYSTEM STATUS:</span>
              <span className="text-[#2ecc71] font-bold">OPERATIONAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a9099]">SIMULATION ENGINE:</span>
              <span className="text-[#4fc3d0] font-bold">DETERMINISTIC // SEEDED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a9099]">INFORMATION CONFIDENCE ENGINE:</span>
              <span className="text-[#4fc3d0] font-bold">ONLINE // EXPLAINABLE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a9099]">DECISION REPLAY:</span>
              <span className="text-[#4fc3d0] font-bold">IMMUTABLE // ZERO LEAK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a9099]">OFFLINE DATA MODE:</span>
              <span className="text-[#e8eaec] font-bold">PUBLIC / SYNTHETIC</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 border-t border-[#2a2d30]/60 text-center text-xs text-[#8a9099] backdrop-blur-sm">
        Smart India Hackathon 2026 &bull; Problem Statement SIH26248 &bull; Synthetic Training Environment
      </footer>
    </div>
  );
}
