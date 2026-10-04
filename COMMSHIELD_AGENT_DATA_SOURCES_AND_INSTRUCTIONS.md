# COMMSHIELD — DATA SOURCES & AGENT INSTRUCTIONS
## SIH26248 — Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments

> PURPOSE: This file is intended to be handed directly to a coding / website-building AI agent together with the COMMSHIELD master build prompt.
>
> IMPORTANT: The human user does **not** need to manually download the datasets and reports listed here.
> The agent must use the public URLs and source metadata below as the authoritative source registry.
> Do not instruct the user to manually download large datasets.

---

# 1. NON-NEGOTIABLE AGENT POLICY

Build COMMSHIELD as a self-contained, deployable training simulator.

## 1.1 Do not require manual downloads from the user

The user should be able to clone/open/deploy the project without first downloading NOAA, USGS, FCC, ITU, FEMA, OSM, or other datasets manually.

The agent may:

- use public web URLs/API endpoints for source verification;
- create small, derived, normalized scenario fixtures;
- create lightweight GeoJSON/JSON files containing only the subset required for the demo;
- use build-time/server-side scripts to fetch a small subset when network access is available;
- use the source URLs as provenance and citation links.

The agent must NOT:

- ask the user to manually download a multi-gigabyte dataset;
- bundle huge raw datasets into the frontend;
- load giant files directly in the browser;
- pretend that a synthetic scenario is an original historical dataset;
- make the demo depend on a remote dataset being available at runtime.

## 1.2 Offline-first fallback

The demo must work even when public sources are inaccessible.

Create a lightweight local data layer:

- `/data/raw/` — optional cached source extracts only when genuinely needed
- `/data/processed/` — small normalized files
- `/data/scenarios/` — scenario definitions
- `/data/sources/` — source metadata
- `/public/demo/` — minimal demo fixtures

The application should automatically fall back to local synthetic/demo data.

The browser demo must NOT wait for external datasets to load.

## 1.3 Historical evidence vs simulation

Every historical source is used for:

- environmental stress calibration;
- communications disruption patterns;
- recovery / resilience patterns;
- timing or event characteristics;
- public-source provenance.

Historical data must NOT be represented as:

- real military dispositions;
- real military unit locations;
- real operational plans;
- real targeting information;
- real classified information;
- actual military doctrine;
- real-world command decisions.

Use fictional entities, callsigns, facilities, command structures, routes, objectives, and outcomes.

Every historical scenario must visibly state:

"HISTORICAL BASIS — PUBLIC DATA"

and:

"Command entities, tactical context, and scenario injects are synthetic training constructs."

---

# 2. SOURCE REGISTRY

Use these public sources as the canonical source list.

---

## SOURCE A — SIH26248 OFFICIAL PROBLEM STATEMENT

Official listing:

https://sih2026-ps-viewer.vercel.app/ps/SIH26248

Purpose:

- establish the problem context;
- verify the SIH problem statement;
- align features with the requested training environment;
- maintain a requirements traceability section in the application.

Use:

- problem title;
- organization;
- theme/category;
- expected capabilities;
- stated constraints.

Do not claim that this page is a military doctrine document. It is the problem-statement reference.

Application source label:

"SIH 2026 — SIH26248 Official Problem Statement"

---

## SOURCE B — FCC HURRICANE MARIA COMMUNICATIONS REPORT

FCC public PDF:

https://docs.fcc.gov/public/attachments/DOC-348851A1.pdf

Purpose:

- historical evidence of communications disruption;
- calibration for degraded communication scenarios;
- examples of infrastructure outage and communication recovery conditions.

Use this source to inspire:

- network/service disruption;
- partial communications failure;
- delayed or unavailable information;
- uneven recovery;
- degraded information availability.

Do NOT copy a real military scenario from this source.

Suggested scenario:

"MARIA // COMMUNICATIONS SHOCK"

Scenario design:

- fictional command network;
- synthetic field teams;
- synthetic observation nodes;
- synthetic command decisions;
- historical communications-disruption characteristics only.

Source label:

"FCC — Hurricane Maria Communications Status Report"

---

## SOURCE C — FCC LONG-TERM HURRICANE MARIA ANALYSIS

FCC public PDF:

https://docs.fcc.gov/public/attachments/DOC-353805A1.pdf

Purpose:

