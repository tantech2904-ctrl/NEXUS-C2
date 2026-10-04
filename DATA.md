# NEXUS-C2 — DATA SPECIFICATION

> **Document priority:** 6 of 10 in the source-of-truth hierarchy.  
> Defer to master prompt, data sources doc, DESIGN.md, ARCHITECTURE.md, and SIMULATION.md on all conflicts.

---

## 1. Data Philosophy

### Golden rule
The browser application is **independent of raw public datasets**. The data pipeline is:

```
PUBLIC SOURCE (provenance / citation)
        │
   [optional build-time fetch script]
        │
        ▼
/data/raw/            ← large; gitignored; optional
        │
   [preprocess script]
        │
        ▼
/data/processed/      ← small normalized fixtures; committed to repo
        │
        ▼
/data/scenarios/*.json ← scenario definitions consuming processed fixtures
        │
        ▼
SIMULATION ENGINE     ← consumes typed, Zod-validated domain objects
        │
        ▼
BROWSER UI            ← renders normalized data only
```

### Hard rules
- Never ask the user to manually download any dataset.
- Never bundle multi-megabyte raw datasets into the frontend.
- Never make the demo dependent on an external network at runtime.
- Never fabricate source details or claim a dataset was used when it was not.
- Never represent historical data as real military intelligence.

---

## 2. Historical vs Synthetic Boundary

| Category | Label required | Examples |
|---|---|---|
| Public historical data | **HISTORICAL BASIS — PUBLIC DATA** | FCC outage statistics, NOAA storm track, USGS magnitude |
| Synthetic training data | **Synthetic training construct** | Command nodes, field teams, routes, decisions, callsigns |
| Map geometry | Source attribution | OSM-derived GeoJSON region |
| Simulation parameters | None required | ICE formula constants, degradation state mappings |

Both labels must appear on every scenario that uses historical calibration data.

Historical data may inform:
- Communication degradation patterns and timing.
- Environmental stress parameters.
- Recovery duration models.
- Scenario narrative context.

Historical data must never represent:
- Real military unit locations or dispositions.
- Real operational plans or targeting workflows.
- Real command decisions or procedures.
- Classified information of any kind.

---

## 3. Source Registry

All public sources used for calibration. Provenance metadata is stored in `/data/sources/manifest.json`.

### SOURCE A — SIH26248 Official Problem Statement

| Field | Value |
|---|---|
| Source name | SIH 2026 — SIH26248 Official Problem Statement |
| Organization | Smart India Hackathon 2026 |
| URL | `https://sih2026-ps-viewer.vercel.app/ps/SIH26248` |
| Purpose | Requirements alignment and traceability |
| Used in scenarios | All |
| License | Public |

### SOURCE B — FCC Hurricane Maria Communications Status Report

| Field | Value |
|---|---|
| Source name | FCC Hurricane Maria Communications Status Report |
| Organization | Federal Communications Commission |
| URL | `https://docs.fcc.gov/public/attachments/DOC-348851A1.pdf` |
| Purpose | Communication degradation calibration for SCN-01 |
| Used in scenarios | SCN-01 (MARIA) |
| License | US Government public document |
| Processing | Derived degradation parameters (availability %, packet loss patterns, recovery timelines) |

### SOURCE C — FCC Long-Term Hurricane Maria Analysis

| Field | Value |
|---|---|
| Source name | FCC Long-Term Hurricane Maria Communications Analysis |
| Organization | Federal Communications Commission |
| URL | `https://docs.fcc.gov/public/attachments/DOC-353805A1.pdf` |
| Purpose | Long-duration outage and staged recovery calibration |
| Used in scenarios | SCN-01 (MARIA) |
| License | US Government public document |
| Processing | Recovery ramp duration parameters |

### SOURCE D — ITU/EBU Türkiye 2023 Crisis Communications Report

| Field | Value |
|---|---|
| Source name | EBU/ITU Radio in Times of Crisis — Türkiye 2023 |
| Organization | International Telecommunication Union / European Broadcasting Union |
| URL | `https://www.itu.int/en/ITU-D/Emergency-Telecommunications/Documents/2024/EBU-MIS_Radio_in_times_of_crisis.pdf` |
| Purpose | Partial-resilience channel model calibration |
| Used in scenarios | SCN-02 (ANATOLIA) |
| License | ITU public document |
| Processing | Channel survival % per type (mobile, terrestrial, FM) used to set per-channel availability |

