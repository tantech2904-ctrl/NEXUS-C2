# NEXUS-C2 // DECIDE UNDER UNCERTAINTY

**Smart India Hackathon 2026 — Problem Statement SIH26248**  
*Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments*

---

## 1. Project Overview

In high-stakes operational command environments, the greatest threat is rarely a lack of technology—it is **uncertainty**. When communications degrade, field reports arrive late, telemetry becomes stale, sensors drop offline, and forward observation teams report contradictory situations.

**NEXUS-C2** is a deterministic browser-based command training simulator engineered to train decision-making when information becomes unreliable.

> **"What did the trainee know when they made the decision?"**

Rather than treating information as binary (TRUE or FALSE), NEXUS-C2 introduces two signature capabilities:
1. **Information Confidence Engine (ICE)** — A dynamic, transparent heuristic engine computing real-time confidence for every intelligence report based on source reliability, transmission channel quality, freshness decay, and contradiction penalties.
2. **Decision Replay / Information-State Reconstruction** — An immutable snapshot engine allowing instructors and trainees to scrub backward in time to reconstruct the exact information state available at the moment of decision, with a strict **Zero Future-Information Leakage** guarantee.

---

## 2. How to Run the Application

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+ installed.

### Quick Start Commands

```bash
# 1. Clone or open the repository folder
cd c:\Users\tanis\Desktop\NEXUS-C2

# 2. Install dependencies
npm install

# 3. Run unit tests (17 tests covering ICE, replay immutability, scoring, and schemas)
npm test

# 4. Start development server
npm run dev
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

### Production Build & Run
```bash
# Build optimized production bundle
npm run build

