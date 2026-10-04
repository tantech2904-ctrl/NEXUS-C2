# NEXUS-C2 — DESIGN SPECIFICATION

> **Document priority:** 3 of 10 in the source-of-truth hierarchy.  
> Defer to the master prompt and `NEXUS-C2_AGENT_DATA_SOURCES_AND_INSTRUCTIONS.md` on all conflicts.

---

## 1. Product Identity

| Field | Value |
|---|---|
| **Product name** | NEXUS-C2 |
| **Tagline** | DECIDE UNDER UNCERTAINTY. |
| **Secondary descriptor** | Immersive multi-domain command training for degraded information environments. |
| **SIH problem** | SIH26248 |
| **Classification** | Synthetic training environment — not an operational military system |

---

## 2. Design Philosophy

NEXUS-C2 must feel like a **professional command-training simulator**, not a dashboard, game, or marketing website.

### Mandatory tone
- Serious, information-dense, navigable.
- Every visual element serves a functional purpose.
- Animation communicates state, not decoration.

### Explicitly forbidden aesthetics
- Cyberpunk / hacker / RGB gaming aesthetic.
- Esports HUD.
- Generic SaaS analytics dashboard.
- Excessively neon or over-glowing.
- Real military insignia.

---

## 3. Colour System

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0d0f10` | Page background (near-black graphite) |
| `--bg-panel` | `#141618` | Panel backgrounds (charcoal) |
| `--bg-panel-raised` | `#1c1f21` | Elevated card surfaces |
| `--border` | `#2a2d30` | Thin panel borders |
| `--text-primary` | `#e8eaec` | Primary copy |
| `--text-secondary` | `#8a9099` | Labels, metadata |
| `--text-dim` | `#4d5560` | Disabled / very secondary |
| `--accent-cyan` | `#4fc3d0` | Information channel indicators, links |
| `--accent-amber` | `#d4860a` | Warning / degradation alerts |
| `--accent-red` | `#c0392b` | Urgent / critical states only |
| `--accent-green` | `#2ecc71` | Confirmed / healthy states |
| `--grid-overlay` | `rgba(255,255,255,0.03)` | Subtle grid/scanline motif |

Glow must be restrained. Use `box-shadow` at low opacity only on focused elements and active status indicators.

---

## 4. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Product name | `'JetBrains Mono'` or `'Space Mono'` | 700 | 2rem |
| Section heading | `'Inter'` | 600 | 0.875rem |
| Body / feed | `'Inter'` | 400 | 0.8125rem |
| Data values | `'JetBrains Mono'` | 400 | 0.8125rem |
| Status labels | `'Inter'` | 600 uppercase | 0.6875rem |

All text must remain readable on dark backgrounds. Minimum contrast ratio: 4.5:1 (WCAG AA).

---

## 5. Application Modes (P0 unless noted)

| Mode | Route | Priority |
|---|---|---|
| Landing page | `/` | P0 |
| Trainee Console | `/console` | P0 |
| Instructor Control Room | `/instructor` | P0 |
| After-Action Review | `/aar/[sessionId]` | P0 |
| Scenario Library | `/scenarios` | P1 |
| Scenario Builder | `/builder` | P1 |
| Data Provenance | `/data-sources` | P1 |
| System Settings | `/settings` | P1 |

---

## 6. Landing Page (P0)

A cinematic but fast-loading entry screen. The prototype is the product — do not build a marketing page.

### Layout
```
┌─────────────────────────────────────────────┐
│  [animated background: network node graph]  │
│                                             │
│        NEXUS-C2                             │
│        DECIDE UNDER UNCERTAINTY.            │
│                                             │
│  ──────────────────────────────────         │
│  SYSTEM STATUS        ● OPERATIONAL         │
│  SIMULATION ENGINE    ● READY               │
│  DEGRADATION ENGINE   ● READY               │
│  AAR ENGINE           ● READY               │
│  DATA MODE            PUBLIC / SYNTHETIC    │
│  ──────────────────────────────────         │
│                                             │
│   [ENTER TRAINING]  [INSTRUCTOR CONTROL]    │
│   [SCENARIO LIBRARY]  [DATA SOURCES]        │
│                                             │
│  SIH 2026 / SIH26248                        │
└─────────────────────────────────────────────┘
```