### SOURCE E — ITU Disaster Response / Chile 2010

| Field | Value |
|---|---|
| Source name | ITU Saving Lives — Emergency Telecommunications |
| Organization | International Telecommunication Union |
| URL | `https://www.itu.int/en/ITU-D/Emergency-Telecommunications/Documents/SavingLivesBrochure/BD__emergencybrochure_E.pdf` |
| Purpose | Fallback channel activation model |
| Used in scenarios | SCN-03 (CHILE) |
| License | ITU public document |
| Processing | Fallback channel latency and availability presets |

### SOURCE F — NOAA Storm Events Database

| Field | Value |
|---|---|
| Source name | NOAA Storm Events Database |
| Organization | National Oceanic and Atmospheric Administration |
| URL | `https://www.ncei.noaa.gov/pub/data/swdi/stormevents/` |
| Purpose | Environmental stressor timing calibration for SCN-04 |
| Used in scenarios | SCN-04 (STORM CORRIDOR) |
| License | US Government public data |
| Processing | Severity/timing parameters for weather-driven degradation events |

### SOURCE G — NOAA IBTrACS

| Field | Value |
|---|---|
| Source name | NOAA IBTrACS — International Best Track Archive for Climate Stewardship |
| Organization | National Oceanic and Atmospheric Administration |
| URL | `https://www.ncei.noaa.gov/products/international-best-track-archive` |
| Purpose | Historical storm track for scenario geographic context |
| Used in scenarios | SCN-04 (STORM CORRIDOR) |
| License | US Government public data |
| Processing | Storm track subset → small GeoJSON fixture; all command entities are synthetic |

### SOURCE H — USGS Earthquake Feed / FDSN

| Field | Value |
|---|---|
| Source name | USGS Earthquake Catalog (FDSN) |
| Organization | US Geological Survey |
| URL | `https://earthquake.usgs.gov/fdsnws/event/1/` |
| Purpose | Seismic event metadata for SCN-05 |
| Used in scenarios | SCN-05 (SEISMIC WINDOW) |
| License | US Government public data |
| Processing | Single event: magnitude, location, time → used as environmental trigger timing |

### SOURCE I — USGS ShakeMap Atlas

| Field | Value |
|---|---|
| Source name | USGS ShakeMap Atlas v4 |
| Organization | US Geological Survey |
| URL | `https://www.usgs.gov/data/shakemap-atlas-v4-and-atlascat` |
| Purpose | Spatial intensity context for degraded-zone overlay |
| Used in scenarios | SCN-05 (SEISMIC WINDOW) — optional overlay |
| License | US Government public data |
| Processing | Intensity grid → simplified polygon GeoJSON for degraded zone visualization |

### SOURCE J — FEMA National Risk Index (Optional)

| Field | Value |
|---|---|
| Source name | FEMA National Risk Index |
| Organization | Federal Emergency Management Agency |
| URL | `https://hazards.fema.gov/nri/data-resources` |
| Purpose | Optional environmental risk context |
| Used in scenarios | Optional background context |
| License | US Government public data |
| Processing | Hazard classification presets only |

### SOURCE K — OpenStreetMap / Geofabrik

| Field | Value |
|---|---|
| Source name | OpenStreetMap via Geofabrik |
| Organization | OpenStreetMap contributors |
| URL | `https://download.geofabrik.de/asia/india.html` |
| Purpose | Background map geometry for demo area |
| Used in scenarios | All (base map) |
| License | ODbL 1.0 — must attribute © OpenStreetMap contributors |
| Processing | Small regional extract → lightweight GeoJSON/vector tiles in `/public/demo/tiles/` |

> **Attribution required on every map view:** "© OpenStreetMap contributors"

### SOURCE L — Ookla Open Data (Optional / P2)

| Field | Value |
|---|---|
| Source name | Ookla Open Data |
| Organization | Ookla / Speedtest |
| URL | `https://github.com/teamookla/ookla-open-data` |
| Purpose | Optional connectivity performance calibration |
| Used in scenarios | Optional |
| License | Verify current Ookla licence before use |
| Processing | Tiny aggregated subset only; verify redistribution rights |