# Start local production server
npm start
```

*Note: NEXUS-C2 runs 100% offline out-of-the-box. No external database, cloud backend, or third-party API key is required.*

---

## 3. What Each Tab & Screen in the Site Does

NEXUS-C2 is structured into dedicated operational stations accessible via the top navigation bar:

```
[TRAINEE CONSOLE]    [INSTRUCTOR CONTROL]    [SCENARIO LIBRARY]    [DATA PROVENANCE]
```

---

### Tab 1: Landing Hub (`/`)
- **Purpose**: The entry point for evaluators and trainees.
- **Features**:
  - **Animated Tactical Network**: Interactive canvas background simulating 28 interconnected nodes with packet transmissions.
  - **System Readiness Board**: Real-time status indicators confirming the simulation engine, degradation engine, and ICE pipeline are operational.
  - **Quick-Start Actions**:
    - `START LIVE 3-MIN DEMO`: Immediately loads the flagship scenario (`SCN-06`) and launches the simulation.
    - `ENTER TRAINING CONSOLE`: Direct entry into the command console.
    - `INSTRUCTOR ROOM`: Access to the exercise controller interface.
    - `SCENARIO LIBRARY`: Browse and select from the 6 pre-configured scenarios.

---

### Tab 2: Trainee Command Console (`/console`)
The central simulation screen where the trainee monitors operations and commits decisions. It is split into three coordinated panels:

#### A. Persistent Top Header
- **Scenario ID & Session ID**: Identifies active exercise (e.g., `SCN-06`) and unique session UUID (e.g., `SES-8A2F`).
- **Clock (`T+xx:xx`)**: Independent virtual simulation clock that advances deterministically.
- **Mission Phase**: Current tactical phase (e.g., `PHASE 01 / NOMINAL` $\rightarrow$ `PHASE 02 / DEGRADED INFORMATION`).
- **Comms Health Meter**: Live aggregate transmission quality across all active radio and data links ($0\text{--}100\%$).
- **Integrity Meter**: Average confidence score across all active field intelligence items.
- **Status Badge**: Current overall network state (`NORMAL`, `HIGH_LATENCY`, `PARTIAL_DROPOUT`, `CONTRADICTORY_REPORTS`, `SEVERE_DROPOUT`).

#### B. Left Panel: Tactical Operational Map
- **Nodes & Tactical Formations**:
  - 🔵 **Pentagon (Pulsing Ring)**: Command Node (NEXUS Main Hub).
  - 🔷 **Diamond**: Forward Tactical Relay Towers.
  - ⬜ **Square**: Forward Field Reconnaissance Teams (e.g., Team Alpha, Team Bravo).
  - 🟢 **Circle**: Observation Cells & Drone telemetry nodes.
- **Live Communication Links & Packet Particles**:
  - **Healthy (Solid Cyan)**: Rapid, smooth packet particle flow.
  - **Degraded (Amber)**: Slower particle movement with intermittent packet gaps.
  - **Severed (Red Dashes)**: Dashed red links with zero packet throughput.
- **Tactical Overlays**:
  - **Degraded RF Envelope**: Visualized boundary of severe atmospheric or backhaul disruption.
  - **Transit Corridors**: Defined movement routes between nodes.
  - **Uncertainty Halos**: Concentric pulsing rings around units with conflicting or stale intelligence.
- **Interactive Inspector**: Clicking on any node displays its active channel, latency, packet loss, and $Q$ quality factor.

#### C. Middle Panel: Information Feed (ICE Stream)
Incoming field reports and sensor feeds arrive chronologically. Every item is rendered as an **Information Confidence Card**:
- **Source & Origin**: Unit callsign, origin timestamp, and elapsed age in seconds.
- **Verification Status Tag**:
  - `CONFIRMED`: High confidence, fresh report over a verified healthy channel.
  - `LIKELY`: Acceptable reliability with minor latency.
  - `UNCERTAIN`: Low source reliability or moderate packet loss.
  - `STALE`: Report age exceeded threshold (e.g., $>35\text{s}$).
  - `CONTRADICTED`: Two or more reports disagree on the same tactical fact (pulses red).
  - `UNAVAILABLE`: Carrier channel has dropped offline.
- **Dynamic Confidence Percentage & Bar**:
  $$\text{Confidence} = \text{SourceReliability} \times \text{ChannelQuality}(Q) \times \text{Freshness} \times \text{Consistency}$$
- **Expandable Confidence Audit ("Why It Fell")**:
  - Clicking any report reveals an itemized explanation of why confidence degraded (e.g., report age decay, carrier loss, or direct conflict with another node).

#### D. Right Panel: Decision & Rationale Capture
- **Situation Context**: Live brief summarizing the operational dilemma.
- **Decision Window**: When opened by the scenario or instructor (amber pulse), 10 tactical actions unlock:
  - `ASSESS`: Hold order to analyze discordant telemetry.
  - `VERIFY`: Cross-check conflicting reports through alternative paths.
  - `CONTINUE`: Proceed on current vector despite uncertainty.
  - `PAUSE`: Halt forward elements until comms stabilize.
  - `REQUEST_UPDATE`: Send priority ping to refresh stale information.
  - `SWITCH_CHANNEL`: Reroute communications to fallback radio/satcom.
  - `ESCALATE`: Elevate degraded conditions to higher headquarters.
  - `RECONFIGURE_TEAM`: Reassign units or set up point-to-point mesh.
  - `STAND_BY`: Maintain defensive posture.
  - `ADAPT_PLAN`: Change route or mission objective to avoid degraded areas.
- **Mandatory Operational Rationale**: Trainee must type their operational justification (minimum 15 characters). **Blind guessing is blocked.**
- **Commit Decision**: Records decision, freezes an immutable state snapshot, scores the response, and simulates consequences.

#### E. Bottom Footer Controls
- **Simulation Control**: `[RUN SIM]`, `[PAUSE SIM]`, `[RESET]`.
- **Speed Multipliers**: `0.5x`, `1x`, `2x`, `5x`.
- **Per-Channel Health Meters**: Individual indicators for Broadband Data Link, Tactical Radio, and Emergency Satcom.
- **Live Event Ticker**: Rolling ticker of the most recent injects.

---

### Tab 3: After-Action Review (AAR) & Decision Replay
Accessible via the sub-navbar tab in `/console` or after scenario completion:

- **Overall Training Score**: Aggregated rating from 0 to 100 with qualitative outcome class (`POSITIVE`, `NEUTRAL`, `SUBOPTIMAL`, `HIGH_RISK`).
- **8 Evaluation Dimensions (Radar Chart & Matrix)**:
  1. *Decision Quality*: Tactical appropriateness for the given uncertainty.
  2. *Timeliness*: Decision latency without rewarding reckless haste.
  3. *Information Discipline*: Prioritizing verification over impulse.
  4. *Source Evaluation*: Acknowledging source reliability in rationale.
  5. *Communication Resilience*: Adapting to degraded/severed links.
  6. *Coordination*: Involving appropriate command escalation and teams.
  7. *Risk Management*: Acknowledging hazards and conflicting reports.
  8. *Adaptability*: Modifying plans as conditions evolve.
- **Decision Timeline**: Chronological record of all committed decisions, showing action taken, rationale, and consequences.
- **Decision Replay Modal (`REPLAY DECISIONS`)**:
  - Interactive timeline scrubber allowing step-by-step navigation through historical decisions.
  - **WHAT WAS KNOWN**: Reconstructs only reports received on or before that exact tick.
  - **WHAT WAS UNKNOWN**: Reconstructs transmission channels that were down and reports not yet received.
  - **Zero Future-Information Leakage**: Information received after the decision timestamp is strictly excluded.

---

### Tab 4: Instructor Control Room (`/instructor`)
Designed for exercise evaluators to monitor and inject real-time stress:
- **Live Trainee View Mirror**: Real-time read-only mirror of the trainee's tactical map and telemetry health.
- **Reversible Degradation Injects**:
  - `INJECT LATENCY SPIKE`: Induces +450ms packet delay and jitter.
  - `INJECT PACKET LOSS (+40%)`: Elevates carrier packet drop rate.
  - `TRIGGER COMPLETE DROPOUT`: Drops availability to 5% (severe blackout).
  - `INJECT CONTRADICTION`: Dispatches conflicting field reports.
  - `SEVER RELAY COUPLING`: Simulates physical relay node power failure.
  - `TRIGGER AUXILIARY RECOVERY`: Restores carrier back to nominal health.
  - `TRIGGER DECISION WINDOW`: Forces an immediate tactical decision window on the trainee.
- **Live Evaluation Metrics**: Tracks decisions committed, active contradictions, and stale reports.
- **ICE Heuristic Audit Formula**: Displays live formula parameters for debriefing.

---

### Tab 5: Tactical Scenario Library (`/scenarios`)
Browse and launch all 6 pre-configured scenarios:

| Scenario ID | Title | Difficulty | Calibration Basis | Focus |
|---|---|---|---|---|
| **SCN-06** | **BLACKOUT // INFORMATION FOG** | EXPERT | Synthetic Benchmark | Multi-stage degradation, conflicting reports, satcom recovery *(Main Demo)* |
| **SCN-01** | **MARIA // COMMUNICATIONS SHOCK** | ADVANCED | FCC Hurricane Maria Reports | Cellular backhaul collapse and delayed search-and-rescue reports |
| **SCN-02** | **ANATOLIA // PARTIAL RESILIENCE** | ADVANCED | ITU/EBU Türkiye 2023 | Cellular failure while emergency FM radio survives (heterogeneous channels) |
| **SCN-03** | **CHILE // FALLBACK WINDOW** | ADVANCED | ITU Chile 2010 | Microwave link collapse forcing emergency HF radio activation |
| **SCN-04** | **STORM CORRIDOR** | ADVANCED | NOAA IBTrACS & Storm Events | Atmospheric rain fade and UHF RF degradation along cyclone eye |
| **SCN-05** | **SEISMIC WINDOW** | ADVANCED | USGS FDSN Catalog & ShakeMap | Ground rupture severing fiber optic loop, generating route destruction |

*Each scenario card features a one-click `LAUNCH` button to start training immediately.*

---

### Tab 6: Data Provenance Registry (`/data-sources`)
- **Purpose**: Academic and technical transparency.
- **Registry**: Comprehensive listing of all 11 canonical public datasets used in the project:
  - *SIH26248 Problem Statement* (Requirements baseline)
  - *FCC Hurricane Maria Reports* (DOC-348851A1 & DOC-353805A1)
  - *ITU / EBU Crisis Communications Report — Türkiye 2023*
  - *ITU Emergency Telecommunications in Disaster Response — Chile 2010*
  - *NOAA Storm Events Database & NOAA IBTrACS Cyclone Archive*
  - *USGS Earthquake Catalog (FDSN) & USGS ShakeMap Atlas v4*
  - *OpenStreetMap (OSM) via Geofabrik*
- **Details per Source**: Organization, official URL, dataset purpose, processing/normalization method, and license.

---

## 4. The 3-Minute Live Demo Script (Step-by-Step)

Follow this exact flow during demonstrations or evaluations:

1. **Start the Demo (`T+00:00`)**:
   - Navigate to `/` and click **`START LIVE 3-MIN DEMO`**.
   - You land on `/console` with scenario `SCN-06: BLACKOUT // INFORMATION FOG` loaded.