- long-duration communications outage/recovery behavior;
- resilience and restoration timeline calibration;
- demonstrate that degradation can evolve instead of being a single binary OFF state.

Use for:

- staged degradation;
- prolonged outage;
- recovery windows;
- partial restoration;
- information staleness during recovery.

Do not treat outage percentages as a universal military model.

If numerical values are shown in the UI, clearly identify them as historical reference values and preserve the original source attribution.

---

## SOURCE D — ITU / EBU CRISIS COMMUNICATIONS REPORT — TÜRKİYE 2023

Public PDF:

https://www.itu.int/en/ITU-D/Emergency-Telecommunications/Documents/2024/EBU-MIS_Radio_in_times_of_crisis.pdf

Purpose:

- communications resilience during the 2023 Türkiye/Syria earthquake disaster;
- demonstrate partial channel survival and heterogeneous communications availability;
- support scenarios where some information paths continue functioning while others degrade.

Use to model:

- partial resilience;
- channel diversity;
- fallback communication paths;
- uneven availability;
- information arriving through multiple channels at different quality levels.

Suggested scenario:

"ANATOLIA // PARTIAL RESILIENCE"

Important:

Do not imply that this is a military battlefield model.
Use it as a public crisis-communications reference for the simulator's generic information-environment mechanics.

---

## SOURCE E — ITU DISASTER RESPONSE / CHILE 2010

ITU disaster response page:

https://www.itu.int/en/ITU-D/Emergency-Telecommunications/Pages/ITUDisasterResponse.aspx

Public brochure/PDF:

https://www.itu.int/en/ITU-D/Emergency-Telecommunications/Documents/SavingLivesBrochure/BD__emergencybrochure_E.pdf

Purpose:

- fallback communication concepts;
- disaster communications recovery;
- resilient / alternative communication channels;
- historical reference for emergency communications when normal infrastructure is damaged.

Suggested scenario:

"CHILE // FALLBACK WINDOW"

Use to model:

- degraded primary network;
- alternative information channel availability;
- delayed fallback communications;
- restoration windows.

Again: this is historical public disaster-communications evidence, not military doctrine.

---

## SOURCE F — NOAA STORM EVENTS DATABASE

Public directory:

https://www.ncei.noaa.gov/pub/data/swdi/stormevents/

Purpose:

- historical severe-weather event metadata;
- storm severity/context;
- environmental stressor calibration.

Use for:

- storm scenario selection;
- weather-event timing;
- scenario environmental stress;
- generic operational-environment disruption.

Do NOT ship the full NOAA archive to the client.

Create a small processed extract containing only the event(s) used by a demo scenario.

Suggested scenario:

"STORM CORRIDOR"

---

## SOURCE G — NOAA IBTrACS

Official NOAA product page:

https://www.ncei.noaa.gov/products/international-best-track-archive

Use only the lightweight subset needed for scenario visualization.

Potential products:

- tropical cyclone track;
- timestamps;
- storm position;
- intensity metadata where appropriate.

Use to generate:

- a historical storm-track basis;
- environmental pressure/event progression;
- scenario timing.

Do NOT claim that storm trajectory automatically determines military operational decisions.

Suggested scenario:

"STORM CORRIDOR"

Implementation rule:

A preprocessed small GeoJSON/JSON fixture should power the demo.

The user should NOT need to download IBTrACS.

---

## SOURCE H — USGS EARTHQUAKE FEED / FDSN

USGS CSV feed reference:

https://earthquake.usgs.gov/earthquakes/feed/v1.0/csv.php

USGS FDSN event service:

https://earthquake.usgs.gov/fdsnws/event/1/

Purpose:

- public earthquake event metadata;
- location/time/magnitude context;
- historical seismic-event scenario calibration.

Use for:

- earthquake scenario generation;
- environmental disruption;
- timeline calibration;
- synthetic communication degradation following an environmental shock.

Suggested scenario:

"SEISMIC WINDOW"

Do not use real military installations or sensitive locations.

---

## SOURCE I — USGS SHAKE MAP ATLAS

USGS data page:

https://www.usgs.gov/data/shakemap-atlas-v4-and-atlascat

Purpose:

- historical earthquake impact/intensity context;
- spatial stress visualization;
- optional calibration for degraded infrastructure zones.

Use only as environmental context.