---

## 4. Normalized Domain Models

All internal data uses these typed domain objects. External source formats never leak into simulation or UI code.

### 4.1 EnvironmentEvent

```typescript
type EnvironmentEvent = {
  id: string
  sourceId: string           // references manifest.json entry
  sourceUrl: string
  type: 'STORM' | 'EARTHQUAKE' | 'FLOOD' | 'INFRASTRUCTURE_FAILURE' | 'OTHER'
  startTime: string          // ISO 8601
  endTime?: string
  severity?: number          // [0,1]
  geometry?: GeoJSON.Geometry
  description: string
  historicalBasis: boolean
}
```

### 4.2 CommunicationState

```typescript
type CommunicationState = {
  channelId: string
  availability: number       // [0,1]
  latencyMs: number
  packetLoss: number         // [0,1]
  bandwidthFactor: number    // [0,1]
  channelQuality: number     // computed Q
  status: 'NORMAL' | 'DEGRADED' | 'INTERMITTENT' | 'OFFLINE' | 'RECOVERING'
  lastSuccessfulContact?: string
}
```

### 4.3 InformationItem

See SIMULATION.md §3.1 for full definition.

### 4.4 ScenarioInject

```typescript
type ScenarioInject = {
  id: string
  time: number               // simulation ms
  type:
    | 'LATENCY'
    | 'PACKET_LOSS'
    | 'DROPOUT'
    | 'RELAY_FAILURE'
    | 'SENSOR_LOSS'
    | 'CONTRADICTION'
    | 'STALE_INFORMATION'
    | 'BANDWIDTH_CONGESTION'
    | 'RECOVERY'
    | 'CUSTOM'
  target?: string            // channelId or entityId
  severity?: number          // [0,1]
  duration?: number          // ms; null = permanent until reversed
  message?: string
  historicalBasis?: boolean
}
```

### 4.5 SourceMetadata

```typescript
type SourceMetadata = {
  id: string
  sourceName: string
  organization: string
  sourceURL: string
  publicationDate?: string
  datasetVersion?: string
  retrievalDate?: string
  purpose: string
  license: string
  processingMethod: string
  usedInScenarios: string[]
  category: 'HISTORICAL' | 'SYNTHETIC' | 'MAP_DATA' | 'OPTIONAL_EXTERNAL'
}
```

---

## 5. File Layout

### /data/processed/ (committed to repo)

All files small (< 50 KB each). No raw public archives.

| File | Contents | Source(s) |
|---|---|---|
| `fcc_communications_reference.json` | Derived degradation parameters from Maria reports | SOURCE B, C |
| `itu_resilience_reference.json` | Channel-survival percentages per type | SOURCE D |
| `itu_fallback_reference.json` | Fallback channel model parameters | SOURCE E |
| `noaa_storm_demo.json` | Minimal storm-event metadata | SOURCE F |
| `ibtracs_track_demo.json` | Minimal storm-track GeoJSON subset | SOURCE G |
| `usgs_event_demo.json` | Single earthquake event metadata | SOURCE H |
| `usgs_shakemap_demo.geojson` | Simplified intensity polygon | SOURCE I |
| `osm_demo_region.geojson` | Demo training area road/settlement geometry | SOURCE K |

### /data/scenarios/ (committed to repo)

Six scenario definition files (JSON, Zod-validated):

| File | Scenario |
|---|---|
| `scn-01-maria.json` | MARIA // COMMUNICATIONS SHOCK |
| `scn-02-anatolia.json` | ANATOLIA // PARTIAL RESILIENCE |
| `scn-03-chile.json` | CHILE // FALLBACK WINDOW |
| `scn-04-storm-corridor.json` | STORM CORRIDOR |
| `scn-05-seismic-window.json` | SEISMIC WINDOW |
| `scn-06-blackout.json` | BLACKOUT / INFORMATION FOG ← main demo |

### /data/sources/manifest.json

Provenance registry for all sources. Consumed by the Data Provenance page.

### /public/demo/ (committed to repo, served statically)

Offline fallback fixtures:

