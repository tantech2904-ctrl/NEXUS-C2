# NEXUS-C2 — AGENT INSTRUCTIONS

## 1. Project Identity

**Project:** NEXUS-C2  
**SIH Problem:** SIH26248 — Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments  
**Tagline:** DECIDE UNDER UNCERTAINTY.

NEXUS-C2 is a browser-based, deterministic command-training simulator for decision-making when information becomes delayed, incomplete, stale, contradictory, or unavailable.

It is a **synthetic training environment**, not an operational military command system.

The target is a polished Smart India Hackathon 2026 demonstration that a judge can understand in approximately 15 seconds and experience end-to-end in approximately 3 minutes.

---

## 2. Source-of-Truth Hierarchy

Use this priority order:

1. Approved NEXUS-C2 master prompt/specification.
2. `NEXUS-C2_AGENT_DATA_SOURCES_AND_INSTRUCTIONS.md`
3. `DESIGN.md`
4. `ARCHITECTURE.md`
5. `SIMULATION.md`
6. `DATA.md`
7. `SECURITY.md`
8. `TESTING.md`
9. `IMPLEMENTATION.md`
10. Existing source code.

If documents conflict, resolve the conflict in favor of the higher-priority source. Do not silently redesign the product.

---

## 3. Core Experience

The application must implement this loop:

1. Start scenario.
2. Information appears reliable.
3. Communication/environmental degradation occurs.
4. Information becomes delayed, stale, missing, or contradictory.
5. Trainee assesses information quality.
6. Trainee selects an action.
7. Trainee provides a rationale.
8. Simulation produces abstract consequences and a score.
9. After-Action Review explains performance.
10. Decision Replay reconstructs exactly what the trainee knew at the decision moment.

The defining question is:

> **What did the trainee know when they made the decision?**

---

## 4. Mandatory Signature Features

### Information Confidence Engine

Every meaningful information item must support:

- source
- timestamp
- age/staleness
- channel
- channel quality
- source reliability
- freshness
- consistency
- verification state
- confidence

Baseline simulator heuristic:

```text
confidence =
    sourceReliability
    × communicationQuality
    × freshness
    × consistency
```

Communication quality may be represented as:

```text
Q =
    availability
    × (1 - packetLoss)
    × latencyFactor
    × bandwidthFactor
```

These are **simulator heuristics, not official military doctrine**.

The UI must explain why confidence changes.

### Decision Replay / Information-State Reconstruction

Every major decision must store an immutable snapshot containing, as applicable:

- simulation time
- map state
- communication/network state
- available and unavailable reports
- report timestamps and age
- confidence values
- contradictions
- source reliability
- environment
- active degradation
- decision options
- selected action
- rationale
- score components

Replay must never reveal information that was unavailable at the original decision timestamp.

Provide a replay button and timeline/scrubber.

---

## 5. Determinism

Core simulation behavior must be deterministic.

Given:

```text
scenarioId
scenarioVersion
seed
initialState
event sequence
trainee actions
```

the simulation should reproduce the same state, outcomes, scores, and replay snapshots.

Use a seeded PRNG if randomness is required. Do not use uncontrolled `Math.random()` for simulation-critical behavior.

---

## 6. Technical Direction

Preferred stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- XState or an explicit deterministic state machine
- MapLibre GL JS
- Turf.js
- Framer Motion
- Recharts
- Lucide
- Zod
- Web Audio API or Howler.js
- IndexedDB/localStorage where useful
- Web Workers only where needed
- PWA/offline support where practical

Optional backend:

- Supabase Realtime/Postgres

The demo must work **without a backend or API key**. Do not add infrastructure without a concrete need.

---

## 7. Architecture Rules

Keep these concerns separate:

```text
UI
↓
Application/orchestration
↓
Simulation engine
↓
Scenario definitions
↓
Data adapters / normalized data
```

Do not put simulation logic inside React components.

Do not put scoring logic inside presentation components.

Keep scenario definitions data-driven.

Keep historical source data separate from synthetic scenario state.

Prefer pure/testable functions for:

