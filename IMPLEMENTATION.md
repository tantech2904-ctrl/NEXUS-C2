# NEXUS-C2 — IMPLEMENTATION PLAN

> **Document priority:** 9 of 10 in the source-of-truth hierarchy.  
> All implementation decisions defer to higher-priority documents on conflict.

---

## 1. Implementation Principles

1. Build P0 features first, completely, before touching P1.
2. Every feature must work; no fake buttons or placeholder cards.
3. SCN-06 (BLACKOUT) is the primary demo scenario and must be reliable end-to-end before any other scenario is authored.
4. Simulation engine and data models are built before UI components.
5. Offline demo capability is validated at each phase boundary.
6. TypeScript strict mode from day one — no `any` exceptions in simulation layer.

---

## 2. Priority Reference

| Tag | Definition |
|---|---|
| **P0** | Must work for demo to be viable |
| **P1** | Polish; significantly improves the product |
| **P2** | Optional; never allowed to delay P0 |

---

## 3. Build Phases

### Phase 0 — Project Scaffold (P0)

**Estimated time: 1–2 hours**

- [ ] `npx create-next-app@latest nexus-c2 --typescript --tailwind --app --src-dir`
- [ ] Install core dependencies:
  ```bash
  npm install zustand @xstate/react xstate framer-motion lucide-react recharts zod idb seedrandom
  npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @playwright/test
  ```
- [ ] Install shadcn/ui base:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Configure `tsconfig.json` strict mode.
- [ ] Configure Tailwind with design token CSS variables (see DESIGN.md §3).
- [ ] Create directory structure (see ARCHITECTURE.md §3).
- [ ] Create `.env.example` with all optional variables.
- [ ] Create `.gitignore` with `/data/raw/` and `.env.local`.
- [ ] Configure Vitest in `vitest.config.ts`.
- [ ] Configure Playwright in `playwright.config.ts`.
- [ ] Verify: `npm run dev`, `npm run build`, `npm run lint` all pass.

**Acceptance:** Dev server starts; build succeeds; lint clean.

---

### Phase 1 — Domain Types and Simulation Engine (P0)

**Estimated time: 2–3 hours**

Build the pure simulation layer first. No React, no UI.

#### 1A — Types (`src/types/`)
- [ ] `scenario.ts` — `Scenario`, `ScenarioInject`, `DecisionWindow`, `SourceReference` + Zod schemas.
- [ ] `simulation.ts` — `InformationItem`, `InformationStatus`, `EntityState`, `MissionPhase`.
- [ ] `communication.ts` — `CommunicationChannel`, `CommunicationDegradationState`.
- [ ] `decision.ts` — `DecisionAction`, `DecisionSnapshot`, `StateSnapshot`.
- [ ] `scoring.ts` — `ScoreResult`, `ScoreComponents`, `DimensionScore`.
- [ ] `provenance.ts` — `SourceMetadata`.

#### 1B — Pure engine functions (`src/lib/simulation/`)

- [ ] `prng.ts` — Seeded PRNG wrapper around `seedrandom`.
- [ ] `communication.ts` — `calculateChannelQuality(channel): number`.
- [ ] `confidence.ts` — `calculateFreshness`, `calculateConsistency`, `calculateConfidence`, `deriveStatus`, `explainConfidenceChange`.
- [ ] `degradation.ts` — State parameter tables; `applyDegradationToChannel(channel, state): CommunicationChannel`.
- [ ] `scoring.ts` — `calculateDimensionScores`, `calculateOverallScore`, `deriveOutcomeClass`.
- [ ] `replay.ts` — `createDecisionSnapshot`, `reconstructStateAtTick`, `filterFutureItems`.
- [ ] `scenario.ts` — `loadScenario(json): Scenario`, `validateScenario(json)`.

#### 1C — Unit tests for all engine functions

Write tests for every function listed in TESTING.md §3 before moving to Phase 2.

- [ ] `tests/unit/confidence.test.ts`
- [ ] `tests/unit/communication.test.ts`
- [ ] `tests/unit/degradation.test.ts`
- [ ] `tests/unit/scoring.test.ts`
- [ ] `tests/unit/replay.test.ts`
- [ ] `tests/unit/scenario.test.ts`
- [ ] `tests/unit/prng.test.ts`

