# NEXUS-C2 — ARCHITECTURE SPECIFICATION

> **Document priority:** 4 of 10 in the source-of-truth hierarchy.  
> Defer to master prompt, `NEXUS-C2_AGENT_DATA_SOURCES_AND_INSTRUCTIONS.md`, and `DESIGN.md` on all conflicts.

---

## 1. Architectural Principles

1. **Layered separation** — UI, application/orchestration, simulation engine, scenario definitions, and data adapters are independent layers.
2. **Pure domain functions** — confidence calculation, scoring, degradation, and replay reconstruction are pure, testable functions with no React dependency.
3. **Data-driven scenarios** — scenario behaviour is defined in JSON; no hard-coded scenario logic in components.
4. **Offline-first** — the full demo must run without a backend, API key, or external network after initial load.
5. **Determinism** — given the same `(scenarioId, seed, initialState, eventSequence, traineeActions)` tuple, the simulation must produce identical outputs.
6. **No unnecessary infrastructure** — Supabase and AI features are optional and never block the demo path.

---

## 2. Technology Stack

| Concern | Library / Tool | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Static export capable |
| UI | React 18 + TypeScript 5 | Strict mode |
| Styling | Tailwind CSS 3 + CSS variables | Design tokens in `globals.css` |
| Component primitives | shadcn/ui | Radix-based, headless |
| Global state | Zustand 4 | Slice pattern |
| Scenario state machine | XState 5 | Deterministic actor model |
| Map | MapLibre GL JS | Lazy-loaded |
| Spatial utilities | Turf.js | Client-side only |
| UI animation | Framer Motion | UI transitions only |
| Canvas animation | `requestAnimationFrame` + Canvas 2D API | Particles, waveforms |
| Charts | Recharts | AAR and instructor panels |
| Icons | Lucide React | Tree-shaken |
| Schema validation | Zod | Scenario JSON + runtime data |
| Audio | Howler.js (or Web Audio API) | Optional; graceful fallback |
| PDF export | jsPDF + html-to-image | Lazy-loaded; P1 |
| Local persistence | localStorage + IndexedDB (via `idb`) | Session snapshots, builder |
| PRNG | `seedrandom` (or equivalent) | Seeded deterministic random |
| PWA | `next-pwa` or manual service worker | Offline support |
| Testing | Vitest + React Testing Library + Playwright | Unit + E2E |

### Explicitly excluded
- No Python backend.
- No mandatory database.
- No mandatory third-party API.
- Supabase is optional; must never prevent boot.
- GSAP is optional and only for highly controlled visual effects if added.

---

## 3. Repository Structure