2. **Observe Nominal Operation (`T+00:00` to `T+00:15`)**:
   - Click **`RUN SIM`** in the bottom footer.
   - Training clock advances. Comms health is at **96%**, Info Integrity at **94%**.
   - At `T+00:08`, Field Team Alpha transmits: *"Grid Alpha-7 transit corridor status: CLEAR"*. Status is `CONFIRMED` with **92% confidence**.
3. **Experience Degradation Strike (`T+00:18` to `T+00:35`)**:
   - At `T+00:18`, microwave backhaul latency spikes (+450ms).
   - At `T+00:28`, packet loss exceeds 38%.
   - Observe that packet particles on the map slow down and Comms Health falls into amber.
4. **Encounter Information Fog & Contradiction (`T+00:38` to `T+00:56`)**:
   - At `T+00:38`, Drone Observation feed arrives: *"Corridor Alpha-7 visually IMPEDED. Heavy dust/debris"*.
   - At `T+00:44`, Tactical Relay 02 reports: *"Corridor Alpha-7 is OPEN"*.
   - **Both reports pulse red with status `CONTRADICTED`**. Confidence falls to ~45%.
   - At `T+00:56`, Tactical Relay 02 suffers complete power failure; its link turns dashed red.
5. **Commit Tactical Command Decision (`T+01:05` / `65s`)**:
   - Amber alert flashes: **`DECISION WINDOW ACTIVE`**.
   - Review the situation context.
   - Select **`VERIFY`** or **`SWITCH_INFORMATION_CHANNEL`**.
   - Type your rationale: *"Observation drone contradicts relay telemetry while primary link is degraded; verifying through auxiliary satcom before proceeding."*
   - Click **`COMMIT DECISION`**.