**Acceptance:** All unit tests pass. Coverage ≥ 90% for `src/lib/simulation/`.

---

### Phase 2 — Scenario Data and Offline Fixtures (P0)

**Estimated time: 1–2 hours**

Build SCN-06 first.

#### 2A — Source manifest
- [ ] `data/sources/manifest.json` — populate all 11 sources (A–K) with provenance metadata.

#### 2B — Processed fixtures (synthetic; no network required)
- [ ] `data/processed/fcc_communications_reference.json` — derived degradation parameters.
- [ ] `data/processed/itu_resilience_reference.json` — channel survival parameters.
- [ ] `data/processed/noaa_storm_demo.json` — minimal storm event metadata.
- [ ] `data/processed/usgs_event_demo.json` — single earthquake event.

#### 2C — SCN-06 BLACKOUT scenario (primary demo)
- [ ] `data/scenarios/scn-06-blackout.json` — full MSEL for judge demo.
  - Entities: 1 command node, 2 relay nodes, 3 field teams, 1 observation node.
  - Channels: PRIMARY DATA LINK, SECONDARY RADIO, FALLBACK LINK.
  - Events: LATENCY at T+20s, PACKET_LOSS at T+30s, CONTRADICTION at T+45s, RELAY_FAILURE at T+60s, RECOVERY at T+90s.
  - 1 decision window at T+70s.
  - Difficulty: EXPERT. Seed: 42.

#### 2D — Offline demo fixtures
- [ ] `public/demo/demo-scenario.json` — minimal copy of SCN-06 for offline boot.
- [ ] `public/demo/demo-map.geojson` — fictional training area GeoJSON.
- [ ] `public/demo/demo-events.json` — minimal MSEL copy.
- [ ] `public/demo/demo-communications.json` — initial channel states.
- [ ] `public/demo/tiles/` — offline vector tiles for MapLibre.

#### 2E — Data adapters
- [ ] `src/lib/data/fccHistoricalAdapter.ts`
- [ ] `src/lib/data/ituHistoricalAdapter.ts`
- [ ] Tests for each adapter.

**Acceptance:** SCN-06 JSON loads and validates without network access. Offline fixtures present.

---

### Phase 3 — State Management and XState Machines (P0)

**Estimated time: 1–2 hours**

#### 3A — Zustand stores (`src/stores/`)
- [ ] `simulationStore.ts` — full `SimulationState` slice with actions.
- [ ] `sessionStore.ts` — `DecisionSnapshot[]` append-only; `ScoreResult`.
- [ ] `instructorStore.ts` — inject queue; live metrics.
- [ ] `settingsStore.ts` — audio, reduced motion, speed preference; persisted to localStorage.

#### 3B — XState machines (`src/machines/`)
- [ ] `scenarioMachine.ts` — full scenario lifecycle (IDLE → LOADING → READY → RUNNING → DECISION_WINDOW → SUBMITTED → COMPLETE).
- [ ] `degradationMachine.ts` — channel degradation state machine per channel.

#### 3C — Simulation tick loop (`src/lib/simulation/engine.ts`)
- [ ] Tick driver: `setInterval` at 100 ms real, scaling by `speedMultiplier`.
- [ ] Each tick: advance tick counter, process due MSEL events, recalculate Q and confidence, update store.
- [ ] Snapshot writer: every 1 simulation-second appends to in-memory `StateSnapshot[]`.
- [ ] Decision window trigger: opens window when `openAtTick` is reached.

**Acceptance:** Simulation tick loop advances without errors; stores update on tick.

---

### Phase 4 — UI Layout and Landing Page (P0)

**Estimated time: 1–2 hours**

#### 4A — Global layout
- [ ] `src/app/layout.tsx` — root layout with CSS variables, fonts, global providers.
- [ ] `src/components/layout/Shell.tsx` — application shell.
- [ ] `src/components/layout/Header.tsx` — scenario header strip (clock, commHealth, infoIntegrity).
- [ ] `src/components/layout/Footer.tsx` — comm health bars, mini event timeline, speed controls.