Do not imply that any map layer directly identifies military capabilities or real command status.

If using ShakeMap-derived values, clearly label the layer as environmental/public historical context.

---

## SOURCE J — FEMA NATIONAL RISK INDEX

FEMA NRI data resources:

https://hazards.fema.gov/nri/data-resources

Purpose:

- public hazard context;
- environmental-risk background;
- optional scenario-context generation.

Use for:

- generic hazard classification;
- disaster-risk context;
- environmental stress presets.

Do not present FEMA risk information as military operational intelligence.

---

## SOURCE K — OPENSTREETMAP / GEOFABRIK INDIA

Geofabrik India download page:

https://download.geofabrik.de/asia/india.html

India PBF source:

https://download.geofabrik.de/asia/india-latest.osm.pbf

Purpose:

- background map geometry;
- roads;
- settlements;
- terrain/context;
- non-sensitive geographic visualization.

CRITICAL:

Do NOT download or package the full India PBF for the web demo.

Instead:

1. Choose a small fictional/demo operating area.
2. Extract only the required road/landmark geometry.
3. Convert the small subset into lightweight GeoJSON/vector tiles.
4. Store only the processed demo area.

Better still for the main demo:

- use a fictional training area;
- optionally place it in a broad regional context without using real military facilities.

Never show sensitive or classified military locations.

---

## SOURCE L — OOKLA OPEN DATA (OPTIONAL)

Project:

https://github.com/teamookla/ookla-open-data

Example public parquet reference:

https://ookla-open-data.s3.amazonaws.com/parquet/performance/type=mobile/year=2024/quarter=4/2024-10-01_performance_mobile_tiles.parquet

Purpose:

- optional public connectivity-performance calibration;
- optional mobile-network degradation visualization.

Important:

Check the current licence/usage requirements before redistribution or commercial use.

Do not make this source a hard dependency.

Do not send the full parquet dataset to the browser.

If used:

- preprocess a tiny geographic subset;
- store only required aggregates;
- preserve licence and attribution metadata.

---

# 3. SOURCE-DATA HANDLING RULE

## GOLDEN RULE

The website must be independent of the raw public datasets.

Use this architecture:

PUBLIC SOURCE
    ↓
OPTIONAL BUILD/SERVER FETCH
    ↓
SMALL NORMALIZED EXTRACT
    ↓
SCENARIO JSON
    ↓
DETERMINISTIC SIMULATION ENGINE
    ↓
BROWSER UI

Not:

PUBLIC SOURCE
    ↓
GIANT DOWNLOAD
    ↓
BROWSER

---

# 4. NORMALIZED DATA MODEL

Create adapters / normalizers where useful.

Suggested files:

- `src/lib/data/femaAdapter.ts`
- `src/lib/data/usgsAdapter.ts`
- `src/lib/data/noaaStormAdapter.ts`
- `src/lib/data/ibtracsAdapter.ts`
- `src/lib/data/osmAdapter.ts`
- `src/lib/data/fccHistoricalAdapter.ts`
- `src/lib/data/ituHistoricalAdapter.ts`

Create normalized domain objects.

## EnvironmentEvent

```ts
type EnvironmentEvent = {
  id: string
  sourceId: string
  sourceUrl: string
  type: string
  startTime: string
  endTime?: string
  severity?: number
  geometry?: unknown
  description: string
  historicalBasis: boolean
}
```

## CommunicationState

```ts
type CommunicationState = {
  channelId: string
  availability: number
  latencyMs: number
  packetLoss: number
  bandwidthFactor: number
  channelQuality: number
  status:
    | "NORMAL"
    | "DEGRADED"
    | "INTERMITTENT"
    | "OFFLINE"
    | "RECOVERING"
  lastSuccessfulContact?: string
}
```

## InformationItem

```ts
type InformationItem = {
  id: string
  sourceName: string
  sourceType: string
  timestamp: string
  receivedAt: string
  ageSeconds: number
  sourceReliability: number
  channelQuality: number
  freshness: number
  consistency: number
  confidence: number
  verification:
    | "CONFIRMED"
    | "LIKELY"
    | "UNCERTAIN"
    | "STALE"
    | "CONTRADICTED"
    | "UNAVAILABLE"
  content: string
  location?: unknown
  contradictionGroupId?: string
}
```

## ScenarioInject

