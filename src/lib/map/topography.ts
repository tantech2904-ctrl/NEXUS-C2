/**
 * NEXUS-C2 — High-Contrast Offline Topographic Cartography Engine
 * 
 * Provides deterministic multi-elevation hypsometric relief, analytical hillshading,
 * clean contour isoline generation (50m minor / 100m major index contours),
 * smooth hydrography, tactical transit routes, and military grid references.
 * 
 * Calibrated specifically for high contrast, clean presentation, and seamless integration
 * with the NEXUS-C2 dark graphite (#0d0f10 / #141618) command center aesthetic.
 */

export interface TopographicPoint {
  x: number;
  y: number;
}

export interface ContourLine {
  elevation: number;
  isMajor: boolean;
  segments: TopographicPoint[][];
}

export interface WaterBody {
  type: 'COAST' | 'LAKE' | 'RIVER';
  name?: string;
  path: TopographicPoint[];
  fill?: boolean;
}

export interface RoadFeature {
  type: 'PRIMARY' | 'TRACK';
  name?: string;
  path: TopographicPoint[];
}

export interface SpotHeight {
  elevation: number;
  name: string;
  x: number;
  y: number;
}

export interface TopographicExtent {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TopographicModel {
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number };
  extent: TopographicExtent;
  gridWidth: number;
  gridHeight: number;
  elevations: Float32Array;
  hillshades: Float32Array;
  contours: ContourLine[];
  waterBodies: WaterBody[];
  roads: RoadFeature[];
  spotHeights: SpotHeight[];
  minElevation: number;
  maxElevation: number;
}

// Deterministic Pseudo-Random Number Generator based on scenario seed
class SeededRNG {
  private s: number;
  constructor(seed: number) {
    this.s = Math.sin(seed + 1) * 10000;
  }
  next(): number {
    this.s = (this.s * 9301 + 49297) % 233280;
    return this.s / 233280;
  }
}

/**
 * Coherent 2D multi-octave terrain synthesizer with smooth broad harmonics
 */
function evaluateNoise(x: number, y: number, seed: number): number {
  const s = seed * 0.137;
  let val = 0;
  let amp = 1.0;
  let freq = 0.85; // Lower frequency for broad, sweeping ridgelines
  let maxAmp = 0;

  for (let o = 0; o < 3; o++) {
    const nx = (x + s) * freq * Math.PI * 2;
    const ny = (y + s * 1.4) * freq * Math.PI * 2;
    val += (Math.sin(nx) * Math.cos(ny) + Math.cos(nx * 0.8 - ny * 1.2) * 0.6) * amp;
    maxAmp += amp * 1.6;
    amp *= 0.45;
    freq *= 2.1;
  }

  return (val / maxAmp + 1) * 0.5; // Normalized to 0..1
}

/**
 * Generate a clean, high-contrast deterministic topographic model
 */