### Animated background
- Subtle network-node graph (SVG/canvas).
- Moving edges with packet particles when healthy.
- Particles slow and drop out progressively after 10 s to hint at degradation.
- 60 FPS target; use `requestAnimationFrame` and canvas, not DOM nodes.

---

## 7. Trainee Console (P0)

The centrepiece of the application.

### Desktop layout (≥ 1280 px)

```
┌───────────────────────────────────────────────────────────────────┐
│  HEADER: SCN-ID | SESSION | CLOCK T+xx:xx | PHASE | COMMS | INFO  │
├──────────────────────┬───────────────────────┬────────────────────┤
│                      │                       │                    │
│   OPERATIONAL MAP    │   INFORMATION FEED    │  DECISION PANEL    │
│   (MapLibre GL)      │   (scrolling stream)  │                    │
│                      │                       │  • Situation brief │
│   • Command node     │   • Reports           │  • Decision opts   │
│   • Relay            │   • Alerts            │  • Rationale input │
│   • Field team       │   • Confidence cards  │  • [SUBMIT]        │
│   • Obs node         │   • Contradictions    │                    │
│   • Support node     │   • Stale items       │                    │
│   • Comm links       │                       │                    │
│   • Uncertainty rings│                       │                    │
│   • Degraded zones   │                       │                    │
│                      │                       │                    │
├──────────────────────┴───────────────────────┴────────────────────┤
│  FOOTER: COMM HEALTH BARS | NETWORK STATE | TIMELINE | EVENT LOG  │
└───────────────────────────────────────────────────────────────────┘
```

### Responsive breakpoints
| Width | Layout |
|---|---|
| ≥ 1280 px | Three-column desktop layout above |
| 768–1279 px | Map full-width top; Feed + Decision in tabs below |
| < 768 px | Single-column tab layout (Map / Feed / Decision / Comms) |

### Header strip (P0)
Continuously updating values:
- **Scenario ID** — e.g., `SCN-06`
- **Session ID** — e.g., `SES-8A2F`
- **Training clock** — `T+04:38` (simulation time, not wall clock)
- **Mission phase** — e.g., `PHASE 02 / DEGRADED INFORMATION`
- **Comms health** — bar + percentage
- **Information integrity** — bar + percentage
- **System status** — `OPERATIONAL` / `DEGRADED` / `CRITICAL`

### Operational map (P0)
See §8 — Map Design.

### Information feed (P0)
- Scrolling terminal-style stream of reports.
- Each item renders as a **Confidence Card** — see §9.
- Categories: `SYSTEM` | `INFO` | `WARNING` | `ALERT` | `COMMAND` | `TRAINING`
- Each category has a distinct left-border colour and label.
- New items animate in from top (Framer Motion `AnimatePresence`).

### Decision panel (P0)
- **Situation brief** — current scenario context, 2–3 sentences.
- **Decision options** — rendered as selectable cards (10 abstract actions).
- **Rationale input** — free-text area, max 500 characters.
- **[SUBMIT DECISION]** button — disabled until option + rationale selected.
- Decision window indicator: amber pulse ring when window is open.

### Footer bar (P0)
- Communication health per channel (coloured progress bars).
- Current degradation state label.
- Mini event timeline showing last 10 events.
- Simulation speed control (0.5× 1× 2× 5× PAUSE) — visible to both trainee and instructor.

---

## 8. Map Design (P0)

### Library
MapLibre GL JS — lazy-loaded, tree-shaken.

### Base map
Fictional training area. Map tiles served locally from `/public/demo/tiles/` or an offline vector tile set. No runtime dependency on external tile servers.

### Entity types and visual treatment

| Entity | Marker | Healthy animation | Degraded animation |
|---|---|---|---|
| Command node | Pentagon | Slow amber pulse ring | Fast red pulse |
| Relay node | Diamond | Slow cyan pulse | Intermittent flicker |
| Field team | Circle | Stable | Uncertain halo |
| Observation node | Eye icon | Green pulse | Orange flicker |
| Support node | Square | Stable | No animation |

### Communication links

| State | Visual |
|---|---|
| NORMAL | Solid line, moving cyan particles |
| MINOR_DELAY | Slightly slower particles |
| HIGH_LATENCY | Slow particles, amber tint |
| PARTIAL_DROPOUT | Intermittent particle gaps |
| SEVERE_DROPOUT | Mostly dashed, rare particles |
| RELAY_FAILURE | Broken dashes, red tint |
| RECOVERED | Solid, brief green flash |