#### 4B — Landing page (`src/app/page.tsx`)
- [ ] Hero: NEXUS-C2 title, tagline, status board.
- [ ] Four navigation buttons: ENTER TRAINING, INSTRUCTOR CONTROL, SCENARIO LIBRARY, DATA SOURCES.
- [ ] Animated network background: canvas with ~20 nodes, moving edges.
- [ ] Status indicators: OPERATIONAL / READY labels.
- [ ] `prefers-reduced-motion`: static background.

**Acceptance:** Landing page renders; all four buttons navigate correctly; background animation ≥ 60 FPS.

---

### Phase 5 — Trainee Console (P0)

**Estimated time: 3–4 hours**

This is the centrepiece. Build systematically: map → feed → decision panel → integration.

#### 5A — Operational map (`src/components/map/`)
- [ ] `MapCanvas.tsx` — MapLibre GL wrapper, lazy-loaded, offline tiles.
- [ ] `EntityLayer.tsx` — renders command entities as MapLibre markers with animated SVG icons.
- [ ] `LinkLayer.tsx` — renders communication links as canvas overlay with particle animation.
- [ ] `OverlayLayer.tsx` — uncertainty rings, degraded zones, contradiction markers.
- [ ] Map updates on simulation tick via Zustand selector (no re-render unless entity state changes).

#### 5B — Information feed (`src/components/feed/`)
- [ ] `InformationFeed.tsx` — scrolling list with Framer Motion `AnimatePresence`.
- [ ] `ConfidenceCard.tsx` — full ICE card (DESIGN.md §9): all four factors, status badge, "Why lower" line.
- [ ] `EventLog.tsx` — terminal-style event stream with category colour coding.

#### 5C — Decision panel (`src/components/decision/`)
- [ ] `DecisionPanel.tsx` — situation brief + decision cards + rationale + submit.
- [ ] `ActionCard.tsx` — selectable action card (10 options from SIMULATION.md §7.1).
- [ ] `RationaleInput.tsx` — textarea with char counter, min/max validation.
- [ ] Submit handler: creates `DecisionSnapshot`, updates sessionStore, triggers outcome.

#### 5D — Communication state panel (`src/components/comms/`)
- [ ] `CommHealthBar.tsx` — per-channel progress bar with waveform animation.
- [ ] `ChannelCard.tsx` — expandable channel detail (latency, packet loss, availability, Q).
- [ ] `NetworkState.tsx` — aggregate health indicator with degradation state label.

#### 5E — Trainee Console page (`src/app/console/page.tsx`)
- [ ] Three-column desktop layout (DESIGN.md §7).
- [ ] Responsive tab layout for < 1280 px.
- [ ] Scenario auto-starts with SCN-06 (or user-selected scenario from library).

**Acceptance:** Full trainee console functional; map renders; feed populates; decision can be submitted.

---

### Phase 6 — Instructor Control Room (P0)

**Estimated time: 2 hours**

#### 6A — Instructor layout (`src/app/instructor/page.tsx`)
- [ ] Three-panel layout (DESIGN.md §13).
- [ ] Scenario Control panel: PAUSE, RESUME, speed controls, RESET.
- [ ] Live Trainee View: read-only mirror of trainee console state.
- [ ] Event Injection panel: all eight inject controls.
- [ ] Live Performance panel: all eight metrics (Recharts line charts).

#### 6B — Inject controls (`src/components/instructor/InjectControls.tsx`)
- [ ] Each inject button dispatches to `instructorStore.pendingInjects`.
- [ ] Simulation tick loop processes pending injects.
- [ ] Each inject is reversible (see SIMULATION.md §11).

#### 6C — Formula inspector
- [ ] Expandable drawer showing current ICE formula variables for each active item.

**Acceptance:** All eight inject types work; live metrics update; pause/resume functional.

---

### Phase 7 — After-Action Review and Decision Replay (P0)

**Estimated time: 2–3 hours**