```
nexus-c2/
├── README.md
├── ARCHITECTURE.md          ← this file
├── DESIGN.md
├── SIMULATION.md
├── DATA.md
├── SECURITY.md
├── TESTING.md
├── IMPLEMENTATION.md
├── .env.example
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── demo/
│   │   ├── demo-scenario.json
│   │   ├── demo-map.geojson
│   │   ├── demo-events.json
│   │   ├── demo-communications.json
│   │   └── tiles/               ← offline vector tiles
│   └── fonts/
│
├── data/
│   ├── raw/                     ← optional cached source extracts (gitignored)
│   ├── processed/               ← small normalized fixtures committed
│   │   ├── fcc_communications_reference.json
│   │   ├── itu_resilience_reference.json
│   │   ├── noaa_storm_demo.json
│   │   ├── usgs_event_demo.json
│   │   └── osm_demo_region.geojson
│   ├── scenarios/               ← scenario JSON files
│   │   ├── scn-01-maria.json
│   │   ├── scn-02-anatolia.json
│   │   ├── scn-03-chile.json
│   │   ├── scn-04-storm-corridor.json
│   │   ├── scn-05-seismic-window.json
│   │   └── scn-06-blackout.json
│   └── sources/
│       └── manifest.json        ← provenance metadata for all sources
│
├── scripts/
│   ├── fetch/                   ← optional data-fetch scripts (build-time only)
│   └── preprocess/              ← normalization scripts
│
├── src/
│   ├── app/                     ← Next.js App Router pages
│   │   ├── page.tsx             ← Landing
│   │   ├── console/page.tsx     ← Trainee console
│   │   ├── instructor/page.tsx  ← Instructor control room
│   │   ├── aar/[sessionId]/page.tsx
│   │   ├── scenarios/page.tsx
│   │   ├── builder/page.tsx
│   │   ├── data-sources/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui primitives (auto-generated)
│   │   ├── layout/              ← Header, Footer, Sidebar, Shell
│   │   ├── map/                 ← MapCanvas, EntityLayer, LinkLayer, OverlayLayer
│   │   ├── feed/                ← InformationFeed, ConfidenceCard, EventLog
│   │   ├── decision/            ← DecisionPanel, ActionCard, RationaleInput
│   │   ├── comms/               ← CommHealthBar, ChannelCard, NetworkState
│   │   ├── aar/                 ← AARView, ScoreRadar, DecisionTimeline
│   │   ├── replay/              ← ReplayViewer, TimelineScrubber
│   │   ├── instructor/          ← InstructorPanel, InjectControls, LiveMetrics
│   │   ├── landing/             ← HeroSection, NetworkBackground, StatusBoard
│   │   └── shared/              ← ConfidenceBar, StatusBadge, DataLabel, etc.
│   │
│   ├── lib/
│   │   ├── simulation/          ← PURE ENGINE (no React)
│   │   │   ├── engine.ts        ← Main simulation loop driver
│   │   │   ├── confidence.ts    ← ICE calculation functions
│   │   │   ├── communication.ts ← Channel quality Q calculation
│   │   │   ├── degradation.ts   ← Degradation state machine transitions
│   │   │   ├── scoring.ts       ← Multi-dimensional scoring
│   │   │   ├── replay.ts        ← Decision snapshot creation + reconstruction
│   │   │   ├── scenario.ts      ← Scenario loading + validation
│   │   │   └── prng.ts          ← Seeded PRNG wrapper
│   │   │
│   │   ├── data/                ← Data adapters (normalizers)
│   │   │   ├── fccHistoricalAdapter.ts
│   │   │   ├── ituHistoricalAdapter.ts
│   │   │   ├── noaaStormAdapter.ts
│   │   │   ├── ibtracsAdapter.ts
│   │   │   ├── usgsAdapter.ts
│   │   │   ├── femaAdapter.ts
│   │   │   └── osmAdapter.ts
│   │   │
│   │   └── utils/               ← Generic helpers
│   │       ├── time.ts
│   │       ├── format.ts
│   │       └── clamp.ts
│   │
│   ├── machines/
│   │   ├── scenarioMachine.ts   ← XState actor — scenario lifecycle
│   │   └── degradationMachine.ts← XState actor — communication degradation
│   │
│   ├── stores/
│   │   ├── simulationStore.ts   ← Zustand — live simulation state
│   │   ├── sessionStore.ts      ← Zustand — session + decision history
│   │   ├── instructorStore.ts   ← Zustand — instructor controls
│   │   └── settingsStore.ts     ← Zustand — user preferences
│   │
│   ├── types/
│   │   ├── scenario.ts          ← Scenario schema types + Zod schemas
│   │   ├── simulation.ts        ← Engine types (InformationItem, etc.)
│   │   ├── communication.ts     ← Channel, degradation state types
│   │   ├── decision.ts          ← DecisionAction, DecisionSnapshot types
│   │   ├── scoring.ts           ← ScoreResult, DimensionScore types
│   │   └── provenance.ts        ← SourceMetadata types
│   │
│   └── workers/
│       └── simulationWorker.ts  ← Optional Web Worker for heavy tick processing
│
└── tests/
    ├── unit/
    │   ├── confidence.test.ts
    │   ├── communication.test.ts
    │   ├── degradation.test.ts
    │   ├── scoring.test.ts
    │   ├── replay.test.ts
    │   └── scenario.test.ts
    └── e2e/
        └── demo-flow.spec.ts
```

---

## 4. Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        UI LAYER                          │
│  React Components · Framer Motion · MapLibre · Recharts  │
│  Reads from Zustand stores; dispatches actions           │
└─────────────────────────┬────────────────────────────────┘
                          │ read / dispatch
┌─────────────────────────▼────────────────────────────────┐
│               APPLICATION / ORCHESTRATION LAYER          │
│  Zustand stores · XState machines                        │
│  Coordinates simulation ticks, instructor events,        │
│  session lifecycle, decision submission                  │
└─────────────────────────┬────────────────────────────────┘
                          │ call pure functions