```ts
type ScenarioInject = {
  id: string
  time: number
  type:
    | "LATENCY"
    | "PACKET_LOSS"
    | "DROPOUT"
    | "RELAY_FAILURE"
    | "SENSOR_LOSS"
    | "CONTRADICTION"
    | "STALE_INFORMATION"
    | "BANDWIDTH_CONGESTION"
    | "RECOVERY"
    | "CUSTOM"
  target?: string
  severity?: number
  duration?: number
  message?: string
}
```

---

# 5. INFORMATION CONFIDENCE ENGINE — MANDATORY

This is a signature feature.

Every meaningful information item must have a visible and explainable confidence state.

At minimum show:

- Source
- Timestamp
- Age
- Communication channel
- Channel quality
- Source reliability
- Freshness
- Consistency
- Current confidence
- Verification state

Example UI:

FIELD REPORT
SOURCE: FIELD TEAM ALPHA
AGE: 18.4 s
CHANNEL: DEGRADED RADIO
SOURCE RELIABILITY: 0.86
CHANNEL QUALITY: 0.71
FRESHNESS: 0.79
CONSISTENCY: 0.61
CONFIDENCE: 61%
STATUS: UNCERTAIN

Use a deterministic simulator heuristic such as:

`confidence = sourceReliability * channelQuality * freshness * consistency`

Clamp the result to `[0,1]`.

Important:

This is a simulator heuristic, not an official military or doctrinal formula.

The interface must explain why confidence changes.

For example:

- report gets older → freshness decreases;
- packet loss increases → channel quality decreases;
- conflicting reports appear → consistency decreases;
- reliable source with degraded channel → confidence decreases but does not instantly become zero;
- confirmed update arrives → freshness/consistency may recover.

Do not use a generic "LOW CONFIDENCE" badge with no explanation.

The trainee must be able to answer:

"Why should I trust this information less now?"

---

# 6. DECISION REPLAY — MANDATORY

Every major decision must be recorded as an immutable decision snapshot.

The instructor must be able to click:

`REPLAY DECISION`

The replay system must reconstruct the exact information state available to the trainee at that moment.

Capture:

- scenario time;
- map state;
- communication state;
- network health;
- available reports;
- unavailable reports;
- report age;
- report confidence;
- contradictions present at that time;
- source/channel information;
- active environmental conditions;
- decision options shown;
- selected decision;
- rationale;
- score components.

CRITICAL:

The replay must NOT reveal future information that was unavailable when the decision was made.

The replay is intended to answer:

"What did the trainee know when they made the decision?"

Provide:

- timeline scrubber;
- pause/play;
- previous decision;
- next decision;
- synchronized map;
- synchronized information feed;
- synchronized communication health;
- decision marker;
- rationale panel;
- score explanation.

This feature is a core differentiator and must not be omitted.

---

# 7. SIX DEMO SCENARIOS

Implement at least these scenarios.

## 7.1 MARIA // COMMUNICATIONS SHOCK

Historical basis:

FCC Hurricane Maria public reports.

Mechanics:

- normal communications;
- progressive infrastructure degradation;
- packet loss;
- delayed reports;
- stale information;
- partial recovery.

All command structures and entities are synthetic.

---

## 7.2 ANATOLIA // PARTIAL RESILIENCE

Historical basis:

ITU / EBU Türkiye 2023 crisis-communications reporting.

Mechanics:

- one communication path degrades;
- an alternate path remains partially available;
- information arrives through mixed-quality channels;
- trainee must compare sources instead of assuming total blackout.

---

## 7.3 CHILE // FALLBACK WINDOW

Historical basis:

ITU disaster-response materials referencing Chile 2010.

Mechanics:

- primary channel fails;
- fallback channel is delayed but available;
- trainee decides whether to wait, switch channel, or act with uncertainty.

---

## 7.4 STORM CORRIDOR

Historical basis:

NOAA storm / IBTrACS public data.

Mechanics:

- real historical storm-track basis;
- fully synthetic command environment;
- environmental pressure progressively alters communications and information availability.

---

## 7.5 SEISMIC WINDOW

Historical basis:

USGS earthquake event/ShakeMap public data.

Mechanics:

- environmental disruption;
- relay instability;
- observation gaps;
- intermittent communications;
- contradictory reports.

---

## 7.6 BLACKOUT // INFORMATION FOG

