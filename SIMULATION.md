# NEXUS-C2 — SIMULATION SPECIFICATION

> **Document priority:** 5 of 10 in the source-of-truth hierarchy.  
> Defer to master prompt, data sources doc, DESIGN.md, and ARCHITECTURE.md on all conflicts.

---

## 1. Simulation Philosophy

NEXUS-C2 simulates the **information environment**, not physical events. The engine models:

- How communication channels degrade over time.
- How degraded channels reduce the confidence of information items.
- How the trainee's decisions interact with an evolving, uncertain information landscape.
- How deterministic scoring measures decision quality across multiple dimensions.

> **Disclaimer:** All formulas and state-transition models are **simulator training heuristics**. They are not official military doctrine, intelligence standards, or operational procedures.

---

## 2. Determinism Guarantee

Given the same tuple:

```
(scenarioId, scenarioVersion, seed, initialState, eventSequence, traineeActions)
```

the simulation produces identical:
- channel quality values at every tick.
- information confidence values at every tick.
- degradation state transitions.
- outcome scores.
- `DecisionSnapshot` objects.

**Rules enforced by the engine:**
- All stochastic variation uses `seedrandom` seeded with `scenario.seed`.
- `Math.random()` is never called directly in simulation-critical paths.
- Event processing order is deterministic: MSEL events sorted by `time ASC`, instructor injects appended in received order.
- No wall-clock time dependency in simulation logic; only simulation ticks are used.

---

## 3. Information Confidence Engine (ICE) — P0

This is a mandatory signature feature.

### 3.1 InformationItem model

Every meaningful information item in the simulation carries:

```typescript
interface InformationItem {
  id: string
  sourceName: string                   // e.g., "FIELD TEAM ALPHA"
  sourceType: 'FIELD_REPORT' | 'OBSERVATION' | 'RELAY' | 'SENSOR' | 'COMMAND'
  channelId: string                    // references a CommunicationChannel
  timestamp: number                    // simulation tick when the report was generated
  receivedAt: number                   // simulation tick when it arrived at the trainee
  content: string                      // human-readable report text
  location?: GeoJSON.Point             // optional position data
  sourceReliability: number            // [0,1] — set in scenario definition
  freshness: number                    // [0,1] — computed; decreases with age
  consistency: number                  // [0,1] — computed; reduced by contradictions
  channelQuality: number               // [0,1] — live Q value of associated channel
  confidence: number                   // [0,1] — computed composite
  verification: InformationStatus
  contradictionGroupId?: string        // links contradicting items
  ageSeconds: number                   // derived: (currentTick - timestamp) / 1000
}

type InformationStatus =
  | 'CONFIRMED'
  | 'LIKELY'
  | 'UNCERTAIN'
  | 'STALE'
  | 'CONTRADICTED'
  | 'UNAVAILABLE'
```

### 3.2 Confidence calculation

```
confidence = clamp(sourceReliability × channelQuality × freshness × consistency, 0, 1)
```

All four factors are `[0, 1]`.

This formula is applied every simulation tick for every active `InformationItem`.

### 3.3 Freshness calculation

```
freshness = exp(-λ × ageSeconds)
```

Where `λ` (decay rate) is set per scenario. Default: `λ = 0.01` (half-life ≈ 69 seconds).

A confirmed update arriving resets `timestamp`, resetting `ageSeconds` to 0.

### 3.4 Consistency calculation

```
consistency = 1.0   (no contradiction)
consistency = 0.5   (one contradicting item present)
consistency = 0.25  (two or more contradicting items)
```

When two items share a `contradictionGroupId`, each gets `consistency ≤ 0.5`.

### 3.5 Status derivation

| Condition | Status |
|---|---|
| `confidence ≥ 0.80` and age < staleness threshold | `CONFIRMED` |
| `confidence ≥ 0.65` | `LIKELY` |
| `confidence ≥ 0.40` | `UNCERTAIN` |
| `ageSeconds > scenario.stalenessThresholdSeconds` | `STALE` |
| `contradictionGroupId` set and `consistency < 0.5` | `CONTRADICTED` |
| Channel `OFFLINE` and no local cache | `UNAVAILABLE` |

Rules are evaluated in priority order: UNAVAILABLE > CONTRADICTED > STALE > UNCERTAIN > LIKELY > CONFIRMED.

### 3.6 UI requirement

The UI **must** show, for every card:
- All four ICE factors with their current numeric values.
- The computed `confidence` as a percentage bar.
- The `verification` status badge.
- A human-readable explanation of why confidence changed (the "Why lower" line).

See DESIGN.md §9 for the Confidence Card layout.

---

## 4. Communication Quality Model (P0)

### 4.1 CommunicationChannel model