- confidence calculation
- communication quality
- freshness
- consistency
- degradation transitions
- scoring
- replay reconstruction

Use typed domain models and validate scenario/external data with Zod or equivalent.

---

## 8. Core Simulation States

Communication:

```text
NORMAL
MINOR_DELAY
HIGH_LATENCY
PARTIAL_DROPOUT
SEVERE_DROPOUT
STALE_INFORMATION
CONTRADICTORY_REPORTS
PARTIAL_SENSOR_LOSS
RELAY_FAILURE
BANDWIDTH_CONGESTION
RECOVERY
RECOVERED
```

Information:

```text
CONFIRMED
LIKELY
UNCERTAIN
STALE
CONTRADICTED
UNAVAILABLE
```

Training actions may include:

```text
ASSESS
VERIFY
CONTINUE
PAUSE
REQUEST_UPDATE
SWITCH_INFORMATION_CHANNEL
ESCALATE
RECONFIGURE_TEAM_COORDINATION
STAND_BY
ADAPT_PLAN
```

These are abstract training actions, not official doctrine.

---

## 9. Trainee Console

Header:

- scenario ID
- session ID
- training clock
- mission phase
- communication health
- information integrity
- system status

Main area:

- operational map
- information feed
- decision panel
- communication/network state
- timeline/event indicator

Use fictional entities:

- command node
- relay
- field team
- observation node
- support node
- communication links
- uncertainty areas
- degraded zones
- route corridors

Do not use real military dispositions, sensitive coordinates, or operational plans.

Communication visualization should visibly change with state:

- healthy: stable links and packet flow
- degraded: slower/intermittent packets
- offline: broken links
- uncertain: flicker/uncertainty indicators
- contradiction: visibly conflicting reports

---

## 10. Instructor Control Room

Support:

- trainee-state view
- pause/resume
- latency injection
- packet loss/dropout
- contradictory reports
- feed disable/restore
- environmental changes
- decision-window trigger

Metrics:

- score
- decision latency
- decisions made
- information consulted
- contradiction handling
- communication adaptation
- coordination
- unresolved uncertainty

---

## 11. Scenario Builder

Where implemented, support:

- scenario name
- training objective
- environment
- communication baseline
- degradation parameters
- information density
- contradiction probability
- delay
- dropout
- recovery model
- decision windows
- scoring weights
- historical reference

Also support save, duplicate, JSON export/import, and timeline editing where feasible.

---

## 12. After-Action Review

AAR should provide:

- overall score
- dimension scores
- decision timeline
- information available at each decision
- communication quality
- trainee decision
- rationale
- outcome
- missed/ignored uncertainty
- adaptation behavior

Possible dimensions:

- decision quality
- timeliness
- information discipline
- source evaluation
- communication resilience
- coordination
- risk management
- adaptability

Do not reward speed blindly.

---

## 13. Visual Design

Target:

**Modern military command-training / professional C2 simulator / high-end mission simulator.**

Do not make it:

- cyberpunk
- hacker-themed
- RGB gaming UI
- esports HUD
- generic SaaS dashboard
- excessively neon

Use:

- near-black graphite
- charcoal panels
- restrained amber alerts
- muted cyan information accents
- red only for urgent states
- white/grey typography
- thin borders
- subtle grid/scanline motifs
- restrained glow
- tactical map/grid motifs
- waveform/packet-flow animation

No real military insignia.

Animation should communicate state rather than merely decorate the interface.

---

## 14. Performance

Target approximately 60 FPS on a modern laptop.

Use Framer Motion for UI transitions. For large animated object counts, prefer efficient rendering/requestAnimationFrame/canvas techniques.

Avoid unnecessary continuous React re-renders.

---

## 15. Offline Demo

The application must have a complete local fallback.

Recommended fixtures:

```text
demo-scenario.json
demo-map.geojson
demo-events.json
demo-communications.json
```

The core demo must work without internet access and must not depend on a live public API.

Never require manual download of huge datasets just to run the project.

---

## 16. Historical vs Synthetic Boundary