Fully synthetic benchmark.

Mechanics:

- rapid multi-stage degradation;
- severe latency;
- packet loss;
- contradictory reports;
- sensor loss;
- relay failure;
- recovery;
- high-pressure decision windows.

This is the main "judge wow" scenario.

---

# 8. CORE COMMUNICATION MODEL

Suggested simulator heuristic:

`Q = availability * (1 - packetLoss) * latencyFactor * bandwidthFactor`

Then:

`confidence = sourceReliability * Q * freshness * consistency`

These are simulation heuristics.

They are NOT official military standards.

Make the variables tunable by the scenario designer.

---

# 9. DEGRADATION STATES

Implement explicit states:

- NORMAL
- MINOR_DELAY
- HIGH_LATENCY
- PARTIAL_DROPOUT
- SEVERE_DROPOUT
- STALE_INFORMATION
- CONTRADICTORY_REPORTS
- PARTIAL_SENSOR_LOSS
- RELAY_FAILURE
- BANDWIDTH_CONGESTION
- RECOVERY
- RECOVERED

The transition between states must be visible and reflected in:

- map links;
- information confidence;
- reports;
- event feed;
- decision pressure;
- scoring.

---

# 10. DATA PROVENANCE PAGE

Create a dedicated application page:

`/data-sources`

For every source show:

- Source name
- Organization
- Dataset/report
- Public URL
- Date/version if available
- Purpose in simulator
- Exact usage
- Licence/usage note if applicable
- Whether the data is:
  - HISTORICAL
  - SYNTHETIC
  - MAP DATA
  - OPTIONAL EXTERNAL
- Download/reference link

Use wording that makes the distinction obvious.

Example:

HISTORICAL BASIS
Public source used for communications-disruption calibration.

SIMULATION DATA
Fictional command entities and training events generated by COMMSHIELD.

---

# 11. SOURCE CITATION REQUIREMENTS

Each scenario must store provenance in its JSON.

Example:

```json
{
  "scenarioId": "maria-comms-shock",
  "historicalBasis": true,
  "sources": [
    {
      "name": "FCC Hurricane Maria Communications Status Report",
      "organization": "Federal Communications Commission",
      "url": "https://docs.fcc.gov/public/attachments/DOC-348851A1.pdf",
      "usage": "Historical communications disruption and recovery calibration"
    }
  ],
  "syntheticDisclaimer": "Command entities, locations, decision logic, and training injects are synthetic constructs."
}
```

---

# 12. WHAT THE AGENT SHOULD PREPROCESS

If network access is available during development, create small processed fixtures.

Examples:

`data/processed/noaa_storm_demo.json`

`data/processed/usgs_event_demo.json`

`data/processed/fcc_communications_reference.json`

`data/processed/itu_resilience_reference.json`

`data/processed/osm_demo_region.geojson`

Keep them small.

Do not store entire public archives.

Do not expose raw source URLs as application API dependencies.

---

# 13. WHAT THE AGENT SHOULD DO WHEN PUBLIC DATA CANNOT BE FETCHED

Do NOT stop the build.

Do NOT ask the user to manually download the dataset.

Use:

- synthetic local fixtures;
- documented historical source metadata;
- fixed sample event values;
- clearly marked historical calibration fields.

Example:

`data/scenarios/maria-comms-shock.json`

can contain a small, synthetic sequence such as:

1. NORMAL
2. MINOR_DELAY
3. HIGH_LATENCY
4. PARTIAL_DROPOUT
5. CONTRADICTORY_REPORTS
6. RECOVERY

The source page remains linked for provenance.

---

# 14. SAFETY / REALISM BOUNDARY

The simulator must be immersive but remain a fictional training environment.

Do NOT include:

- classified information;
- real military unit dispositions;
- real military facility coordinates;
- real targeting workflows;
- weapons employment guidance;
- operational military plans;
- sensitive command procedures;
- claims that the simulator reproduces actual military doctrine.

Use:

- fictional command units;
- fictional callsigns;
- fictional objectives;
- fictional routes;
- fictional observation cells;
- fictional communication networks.

Professional military-style presentation is acceptable.

No real military insignia or misleading official affiliation.

---

# 15. AI AGENT IMPLEMENTATION RULES

The core simulation must be deterministic.

AI may assist with:

- after-action explanation;
- instructor summaries;
- scenario narrative;
- scenario description;
- adaptive difficulty suggestions.

AI must NOT silently modify:

- simulation state;
- scoring;
- communication quality;
- trainee decision outcome;
- scenario facts.

If AI-generated text is shown, label it:

"AI-GENERATED TRAINING ANALYSIS"

The simulator itself must remain reproducible without AI.

---

# 16. REQUIRED REPOSITORY STRUCTURE

Suggested:

```text
/
├── README.md
├── ARCHITECTURE.md
├── DATA_SOURCES.md
├── SIMULATION_MODEL.md
├── SCENARIO_AUTHORING.md
├── DEMO_SCRIPT.md
├── .env.example
├── package.json
├── public/
│   └── demo/
├── data/
│   ├── raw/
│   ├── processed/
│   ├── scenarios/
│   └── sources/
├── scripts/
│   ├── fetch/
│   └── preprocess/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── stores/
│   ├── types/
│   └── workers/
└── tests/
```

---

# 17. PERFORMANCE REQUIREMENTS

Target:

- smooth 60 FPS on a modern laptop;
- fast initial load;
- no giant data downloads;
- no blocking network dependency;
- code splitting for maps/charts/PDF export;
- Web Workers for expensive preprocessing/calculation;
- local demo fixtures for immediate start.

Do not render thousands of map features unnecessarily.

Do not animate the DOM at high volume when Canvas/WebGL is more appropriate.

---

# 18. REQUIRED USER FLOW

The judge should be able to understand the core value without documentation.

Flow:

1. Open COMMSHIELD.
2. Click ENTER TRAINING.
3. Start a scenario.
4. Observe normal information flow.
5. Trigger or reach degradation.
6. Observe communications deteriorate.
7. Observe information-confidence scores fall.
8. Receive stale or contradictory reports.
9. Make a decision.
10. Enter rationale.
11. Receive a score with explainable dimensions.
12. Open AAR.
13. Click REPLAY DECISION.
14. Scrub the timeline.
15. See exactly what information was available at decision time.

---

# 19. FINAL ACCEPTANCE TEST

Do not consider the implementation complete until all of these work:

[ ] Scenario loads without external data
[ ] Map renders
[ ] Communications links animate
[ ] Degradation changes communication state
[ ] Information confidence changes dynamically
[ ] Each report explains its confidence
[ ] Contradictory reports are possible
[ ] Stale information is visible
[ ] Decision can be submitted
[ ] Rationale can be recorded
[ ] Score is deterministic and explainable
[ ] AAR is generated
[ ] Decision Replay works
[ ] Replay reconstructs the exact historical information state
[ ] Replay does not reveal future information
[ ] Instructor mode works
[ ] Scenario provenance is visible
[ ] Historical vs synthetic data is clearly separated
[ ] Offline/local demo works
[ ] No user manual dataset download is required
[ ] No giant dataset is shipped to the browser
[ ] Build succeeds
[ ] Production deployment succeeds
[ ] No TypeScript errors
[ ] No obvious runtime errors
[ ] UI remains readable at 1366x768 and 1920x1080

---

# 20. AGENT INSTRUCTION — USE THIS FILE AS A CONTRACT

When building COMMSHIELD:

1. Treat every public URL above as a source/provenance reference.
2. Do not require the human user to manually download any source dataset.
3. Prefer tiny normalized subsets or synthetic fixtures.
4. Keep the browser independent of giant datasets.
5. Build historical scenarios around publicly documented disruption/resilience patterns.
6. Keep all military entities and decisions fictional.
7. Implement the Information Confidence Engine as a first-class subsystem.
8. Implement Decision Replay / Information-State Reconstruction as a first-class subsystem.
9. Make the simulator deterministic.
10. Preserve source attribution inside the application.
11. Make the application run without network access after initial installation.
12. If a source cannot be retrieved, use a local synthetic fallback instead of blocking the build.
13. Do not replace these requirements with a generic analytics dashboard.
14. The core experience must feel like a high-end command-training simulator.

---

# 21. ONE-SENTENCE PRODUCT TEST

If a judge can watch the screen and immediately understand:

"Something just went wrong. I no longer trust my information. I have seconds to decide. What do I do?"

then the implementation is on target.

If the interface looks like a generic dashboard, the implementation is NOT on target.

