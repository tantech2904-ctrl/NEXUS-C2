# NEXUS-C2 — TESTING SPECIFICATION

> **Document priority:** 8 of 10 in the source-of-truth hierarchy.  
> Defer to master prompt, data sources doc, DESIGN.md, ARCHITECTURE.md, SIMULATION.md, DATA.md, and SECURITY.md on all conflicts.

---

## 1. Testing Philosophy

> A feature is not complete merely because TypeScript compiles.

Testing in NEXUS-C2 is mandatory, not optional polish. The simulation engine, confidence calculations, replay reconstruction, and scoring are pure functions — they are the most testable part of the application and must have the highest coverage.

**Coverage targets:**
- `src/lib/simulation/*`: ≥ 90% line coverage.
- `src/lib/data/*Adapter.ts`: ≥ 85% line coverage.
- `src/components/*`: ≥ 60% line coverage (behaviour tests, not snapshot tests).
- E2E: the complete 3-minute demo flow passes without error.

---

## 2. Test Stack

| Layer | Tool |
|---|---|
| Unit / integration | Vitest |
| React component | React Testing Library |
| E2E / browser | Playwright |
| Coverage | Vitest with V8 coverage |
| CI | GitHub Actions (on push and PR) |

---

## 3. Unit Tests — Simulation Engine (P0)

All tests in `tests/unit/`. All simulation functions are pure — no mocking required.

### 3.1 Information Confidence Engine (`confidence.test.ts`)

| Test | Assertion |
|---|---|
| Baseline confidence calculation | `calculateConfidence({sr:0.9, cq:0.9, f:0.9, c:0.9})` returns ≈ 0.656 |
| Confidence clamps to [0,1] | Values exceeding 1.0 are clamped |
| Freshness decay over time | Confidence decreases as `ageSeconds` increases |
| Consistency drops on contradiction | Adding contradicting item lowers `consistency` to ≤ 0.5 |
| Channel quality affects confidence | Lowering `channelQuality` proportionally lowers `confidence` |
| CONFIRMED status threshold | Item with confidence ≥ 0.80 and fresh returns `CONFIRMED` |
| STALE status threshold | Item older than scenario staleness threshold returns `STALE` regardless of confidence |
| CONTRADICTED status | Item with `contradictionGroupId` and consistency < 0.5 returns `CONTRADICTED` |
| UNAVAILABLE status | Item with offline channel returns `UNAVAILABLE` |
| Why-lower explanation populated | `explainConfidenceChange()` returns a non-empty string for each change |
| Determinism across repeated calls | Same inputs produce identical outputs |

### 3.2 Communication Quality (`communication.test.ts`)

| Test | Assertion |
|---|---|
| Nominal Q calculation | `calculateQ({a:1,pl:0,lf:1,bf:1})` returns 1.0 |
| Packet loss reduces Q | Q decreases as `packetLoss` increases |
| High latency reduces Q | Latency 600 ms → `latencyFactor` 0.60 |
| Zero availability → Q = 0 | Channel offline |
| Q clamps to [0,1] | No overflow |
| Aggregate commHealth | Mean of Q across channels computed correctly |
| Recovery ramp produces intermediate Q | Linear interpolation from degraded → nominal over duration |

### 3.3 Degradation State Machine (`degradation.test.ts`)

| Test | Assertion |
|---|---|
| Initial state is NORMAL | Fresh channel starts at NORMAL |
| NORMAL → MINOR_DELAY transition | LATENCY inject fires correct transition |
| MINOR_DELAY → HIGH_LATENCY | Escalation path |
| HIGH_LATENCY → PARTIAL_DROPOUT | Escalation path |
| PARTIAL_DROPOUT → SEVERE_DROPOUT | Escalation path |
| RELAY_FAILURE → RECOVERY → RECOVERED | Recovery path |
| CONTRADICTION inject fires correctly | State changes to CONTRADICTORY_REPORTS |
| SENSOR_LOSS hides entity | PARTIAL_SENSOR_LOSS state removes entity from feed |
| Instructor inject overrides MSEL event | Inject processed on next tick |
| Reverse inject restores state | RECOVERY inject after DROPOUT returns to NORMAL |
| Seeded PRNG: identical seed produces identical transition timing | Determinism |