export function generateTopographicModel(
  scenarioId: string,
  seed: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  extent: TopographicExtent = { minX: 0, maxX: 1, minY: 0, maxY: 1 },
  gridWidth = 96,
  gridHeight = 72
): TopographicModel {
  const rng = new SeededRNG(seed + 1047);
  const elevations = new Float32Array(gridWidth * gridHeight);
  const hillshades = new Float32Array(gridWidth * gridHeight);

  const isCoastWest = scenarioId.includes('03') || scenarioId.includes('01');
  const isCoastEast = scenarioId.includes('04');
  const isFaultValley = scenarioId.includes('02') || scenarioId.includes('05');

  let minElevation = Infinity;
  let maxElevation = -Infinity;

  const spanX = extent.maxX - extent.minX;
  const spanY = extent.maxY - extent.minY;

  // 1. Synthesize Smooth Elevation Field
  for (let gy = 0; gy < gridHeight; gy++) {
    const ny = extent.minY + (gy / (gridHeight - 1)) * spanY;
    for (let gx = 0; gx < gridWidth; gx++) {
      const nx = extent.minX + (gx / (gridWidth - 1)) * spanX;

      const rawNoise = evaluateNoise(nx * 1.5, ny * 1.5, seed);

      let macro = 0;
      if (isCoastWest) {
        macro = Math.pow(Math.max(0, nx + 0.25), 1.35) * 0.8 - Math.max(0, 0.26 - nx) * 1.25;
      } else if (isCoastEast) {
        macro = Math.pow(Math.max(0, 1.2 - nx), 1.2) * 0.55 - Math.max(0, nx - 0.72) * 0.85;
      } else if (isFaultValley) {
        const distFromCenter = Math.abs(nx - 0.52) * 2;
        macro = Math.pow(distFromCenter, 1.45) * 0.7;
      } else {
        const diag = (nx + ny) * 0.5;
        macro = Math.sin(diag * Math.PI) * 0.4 + (nx > 0.65 ? 0.35 : 0);
      }

      let elev = (rawNoise * 0.5 + macro * 0.5) * 620 + 30;
      if (elev < 8) elev = 0; // Sea/water level cutoff

      elevations[gy * gridWidth + gx] = elev;
      if (elev < minElevation) minElevation = elev;
      if (elev > maxElevation) maxElevation = elev;
    }
  }

  // 2. High-Contrast Analytical Hillshading (315° NW illumination)
  const sunAzimuth = (315 * Math.PI) / 180;
  const sunAltitude = (45 * Math.PI) / 180;
  const cosSunZenith = Math.cos(Math.PI / 2 - sunAltitude);
  const sinSunZenith = Math.sin(Math.PI / 2 - sunAltitude);

  for (let gy = 1; gy < gridHeight - 1; gy++) {
    for (let gx = 1; gx < gridWidth - 1; gx++) {
      const dz_dx =
        (elevations[gy * gridWidth + (gx + 1)] - elevations[gy * gridWidth + (gx - 1)]) / 2.0;
      const dz_dy =
        (elevations[(gy + 1) * gridWidth + gx] - elevations[(gy - 1) * gridWidth + gx]) / 2.0;

      const slope = Math.atan(Math.hypot(dz_dx, dz_dy) * 0.045);
      let aspect = Math.atan2(dz_dy, -dz_dx);
      if (aspect < 0) aspect += Math.PI * 2;

      let shade =
        cosSunZenith * Math.cos(slope) +
        sinSunZenith * Math.sin(slope) * Math.cos(sunAzimuth - aspect);

      shade = Math.max(0.0, Math.min(1.0, shade));
      hillshades[gy * gridWidth + gx] = shade;
    }
  }

  // 3. Marching Squares Clean Contour Isolines (50m minor, 100m major index)
  const contours: ContourLine[] = [];
  const contourInterval = 50; // Clean 50m interval eliminates visual clutter
  const startElevation = Math.ceil(Math.max(50, minElevation) / contourInterval) * contourInterval;
  const endElevation = Math.floor(maxElevation / contourInterval) * contourInterval;

  for (let h = startElevation; h <= endElevation; h += contourInterval) {
    const isMajor = h % 100 === 0;
    const segments: TopographicPoint[][] = [];

    for (let gy = 0; gy < gridHeight - 1; gy++) {
      for (let gx = 0; gx < gridWidth - 1; gx++) {
        const v0 = elevations[gy * gridWidth + gx];
        const v1 = elevations[gy * gridWidth + (gx + 1)];
        const v2 = elevations[(gy + 1) * gridWidth + (gx + 1)];
        const v3 = elevations[(gy + 1) * gridWidth + gx];

        let idx = 0;
        if (v0 >= h) idx |= 1;
        if (v1 >= h) idx |= 2;
        if (v2 >= h) idx |= 4;
        if (v3 >= h) idx |= 8;

        if (idx === 0 || idx === 15) continue;

        const x0 = extent.minX + (gx / (gridWidth - 1)) * spanX;
        const x1 = extent.minX + ((gx + 1) / (gridWidth - 1)) * spanX;
        const y0 = extent.minY + (gy / (gridHeight - 1)) * spanY;
        const y1 = extent.minY + ((gy + 1) / (gridHeight - 1)) * spanY;

        const top = { x: x0 + ((h - v0) / (v1 - v0 || 1e-4)) * (x1 - x0), y: y0 };
        const right = { x: x1, y: y0 + ((h - v1) / (v2 - v1 || 1e-4)) * (y1 - y0) };
        const bottom = { x: x0 + ((h - v3) / (v2 - v3 || 1e-4)) * (x1 - x0), y: y1 };
        const left = { x: x0, y: y0 + ((h - v0) / (v3 - v0 || 1e-4)) * (y1 - y0) };

        switch (idx) {
          case 1:
          case 14:
            segments.push([left, top]);
            break;
          case 2:
          case 13:
            segments.push([top, right]);
            break;
          case 3:
          case 12:
            segments.push([left, right]);
            break;
          case 4:
          case 11:
            segments.push([right, bottom]);
            break;
          case 5:
            segments.push([left, top]);
            segments.push([right, bottom]);
            break;
          case 6:
          case 9:
            segments.push([top, bottom]);
            break;
          case 7:
          case 8:
            segments.push([left, bottom]);
            break;
          case 10:
            segments.push([top, right]);
            segments.push([left, bottom]);
            break;
        }
      }
    }

    if (segments.length > 0) {
      contours.push({ elevation: h, isMajor, segments });
    }
  }

  // 4. Clean Hydrography
  const waterBodies: WaterBody[] = [];

  if (isCoastWest) {
    waterBodies.push({
      type: 'COAST',
      name: 'PACIFIC MARITIME SECTOR',
      fill: true,
      path: [
        { x: extent.minX, y: extent.minY },
        { x: 0.22, y: extent.minY },
        { x: 0.25, y: extent.minY + spanY * 0.35 },
        { x: 0.19, y: extent.minY + spanY * 0.7 },
        { x: 0.26, y: extent.maxY },
        { x: extent.minX, y: extent.maxY },
      ],
    });
  } else if (isCoastEast) {
    waterBodies.push({
      type: 'COAST',
      name: 'BAY OF BENGAL ESTUARY',
      fill: true,
      path: [
        { x: 0.78, y: extent.minY },
        { x: extent.maxX, y: extent.minY },
        { x: extent.maxX, y: extent.maxY },
        { x: 0.72, y: extent.maxY },
        { x: 0.75, y: extent.minY + spanY * 0.65 },
        { x: 0.81, y: extent.minY + spanY * 0.3 },
      ],
    });
  }

  // Smooth River Network
  const riverPoints: TopographicPoint[] = [];
  const startX = isCoastEast ? extent.minX + 0.05 : 0.45;
  const endX = isCoastWest ? 0.22 : isCoastEast ? 0.76 : extent.maxX - 0.1;
  const steps = 18;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rx = startX + (endX - startX) * t;
    const ry =
      extent.minY +
      spanY * (0.05 + t * 0.9) +
      Math.sin(t * Math.PI * 3.8 + seed) * (spanX * 0.035);
    riverPoints.push({ x: rx, y: ry });
  }

  waterBodies.push({
    type: 'RIVER',
    name: 'TACTICAL WATERWAY',
    fill: false,
    path: riverPoints,
  });

  // 5. Clean Tactical Transit Corridors
  const roads: RoadFeature[] = [
    {
      type: 'PRIMARY',
      name: 'TACTICAL ROUTE 1',
      path: [
        { x: extent.minX, y: extent.minY + spanY * 0.82 },
        { x: 0.32, y: 0.68 },
        { x: 0.50, y: 0.48 },
        { x: 0.68, y: 0.32 },
        { x: extent.maxX, y: extent.minY + spanY * 0.18 },
      ],
    },
    {
      type: 'TRACK',
      name: 'VALLEY BYPASS',
      path: [
        { x: 0.25, y: extent.minY },
        { x: 0.42, y: 0.38 },
        { x: 0.58, y: 0.62 },
        { x: 0.80, y: extent.maxY },
      ],
    },
  ];

  // 6. Prominent High-Contrast Spot Heights
  const spotHeights: SpotHeight[] = [
    {
      elevation: Math.round(maxElevation * 0.92),
      name: `RIDGE ${Math.round(maxElevation * 0.92)}`,
      x: isCoastWest ? 0.76 : 0.24,
      y: 0.26,
    },
    {
      elevation: Math.round(maxElevation * 0.78),
      name: `HILL ${Math.round(maxElevation * 0.78)}`,
      x: 0.64,
      y: 0.74,
    },
  ];

  if (spanX > 1.4) {
    spotHeights.push({
      elevation: Math.round(maxElevation * 0.85),
      name: `NORTH RIDGE ${Math.round(maxElevation * 0.85)}`,
      x: isCoastWest ? 0.85 : 0.15,
      y: extent.minY + spanY * 0.14,
    });
  }

  return {
    bounds,
    extent,
    gridWidth,
    gridHeight,
    elevations,
    hillshades,
    contours,
    waterBodies,
    roads,
    spotHeights,
    minElevation,
    maxElevation,
  };
}

/**
 * High-Contrast Hypsometric Palette
 * Deep charcoal graphite base with vibrant contrast to mountain crests
 */
export function getHypsometricRGB(elevation: number, minElev: number, maxElev: number): [number, number, number] {
  const norm = Math.max(0, Math.min(1, (elevation - minElev) / (maxElev - minElev || 1)));

  if (norm < 0.15) {
    return [13, 18, 16]; // Deepest basin (#0d1210)
  } else if (norm < 0.32) {
    return [20, 28, 24]; // Lowland plain (#141c18)
  } else if (norm < 0.50) {
    return [30, 42, 35]; // Foothills (#1e2a23)
  } else if (norm < 0.68) {
    return [42, 58, 48]; // Mid-elevation ridges (#2a3a30)
  } else if (norm < 0.85) {
    return [58, 78, 66]; // High mountain slate (#3a4e42)
  } else {
    return [76, 102, 86]; // Summit peak crest (#4c6656 - crisp, bright contrast)
  }
}