#### 7A — AAR page (`src/app/aar/[sessionId]/page.tsx`)
- [ ] Overall score (large display).
- [ ] Dimension scores (Recharts radar chart + table).
- [ ] Decision timeline: chronological list, each expandable.
- [ ] Missed uncertainty panel.
- [ ] REPLAY DECISION button per decision.
- [ ] Training disclaimer.

#### 7B — Decision Replay (`src/components/replay/`)
- [ ] `ReplayViewer.tsx` — modal/panel with map, feed, comm state panels.
- [ ] `TimelineScrubber.tsx` — horizontal scrubber with decision markers.
- [ ] Replay reconstruction via `replay.ts:reconstructStateAtTick`.
- [ ] No-future-information filter active at every scrubber position.
- [ ] Previous / Next decision navigation.
- [ ] Play / Pause for automatic replay.

#### 7C — Outcome display
- [ ] Post-decision outcome panel: abstract outcome class, score preview, "Why this mattered" text.

**Acceptance:** AAR generates correctly after session; Decision Replay shows exact historical state; no future information leakage confirmed in tests.

---

### Phase 8 — Offline / PWA Support (P0)

**Estimated time: 1 hour**

- [ ] Install and configure `next-pwa` (or write custom `sw.ts`).
- [ ] Service worker pre-caches: JS bundle, `/public/demo/*`, CSS, fonts.
- [ ] Application detects offline and uses `/public/demo/` fixtures automatically.
- [ ] MapLibre configured to use local tiles first; no external tile server at runtime.
- [ ] Offline E2E test passes (TESTING.md §6.3).

**Acceptance:** Application fully functional with network disabled in DevTools.

---

### Phase 9 — Reset, Session Management, and Scenario Loading (P0)

**Estimated time: 30 minutes**

- [ ] RESET button: resets simulationStore to initial state, clears sessionStore, re-seeds PRNG.
- [ ] Session ID generated on each new session (UUIDv4).
- [ ] Scenario loading fallback: if no scenario selected, load SCN-06.
- [ ] Error boundary for invalid scenario JSON.
- [ ] Determinism check: reset + replay with same seed produces identical event sequence.

**Acceptance:** Reset works; session restarts cleanly; determinism verified.

---

### Phase 10 — P1 Features (Polish, after P0 complete)

**Estimated time: 4–8 hours total**

Complete in any order once all P0 acceptance criteria are met.

#### 10A — Five additional scenarios (P1)
- [ ] `scn-01-maria.json` + historical calibration from FCC data.
- [ ] `scn-02-anatolia.json` + channel-survival parameters from ITU data.
- [ ] `scn-03-chile.json` + fallback model parameters.
- [ ] `scn-04-storm-corridor.json` + NOAA storm track fixture.
- [ ] `scn-05-seismic-window.json` + USGS earthquake fixture.

#### 10B — Scenario Library page (P1)
- [ ] `/scenarios` — grid of six scenario cards.
- [ ] Difficulty badge, historical basis tag, duration estimate.
- [ ] [START] button navigates to console with scenario pre-selected.

#### 10C — Audio (P1)
- [ ] Howler.js integration.
- [ ] Startup chime, radio click, message received, warning tone, degradation pulse, decision confirmation, scenario complete.
- [ ] Audio ON/OFF toggle in settings.
- [ ] During SEVERE_DROPOUT: audio intermittent effect.

#### 10D — Scenario Builder (P1)
- [ ] `/builder` — all fields from DESIGN.md §17.
- [ ] Timeline drag-and-drop editor.
- [ ] SAVE / DUPLICATE / EXPORT JSON / IMPORT JSON.

#### 10E — Data Provenance page (P1)
- [ ] `/data-sources` — renders from `manifest.json`.
- [ ] Four sections: Historical Evidence, Simulation Data, Map Data, Optional External.
- [ ] All source cards with links and required labels.

#### 10F — PDF Export (P1)
- [ ] [DOWNLOAD AAR] button in AAR page.
- [ ] Uses `jsPDF` + `html-to-image` — lazy-loaded.
- [ ] PDF includes: scenario, session ID, decision timeline, scores, disclaimer.

#### 10G — Adaptive Difficulty (P1)
- [ ] Three difficulty presets applied to MSEL parameter scaling.
- [ ] Post-session recommendation displayed in AAR.