```typescript
interface CommunicationChannel {
  id: string
  name: string                          // e.g., "PRIMARY DATA LINK"
  type: 'PRIMARY' | 'SECONDARY' | 'RADIO' | 'SATELLITE' | 'FALLBACK' | 'FIELD'
  availability: number                  // [0,1]
  packetLoss: number                    // [0,1]
  latencyMs: number                     // milliseconds
  bandwidthFactor: number               // [0,1]
  status: CommunicationDegradationState
  lastSuccessfulContactTick: number
  channelQuality: number                // computed Q
}
```

### 4.2 Channel quality formula

```
Q = availability × (1 − packetLoss) × latencyFactor × bandwidthFactor
```

**latencyFactor** mapping:

| Latency | latencyFactor |
|---|---|
| < 100 ms | 1.00 |
| 100–299 ms | 0.90 |
| 300–599 ms | 0.75 |
| 600–999 ms | 0.60 |
| 1000–1999 ms | 0.40 |
| ≥ 2000 ms | 0.20 |

All values are clamped to `[0, 1]`.

### 4.3 Aggregate communication health

```
commHealth = mean(Q) across all active channels
```

Displayed as a percentage bar in the header.

### 4.4 Aggregate information integrity

```
infoIntegrity = mean(confidence) across all non-UNAVAILABLE InformationItems
```

Displayed as a percentage bar in the header.

---

## 5. Degradation State Machine (P0)

### 5.1 Communication degradation states