### Overlay layers
- **Uncertainty rings** — semi-transparent concentric circles around entities with `UNCERTAIN` or `STALE` information.
- **Degraded zones** — semi-transparent red polygons for areas with active sensor loss.
- **Route corridors** — thin polylines for defined transit routes.
- **Contradiction markers** — alternating position indicators when contradictory data is active.

### Map performance
- Maximum 20–30 entities per scenario.
- Particle animations on canvas overlay, not DOM.
- Limit MapLibre layers; prefer a single GeoJSON source updated via `setData`.

---

## 9. Information Confidence Card (P0)

Every report in the information feed is rendered as a Confidence Card exposing all ICE fields.

### Card anatomy
```
┌─────────────────────────────────────────────────────────┐
│  ● FIELD REPORT          [UNCERTAIN]     T+04:21        │
│  Source: FIELD TEAM ALPHA                               │
│  Channel: DEGRADED RADIO — Quality 71%                  │
│  ─────────────────────────────────────────────────────  │
│  "Route status nominal at grid ref ALPHA-7."            │
│  ─────────────────────────────────────────────────────  │
│  Source reliability   0.86  ████████░░                  │
│  Freshness            0.79  ███████░░░  Age: 18.4 s     │
│  Consistency          0.61  ██████░░░░  [CONTRADICTION]  │
│  Channel quality      0.71  ███████░░░                  │
│  ─────────────────────────────────────────────────────  │
│  CONFIDENCE           61%   ██████░░░░                  │
│                                                         │
│  ⚠ Why lower: Conflict with OBSERVATION FEED at T+04:22 │
└─────────────────────────────────────────────────────────┘
```

- The "Why lower" line is mandatory — the UI must explain confidence changes.
- Confidence bar colour: green ≥ 75 % | amber 50–74 % | red < 50 %.
- Cards pulse amber on arrival. Contradicted cards pulse red.
- Stale cards dim and add a STALE badge.

---

## 10. Information Confidence Engine — UI Integration (P0)

The Information Confidence Engine (ICE) is defined in SIMULATION.md §3. The UI must:

1. Render each ICE field on every Confidence Card.
2. Update confidence values in real time as simulation state changes.
3. Visually distinguish each `InformationStatus` value:

| Status | Badge colour | Behaviour |
|---|---|---|
| `CONFIRMED` | Green | Stable card |
| `LIKELY` | Cyan | Slight pulse |
| `UNCERTAIN` | Amber | Slow pulse |
| `STALE` | Grey | Dimmed, STALE badge |
| `CONTRADICTED` | Red | Red border, fast pulse |
| `UNAVAILABLE` | Dark grey | Greyed out, blocked |

4. Show a global **Information Integrity** percentage in the header, derived from mean confidence across active items.
5. Never display a bare "LOW CONFIDENCE" badge without an explanation.

---

## 11. Decision Panel — Detailed Design (P0)

### Decision options (10 abstract training actions)
Rendered as selectable cards, one active at a time:

| Label | Description shown to trainee |
|---|---|
| ASSESS | Evaluate available information before acting |
| VERIFY | Seek independent confirmation of reported data |
| CONTINUE | Proceed with current plan |
| PAUSE | Halt activity pending clarification |
| REQUEST UPDATE | Formally request refreshed information |
| SWITCH CHANNEL | Route through alternative communication path |
| ESCALATE | Elevate situation to higher command tier |
| RECONFIGURE | Adjust team coordination for current conditions |
| STAND BY | Hold position; maintain readiness |
| ADAPT PLAN | Modify current plan to account for uncertainty |

### Rationale input
- Free text, min 20 chars, max 500 chars.
- Placeholder examples provided:
  - *"Primary source unreliable; seeking independent confirmation."*
  - *"Maintaining current posture while validating conflicting reports."*
- Character counter shown.

### Decision window state
- Window **closed**: panel shows current situation summary only.
- Window **open**: decision cards become selectable; amber pulse ring appears; countdown timer visible.
- After submission: panel shows outcome summary and score preview.

---

## 12. Communication / Network State Panel (P0)

Located in the footer bar and expandable to a sidebar drawer.