| File | Contents |
|---|---|
| `demo-scenario.json` | Minimal SCN-06 copy for offline boot |
| `demo-map.geojson` | Simplified training area for offline MapLibre |
| `demo-events.json` | Minimal MSEL for offline demo |
| `demo-communications.json` | Initial channel states for offline demo |
| `tiles/` | Offline vector tile set for MapLibre |

### /data/raw/ (gitignored)

Optional cached source extracts. Developer-only. Never bundled or served to browser.

---

## 6. Data Adapter Pattern

Each adapter in `src/lib/data/` maps an external format to a normalized domain object.

```typescript
// Example: fccHistoricalAdapter.ts
export function parseFCCReport(raw: unknown): CommunicationState[] {
  // Validates raw input with Zod, returns normalized array
}
```

Adapters are:
- Pure functions (no side effects).
- Tested independently.
- Never imported by UI components directly.
- Called only from `src/lib/simulation/scenario.ts` during scenario loading.

---

## 7. Scenario JSON Authoring

### Required fields per scenario

```json
{
  "id": "SCN-01",
  "version": "1.0.0",
  "title": "MARIA // COMMUNICATIONS SHOCK",
  "historicalBasis": "Hurricane Maria, Puerto Rico, 2017. FCC public communications reports.",
  "syntheticDisclaimer": "Command entities and scenario injects are synthetic training constructs.",
  "difficulty": "ADVANCED",
  "seed": 1234,
  "sources": [
    {
      "name": "FCC Hurricane Maria Communications Status Report",
      "organization": "Federal Communications Commission",
      "url": "https://docs.fcc.gov/public/attachments/DOC-348851A1.pdf",
      "usage": "Historical communications disruption and recovery calibration"
    }
  ]
}
```

Every scenario with `historicalBasis` non-null must include at least one `sources` entry. Fabricated source entries are prohibited.

---

## 8. Map Data Constraints

- Base map geometry is OSM-derived. Attribution `© OpenStreetMap contributors` must appear on every map view.
- All command entities (nodes, relays, teams) are synthetic and must not coincide with real military facilities.
- The demo training area is fictional. It may be geographically inspired by a generic region, but all tactical elements are invented.
- No sensitive coordinates, classified facilities, or real military installations.
- Tile server: local `/public/demo/tiles/` for offline; no external tile server dependency at runtime.

---

## 9. Provenance in the UI

The Data Provenance page (`/data-sources`) renders from `manifest.json`. Required display per source:

- Source name and organisation.
- Dataset/report name.
- Public URL (clickable link).
- Date/version if available.
- Purpose in NEXUS-C2.
- Exact usage description.
- Licence / usage note.
- Category badge: `HISTORICAL` | `SYNTHETIC` | `MAP DATA` | `OPTIONAL EXTERNAL`.

Sections:
1. Historical Evidence.
2. Simulation Data (synthetic constructs).
3. Map Data.
4. Optional External Data.

Required disclaimer on the page: *"Command entities and scenario injects are synthetic training constructs."*

---

## 10. Data Handling Prohibitions

The following are absolutely prohibited:

- Bundling the full Geofabrik India PBF or any multi-GB dataset.
- Loading raw NOAA, USGS, FCC, ITU, or FEMA archives in the browser at runtime.
- Making the demo wait for an external URL at startup.
- Claiming that synthetic scenario data derives from a real source it does not.
- Claiming that a historical source was used when it was not.
- Exposing raw source URLs as application API dependencies at runtime.
- Reproducing actual military facility coordinates or dispositions.
- Representing any synthetic scenario element as real operational data.

---

## 11. Build-Time Data Fetch Scripts (Optional)

Located in `/scripts/fetch/`. Run only during development or CI, never in the browser.

| Script | Purpose |
|---|---|
| `fetchNoaaStormEvents.ts` | Downloads a minimal storm event subset from NOAA |
| `fetchUsgsEvent.ts` | Downloads a single earthquake event from USGS FDSN |
| `fetchIbtracsTrack.ts` | Downloads a storm track subset from IBTrACS |
| `preprocessOsm.ts` | Extracts a small GeoJSON region from an OSM extract |

Each script:
- Writes to `/data/raw/` (gitignored).
- Runs a preprocess step writing to `/data/processed/`.
- Exits gracefully if the network is unavailable, using existing processed files.
- Never blocks the build if data cannot be fetched.

---

*Document version: 1.0 — October 2026*