#### 10H — Enhanced animations (P1)
- [ ] Map particle system refined.
- [ ] Communication waveform animation per channel.
- [ ] Scanline motif on panels.
- [ ] Decision window amber pulse ring.

---

### Phase 11 — P2 Features (Optional)

Do not implement unless all P0 and desired P1 features are complete and the demo is reliable.

- [ ] Supabase persistence (session save/restore).
- [ ] Supabase Realtime multiplayer.
- [ ] AI-generated AAR explanation (server-side only; labelled).
- [ ] Advanced instructor analytics export.
- [ ] Cloud sync.

---

## 4. Dependency Installation Reference

```bash
# Core
npm install next react react-dom typescript
npm install zustand @xstate/react xstate
npm install framer-motion
npm install lucide-react
npm install recharts
npm install zod
npm install idb
npm install seedrandom
npm install @types/seedrandom

# Map
npm install maplibre-gl
npm install @turf/turf

# Audio (P1)
npm install howler @types/howler

# PDF (P1)
npm install jspdf html-to-image

# PWA
npm install next-pwa

# Dev / test
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D @playwright/test
npm install -D eslint eslint-config-next
npm install -D @types/node @types/react @types/react-dom
```

---

## 5. Definition of Done

The SIH demo is ready when all of the following are true:

**P0 mandatory:**

- [ ] `npm install` completes cleanly.
- [ ] `npm run dev` starts without errors.
- [ ] `npm run build` succeeds with zero TypeScript errors.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes with ≥ 90% coverage on simulation engine.
- [ ] `npm run test:e2e` passes (Chromium minimum).
- [ ] Landing page is polished and understandable in ≤ 15 seconds.
- [ ] Scenario (SCN-06) starts and runs the full event sequence.
- [ ] Communication degrades visibly (commHealth bar, map links, feed states).
- [ ] Information confidence changes dynamically and is explained.
- [ ] Decision window opens, action is selectable, rationale is captured.
- [ ] Decision is scored (deterministic, explainable).
- [ ] AAR is generated with dimension scores.
- [ ] Decision Replay opens and reconstructs historical information state.
- [ ] Replay shows no future information at positions before receivedAt.
- [ ] Instructor controls work (all eight injects functional).
- [ ] Offline demo works (DevTools → Offline → full demo flow succeeds).
- [ ] Reset returns simulation to initial state.
- [ ] Historical source attribution visible.
- [ ] Synthetic/historical boundary labels visible.
- [ ] No critical browser console errors.
- [ ] 3-minute demo flow is reliable and repeatable.

---

## 6. Traceability Matrix

Cross-reference from master prompt requirements to implementing document and feature location.