### 3.4 Scenario Loading (`scenario.test.ts`)

| Test | Assertion |
|---|---|
| Valid SCN-06 JSON loads without error | `loadScenario(scn06)` succeeds |
| Missing required field throws ZodError | Invalid JSON fails gracefully |
| Events are sorted by time ascending | MSEL processed in correct order |
| Duplicate event IDs detected | Schema validation fails with clear error |
| Historical scenario has `syntheticDisclaimer` | Required field present |
| Offline fallback scenario loads | `demo-scenario.json` passes schema |
| Scenario seed is preserved through load | `seed` field unchanged |

### 3.5 Scoring (`scoring.test.ts`)

| Test | Assertion |
|---|---|
| VERIFY action with active contradiction → bonus to Information Discipline | Score > baseline |
| CONTINUE action with low confidence → penalty to Risk Management | Score < baseline |
| Fast decision with good info → high Timeliness score | |
| Slow decision with good justification ≥ reflexive poor decision | No speed reward without quality |
| Rationale with source-quality keywords → Source Evaluation bonus | Keyword matching |
| Overall score is weighted mean of dimensions | Arithmetic check |
| Scoring is deterministic | Same inputs → same output |
| Outcome class thresholds | ≥75→POSITIVE, ≥55→NEUTRAL, ≥35→SUBOPTIMAL, <35→HIGH_RISK |
| Default weights sum to 1.0 | Invariant |
| Custom scenario weights applied | Weight override from scenario JSON |

### 3.6 Decision Replay (`replay.test.ts`)

| Test | Assertion |
|---|---|
| Snapshot is created on decision submission | `DecisionSnapshot.tick` matches decision tick |
| Snapshot is immutable (Object.frozen) | Attempting to mutate throws TypeError |
| Replay at decision tick returns correct state | `reconstructStateAtTick(snapshots, decisionTick)` |
| No-future-information guarantee | Items with `receivedAt > targetTick` are excluded from replay |
| Replay at T+0 returns initial state | Boundary condition |
| Replay between two snapshots returns earlier one | Correct floor behaviour |
| Multiple decisions produce multiple snapshots | Append-only array grows |
| Replay does not modify live simulation state | Store remains unchanged |
| Contradictions at replay time match original | Consistent reconstruction |
| Unavailable item IDs list populated correctly | Items not received at snapshot time recorded |

### 3.7 Seeded PRNG (`prng.test.ts`)

| Test | Assertion |
|---|---|
| Same seed → identical sequence of 1000 values | Determinism |
| Different seeds → different sequences | Uniqueness |
| `Math.random()` is not called in simulation paths | Grep-based audit (optional linter rule) |

---

## 4. Data Adapter Tests (P0)

Located in `tests/unit/data/`.

| Test file | Tests |
|---|---|
| `fccHistoricalAdapter.test.ts` | Parses FCC reference fixture correctly; invalid input throws |
| `ituHistoricalAdapter.test.ts` | Channel availability percentages extracted correctly |
| `noaaStormAdapter.test.ts` | Storm event metadata parsed to EnvironmentEvent |
| `ibtracsAdapter.test.ts` | GeoJSON track output is valid GeoJSON |
| `usgsAdapter.test.ts` | Earthquake event metadata parsed to EnvironmentEvent |
| `osmAdapter.test.ts` | GeoJSON region output passes schema |

---

## 5. React Component Tests (P0 components)

Located in `tests/unit/components/`. Use React Testing Library; test behaviour, not snapshots.

### 5.1 ConfidenceCard

| Test |
|---|
| Renders source name, channel, and age |
| Renders all four ICE factors numerically |
| Confidence bar colour is green when confidence ≥ 0.75 |
| Confidence bar colour is amber when confidence 0.50–0.74 |
| Confidence bar colour is red when confidence < 0.50 |
| CONTRADICTED badge appears when status is CONTRADICTED |
| STALE badge appears when status is STALE |
| "Why lower" explanation is rendered when provided |
| No bare "LOW CONFIDENCE" without explanation |
| Card pulses amber on initial render (Framer Motion present) |

