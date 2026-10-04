# NEXUS-C2 // DECIDE UNDER UNCERTAINTY

**NEXUS** — *Networked Environment for eXploration, Uncertainty & Simulation*  
**C2** — *Command & Control Platform*

**Smart India Hackathon 2026 — Problem Statement SIH26248**  
*Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments*

---

## 1. Project Overview

In high-stakes operational command environments, the greatest threat is rarely a lack of technology—it is **uncertainty**. When communications degrade, field reports arrive late, telemetry becomes stale, sensors drop offline, and forward observation teams report contradictory situations.

**NEXUS-C2** is a deterministic browser-based command training simulator engineered to train military and crisis leadership on decision-making when information becomes delayed, incomplete, contradictory, or unavailable.

> **"What did the trainee know when they made the decision?"**

Rather than treating information as binary (TRUE or FALSE), NEXUS-C2 introduces two signature capabilities:
1. **Information Confidence Engine (ICE)** — A dynamic, transparent heuristic engine continuously computing real-time confidence for every intelligence report based on source reliability, transmission channel quality, freshness decay, and contradiction penalties:
   $$\text{Confidence} = \text{SourceReliability} \times \text{CommQuality} \times \text{Freshness} \times \text{Consistency}$$
2. **Decision Replay / Information-State Reconstruction** — An immutable snapshot engine allowing instructors and trainees to scrub backward in time to reconstruct the exact information state available at the moment of decision, with a strict **Zero Future-Information Leakage** guarantee.

---

## 2. One-Click Launchers (Judge & Evaluator Ready)

To make it completely effortless for judges and evaluators across any operating system, dedicated automated launch scripts are provided in the project root:

### For Windows:
- Double-click **`run_windows.bat`** (or execute `.\run_windows.bat` in CMD / PowerShell).
- Automatically checks Node.js, verifies dependencies, starts the simulator server, and opens Google Chrome or Microsoft Edge in immersive full-screen command center mode (`--start-fullscreen`).

### For Linux:
- Run in terminal:
  ```bash
  chmod +x run_linux.sh && ./run_linux.sh
  ```
- Automatically verifies environment, installs dependencies if needed, starts the engine, and launches your browser in kiosk / full-screen mode.

### For macOS:
- Run in terminal:
  ```bash
  chmod +x run_mac.sh && ./run_mac.sh
  ```
- Automatically checks environment, starts the background engine, and launches Google Chrome or default browser in full-screen mode.

### Manual Command Line (Any OS):
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000/console)** in your browser.  
*(Press `F11` or click `[ FULLSCREEN ]` in the top right header for optimal full-screen command center view).*

---

## 3. What Each Tab & Screen in the Platform Does

```
[TRAINEE CONSOLE]    [INSTRUCTOR ROOM]    [SCENARIO LIBRARY]    [SCENARIO BUILDER]    [DATA PROVENANCE]
```

### Tab 1: Trainee Command Console (`/console`)
The core operational station where commanders and trainees monitor operations and make decisions under uncertainty:
- **Offline 1:50,000 Topographic Tactical Map**:
  - Natural elevation shading, 50m/100m contour lines, river corridors, and peak elevations.
  - Uniform aspect-ratio Mercator projection (no horizontal or vertical stretching).
  - Clean non-overlapping top toolbar showing scenario name, elevation range (`ELEV: 240m – 1480m`), layer toggles (`TOPO`, `CONTOURS`, `COMMS`), and interactive mouse pan/zoom (`0.3x` to `3.5x`).
  - Interactive nodes: Command nodes, tactical relay towers, reconnaissance field teams, observation drones, and real-time packet flow comets.
  - Red pulsing reticles on links or nodes suffering from active contradictions or jamming.
- **Center Panel: Information Feed & Confidence Engine (ICE)**:
  - Chronological real-time intelligence cards with age timers (`T+38s`, `Age: 12s`).
  - Color-coded ICE badges: `CONFIRMED` (green), `LIKELY` (cyan), `STALE` (amber), `CONTRADICTED` (pulsing red).
  - Click any card to open a transparent audit panel showing exact numerical breakdown ($S \times Q \times F \times C$).
- **Right Panel: Tactical Decision Window & Mandatory Rationale**:
  - When crisis conditions trigger, a countdown decision window opens.
  - Trainees choose actions (`VERIFY`, `SWITCH_INFORMATION_CHANNEL`, `PAUSE`, `ADAPT_PLAN`, `ESCALATE`).
  - **Mandatory Military Rationale**: Requires trainees to articulate *why* they chose their action. Rushing blind on stale or contradictory data is heavily penalized.
- **Judge-Friendly Sub-Navbar**:
  - `[ ← SCENARIOS ]`: One-click button returning directly to the scenario library.
  - `MISSION SELECTOR`: Instant dropdown switcher across all 9 scenarios without leaving the console.
  - `[ ⟲ RESET ]`: Immediately restarts the mission to `T+00:00`.
  - `LAYOUT SWITCHER`: Toggle between `3-PANE`, `MAP`, `INTEL`, or `DECISION` views to fit any screen resolution.
  - `[ ⚡ 3-MIN TOUR ]`: Launches the automated live demonstration with floating commentary HUD.

