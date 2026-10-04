'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { TacticalEntity } from '@/types/simulation';
import { tacticalAudio } from '@/lib/audio';
import {
  generateTopographicModel,
  getHypsometricRGB,
  TopographicModel,
  TopographicExtent,
} from '@/lib/map/topography';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Mountain,
  Layers,
} from 'lucide-react';

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
  const { scenario, entities, channels, informationItems } = useSimulationStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoveredEntity, setHoveredEntity] = useState<TacticalEntity | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<TacticalEntity | null>(null);

  // Mouse pan and zoom states (supports down to 0.3 for wide tactical zoom out)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Cartographic layer toggles (Topography off by default for clean tactical view)
  const [showTerrain, setShowTerrain] = useState<boolean>(false);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showHydroRoads, setShowHydroRoads] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTactical, setShowTactical] = useState<boolean>(true);
  const [showComms, setShowComms] = useState<boolean>(true);

  const entityList = Object.values(entities);

  // Reset zoom & pan when scenario changes so the new map fits immediately
  useEffect(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedEntity(null);
  }, [scenario?.id]);

  // Dynamically compute geographical bounds from entities in active scenario
  const getBounds = useCallback(() => {
    if (entityList.length === 0) {
      return { minLng: 77.12, maxLng: 77.34, minLat: 28.53, maxLat: 28.7 };
    }

    const lngs = entityList.map((e) => e.coordinates[0]);
    const lats = entityList.map((e) => e.coordinates[1]);

    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);

    const lngSpan = Math.max(0.06, maxLng - minLng);
    const latSpan = Math.max(0.06, maxLat - minLat);
    const paddingX = lngSpan * 0.3;
    const paddingY = latSpan * 0.3;

    return {
      minLng: minLng - paddingX,
      maxLng: maxLng + paddingX,
      minLat: minLat - paddingY,
      maxLat: maxLat + paddingY,
    };
  }, [entityList]);

  // UNIFORM ASPECT-RATIO PROJECTION (Prevents horizontal stretching)
  const getProjectionParams = useCallback((width: number, height: number) => {
    const { minLng, maxLng, minLat, maxLat } = getBounds();
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const lngSpan = Math.max(0.06, maxLng - minLng);
    const latSpan = Math.max(0.06, maxLat - minLat);

    // Latitude convergence correction: 1 degree lng = cos(midLat) * 1 degree lat
    const cosLat = Math.cos(((centerLat * Math.PI) / 180));
    const aspect = Math.max(0.3, Math.abs(cosLat));

    const xPadding = 48;
    const yPadding = 48;
    const availW = Math.max(100, width - 2 * xPadding);
    const availH = Math.max(100, height - 2 * yPadding);

    // Uniform scale so 1km X equals 1km Y
    const scale = Math.min(availW / (lngSpan * aspect), availH / latSpan);

    return {
      centerLng,
      centerLat,
      aspect,
      scale,
      baseCenterX: width / 2,
      baseCenterY: height / 2,
      minLng,
      maxLng,
      minLat,
      maxLat,
    };
  }, [getBounds]);

  // Transform [lng, lat] to canvas [x, y] with uniform aspect ratio
  const getCanvasCoords = useCallback(
    (coords: [number, number], width: number, height: number) => {
      const { centerLng, centerLat, aspect, scale, baseCenterX, baseCenterY } =
        getProjectionParams(width, height);

      const dx = (coords[0] - centerLng) * aspect * scale;
      const dy = -(coords[1] - centerLat) * scale;

      const x = baseCenterX + dx * zoomLevel + panOffset.x;
      const y = baseCenterY + dy * zoomLevel + panOffset.y;

      return { x, y };
    },
    [getProjectionParams, zoomLevel, panOffset]
  );

  // Invert canvas coords to normalized terrain coordinates [0..1]
  const getVisibleExtent = useCallback(
    (width: number, height: number): TopographicExtent => {
      const { centerLng, centerLat, aspect, scale, baseCenterX, baseCenterY, minLng, maxLng, minLat, maxLat } =
        getProjectionParams(width, height);

      const canvasToLngLat = (cx: number, cy: number) => {
        const dx = (cx - baseCenterX - panOffset.x) / (zoomLevel * scale * aspect);
        const dy = -(cy - baseCenterY - panOffset.y) / (zoomLevel * scale);
        return {
          lng: centerLng + dx,
          lat: centerLat + dy,
        };
      };

      const cTopLeft = canvasToLngLat(-60, -60);
      const cBottomRight = canvasToLngLat(width + 60, height + 60);

      const normX0 = (cTopLeft.lng - minLng) / (maxLng - minLng || 1);
      const normX1 = (cBottomRight.lng - minLng) / (maxLng - minLng || 1);
      const normY0 = 1 - (cTopLeft.lat - minLat) / (maxLat - minLat || 1);
      const normY1 = 1 - (cBottomRight.lat - minLat) / (maxLat - minLat || 1);

      return {
        minX: parseFloat(Math.min(normX0, normX1).toFixed(3)),
        maxX: parseFloat(Math.max(normX0, normX1).toFixed(3)),
        minY: parseFloat(Math.min(normY0, normY1).toFixed(3)),
        maxY: parseFloat(Math.max(normY0, normY1).toFixed(3)),
      };
    },
    [getProjectionParams, zoomLevel, panOffset]
  );

  // Transform normalized coords to canvas [x, y] with uniform aspect ratio
  const getNormCanvasCoords = useCallback(
    (nx: number, ny: number, width: number, height: number) => {
      const { minLng, maxLng, minLat, maxLat } = getBounds();
      const lng = minLng + nx * (maxLng - minLng);
      const lat = maxLat - ny * (maxLat - minLat);
      return getCanvasCoords([lng, lat], width, height);
    },
    [getBounds, getCanvasCoords]
  );

  // Generate the deterministic topographic model covering the full visible extent
  const topoModel: TopographicModel | null = useMemo(() => {
    if (!scenario) return null;
    const canvas = canvasRef.current;
    const width = canvas?.width || 800;
    const height = canvas?.height || 500;
    const bounds = getBounds();
    const extent = getVisibleExtent(width, height);

    return generateTopographicModel(scenario.id, scenario.seed || 42, bounds, extent);
  }, [scenario?.id, scenario?.seed, getBounds, getVisibleExtent]);

  // -------------------------------------------------------------
  // PRECOMPUTE / CACHE HIGH-CONTRAST TOPOGRAPHIC BASEMAP
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !topoModel) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    if (offCanvas.width !== width || offCanvas.height !== height) {
      offCanvas.width = width;
      offCanvas.height = height;
    }

    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Clean Dark Graphite Background (#0d0f10)
    ctx.fillStyle = '#0d0f10';
    ctx.fillRect(0, 0, width, height);

    // 2. High-Contrast Smooth Hypsometric Shaded Relief (via Hardware-Smoothed Texture)
    if (showTerrain) {
      const { gridWidth, gridHeight, elevations, hillshades, minElevation, maxElevation, extent } =
        topoModel;

      if (!textureCanvasRef.current) {
        textureCanvasRef.current = document.createElement('canvas');
      }
      const texCanvas = textureCanvasRef.current;
      if (texCanvas.width !== gridWidth || texCanvas.height !== gridHeight) {
        texCanvas.width = gridWidth;
        texCanvas.height = gridHeight;
      }

      const texCtx = texCanvas.getContext('2d');
      if (texCtx) {
        const imgData = texCtx.createImageData(gridWidth, gridHeight);
        const data = imgData.data;

        for (let gy = 0; gy < gridHeight; gy++) {
          for (let gx = 0; gx < gridWidth; gx++) {
            const idx = (gy * gridWidth + gx) * 4;
            const elev = elevations[gy * gridWidth + gx];
            const shade = hillshades[gy * gridWidth + gx];

            const [baseR, baseG, baseB] = getHypsometricRGB(elev, minElevation, maxElevation);

            let r = baseR;
            let g = baseG;
            let b = baseB;

            // Crisp analytical hillshading modulation
            if (shade < 0.48) {
              const shadowFactor = 0.55 + shade * 0.9;
              r = Math.round(r * shadowFactor);
              g = Math.round(g * shadowFactor);
              b = Math.round(b * shadowFactor);
            } else if (shade > 0.54) {
              const highlight = (shade - 0.54) * 1.8;
              r = Math.min(255, Math.round(r + highlight * 45));
              g = Math.min(255, Math.round(g + highlight * 65));
              b = Math.min(255, Math.round(b + highlight * 75)); // Crisp tactical cyan infusion
            }

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }

        texCtx.putImageData(imgData, 0, 0);

        // Blit with smooth hardware bilinear filtering over visible extent
        const pTopLeft = getNormCanvasCoords(extent.minX, extent.minY, width, height);
        const pBottomRight = getNormCanvasCoords(extent.maxX, extent.maxY, width, height);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          texCanvas,
          pTopLeft.x,
          pTopLeft.y,
          pBottomRight.x - pTopLeft.x,
          pBottomRight.y - pTopLeft.y
        );
      }
    }

    // 3. Clean Hydrography (Water Bodies & Meandering Rivers)
    if (showHydroRoads) {
      topoModel.waterBodies.forEach((wb) => {
        if (wb.path.length < 2) return;

        if (wb.fill) {
          // Deep naval midnight blue
          ctx.fillStyle = '#0e1822';
          ctx.strokeStyle = 'rgba(79, 195, 208, 0.7)'; // High-contrast glowing shoreline
          ctx.lineWidth = 1.6;

          ctx.beginPath();
          wb.path.forEach((pt, idx) => {
            const cp = getNormCanvasCoords(pt.x, pt.y, width, height);
            if (idx === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Clean shoreline depth ripple
          ctx.strokeStyle = 'rgba(79, 195, 208, 0.2)';
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Smooth river channel
          ctx.strokeStyle = '#12202c'; // Dark riverbed casing
          ctx.lineWidth = Math.max(2.5, 4 * zoomLevel);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          wb.path.forEach((pt, idx) => {
            const cp = getNormCanvasCoords(pt.x, pt.y, width, height);
            if (idx === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
          });
          ctx.stroke();

          // Inner water channel
          ctx.strokeStyle = '#274b62';
          ctx.lineWidth = Math.max(1.2, 2 * zoomLevel);
          ctx.stroke();
        }
      });

      // Clean Tactical Roads & Corridors
      topoModel.roads.forEach((road) => {
        if (road.path.length < 2) return;

        if (road.type === 'PRIMARY') {
          // High-contrast primary highway
          ctx.strokeStyle = 'rgba(10, 14, 12, 0.95)';
          ctx.lineWidth = Math.max(3, 4.5 * zoomLevel);
          ctx.lineCap = 'round';
          ctx.beginPath();
          road.path.forEach((pt, idx) => {
            const cp = getNormCanvasCoords(pt.x, pt.y, width, height);
            if (idx === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
          });
          ctx.stroke();

          // Crisp road surface
          ctx.strokeStyle = 'rgba(230, 238, 242, 0.85)';
          ctx.lineWidth = Math.max(1.5, 2.5 * zoomLevel);
          ctx.stroke();
        } else {
          // Secondary bypass track
          ctx.strokeStyle = 'rgba(175, 190, 180, 0.45)';
          ctx.lineWidth = Math.max(1, 1.8 * zoomLevel);
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          road.path.forEach((pt, idx) => {
            const cp = getNormCanvasCoords(pt.x, pt.y, width, height);
            if (idx === 0) ctx.moveTo(cp.x, cp.y);
            else ctx.lineTo(cp.x, cp.y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // 4. Clean, High-Contrast Contour Isolines
    if (showContours) {
      topoModel.contours.forEach((contour) => {
        ctx.strokeStyle = contour.isMajor
          ? 'rgba(79, 195, 208, 0.75)' // Major index contour (tactical cyan)
          : 'rgba(160, 185, 175, 0.30)'; // Minor contour (crisp thin slate)
        ctx.lineWidth = contour.isMajor ? Math.max(1.2, 1.5 * Math.min(1.2, zoomLevel)) : 0.8;

        ctx.beginPath();
        contour.segments.forEach(([p1, p2]) => {
          const cp1 = getNormCanvasCoords(p1.x, p1.y, width, height);
          const cp2 = getNormCanvasCoords(p2.x, p2.y, width, height);
          ctx.moveTo(cp1.x, cp1.y);
          ctx.lineTo(cp2.x, cp2.y);
        });
        ctx.stroke();

        // Clean elevation callout stamps with dark pill backing
        if (contour.isMajor && contour.segments.length > 8 && zoomLevel >= 0.65) {
          const midSeg = contour.segments[Math.floor(contour.segments.length / 2)];
          const labelPt = getNormCanvasCoords(midSeg[0].x, midSeg[0].y, width, height);

          if (labelPt.x > 35 && labelPt.x < width - 45 && labelPt.y > 35 && labelPt.y < height - 35) {
            const text = `${contour.elevation}`;
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            const tw = ctx.measureText(text).width;

            ctx.fillStyle = 'rgba(10, 14, 12, 0.9)';
            ctx.fillRect(labelPt.x - 3, labelPt.y - 8, tw + 6, 11);

            ctx.fillStyle = '#4fc3d0';
            ctx.fillText(text, labelPt.x, labelPt.y);
          }
        }
      });
    }

    // 5. Prominent Spot Heights & Peak Markers
    if (showTerrain && zoomLevel >= 0.55) {
      topoModel.spotHeights.forEach((sh) => {
        const cp = getNormCanvasCoords(sh.x, sh.y, width, height);

        if (cp.x > 25 && cp.x < width - 45 && cp.y > 25 && cp.y < height - 25) {
          ctx.fillStyle = '#d4860a';
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y - 5 * zoomLevel);
          ctx.lineTo(cp.x + 4 * zoomLevel, cp.y + 3 * zoomLevel);
          ctx.lineTo(cp.x - 4 * zoomLevel, cp.y + 3 * zoomLevel);
          ctx.closePath();
          ctx.fill();

          const txt = `▲ ${sh.elevation}m`;
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          const tw = ctx.measureText(txt).width;

          ctx.fillStyle = 'rgba(10, 14, 12, 0.85)';
          ctx.fillRect(cp.x + 5 * zoomLevel, cp.y - 7, tw + 4, 11);

          ctx.fillStyle = '#e8eaec';
          ctx.fillText(txt, cp.x + 7 * zoomLevel, cp.y + 2);

          ctx.fillStyle = '#8a9099';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(sh.name, cp.x + 7 * zoomLevel, cp.y + 13);
        }
      });
    }

    // 6. Clean Subtle Military MGRS Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(79, 195, 208, 0.06)';
      ctx.lineWidth = 0.8;
      const gridSize = Math.max(36, Math.round(52 * zoomLevel));
      const offsetX = panOffset.x % gridSize;
      const offsetY = panOffset.y % gridSize;

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = 'rgba(138, 144, 153, 0.45)';
        ctx.font = '8px JetBrains Mono, monospace';
        if (x > 40 && x < width - 40) {
          ctx.fillText(`${Math.round(x)}E`, x + 3, 11);
        }
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(138, 144, 153, 0.45)';
        ctx.font = '8px JetBrains Mono, monospace';
        if (y > 30 && y < height - 30) {
          ctx.fillText(`${Math.round(y)}N`, 3, y - 2);
        }
      }
    }
  }, [
    topoModel,
    zoomLevel,
    panOffset,
    showTerrain,
    showContours,
    showHydroRoads,
    showGrid,
    getNormCanvasCoords,
  ]);

  // -------------------------------------------------------------
  // MAIN ANIMATION LOOP (60 FPS CLEAN TACTICAL COMPOSITING)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = performance.now();

      ctx.clearRect(0, 0, width, height);

      // Blit cached high-contrast topographic basemap
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      } else {
        ctx.fillStyle = '#0d0f10';
        ctx.fillRect(0, 0, width, height);
      }

      const cmdNode = entityList.find((e) => e.type === 'COMMAND_NODE') || entityList[0];

      // 1. Tactical Overlays (Radar sweep & concentric range rings)
      if (showTactical && cmdNode) {
        const cmdCenter = getCanvasCoords(cmdNode.coordinates, width, height);
        const sweepAngle = (now * 0.0009) % (Math.PI * 2);
        const sweepRadius = Math.max(width, height) * 0.8 * zoomLevel;

        const sweepGradient = ctx.createRadialGradient(
          cmdCenter.x,
          cmdCenter.y,
          0,
          cmdCenter.x,
          cmdCenter.y,
          sweepRadius
        );
        sweepGradient.addColorStop(0, 'rgba(79, 195, 208, 0.08)');
        sweepGradient.addColorStop(0.5, 'rgba(79, 195, 208, 0.025)');
        sweepGradient.addColorStop(1, 'rgba(79, 195, 208, 0.0)');

        ctx.fillStyle = sweepGradient;
        ctx.beginPath();
        ctx.moveTo(cmdCenter.x, cmdCenter.y);
        ctx.arc(cmdCenter.x, cmdCenter.y, sweepRadius, sweepAngle - 0.4, sweepAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(79, 195, 208, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cmdCenter.x, cmdCenter.y);
        ctx.lineTo(
          cmdCenter.x + Math.cos(sweepAngle) * sweepRadius,
          cmdCenter.y + Math.sin(sweepAngle) * sweepRadius
        );
        ctx.stroke();

        // Concentric Tactical Range Rings
        [75, 150, 225].forEach((r) => {
          const scaledR = r * zoomLevel;
          ctx.strokeStyle = 'rgba(79, 195, 208, 0.1)';
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(cmdCenter.x, cmdCenter.y, scaledR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 2. Degraded Environmental RF Envelope
      if (showComms && entityList.length >= 2) {
        const forwardUnits = entityList.filter(
          (e) => e.type === 'FIELD_TEAM' || e.type === 'RELAY_NODE'
        );
        if (forwardUnits.length > 0) {
          const target = forwardUnits[0];
          const center = getCanvasCoords(target.coordinates, width, height);
          const r = 70 * zoomLevel;

          ctx.fillStyle = 'rgba(192, 57, 43, 0.10)';
          ctx.strokeStyle = 'rgba(192, 57, 43, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(235, 95, 85, 0.95)';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.fillText(
            `DEGRADED RF ZONE // ${scenario?.environment?.type || 'ACTIVE INTERFERENCE'}`,
            center.x - r + 8,
            center.y - r - 6
          );
        }
      }

      // 3. Active Communication Links & Flowing Packet Particles
      if (showComms && cmdNode) {
        const from = getCanvasCoords(cmdNode.coordinates, width, height);

        entityList.forEach((target) => {
          if (target.id === cmdNode.id) return;
          const to = getCanvasCoords(target.coordinates, width, height);

          const ch =
            channels[target.activeChannelId] ||
            channels['ch-primary'] ||
            Object.values(channels)[0];
          const isOffline = ch ? ch.availability < 0.2 : false;
          const isDegraded = ch ? ch.channelQuality < 0.65 : false;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);

          if (isOffline) {
            ctx.strokeStyle = 'rgba(192, 57, 43, 0.75)';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (isDegraded) {
            ctx.strokeStyle = 'rgba(212, 134, 10, 0.7)';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            const speed = 0.00035;
            const progress = (now * speed) % 1;
            if (progress < 0.8) {
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              ctx.fillStyle = '#d4860a';
              ctx.beginPath();
              ctx.arc(px, py, 3.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.strokeStyle = 'rgba(79, 195, 208, 0.6)';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            const speed = 0.00085;
            for (let i = 0; i < 3; i++) {
              const progress = (now * speed + i * 0.33) % 1;
              const px = from.x + (to.x - from.x) * progress;
              const py = from.y + (to.y - from.y) * progress;
              ctx.fillStyle = '#4fc3d0';
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }

      // 4. Tactical Entities & Contradiction Alerts (High Contrast Halo Backings)
      if (showTactical) {
        const hasContradiction = informationItems.some(
          (i) => i.verification === 'CONTRADICTED'
        );

        entityList.forEach((entity) => {
          const { x, y } = getCanvasCoords(entity.coordinates, width, height);
          const ch = channels[entity.activeChannelId];
          const isSeverelyDegraded = ch ? ch.channelQuality < 0.5 : false;

          // Contradiction alert reticle
          if (
            hasContradiction &&
            (entity.type === 'FIELD_TEAM' || entity.type === 'RELAY_NODE')
          ) {
            const pulse = (Math.sin(now * 0.006) + 1) * 0.5;
            ctx.strokeStyle = `rgba(192, 57, 43, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, (18 + pulse * 6) * zoomLevel, 0, Math.PI * 2);
            ctx.stroke();

            const rLen = 22 * zoomLevel;
            ctx.beginPath();
            ctx.moveTo(x - rLen, y);
            ctx.lineTo(x + rLen, y);
            ctx.moveTo(x, y - rLen);
            ctx.lineTo(x, y + rLen);
            ctx.stroke();
          } else if (isSeverelyDegraded) {
            const pulse = (Math.sin(now * 0.004) + 1) * 0.5;
            ctx.strokeStyle = `rgba(212, 134, 10, ${0.4 + pulse * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, (16 + pulse * 4) * zoomLevel, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Entity Symbol & High-Contrast Halo
          const isHovered = hoveredEntity?.id === entity.id;
          const isSelected = (selectedEntityId || selectedEntity?.id) === entity.id;

          ctx.fillStyle = '#0d0f10';
          ctx.beginPath();
          ctx.arc(x, y, (entity.type === 'COMMAND_NODE' ? 12 : 10) * zoomLevel, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isSelected ? '#4fc3d0' : isHovered ? '#ffffff' : '#141618';
          ctx.strokeStyle = isSelected
            ? '#4fc3d0'
            : isSeverelyDegraded
            ? '#c0392b'
            : '#4fc3d0';
          ctx.lineWidth = isSelected ? 2.5 : 1.8;

          if (entity.type === 'COMMAND_NODE') {
            ctx.beginPath();
            ctx.arc(x, y, 10 * zoomLevel, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const ring = (Math.sin(now * 0.003) + 1) * 4;
            ctx.strokeStyle = 'rgba(79, 195, 208, 0.6)';
            ctx.beginPath();
            ctx.arc(x, y, (14 + ring) * zoomLevel, 0, Math.PI * 2);
            ctx.stroke();
          } else if (entity.type === 'RELAY_NODE') {
            const s = 9 * zoomLevel;
            ctx.beginPath();
            ctx.moveTo(x, y - s);
            ctx.lineTo(x + s, y);
            ctx.lineTo(x, y + s);
            ctx.lineTo(x - s, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (entity.type === 'FIELD_TEAM') {
            const s = 7 * zoomLevel;
            ctx.fillRect(x - s, y - s, s * 2, s * 2);
            ctx.strokeRect(x - s, y - s, s * 2, s * 2);
          } else {
            ctx.beginPath();
            ctx.arc(x, y, 7 * zoomLevel, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Clean unit name label with pill backing
          const unitName = entity.name.split(' ')[0];
          ctx.font = `bold ${Math.max(
            9,
            Math.round(10 * Math.min(1.2, zoomLevel))
          )}px JetBrains Mono, monospace`;
          const tw = ctx.measureText(unitName).width;

          ctx.fillStyle = 'rgba(10, 14, 12, 0.9)';
          ctx.fillRect(x + 12 * zoomLevel - 2, y - 7, tw + 4, 12);

          ctx.fillStyle = isSelected ? '#4fc3d0' : '#e8eaec';
          ctx.fillText(unitName, x + 12 * zoomLevel, y + 3);
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    entityList,
    channels,
    informationItems,
    hoveredEntity,
    selectedEntity,
    selectedEntityId,
    zoomLevel,
    panOffset,
    showTactical,
    showComms,
    getCanvasCoords,
    scenario,
  ]);

  // Handle Canvas Resize with ResizeObserver for robust layout tracking across reloads
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const p = canvasRef.current.parentElement;
        const w = p.clientWidth || 600;
        const h = p.clientHeight || 400;
        if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };

    updateSize();
    // Extra timeout ensures size updates after CSS flex/grid layout settles
    const timer = setTimeout(updateSize, 50);

    window.addEventListener('resize', updateSize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvasRef.current?.parentElement) {
      observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(canvasRef.current.parentElement);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, []);

  // Mouse Drag / Pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      hasMovedRef.current = true;
      const newOffsetX = e.clientX - dragStartRef.current.x;
      const newOffsetY = e.clientY - dragStartRef.current.y;
      setPanOffset({ x: newOffsetX, y: newOffsetY });
      return;
    }

    const hovered = entityList.find((entity) => {
      const coords = getCanvasCoords(
        entity.coordinates,
        canvasRef.current!.width,
        canvasRef.current!.height
      );
      const dist = Math.hypot(coords.x - mouseX, coords.y - mouseY);
      return dist <= 18 * zoomLevel;
    });

    setHoveredEntity(hovered || null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    setIsDragging(false);

    if (!hasMovedRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clicked = entityList.find((entity) => {
        const coords = getCanvasCoords(
          entity.coordinates,
          canvasRef.current!.width,
          canvasRef.current!.height
        );
        const dist = Math.hypot(coords.x - clickX, coords.y - clickY);
        return dist <= 22 * zoomLevel;
      });

      if (clicked) {
        tacticalAudio.playClick();
        setSelectedEntity(clicked);
        if (onSelectEntity) onSelectEntity(clicked);
      } else {
        setSelectedEntity(null);
        if (onSelectEntity) onSelectEntity(null);
      }
    }
  };

  // Mouse Wheel Smooth Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    setZoomLevel((prev) =>
      Math.max(0.3, Math.min(3.5, parseFloat((prev + zoomDelta).toFixed(2))))
    );
  };

  const resetView = () => {
    tacticalAudio.playClick();
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedEntity(null);
  };

  const activeDisplayEntity = selectedEntity || hoveredEntity;

  return (
    <div className="relative w-full h-full bg-[#0d0f10] border border-[#2a2d30] rounded-sm overflow-hidden flex flex-col select-none group">
      {/* CLEAN NON-OVERLAPPING TOP TOOLBAR */}
      <div className="bg-[#141618] border-b border-[#2a2d30] px-3 py-1.5 flex items-center justify-between gap-2 z-10 text-[11px] font-mono">
        {/* Left: Location Name & Elevation (Always fully visible, never covered!) */}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <Mountain className="w-4 h-4 text-[#4fc3d0] shrink-0" />
          <span className="text-[#e8eaec] font-bold truncate">
            {scenario?.title || 'TACTICAL MAP'}
          </span>
          {topoModel && (
            <span className="text-[10px] text-[#d4860a] border-l border-[#2a2d30] pl-2 hidden sm:inline shrink-0">
              ELEV: {Math.round(topoModel.minElevation)}m – {Math.round(topoModel.maxElevation)}m
            </span>
          )}
        </div>

        {/* Right: Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Compact Layer Toggles */}
          <div className="hidden md:flex items-center gap-1 bg-[#1c1f21] border border-[#2a2d30] px-1.5 py-0.5 rounded text-[10px]">
            <button
              onClick={() => setShowTerrain(!showTerrain)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                showTerrain ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] font-bold' : 'text-[#8a9099]'
              }`}
              title="Toggle Terrain Shading"
            >
              TOPO
            </button>
            <button
              onClick={() => setShowContours(!showContours)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                showContours ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] font-bold' : 'text-[#8a9099]'
              }`}
              title="Toggle Contours"
            >
              CONTOURS
            </button>
            <button
              onClick={() => setShowComms(!showComms)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                showComms ? 'bg-[#4fc3d0]/20 text-[#4fc3d0] font-bold' : 'text-[#8a9099]'
              }`}
              title="Toggle Comms & RF"
            >
              COMMS
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 bg-[#1c1f21] border border-[#2a2d30] p-0.5 rounded">
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setZoomLevel((z) => Math.min(3.5, parseFloat((z + 0.25).toFixed(2))));
              }}
              className="p-1 rounded text-[#8a9099] hover:text-[#4fc3d0] hover:bg-[#2a2d30]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                tacticalAudio.playClick();
                setZoomLevel((z) => Math.max(0.3, parseFloat((z - 0.25).toFixed(2))));
              }}
              className="p-1 rounded text-[#8a9099] hover:text-[#4fc3d0] hover:bg-[#2a2d30]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded text-[#8a9099] hover:text-[#4fc3d0] hover:bg-[#2a2d30]"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] text-[#4fc3d0] font-bold px-1.5 hidden sm:inline">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Drag & Zoom Helper Hint */}
      <div className="absolute bottom-2 right-3 z-10 hidden md:flex items-center gap-1.5 text-[9px] text-[#8a9099] bg-[#141618]/85 backdrop-blur-sm border border-[#2a2d30] px-2 py-0.5 rounded">
        <Move className="w-3 h-3 text-[#4fc3d0]" />
        <span>CLICK & DRAG TO PAN &bull; WHEEL TO ZOOM</span>
      </div>

      {/* Entity Inspector Card Flyout */}
      {activeDisplayEntity && (
        <div className="absolute bottom-10 right-3 z-10 bg-[#141618]/95 backdrop-blur-md border border-[#4fc3d0]/60 p-3 rounded text-xs font-mono max-w-xs shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#2a2d30] pb-1.5 mb-2">
            <span className="font-bold text-[#4fc3d0]">{activeDisplayEntity.name}</span>
            <span className="text-[9px] px-1 rounded bg-[#2a2d30] text-[#8a9099]">
              {activeDisplayEntity.type}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-[#8a9099]">
            <div className="flex justify-between">
              <span>ACTIVE CHANNEL:</span>
              <span className="text-[#e8eaec] font-semibold">
                {channels[activeDisplayEntity.activeChannelId]?.name || 'Carrier Link'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CHANNEL QUALITY (Q):</span>
              <span className="text-[#4fc3d0] font-semibold">
                {Math.round(
                  (channels[activeDisplayEntity.activeChannelId]?.channelQuality || 0) * 100
                )}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY / LOSS:</span>
              <span className="text-[#e8eaec]">
                {channels[activeDisplayEntity.activeChannelId]?.latencyMs || 0}ms /{' '}
                {Math.round(
                  (channels[activeDisplayEntity.activeChannelId]?.packetLoss || 0) * 100
                )}
                %
              </span>
            </div>
            <div className="flex justify-between border-t border-[#2a2d30] pt-1 text-[10px]">
              <span>COORDINATES:</span>
              <span className="text-[#8a9099] font-mono">
                {activeDisplayEntity.coordinates[1].toFixed(4)}°N,{' '}
                {activeDisplayEntity.coordinates[0].toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Topographic Military Map Legend */}
      <div className="absolute bottom-2 left-3 z-10 hidden sm:flex items-center gap-3 bg-[#141618]/90 backdrop-blur-md border border-[#2a2d30] px-2.5 py-1 rounded text-[10px] font-mono text-[#8a9099]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4fc3d0] inline-block" />
          <span>CMD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#e8eaec] inline-block border border-[#4fc3d0]" />
          <span>RELAY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#e8eaec] inline-block" />
          <span>TEAM</span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-[#2a2d30] pl-2">
          <span className="w-4 h-0.5 bg-[#4fc3d0] inline-block opacity-85" />
          <span>INDEX (100m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-[#274b62] inline-block" />
          <span>RIVER</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#c0392b] bg-[#c0392b]/30 inline-block" />
          <span>DEGRADED RF</span>
        </div>
      </div>

      {/* Interactive Main Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
          onWheel={handleWheel}
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        />
      </div>
    </div>
  );
};