### 5.2 DecisionPanel

| Test |
|---|
| All 10 action cards are rendered |
| Submit button disabled until action selected |
| Submit button disabled until rationale has ≥ 20 chars |
| Submit button enabled when both action and rationale present |
| Decision window closed state hides action cards |
| Decision window open state shows action cards |
| Submitted decision calls store action |
| Rationale limited to 500 chars |

### 5.3 Header

| Test |
|---|
| Scenario ID rendered |
| Training clock advances every second (mock timers) |
| CommHealth bar renders correct percentage |
| InfoIntegrity bar renders correct percentage |
| Status badge updates on store change |

### 5.4 ReplayViewer

| Test |
|---|
| Scrubber renders at decision tick |
| Scrubbing left hides items with receivedAt > new tick |
| Map/feed panels update on scrubber change |
| Future information is not shown at any scrubber position before its receivedAt |
| Decision action and rationale displayed at decision tick |

---

## 6. E2E Tests — Complete Demo Flow (P0)

Located in `tests/e2e/`. Playwright, targeting Chromium, WebKit, and Firefox.

### 6.1 demo-flow.spec.ts — 3-minute judge demonstration

```
1. Open http://localhost:3000/
2. Assert: "NEXUS-C2" heading visible.
3. Assert: status board shows OPERATIONAL / READY.
4. Click "ENTER TRAINING".
5. Assert: Trainee Console loads (map, feed, decision panel visible).
6. Assert: Initial commHealth ≥ 90%.
7. Wait for T+00:20.
8. Assert: At least one LATENCY or DEGRADATION event appears in the feed.
9. Assert: commHealth decreased from initial.
10. Wait for T+00:30.
11. Assert: At least one report card shows status DELAYED or STALE.
12. Wait for decision window to open (amber pulse visible or DECISION WINDOW OPEN in feed).
13. Click action card "VERIFY".
14. Fill rationale: "Primary source unreliable; seeking independent confirmation."
15. Assert: Submit button enabled.
16. Click "SUBMIT DECISION".
17. Assert: Outcome panel visible with score > 0.
18. Assert: Score is numeric (0–100).
19. Click "VIEW AFTER-ACTION REVIEW".
20. Assert: Overall score displayed.
21. Assert: All 8 dimension scores displayed.
22. Assert: Decision timeline shows at least one decision.
23. Click "REPLAY DECISION" on first decision.
24. Assert: ReplayViewer opens with scrubber.
25. Assert: Map panel is visible.
26. Assert: Information feed shows only items from ≤ decision tick.
27. Scrub scrubber to T+00:00.
28. Assert: No information items visible (none received yet at T+00:00).
29. Click "RESET SCENARIO".
30. Assert: Simulation resets to T+00:00, commHealth returns to initial.
```

### 6.2 instructor.spec.ts

```
1. Open http://localhost:3000/instructor.
2. Assert: Instructor Control Room layout visible.
3. Click "INJECT DELAY" for primary channel.
4. Assert: PRIMARY DATA LINK shows increased latency in live trainee view.
5. Click "INJECT CONTRADICTION".
6. Assert: At least one CONTRADICTED card appears in trainee feed.
7. Click "TRIGGER DECISION WINDOW".
8. Assert: Decision window opens in trainee console (amber indicator).
9. Click "PAUSE".
10. Assert: Training clock stops advancing.
11. Click "RESUME".
12. Assert: Training clock resumes.
```

### 6.3 offline.spec.ts

```
1. Use Playwright networkIntercept to block all external URLs.
2. Open http://localhost:3000/.
3. Assert: Landing page loads without errors.
4. Click "ENTER TRAINING".
5. Assert: Trainee Console loads with map visible.
6. Assert: Information feed receives at least one item within 30 s.
7. Assert: No console errors referencing network failures.
8. Assert: commHealth bar updates.
```

### 6.4 accessibility.spec.ts