6. **Evaluate After-Action Review (AAR)**:
   - Click **`AFTER-ACTION REVIEW`** in the top sub-bar.
   - Review the **Overall Score** and **Radar Chart** across the 8 dimensions.
   - Inspect the decision timeline item and its outcome classification (`POSITIVE`).
7. **Perform Decision Replay**:
   - Click **`REPLAY DECISIONS`**.
   - The scrubber reconstructs the exact state at that millisecond.
   - Verify that intelligence received *after* that moment is hidden (**Zero Future-Information Leakage**).

---

## 5. Technology Stack & Verification

- **Frontend & App Engine**: Next.js 14 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS (Near-black graphite `#0d0f10`, charcoal panels `#141618`, muted cyan `#4fc3d0`, amber alerts `#d4860a`)
- **State Management**: Zustand (Deterministic simulation and session slices)
- **Map & Canvas Engine**: HTML5 Canvas 2D API (`requestAnimationFrame` 60 FPS particle loop) + MapLibre GL
- **Data Validation**: Zod runtime schema validation
- **Analytics & Radar**: Recharts
- **Icons**: Lucide React
- **Test Suite**: Vitest (17 passing unit tests)

---

## 6. Safety, Ethical & Legal Boundaries

- **Synthetic Training Construct**: All tactical units, command nodes, callsigns, coordinates, formations, and scenario injects are strictly fictional.
- **No Operational Military Intelligence**: NEXUS-C2 does not model weapons employment, targeting workflows, real force dispositions, classified installations, or operational military doctrine.
- **Public Data Attribution**: Historical sources (FCC, NOAA, USGS, ITU, OpenStreetMap) are used exclusively for environmental disruption calibration and provenance. Full citations are maintained in `/data-sources`.

---

*NEXUS-C2 — DECIDE UNDER UNCERTAINTY &bull; Smart India Hackathon 2026*