```
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

States can be combined per channel (e.g., `HIGH_LATENCY` and `STALE_INFORMATION` simultaneously).

### 5.2 State-to-parameter mappings

| State | Availability | Packet loss | Latency multiplier |
|---|---|---|---|
| NORMAL | 1.00 | 0.00 | 1.0× |
| MINOR_DELAY | 1.00 | 0.02 | 1.5× |
| HIGH_LATENCY | 0.95 | 0.10 | 3.0× |
| PARTIAL_DROPOUT | 0.70 | 0.30 | 4.0× |
| SEVERE_DROPOUT | 0.30 | 0.65 | 8.0× |
| STALE_INFORMATION | 0.85 | 0.05 | 2.0× (items age faster) |
| CONTRADICTORY_REPORTS | 1.00 | 0.00 | 1.0× (consistency reduced) |
| PARTIAL_SENSOR_LOSS | 0.60 | 0.20 | 2.5× |
| RELAY_FAILURE | 0.10 | 0.80 | 10.0× |
| BANDWIDTH_CONGESTION | 0.90 | 0.25 | 2.0× |
| RECOVERY | ramping ↑ | ramping ↓ | ramping ↓ |
| RECOVERED | 1.00 | 0.00 | 1.0× |

Recovery ramping: linear interpolation over `scenario.recoveryDurationSeconds`.

### 5.3 Degradation transition rules

- Transitions are triggered by MSEL events or instructor injects.
- Transitions are evaluated by `degradationMachine` (XState).
- Seeded PRNG governs any stochastic variation (e.g., partial recovery amount).
- Channel transitions are independent per channel.

---

## 6. Decision Replay / Information-State Reconstruction (P0)

This is a mandatory signature feature. See ARCHITECTURE.md §8 for the data model.

### 6.1 State snapshot cadence

A `StateSnapshot` is written every 1 simulation-second to an in-memory append-only array. At a 3-minute demo session with 1× speed, this is ~180 snapshots — negligible memory footprint.

### 6.2 DecisionSnapshot creation

When a decision is submitted, the engine calls:

```typescript
function createDecisionSnapshot(
  state: StateSnapshot,
  action: DecisionAction,
  rationale: string,
  scoreComponents: ScoreComponents
): DecisionSnapshot
```

The snapshot:
- Deep-copies and `Object.freeze`s the current `StateSnapshot`.
- Records which `InformationItem` IDs were unavailable at this tick (for replay filtering).
- Is appended to `sessionStore.decisions` — **never mutated after creation**.

### 6.3 Replay reconstruction

```typescript
function reconstructStateAtTick(
  snapshots: StateSnapshot[],
  targetTick: number
): StateSnapshot
```

Returns the snapshot whose `tick` is ≤ `targetTick`. Filters `informationItems` to exclude any item with `receivedAt > targetTick`. This is the **no-future-information guarantee**.

The replay viewer calls `reconstructStateAtTick` on every scrubber position change.

### 6.4 Replay constraints

- Replay may not show items with `receivedAt > targetTick`.
- Replay may not show events with `timestamp > targetTick`.
- Communication channel states are reconstructed from the snapshot, not the live state.
- Replay is read-only; no simulation state is modified.

---

## 7. Scoring Engine (P0)

### 7.1 Score dimensions

| Dimension | What it measures |
|---|---|
| Decision Quality | Whether the selected action was appropriate for the information state |
| Timeliness | Time from decision window open to submission (penalises only extreme delays) |
| Information Discipline | Whether the trainee assessed available confidence before deciding |
| Source Evaluation | Whether the trainee's rationale references source reliability |
| Communication Resilience | Whether the trainee adapted to degraded channels |
| Coordination | Whether the decision involved appropriate escalation/team action |
| Risk Management | Whether uncertainty was acknowledged |
| Adaptability | Whether the trainee changed approach as conditions evolved |

Each dimension: `[0, 100]`. Overall score: weighted mean.

### 7.2 Scoring formula

```
overallScore = Σ (dimensionWeight[d] × dimensionScore[d])
```

Default weights (scenario-configurable):

| Dimension | Default weight |
|---|---|
| Decision Quality | 0.25 |
| Timeliness | 0.10 |
| Information Discipline | 0.20 |
| Source Evaluation | 0.10 |
| Communication Resilience | 0.15 |
| Coordination | 0.05 |
| Risk Management | 0.10 |
| Adaptability | 0.05 |

> Weights sum to 1.0.

### 7.3 Scoring rules

- Speed is **not** the primary metric. A fast decision based on low-confidence information loses `Decision Quality` and `Information Discipline` points.
- A slower, well-justified decision referencing high source reliability may outscore a reflexive response.
- Timeliness scoring: full marks within the nominal window; linear penalty for delays beyond 2× the window duration.
- Rationale is analysed for keyword signals (source reliability, contradiction acknowledgement, uncertainty flagging). This is deterministic keyword matching, not AI.

### 7.4 Outcome classes

After scoring, the engine assigns one of four abstract outcome classes:

| Class | Condition |
|---|---|
| POSITIVE | `overallScore ≥ 75` |
| NEUTRAL | `overallScore ≥ 55` |
| SUBOPTIMAL | `overallScore ≥ 35` |
| HIGH_RISK | `overallScore < 35` |

Outcome text is templated per scenario. No real-world military predictions are made.

---

## 8. Scenario MSEL Structure (P0)

Each scenario is a JSON file defining a Master Scenario Event List (MSEL).

### 8.1 Event types

| Type | Effect |
|---|---|
| `LATENCY` | Increases latency on target channel |
| `PACKET_LOSS` | Increases packet loss on target channel |
| `DROPOUT` | Takes target channel offline |
| `RELAY_FAILURE` | Sets RELAY_FAILURE on target channel |
| `SENSOR_LOSS` | Removes observation node from map |
| `CONTRADICTION` | Fires a contradicting InformationItem |
| `STALE_INFORMATION` | Sets items on target channel to STALE |
| `BANDWIDTH_CONGESTION` | Increases congestion on target channel |
| `RECOVERY` | Begins recovery ramp on target channel |
| `CUSTOM` | Fires a custom scenario inject (payload in event data) |

### 8.2 Decision windows

```typescript
interface DecisionWindow {
  id: string
  openAtTick: number           // simulation ms
  duration: number             // ms the window stays open
  situation: string            // brief for the decision panel
  scoringWeightOverride?: Partial<ScoringWeights>
}
```

### 8.3 Scenario example structure

```json
{
  "id": "SCN-06",
  "version": "1.0.0",
  "title": "BLACKOUT / INFORMATION FOG",
  "historicalBasis": null,
  "syntheticDisclaimer": "Command entities and scenario injects are synthetic training constructs.",
  "difficulty": "EXPERT",
  "seed": 42,
  "environment": { "type": "NEUTRAL", "weatherSeverity": 0.0 },
  "entities": [ ... ],
  "communicationChannels": [
    { "id": "ch-primary", "name": "PRIMARY DATA LINK", "type": "PRIMARY", ... },
    { "id": "ch-secondary", "name": "SECONDARY RADIO", "type": "RADIO", ... },
    { "id": "ch-fallback", "name": "FALLBACK LINK", "type": "FALLBACK", ... }
  ],
  "initialConditions": { "commHealth": 0.96, "infoIntegrity": 0.94 },
  "events": [
    { "id": "ev-01", "time": 20000, "type": "LATENCY", "target": "ch-primary", "severity": 0.5 },
    { "id": "ev-02", "time": 30000, "type": "PACKET_LOSS", "target": "ch-primary", "severity": 0.4 },
    { "id": "ev-03", "time": 45000, "type": "CONTRADICTION", "target": null, "severity": 0.7 },
    { "id": "ev-04", "time": 60000, "type": "RELAY_FAILURE", "target": "ch-secondary", "severity": 1.0 }
  ],
  "decisionWindows": [
    { "id": "dw-01", "openAtTick": 70000, "duration": 30000, "situation": "..." }
  ],
  "scoring": { "weights": { ... } },
  "sources": []
}
```

---

## 9. Six Demo Scenarios (P0 for SCN-06; P1 for others)

| ID | Title | Historical basis | Key mechanic | Priority |
|---|---|---|---|---|
| SCN-01 | MARIA // COMMUNICATIONS SHOCK | FCC Hurricane Maria reports | Progressive infrastructure collapse + partial recovery | P1 |
| SCN-02 | ANATOLIA // PARTIAL RESILIENCE | ITU/EBU Türkiye 2023 | Mixed-quality multi-channel evaluation | P1 |
| SCN-03 | CHILE // FALLBACK WINDOW | ITU Chile 2010 | Primary fails; trainee switches to fallback | P1 |
| SCN-04 | STORM CORRIDOR | NOAA IBTrACS public track | Progressive storm-driven degradation | P1 |
| SCN-05 | SEISMIC WINDOW | USGS earthquake public data | Relay instability + contradictory reports | P1 |
| SCN-06 | BLACKOUT / INFORMATION FOG | Fully synthetic | Multi-stage blackout — main demo scenario | **P0** |

SCN-06 must be complete and reliable for the 3-minute judge demonstration.

---

## 10. Contradiction Engine (P0)

### Injection mechanics
A MSEL `CONTRADICTION` event fires two `InformationItem`s with the same `contradictionGroupId` and conflicting `content`.

Example:
```
T+02:44  FIELD REPORT: "ROUTE STATUS NOMINAL"
T+02:49  OBSERVATION FEED: "OBSTRUCTION POSSIBLE"
T+02:56  RELAY: "ROUTE STATUS UNKNOWN"
```

All three share `contradictionGroupId: "cg-route-7"`.

### Effects
- `consistency` of all items in the group drops to ≤ 0.5.
- `status` of affected items changes to `CONTRADICTED`.
- Map shows alternating position estimates for affected entities.
- Decision panel situation brief updates to note the contradiction.

### Scoring impact
- If the trainee selects VERIFY or REQUEST_UPDATE when contradiction is active: bonus to `Information Discipline` and `Source Evaluation`.
- If the trainee selects CONTINUE despite contradiction: penalty to `Risk Management`.

---

## 11. Instructor Event Injection (P0)

Instructor injects mirror MSEL event types but are queued at runtime:

```typescript
interface InstructorInject extends ScenarioInject {
  injectedByInstructor: true
  injectedAtTick: number
}
```

Injects are appended to `simulationStore.activeInjects` and processed on the next simulation tick.

All injects are reversible:
- Latency / packet loss injects: reversed by a corresponding RECOVERY inject.
- DROPOUT injects: reversed by RECOVERY.
- CONTRADICTION injects: can be resolved by a CONFIRMED follow-up item.
- DISABLE FEED injects: reversed by RESTORE FEED.

---

## 12. Adaptive Difficulty (P1)

Three built-in difficulty presets configuring MSEL parameters:

| Preset | Contradiction prob | Decision window | Channel availability |
|---|---|---|---|
| FOUNDATION | 10% | 60 s | ≥ 0.80 |
| ADVANCED | 30% | 30 s | ≥ 0.50 |
| EXPERT | 60% | 15 s | ≥ 0.20 |

After each session, the engine computes a recommendation:

```
if overallScore ≥ 80 → recommend INCREASE
if overallScore 50–79 → recommend MAINTAIN
if overallScore < 50 → recommend REDUCE
```

Recommendation is displayed in AAR; no automatic state change without trainee confirmation.

---

## 13. Simulation Speed Controls (P0)

| Setting | Simulation tick rate |
|---|---|
| 0.5× | 1 sim-second = 2 real-seconds |
| 1× | 1 sim-second = 1 real-second |
| 2× | 1 sim-second = 0.5 real-seconds |
| 5× | 1 sim-second = 0.2 real-seconds |
| PAUSE | Tick advancement halted |

Speed is controlled by the instructor or trainee. All scheduled events scale with the multiplier. Snapshot cadence stays at 1 sim-second regardless of speed.

---

## 14. Session Lifecycle

```
SCENARIO SELECTED
      │
      ▼
LOADING (validate JSON, init stores, seed PRNG)
      │
      ▼
BRIEFING (show scenario overview, historical basis, entities)
      │
      ▼
RUNNING (simulation tick loop, event processing, ICE updates)
      │
      ├─ DECISION_WINDOW opens
      │         │
      │         ▼
      │    TRAINEE SELECTS ACTION + RATIONALE
      │         │
      │         ▼
      │    SUBMITTED (snapshot created, score calculated)
      │         │
      │         ▼
      │    OUTCOME SHOWN (abstract consequence + score preview)
      │         │
      │         ▼
      │    RESUME RUNNING
      │
      ▼
COMPLETE (all decision windows exhausted or time limit reached)
      │
      ▼
AAR GENERATED (full score, timeline, replay data available)
      │
      ▼
[RESET] → returns to SCENARIO SELECTED
```

---

*Document version: 1.0 — October 2026*