### Channels displayed
| Channel | Properties shown |
|---|---|
| PRIMARY DATA LINK | Latency, packet loss, availability, confidence, last contact |
| SECONDARY RADIO | Same fields |
| FALLBACK LINK | Same fields |

### Visual state per channel
- Healthy: green left border, moving waveform animation.
- Degraded: amber left border, slower waveform.
- Offline: red left border, flatline.
- Recovering: pulsing amber/green transition.

---

## 13. Instructor Control Room (P0)

Completely separate from the trainee console. URL: `/instructor`.

### Layout
```
┌──────────────┬───────────────────────────┬─────────────────┐
│  SCENARIO    │   LIVE TRAINEE VIEW       │ EVENT INJECTION │
│  CONTROL     │   (read-only mirror)      │                 │
│              │                           │ [INJECT DELAY]  │
│  [PAUSE]     │  Map + Feed + Decision    │ [INJECT LOSS]   │
│  [RESUME]    │  state (read-only)        │ [INJECT CONTRA] │
│  Speed: 1×   │                           │ [DISABLE FEED]  │
│  [RESET]     │                           │ [RESTORE FEED]  │
│              │                           │ [ALTER WEATHER] │
│              │                           │ [TRIGGER DW]    │
├──────────────┴───────────────────────────┴─────────────────┤
│  LIVE PERFORMANCE METRICS                                   │
│  Score | Latency | Decisions | Info consulted | Uncertainty │
│  ───────────────────────────────────────────────────────── │
│  Synchronized timeline charts (Recharts):                   │
│  Communication quality | Information reliability | Events   │
└─────────────────────────────────────────────────────────────┘
```

### Inject controls
Every inject is reversible. Controls:
- **[INJECT DELAY]** — increases latency on selected channel.
- **[INJECT PACKET LOSS]** — increases packet loss %.
- **[INJECT DROPOUT]** — takes selected channel offline.
- **[INJECT CONTRADICTION]** — fires a contradicting report.
- **[DISABLE FEED]** — suspends a report source.
- **[RESTORE FEED]** — restores a suspended source.
- **[ALTER WEATHER]** — changes environmental state.
- **[TRIGGER DECISION WINDOW]** — immediately opens a decision window.

### Live metrics
- Current score (live update).
- Decision latency (average ms between decision window open and submission).
- Decisions made (count).
- Information items consulted (count of cards opened/expanded).
- Contradiction handling score.
- Communication adaptation score.
- Unresolved uncertainties (count).

### Formula inspector (P0)
Expandable drawer showing the ICE formula variables in real time — allows instructors to explain the scoring mechanism during a debrief.

---

## 14. After-Action Review (P0)

Route: `/aar/[sessionId]`

### Layout — top to bottom
1. **Header**: Scenario name, session ID, overall score (large display).
2. **Dimension scores** (Recharts radar chart + table):
   - Decision Quality, Timeliness, Information Discipline, Source Evaluation, Communication Resilience, Coordination, Risk Management, Adaptability.
3. **Decision timeline** — chronological list of decisions made, each expandable to show:
   - Information available at that moment (count + confidence).
   - Communication quality at that moment.
   - Decision selected + rationale.
   - System outcome assessment.
4. **Missed uncertainty panel** — uncertainties that existed but were not acted on.
5. **[REPLAY DECISION]** button per decision → opens Decision Replay.
6. **[DOWNLOAD AAR]** button → PDF export (P1, degrade gracefully if unavailable).

### Scoring note
AAR must display: *"Score is a training heuristic, not an official military assessment."*

---

## 15. Decision Replay (P0)

Accessible from AAR or from the instructor view.

### Layout
```
┌───────────────────────────────────────────────────────────────────┐
│  DECISION REPLAY — Decision #2 at T+04:38                         │
├───────────────────────────────────────────────────────────────────┤
│  [MAP at T+04:38]          │  [INFO FEED at T+04:38]              │
│                            │  Only items available at T+04:38     │
│                            │  shown; future items suppressed       │
├────────────────────────────┴──────────────────────────────────────┤
│  ◀  ──────────────●────────────────────────────────  ▶           │
│          T+04:38 (Decision point)                                 │
├───────────────────────────────────────────────────────────────────┤
│  COMM STATE at T+04:38 | DECISION: VERIFY | RATIONALE: "..."      │
│  SCORE: Decision Quality 82 | Timeliness 91 | ...                │
└───────────────────────────────────────────────────────────────────┘
```