| Master Prompt Requirement | Priority | DESIGN | ARCHITECTURE | SIMULATION | DATA | SECURITY | TESTING | Implementation Phase |
|---|---|---|---|---|---|---|---|---|
| Browser-based training simulator | P0 | §2 | §2 | §1 | — | — | §6.1 | Phase 0 |
| Landing page | P0 | §6 | §3 | — | — | — | §6.1 | Phase 4 |
| Trainee Console | P0 | §7 | §3 | — | — | — | §6.1 | Phase 5 |
| Operational map (MapLibre) | P0 | §8 | §2 | — | §8 | — | §6.1 | Phase 5A |
| Information feed | P0 | §7 | §3 | — | — | — | §5.2, §6.1 | Phase 5B |
| **Information Confidence Engine** | **P0** | **§9, §10** | **§10** | **§3** | **§4.3** | — | **§3.1, §5.1** | **Phase 1B, 5B** |
| ICE: source/timestamp/age/channel/quality/reliability/freshness/consistency/confidence | P0 | §9 | §10 | §3.1 | §4.3 | — | §3.1 | Phase 1B |
| ICE formula (confidence = sr×cq×f×c) | P0 | §10 | §10 | §3.2 | — | — | §3.1 | Phase 1B |
| Q formula (availability×(1-pl)×lf×bf) | P0 | §12 | §10 | §4.2 | — | — | §3.2 | Phase 1B |
| UI explains why confidence changed | P0 | §9, §10 | — | §3.6 | — | — | §3.1, §5.1 | Phase 5B |
| **Decision Replay / Information-State Reconstruction** | **P0** | **§15** | **§8** | **§6** | — | — | **§3.6, §6.1** | **Phase 7B** |
| Replay stores immutable snapshot | P0 | §15 | §8 | §6.2 | — | — | §3.6 | Phase 7B |
| Replay no-future-information guarantee | P0 | §15 | §8 | §6.4 | — | — | §3.6 | Phase 7B |
| Replay timeline scrubber | P0 | §15 | §8 | §6.3 | — | — | §3.6 | Phase 7B |
| Decision panel (10 actions + rationale) | P0 | §11 | §3 | §7 | — | — | §5.2, §6.1 | Phase 5C |
| Deterministic simulation (seeded PRNG) | P0 | — | §15 | §2 | — | — | §3.7 | Phase 1B |
| Communication degradation states (12) | P0 | §12 | §6 | §5 | §4.2 | — | §3.2, §3.3 | Phase 1B, 3B |
| Instructor Control Room | P0 | §13 | §3 | §11 | — | — | §6.2 | Phase 6 |
| Instructor event injection (8 controls) | P0 | §13 | §3 | §11 | — | — | §6.2 | Phase 6 |
| Instructor live metrics | P0 | §13 | §5 | — | — | — | §6.2 | Phase 6 |
| After-Action Review | P0 | §14 | §3 | §7 | — | — | §5.3, §6.1 | Phase 7A |
| AAR: 8 score dimensions | P0 | §14 | — | §7.1 | — | — | §3.5 | Phase 7A |
| AAR: decision timeline | P0 | §14 | — | — | — | — | §6.1 | Phase 7A |
| Scoring: multi-dimensional, not speed-only | P0 | §14 | — | §7 | — | — | §3.5 | Phase 1B |
| Contradiction engine | P0 | §9 | §10 | §10 | §4.4 | — | §7.1 | Phase 5B |
| Offline demo (4 fixture files) | P0 | §22 | §12 | — | §5 | — | §6.3 | Phase 2D, 8 |
| PWA support | P0 | §22 | §12 | — | — | — | §6.3 | Phase 8 |
| Reset / restart | P0 | — | — | §14 | — | — | §7.5, §6.1 | Phase 9 |
| Historical vs synthetic boundary labels | P0 | §23 | — | — | §2 | §2 | — | Phase 2C |
| Data provenance page | P1 | §18 | §3 | — | §9 | — | — | Phase 10E |
| Scenario library (6 scenarios) | P1 | §16 | §3 | §9 | §5 | — | — | Phase 10A–B |
| Scenario builder | P1 | §17 | §3 | — | — | — | — | Phase 10D |
| Audio | P1 | §19 | §2 | — | — | — | — | Phase 10C |
| PDF AAR export | P1 | §14 | §2 | — | — | — | — | Phase 10F |
| Adaptive difficulty (3 levels) | P1 | — | — | §12 | — | — | — | Phase 10G |
| Sophisticated animation (60 FPS) | P1 | §19 | §2 | — | — | — | §9 | Phase 10H |
| Multiplayer (simulated roles) | P2 | — | — | — | — | — | — | Phase 11 |
| Supabase persistence | P2 | — | §13 | — | — | §5 | — | Phase 11 |
| AI-generated AAR | P2 | §23 | §13 | §1 | — | §6 | — | Phase 11 |
| Safety boundary (no real military data) | P0 | §23 | — | §1 | §2 | §2 | — | All phases |
| No API key required for demo | P0 | — | §14 | — | — | §3 | — | Phase 0 |
| No backend required for demo | P0 | — | §13 | — | — | §5 | — | Phase 0 |
| Accessibility (keyboard, ARIA, contrast) | P0 | §20 | — | — | — | — | §6.4 | Phases 4–7 |
| Responsive design (1366–1920 px) | P0 | §21 | — | — | — | — | §8 | All UI phases |
| Source attribution (manifest.json) | P1 | §18 | §3 | — | §3, §7 | — | — | Phase 2A |

---

*Document version: 1.0 — October 2026*
