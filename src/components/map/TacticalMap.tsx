'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { TacticalEntity } from '@/types/simulation';
import { Shield, Radio, Users, Eye, Box, AlertTriangle, Layers } from 'lucide-react';

interface TacticalMapProps {
  interactive?: boolean;
  selectedEntityId?: string | null;
  onSelectEntity?: (entity: TacticalEntity | null) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  interactive = true,
  selectedEntityId = null,
  onSelectEntity,
}) => {
  const { entities, channels, informationItems, tick } = useSimulationStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<TacticalEntity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<TacticalEntity | null>(null);

  const entityList = Object.values(entities);

  // Geographic boundary bounds to local canvas coords
  // Normalize longitudes and latitudes of our fictional area into canvas dimensions
  const getCanvasCoords = (coords: [number, number], width: number, height: number) => {
    // Default sector centered around ~28.6° N, 77.2° E
    const minLng = 77.12;
    const maxLng = 77.34;
    const minLat = 28.53;
    const maxLat = 28.70;

    const xPadding = 40;
    const yPadding = 40;

    const normX = (coords[0] - minLng) / (maxLng - minLng);
    const normY = 1 - (coords[1] - minLat) / (maxLat - minLat); // invert Y for screen coords

    const x = xPadding + normX * (width - 2 * xPadding);
    const y = yPadding + normY * (height - 2 * yPadding);

    return { x, y };
  };

  // Render loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle tactical grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Sector Bounds & Degraded RF Zone Polygon
      ctx.fillStyle = 'rgba(192, 57, 43, 0.08)';
      ctx.strokeStyle = 'rgba(192, 57, 43, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Degraded zone coords
      const p1 = getCanvasCoords([77.23, 28.675], width, height);
      const p2 = getCanvasCoords([77.29, 28.675], width, height);
      const p3 = getCanvasCoords([77.285, 28.62], width, height);
      const p4 = getCanvasCoords([77.23, 28.62], width, height);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(192, 57, 43, 0.7)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('SECTOR BRAVO — DEGRADED RF ENVELOPE', p1.x + 8, p1.y + 16);

      // 3. Draw Tactical Transit Corridors
      ctx.strokeStyle = 'rgba(79, 195, 208, 0.25)';
      ctx.lineWidth = 2;
      const cmdNode = entityList.find((e) => e.type === 'COMMAND_NODE');
      const teamAlpha = entityList.find((e) => e.id === 'team-alpha');
      const relay1 = entityList.find((e) => e.id === 'node-relay-1');
      const relay2 = entityList.find((e) => e.id === 'node-relay-2');

      if (cmdNode && relay1 && teamAlpha) {
        const c1 = getCanvasCoords(cmdNode.coordinates, width, height);
        const c2 = getCanvasCoords(relay1.coordinates, width, height);
        const c3 = getCanvasCoords(teamAlpha.coordinates, width, height);

        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.stroke();
      }

      // 4. Draw Active Communication Links & Packet Particle Flow
      const now = performance.now();
      if (cmdNode) {
        const from = getCanvasCoords(cmdNode.coordinates, width, height);

        entityList.forEach((target) => {
          if (target.id === cmdNode.id) return;
          const to = getCanvasCoords(target.coordinates, width, height);

          const ch = channels[target.activeChannelId] || channels['ch-primary'];
          const isOffline = ch ? ch.availability < 0.2 : false;
          const isDegraded = ch ? ch.channelQuality < 0.65 : false;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);

          if (isOffline) {
            ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (isDegraded) {
            ctx.strokeStyle = 'rgba(212, 134, 10, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Slower, intermittent packet particles
            const speed = 0.0003;
            const progress = (now * speed) % 1;
            if (progress < 0.8) {
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              ctx.fillStyle = '#d4860a';
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Healthy link
            ctx.strokeStyle = 'rgba(79, 195, 208, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Smooth high-speed packet flow
            const speed = 0.0008;
            for (let i = 0; i < 3; i++) {
              const progress = ((now * speed) + i * 0.33) % 1;
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              ctx.fillStyle = '#4fc3d0';
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }

      // 5. Draw Uncertainty Rings on Degraded Entities & Contradiction Indicators
      const hasContradiction = informationItems.some((i) => i.verification === 'CONTRADICTED');

      entityList.forEach((entity) => {
        const { x, y } = getCanvasCoords(entity.coordinates, width, height);
        const ch = channels[entity.activeChannelId];
        const isSeverelyDegraded = ch ? ch.channelQuality < 0.5 : false;

        if (isSeverelyDegraded || (hasContradiction && entity.id === 'team-alpha')) {
          const pulse = (Math.sin(now * 0.005) + 1) * 0.5; // 0 to 1
          ctx.strokeStyle = hasContradiction ? `rgba(192, 57, 43, ${0.3 + pulse * 0.4})` : `rgba(212, 134, 10, ${0.2 + pulse * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(x, y, 16 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Entity Marker
        const isHovered = hoveredEntity?.id === entity.id;
        const isSelected = (selectedEntityId || selectedEntity?.id) === entity.id;

        ctx.fillStyle = isSelected ? '#4fc3d0' : isHovered ? '#ffffff' : '#141618';
        ctx.strokeStyle = isSelected ? '#4fc3d0' : isSeverelyDegraded ? '#c0392b' : '#4fc3d0';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;

        // Shape based on type
        if (entity.type === 'COMMAND_NODE') {
          // Pentagon / Command Hub
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Pulsing inner ring
          const ringPulse = (Math.sin(now * 0.003) + 1) * 4;
          ctx.strokeStyle = 'rgba(79, 195, 208, 0.4)';
          ctx.beginPath();
          ctx.arc(x, y, 12 + ringPulse, 0, Math.PI * 2);
          ctx.stroke();
        } else if (entity.type === 'RELAY_NODE') {
          // Diamond for Relays
          ctx.beginPath();
          ctx.moveTo(x, y - 8);
          ctx.lineTo(x + 8, y);
          ctx.lineTo(x, y + 8);
          ctx.lineTo(x - 8, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (entity.type === 'FIELD_TEAM') {
          // Square for Field Teams
          ctx.fillRect(x - 6, y - 6, 12, 12);
          ctx.strokeRect(x - 6, y - 6, 12, 12);
        } else {
          // Observation Node / Circle
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = isSelected ? '#4fc3d0' : '#e8eaec';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(entity.name.split(' ')[0], x + 10, y + 3);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [entities, channels, informationItems, hoveredEntity, selectedEntity, selectedEntityId]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 600;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 400;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click on tactical entity
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = entityList.find((entity) => {
      const coords = getCanvasCoords(entity.coordinates, canvasRef.current!.width, canvasRef.current!.height);
      const dist = Math.hypot(coords.x - clickX, coords.y - clickY);
      return dist <= 16;
    });

    if (clicked) {
      setSelectedEntity(clicked);
      if (onSelectEntity) onSelectEntity(clicked);
    } else {
      setSelectedEntity(null);
      if (onSelectEntity) onSelectEntity(null);
    }
  };

  const activeDisplayEntity = selectedEntity || hoveredEntity;

  return (
    <div className="relative w-full h-full bg-[#0d0f10] border border-[#2a2d30] rounded-sm overflow-hidden flex flex-col select-none">
      {/* Tactical Canvas Header */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2 bg-[#141618]/90 backdrop-blur-sm border border-[#2a2d30] px-2.5 py-1 rounded text-[11px] font-mono text-[#8a9099]">
        <Layers className="w-3.5 h-3.5 text-[#4fc3d0]" />
        <span className="text-[#e8eaec] font-semibold">TACTICAL OPERATIONAL GRID</span>
        <span className="text-[10px] text-[#4fc3d0]">SECTOR BRAVO</span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 left-3 z-10 hidden sm:flex items-center gap-3 bg-[#141618]/85 backdrop-blur-sm border border-[#2a2d30] px-2.5 py-1 rounded text-[10px] font-mono text-[#8a9099]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4fc3d0] inline-block" />
          <span>COMMAND</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#e8eaec] inline-block border border-[#4fc3d0]" />
          <span>RELAY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#e8eaec] inline-block" />
          <span>FIELD TEAM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#c0392b] bg-[#c0392b]/30 inline-block" />
          <span>DEGRADED RF</span>
        </div>
      </div>

      {/* Selected Entity Inspector Card Overlay */}
      {activeDisplayEntity && (
        <div className="absolute top-2 right-3 z-10 bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0]/60 p-3 rounded text-xs font-mono max-w-xs shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#2a2d30] pb-1.5 mb-2">
            <span className="font-bold text-[#4fc3d0]">{activeDisplayEntity.name}</span>
            <span className="text-[10px] px-1 rounded bg-[#2a2d30] text-[#8a9099]">{activeDisplayEntity.type}</span>
          </div>
          <div className="space-y-1 text-[11px] text-[#8a9099]">
            <div className="flex justify-between">
              <span>ACTIVE CHANNEL:</span>
              <span className="text-[#e8eaec] font-semibold">{channels[activeDisplayEntity.activeChannelId]?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>CHANNEL QUALITY (Q):</span>
              <span className="text-[#4fc3d0] font-semibold">
                {Math.round((channels[activeDisplayEntity.activeChannelId]?.channelQuality || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY / LOSS:</span>
              <span className="text-[#e8eaec]">
                {channels[activeDisplayEntity.activeChannelId]?.latencyMs || 0}ms / {Math.round((channels[activeDisplayEntity.activeChannelId]?.packetLoss || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tactical Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