Public/historical data may be used for:

- environmental calibration
- communications-disruption calibration
- scenario context
- provenance
- educational/historical grounding

Scenario entities, routes, objectives, callsigns, decisions, network topology, and operational events must be synthetic.

Never introduce:

- classified information
- real military dispositions
- targeting workflows
- weapons employment
- real operational plans
- sensitive command procedures
- sensitive facility coordinates

Use labels:

> HISTORICAL BASIS — PUBLIC DATA

and:

> Command entities and scenario injects are synthetic training constructs.

---

## 17. Safety Boundary

Do not turn NEXUS-C2 into an operational military planning system.

Do not implement real-world targeting, weapons employment, attack optimization, real unit deployment planning, sensitive intelligence fusion, or real operational command procedures.

The simulator should demonstrate information discipline, resilience, uncertainty management, and decision quality.

---

## 18. Data Provenance

Every public source actually used must have traceable metadata:

```text
sourceName
organization
sourceURL
publicationDate
datasetVersion
retrievalDate
purpose
license
processingMethod
usedInScenarios
```

Never fabricate source details or claim a dataset was used when it was not.

---

## 19. Development Priority

### P0 — Must work

- landing page
- trainee console
- operational map
- communication degradation
- information confidence engine
- information feed
- decision panel
- rationale
- deterministic simulation
- scoring
- AAR
- Decision Replay
- instructor event injection
- offline demo
- reset/restart

### P1 — Polish

- sophisticated animation
- audio
- scenario library
- scenario builder
- PDF export
- provenance page
- historical calibration panels
- adaptive difficulty
- richer instructor analytics

### P2 — Optional

- multiplayer
- Supabase persistence
- AI-generated AAR
- advanced authoring
- cloud synchronization
- advanced analytics

Never sacrifice P0 for P1/P2.

---

## 20. AI Usage

Allowed:

- AAR explanation
- instructor summaries
- scenario narrative generation
- adaptive difficulty suggestions

Not allowed:

- autonomous operational recommendations
- automatic modification of core simulation state
- real-world military advice
- hidden AI decisions that affect scoring

AI-generated analysis must be labeled. Core simulation behavior remains deterministic.

---

## 21. Testing

At minimum test:

- scenario loading
- reset
- deterministic seed behavior
- latency
- packet loss
- dropout
- recovery
- stale information
- contradiction handling
- confidence calculation
- scoring
- decision snapshot creation
- replay reconstruction
- no-future-information leakage
- AAR
- instructor event injection

Also test:

- desktop layouts
- keyboard navigation
- reduced motion
- accessibility
- performance
- browser console errors
- production build

A feature is not complete merely because TypeScript compiles.

---

## 22. Browser QA

Before completion:

1. Run production build.
2. Start production server.
3. Open in a real browser.
4. Execute the complete demo flow.
5. Check console errors.
6. Check responsive behavior.
7. Check performance.
8. Trigger major degradation modes.
9. Make a decision and rationale.
10. Open AAR.
11. Replay the decision.
12. Verify replay contains only information available at that time.
13. Reset and repeat.

---

## 23. Code Quality

Prefer:

- cohesive modules
- explicit types
- pure domain functions
- descriptive names
- predictable state transitions
- reusable components
- schema validation
- testable business logic

Avoid:

- giant components
- duplicated simulation logic
- hidden global state
- magic numbers
- uncontrolled timers
- mutable replay snapshots
- unnecessary dependencies
- fake functionality presented as complete

---

## 24. Definition of Done

The SIH demo is ready when:

- project installs cleanly
- dev server starts
- production build succeeds
- landing page is polished
- scenario starts
- communication degrades
- information confidence visibly changes
- trainee can decide
- rationale is captured
- scoring works
- AAR works
- Decision Replay works
- instructor controls work
- offline demo works
- no critical browser errors remain
- 3-minute demo is reliable
- sources are attributed
- synthetic/historical boundaries are clear

Final product message:

> **NEXUS-C2 is not training people when information is perfect. It is training decision-making when information becomes unreliable.**