┌─────────────────────────▼────────────────────────────────┐
│                   SIMULATION ENGINE LAYER                │
│  src/lib/simulation/*                                    │
│  Pure TypeScript functions — no React, no side effects   │
│  confidence.ts · communication.ts · degradation.ts       │
│  scoring.ts · replay.ts · scenario.ts · prng.ts          │
└─────────────────────────┬────────────────────────────────┘
                          │ consume
┌─────────────────────────▼────────────────────────────────┐
│                  SCENARIO DEFINITIONS LAYER              │
│  /data/scenarios/*.json validated via Zod schemas        │
│  /public/demo/demo-scenario.json (offline fallback)      │
└─────────────────────────┬────────────────────────────────┘
                          │ normalize
┌─────────────────────────▼────────────────────────────────┐
│               DATA ADAPTERS / NORMALIZED DATA LAYER      │
│  src/lib/data/*Adapter.ts                                │
│  /data/processed/*.json (small derived fixtures)         │
│  /data/sources/manifest.json (provenance registry)       │
└──────────────────────────────────────────────────────────┘
```

---

## 5. State Management

### Zustand stores

#### `simulationStore`
Primary live simulation state, updated every simulation tick.

```typescript
interface SimulationState {
  scenarioId: string
  seed: number
  tick: number                     // simulation milliseconds elapsed
  phase: MissionPhase
  channels: Record<string, CommunicationChannelState>
  entities: Record<string, EntityState>
  informationItems: InformationItem[]
  activeInjects: ScenarioInject[]
  degradationState: CommunicationDegradationState
  commHealth: number               // 0–1 aggregate
  infoIntegrity: number            // 0–1 aggregate
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'DECISION_WINDOW' | 'COMPLETE'
  speedMultiplier: 0.5 | 1 | 2 | 5
}
```

#### `sessionStore`
Immutable decision history and replay snapshots.

```typescript
interface SessionState {
  sessionId: string
  decisions: DecisionSnapshot[]    // append-only
  score: ScoreResult | null
  aarGenerated: boolean
}
```

#### `instructorStore`
Instructor event queue and live metrics.

```typescript
interface InstructorState {
  pendingInjects: ScenarioInject[]
  liveMetrics: LiveMetrics
  isLinked: boolean                // watching trainee session
}
```

#### `settingsStore`
User preferences persisted to localStorage.

```typescript
interface SettingsState {
  audioEnabled: boolean
  reducedMotion: boolean
  speedDefault: number
}
```

---

## 6. XState Machines

### `scenarioMachine`
Controls the lifecycle of a training session.

```
IDLE
  → LOADING (load + validate scenario JSON)
  → READY (show briefing)
  → RUNNING (simulation tick loop active)
    → DECISION_WINDOW (trainee must decide)
      → AWAITING_RATIONALE
      → SUBMITTED (calculate outcome + score)
        → RUNNING (continue)
        → COMPLETE (all decision windows done)
  → PAUSED (instructor or trainee pause)
    → RUNNING
  → COMPLETE
    → REVIEWING (AAR mode)
  → ERROR
```

### `degradationMachine`
Controls communication state transitions for each channel.

```
NORMAL
  → MINOR_DELAY
    → HIGH_LATENCY
      → PARTIAL_DROPOUT
        → SEVERE_DROPOUT
          → RELAY_FAILURE
  → STALE_INFORMATION
  → CONTRADICTORY_REPORTS
  → PARTIAL_SENSOR_LOSS
  → BANDWIDTH_CONGESTION
  → RECOVERY
    → RECOVERED
      → NORMAL
```

Transitions are driven by timed events in the scenario MSEL and by instructor injects. Transitions are deterministic — a seeded PRNG governs any stochastic variation.

---

## 7. Simulation Tick Architecture

The simulation runs at a configurable virtual tick rate (default: 1 simulation-second per real-second at 1× speed).

```
┌──────────────────────────────────────────────────────────┐
│  setInterval / requestAnimationFrame (real time)         │
│  → compute elapsed simulation time based on multiplier   │
│  → advance tick in simulationStore                       │
│  → process MSEL events due at or before current tick     │
│  → apply instructor injects from queue                   │
│  → recalculate channel Q for each channel                │
│  → recalculate ICE confidence for each InformationItem   │
│  → update aggregate commHealth and infoIntegrity         │
│  → trigger decision window if scheduled                  │
│  → record state snapshot for replay                      │
└──────────────────────────────────────────────────────────┘
```

Heavy calculations may be offloaded to a Web Worker via `simulationWorker.ts`. The worker receives the current simulation state and returns updated values; it does not hold React or Zustand references.

---

## 8. Decision Replay Architecture (P0)

Every simulation tick writes a lightweight `StateSnapshot` to an append-only array in memory (not a store). When a decision is submitted, a full `DecisionSnapshot` is created from the current `StateSnapshot`.

```typescript
interface StateSnapshot {
  tick: number
  channels: Readonly<Record<string, CommunicationChannelState>>
  entities: Readonly<Record<string, EntityState>>
  informationItems: ReadonlyArray<InformationItem>
  degradationState: CommunicationDegradationState
  environment: EnvironmentState
}

interface DecisionSnapshot {
  decisionId: string
  tick: number
  stateAtDecision: StateSnapshot         // immutable copy
  unavailableItemIds: string[]           // IDs hidden at this moment
  decisionAction: DecisionAction
  rationale: string
  scoreComponents: ScoreComponents
}
```

Replay reconstruction (`src/lib/simulation/replay.ts`) filters `informationItems` to exclude any item with `receivedAt > snapshot.tick`, ensuring no future-information leakage.

Object.freeze is applied to all snapshot objects at creation time. No mutation is permitted after creation.

---

## 9. Scenario JSON Schema

Validated by Zod on load. Invalid scenarios fail gracefully with an error boundary.

```typescript
const ScenarioSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  historicalBasis: z.string().optional(),
  syntheticDisclaimer: z.string(),
  environment: EnvironmentSchema,
  entities: z.array(EntitySchema),
  communicationChannels: z.array(ChannelSchema),
  initialConditions: InitialConditionsSchema,
  events: z.array(ScenarioInjectSchema),     // MSEL
  decisionWindows: z.array(DecisionWindowSchema),
  scoring: ScoringWeightsSchema,
  difficulty: z.enum(['FOUNDATION', 'ADVANCED', 'EXPERT']),
  sources: z.array(SourceReferenceSchema),
})
```

---

## 10. Data Flow — Information Confidence Engine

```
Scenario MSEL event fires
        │
        ▼
degradationMachine transitions channel state
        │
        ▼
simulationStore updates CommunicationChannelState
        │
        ▼
confidence.ts: calculateChannelQuality(channel)
  Q = availability × (1 - packetLoss) × latencyFactor × bandwidthFactor
        │
        ▼
confidence.ts: calculateConfidence(item, Q)
  confidence = sourceReliability × Q × freshness × consistency
        │
        ▼
simulationStore.informationItems[i].confidence updated
        │
        ▼
infoIntegrity = mean(confidence) across active items
        │
        ▼
Zustand selector triggers re-render of ConfidenceCard components
```

All calculation functions in `confidence.ts` are pure and side-effect-free.

---

## 11. Data Pipeline

```
Public source URL (provenance only)
        │
   [optional build-time script]
        │
        ▼
/data/raw/               ← large; gitignored
        │
   [preprocess script]
        │
        ▼
/data/processed/         ← small normalized fixture; committed
        │
        ▼
/data/scenarios/*.json   ← scenario definition consuming processed fixture
        │
        ▼
src/lib/simulation/      ← engine consumes typed, validated domain objects
        │
        ▼
Browser UI               ← renders normalized data only
```

The browser **never** loads raw public datasets.

---

## 12. Offline / PWA Architecture

A service worker (configured via `next-pwa` or a custom `sw.ts`) pre-caches:
- JavaScript bundle.
- `/public/demo/*` fixtures.
- `/public/demo/tiles/*` (offline vector tiles).
- CSS and fonts.

On subsequent loads with no network:
- App loads from cache.
- `simulationStore` loads `demo-scenario.json` from `/public/demo/`.
- MapLibre uses local tile source.
- No API calls made.

---

## 13. Optional Backend (P2)

Supabase Realtime and Postgres may be added for:
- Multi-trainee session synchronisation.
- Persistent session storage.
- Instructor analytics export.

Integration pattern:
- All Supabase calls wrapped in `src/lib/supabase/` with try/catch.
- If `NEXT_PUBLIC_SUPABASE_URL` env var is absent, fall back to local mode silently.
- The application must never throw an unhandled error because Supabase is missing.

---

## 14. Environment Variables

All optional. The application must function without any of these set.

```env
# Optional: Supabase (P2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional: AI features (P2) — server-side only
AI_API_KEY=

# Build-time data fetch (optional scripts)
FETCH_PUBLIC_DATA=false
```

No secrets in client-side source. AI API keys server-side only.

---

## 15. Build and Deployment

```bash
npm install
npm run dev      # development with hot reload
npm run build    # Next.js production build (static export where possible)
npm run start    # production server
npm run lint     # ESLint + TypeScript checks
npm run test     # Vitest unit tests
npm run test:e2e # Playwright E2E tests
```

Primary deployment target: **Vercel**. Repository contains no Vercel-specific configuration beyond standard Next.js conventions.

The application must deploy and run without a database and without API keys.

---

## 16. Code Quality Rules

- No simulation logic inside React components.
- No scoring logic inside presentation components.
- No `Math.random()` in simulation-critical paths — use seeded PRNG.
- No mutable `DecisionSnapshot` objects after creation.
- No `any` types in simulation layer (strict TypeScript).
- No uncontrolled `setInterval` / `setTimeout` — all timers tracked and cleared on unmount.
- Export only what is needed; tree-shake unused code.

---

*Document version: 1.0 — October 2026*