```
1. Open http://localhost:3000/.
2. Tab through all interactive elements.
3. Assert: Every element receives a visible focus ring.
4. Run axe accessibility scan (via @axe-core/playwright).
5. Assert: Zero critical accessibility violations.
6. Set prefers-reduced-motion media query.
7. Assert: Animated elements switch to instant transitions.
```

---

## 7. Additional Test Cases (P0)

### 7.1 Contradiction handling

- Scenario with two contradicting items: both receive `consistency ≤ 0.5`.
- Trainee selects VERIFY: `Information Discipline` score increases.
- Trainee ignores contradiction: AAR records "Missed uncertainty."

### 7.2 Stale information

- Item with `ageSeconds > stalenessThreshold` shows STALE badge.
- STALE item's `confidence` continues to decay.
- Confirmed update resets freshness of affected item.

### 7.3 Recovery transitions

- Channel recovering over 30 s: Q value increases linearly from degraded to nominal.
- Entities on recovering channel show appropriate intermediate animation state.
- After RECOVERED: Q = 1.0, channel shows green state.

### 7.4 Multiple simultaneous degradations

- Two channels degraded simultaneously: aggregate commHealth reflects both.
- ICE confidence for items on each channel degrades independently.
- Map shows correct animated state per entity per channel.

### 7.5 Scenario reset

- After reset: tick = 0, all channels at initial state, feed empty.
- After reset: PRNG re-seeded with same seed → identical event sequence.
- After reset: sessionStore.decisions cleared.

---

## 8. Browser QA Checklist (P0 — manual)

Before claiming any milestone complete:

- [ ] `npm run build` succeeds with zero TypeScript errors.
- [ ] `npm run start` serves the production build.
- [ ] Open in Chrome at 1920×1080: layout correct.
- [ ] Open in Chrome at 1366×768: layout correct (no overflow, no clipping).
- [ ] Open in Firefox: layout and animations correct.
- [ ] Open in Safari (macOS/iOS): layout correct.
- [ ] Execute complete 3-minute demo flow (steps 1–14 from master prompt demo script).
- [ ] Check browser console: zero critical errors.
- [ ] Trigger LATENCY inject from instructor panel: confirmed effect in trainee console.
- [ ] Trigger CONTRADICTION inject: CONTRADICTED card appears.
- [ ] Open decision window, submit decision, view AAR.
- [ ] Click REPLAY DECISION: replay viewer opens.
- [ ] Scrub to T+00:00: no information items visible.
- [ ] Scrub to decision point: correct items visible, no future items.
- [ ] Reset scenario: returns to initial state.
- [ ] Disconnect network (DevTools → Offline): confirm offline demo works.
- [ ] Enable `prefers-reduced-motion`: animations replaced by instant transitions.
- [ ] Tab-navigate entire console: all interactive elements reachable and labelled.
- [ ] Check Data Provenance page: all sources attributed with links and labels.
- [ ] Historical disclaimer visible on each historical scenario.
- [ ] Synthetic disclaimer visible on all scenarios.
- [ ] Formula inspector in instructor panel: ICE formula values visible and updating.

---

## 9. Performance Tests (P1)

- Lighthouse audit on landing page: Performance ≥ 90.
- Lighthouse audit on trainee console: Performance ≥ 75.
- FPS measurement during active degradation sequence: ≥ 60 FPS on reference hardware.
- Time to interactive (landing page): < 3 s on fast connection.
- Time to interactive (console with offline fixtures): < 2 s after service worker warm.
- Memory: no leak detected after 10-minute continuous session (Chrome DevTools memory snapshot).

---

## 10. CI Pipeline Requirements

```yaml
# .github/workflows/ci.yml (summary)
on: [push, pull_request]
jobs:
  test:
    steps:
      - npm ci
      - npm run lint
      - npm run test --coverage
      - npm run build
      - npx playwright install --with-deps
      - npm run test:e2e
```

- Lint must pass with zero errors.
- Unit tests must pass with coverage ≥ targets in §1.
- Build must succeed.
- E2E tests must pass (Chromium minimum).
- CI does not require external services — all E2E tests run against local build with offline fixtures.

---

*Document version: 1.0 — October 2026*