### Tab 2: After-Action Review (AAR) & Decision Replay
Accessed via the `[ AFTER-ACTION REVIEW ]` tab or automatically upon mission conclusion:
- **8-Dimension Radar Evaluation**:
  - Decision Quality, Timeliness, Information Discipline, Source Evaluation, Communication Resilience, Coordination, Risk Management, and Adaptability.
- **Timeline Inspection**: Review every decision, chosen action, outcome classification, and recorded military rationale.
- **Decision Replay**: Click `[ REPLAY DECISIONS ]` to scrub through the exact state of the map and feed at the moment of decision. Zero future information is visible.
- **Export & PDF**: Click `[ EXPORT / PRINT PDF ]` to generate official AAR debrief documentation.

### Tab 3: Instructor Control Room (`/instructor`)
Allows proctors, instructors, or evaluators to inject real-time stress vectors during an ongoing exercise:
- Inject High Latency (+450ms carrier delay)
- Inject Packet Loss (60% dropout)
- Sever Relay Power / Link Jamming
- Inject False / Contradictory Intelligence
- Trigger Satellite or Wireline Recovery
- Inspect live trainee latency and uncertainty metrics.

### Tab 4: Tactical Scenario Library (`/scenarios`)
Comprehensive catalog of 9 calibrated training scenarios, ranging from foundation drills to expert multi-domain crises:
1. **SCN-06: BLACKOUT // CASCADE COLLAPSE** *(Flagship 3-Min Demo)* — Microwave backhaul loss, drone vs relay contradiction on corridor Alpha-7.
2. **SCN-01: HURRICANE MARIA // ISLAND-WIDE COMM COLLAPSE** — 85% cell tower collapse, high-frequency radio and satellite backhaul fallback.
3. **SCN-02: ANATOLIA SEISMIC // BACKHAUL SEVERANCE** — Dual-earthquake disaster with 850ms latency spikes and optical fiber severance.
4. **SCN-03: ATACAMA SUBDUCTION // TSUNAMI CONTRADICTION** — Contradicting buoy sensor telemetry vs local port radar during evacuation.
5. **SCN-04: TYPHOON HAIYAN // STORM SURGE DROPOUT** — 100% telemetry severance in Tacloban coastal corridor, battery depletion.
6. **SCN-05: HIMALAYAN SEISMIC // AVALANCHE RELAY LOSS** — Ridge-line repeater destruction, delayed foot scout reports, channel adaptation.
7. **SCN-07: FUKUSHIMA DAIICHI // STATION BLACKOUT** — Tsunami flooded diesel generators, SCADA optical severance, dosimeter buffer freeze.
8. **SCN-08: LADAKH SIEL // HIGH-ALTITUDE RF ATTENUATION** — -35°C battery capacity collapse, 5,800m granite ridge satellite shadowing, avalanche blockage.
9. **SCN-09: URBAN POWER GRID // CYBER-PHYSICAL SPOOF** — Packet flood, spoofed SCADA dashboard vs verified physical scout observation.

### Tab 5: Scenario Builder (`/builder`)
Author custom training missions: configure geographic boundaries, initial comm links, MSEL event timelines, degradation parameters, and decision criteria, with JSON export and import.

### Tab 6: Data Provenance Registry (`/data-sources`)
Maintains traceable metadata for all public historical datasets used to calibrate the synthetic training environment (ITU, FCC, NOAA, USGS, OpenStreetMap, IAEA, DRDO, CISA).

---

## 4. The 3-Minute Live Demo Flow

When evaluating NEXUS-C2 in an interview or judging session:
1. Click **`[ ⚡ 3-MIN TOUR ]`** in the top-right header or guided banner.
2. The simulator accelerates to 2x speed with an active floating HUD explaining each stage:
   - **T+00-18 (Nominal)**: Baseline 98% telemetry flow with smooth packet comets across natural terrain.
   - **T+18-38 (Degradation)**: Carrier latency spikes (+450ms); packet trails visibly decelerate.
   - **T+38-65 (Contradiction)**: Drone Alpha contradicts Relay Beta; both flag red; ICE confidence drops to 45%.
   - **T+65-85 (Decision Window)**: Decision triggers; automated `SWITCH_INFORMATION_CHANNEL` with military rationale commits.
   - **T+85+ (AAR & Replay)**: Automatically transitions into After-Action Review; radar chart scores performance; Decision Replay displays immutable zero-leak state.
3. Use the HUD shortcuts (`⏩ CONTRADICTION`, `⏩ DECISION`, `⏩ AAR SCORE`) to jump immediately to any phase if time is limited!

---

## 5. Technology Architecture

- **Engine**: Next.js 14, React 18, TypeScript 5 (Strict Mode)
- **State & Determinism**: Zustand with seeded PRNG for reproducible training runs
- **Cartography**: HTML5 2D Canvas offscreen rendering with aspect-ratio Mercator projection & MapLibre GL
- **Audio System**: Web Audio API tactical sound synthesis (clicks, alerts, chirps, commit chimes) with mute toggle
- **Charts**: Recharts radar & linear telemetry graphs
- **Validation**: Zod schema validation across all scenarios and MSEL injects
- **Offline Operation**: 100% local operation with zero cloud dependencies or external API keys

---

*NEXUS-C2 &bull; Smart India Hackathon 2026 &bull; Problem Statement SIH26248*