### Critical requirement
The replay must never display information that was not available at the decision timestamp. This is enforced in SIMULATION.md §6.

### Controls
- Scrubber: drag to any point within ± 60 s of the decision.
- Previous / Next decision navigation.
- Play / Pause.
- Map, feed, and comm health panels synchronised to scrubber position.

---

## 16. Scenario Library (P1)

Route: `/scenarios`

Grid of scenario cards. Each card shows:
- Scenario title.
- Historical basis tag (or SYNTHETIC).
- Difficulty badge (FOUNDATION / ADVANCED / EXPERT).
- Estimated duration.
- [START] button.

Scenarios are loaded from `/data/scenarios/*.json`.

---

## 17. Scenario Builder (P1)

Route: `/builder`

### Fields
Scenario name, training objective, environment, communication baseline, degradation parameters, information density, contradiction probability, delay, dropout, recovery model, decision windows, scoring weights, historical reference.

### Timeline editor
Drag-and-drop inject events onto a visual timeline (T+00:00 → T+05:00).

### Actions
- [SAVE SCENARIO] — writes to localStorage / IndexedDB.
- [DUPLICATE] — clone existing scenario.
- [EXPORT JSON] — download as `.json`.
- [IMPORT JSON] — load from file.

---

## 18. Data Provenance Page (P1)

Route: `/data-sources`

Three sections:
1. **Historical Evidence** — public sources (FCC, ITU, NOAA, USGS, FEMA, OSM) with full provenance metadata.
2. **Simulation Data** — synthetic entities, events, and scoring heuristics.
3. **Map Data** — GeoJSON origin.
4. **Optional External Data** — Ookla (if used).

Each source card: source name, organisation, URL, date, purpose, licence, exact usage.

Visible disclaimer on every page: *"Command entities and scenario injects are synthetic training constructs."*

---

## 19. Animation Guidelines

| Element | Library | Notes |
|---|---|---|
| Panel mounts/unmounts | Framer Motion `AnimatePresence` | Fast (150–200 ms) |
| Card arrivals in feed | Framer Motion `initial`/`animate` | Slide-in from top |
| Status bar transitions | Framer Motion | Smooth value change |
| Map particle animations | canvas / `requestAnimationFrame` | Never DOM nodes |
| Communication waveforms | canvas | Per-channel waveform |
| Header value updates | Framer Motion `motion.div` layout | No flash |
| Decision window open | Scale + opacity transition | 200 ms |

Target: ≥ 60 FPS on a modern laptop (2022+). Respect `prefers-reduced-motion`.

---

## 20. Accessibility (P0)

- All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, arrow keys).
- Visible focus ring on all focusable elements (`:focus-visible`).
- ARIA labels on icon-only buttons.
- `role="status"` / `aria-live="polite"` on the information feed and clock.
- Sufficient contrast (≥ 4.5:1 for body text).
- Do not rely solely on colour to convey status — include labels and icons.
- `prefers-reduced-motion`: replace motion animations with instant transitions.
- Font sizes: minimum 12 px rendered.

---

## 21. Responsive Targets

| Breakpoint | Width |
|---|---|
| Desktop primary | 1920 × 1080 |
| Desktop secondary | 1440 × 900 |
| Laptop | 1366 × 768 |
| Tablet | 768–1024 px |

Mobile is not a primary target but must not be broken.

---

## 22. Offline Demo (P0)

The application must load and run the default scenario with no internet connection once the JavaScript bundle and demo fixtures are cached.

Demo fixtures served from `/public/demo/`:
- `demo-scenario.json`
- `demo-map.geojson`
- `demo-events.json`
- `demo-communications.json`

A PWA service worker caches these on first load. No external tile server dependency; base map tiles served from `/public/demo/tiles/`.

---

## 23. Safety Boundary

- No real military insignia, unit designations, or coordinates.
- No targeting, weapons employment, or operational planning workflows.
- Every historical-basis scenario displays: **HISTORICAL BASIS — PUBLIC DATA** and **Command entities and scenario injects are synthetic training constructs.**
- Simulator heuristic disclaimer shown in the formula inspector: *"These formulas are training simulation heuristics, not official military doctrine."*
- All AI-generated content (P2) labelled: **AI-GENERATED TRAINING ANALYSIS**.

---

*Document version: 1.0 — October 2026*
