# NEXUS-C2 // DECIDE UNDER UNCERTAINTY

**Smart India Hackathon 2026 — Problem Statement SIH26248**  
*Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments*

---

## 1. Executive Summary

In high-stakes command scenarios, the greatest threat is rarely a lack of technology—it is **uncertainty**. When communications degrade, field reports arrive late, telemetry becomes stale, sensor feeds drop offline, and observation teams report conflicting statuses.

**NEXUS-C2** is a deterministic browser-based command training simulator built to train decision-making under information failure.

> **"What did the trainee know when they made the decision?"**

Rather than treating information as binary (TRUE or FALSE), NEXUS-C2 implements two mandatory signature capabilities:
1. **Information Confidence Engine (ICE)** — A dynamic, explainable confidence engine computing real-time reliability for every report based on source reliability, channel quality, freshness decay, and contradiction penalties.
2. **Decision Replay / Information-State Reconstruction** — An immutable snapshot engine allowing instructors to scrub backward in time to reconstruct the exact information state available at the moment of decision, with zero future-information leakage.

---

## 2. 15-Second Judge Overview

1. **Launch Live Demo**: Trainee starts at T+00:00 with nominal 96% communications health.
2. **Environmental Degradation**: At T+00:25, microwave backhaul latency climbs, packet loss spikes to 38%, and Tactical Relay 02 suffers complete power failure.
3. **Information Fog**: Forward drone reconnaissance reports route Alpha-7 obstructed, while secondary relay reports route clear. Confidence falls from 92% to 45% (Status: `CONTRADICTED`).
4. **Command Decision**: Decision window opens. Trainee assesses discordant telemetry, selects an action (e.g., `VERIFY` or `SWITCH_INFORMATION_CHANNEL`), and records a mandatory operational rationale.
5. **Immediate After-Action Review (AAR) & Decision Replay**: Trainee and instructor inspect 8-dimension scoring and scrub historical timelines to verify what was known vs. unknown at that exact second.

---

## 3. Mandatory Signature Capabilities

### A. Information Confidence Engine (ICE)
Every report card in the live feed computes:
$$\text{Confidence} = \text{SourceReliability} \times \text{CommunicationQuality} (Q) \times \text{Freshness} \times \text{Consistency}$$

Where transmission channel quality is modeled as:
$$Q = \text{Availability} \times (1 - \text{PacketLoss}) \times \text{LatencyFactor} \times \text{BandwidthFactor}$$

- **Freshness**: Exponential decay over age: $e^{-\lambda \cdot \text{age}}$
- **Consistency**: 1.0 (nominal) $\rightarrow$ 0.50 (contradicted by 1 source) $\rightarrow$ 0.25 (multi-source conflict)
- **Status Tags**: `CONFIRMED`, `LIKELY`, `UNCERTAIN`, `STALE`, `CONTRADICTED`, `UNAVAILABLE`
- **Transparent Audit**: Clicking any report reveals a human-readable explanation of why confidence degraded.

### B. Decision Replay / Zero-Leakage Guarantee
At the moment of decision, the simulator creates a deep-frozen, immutable snapshot (`Object.freeze`) storing:
- Operational map state & network topology
- Available reports (strictly timestamped $\le \text{decisionTick}$)
- Channel availability, packet loss, and latency
- Selected command action and trainee rationale
- Dimension score breakdown

**Zero Future-Information Leakage**: Replay strictly excludes any event or report received after the decision timestamp.

---

## 4. Scenario Library (6 Pre-Configured Scenarios)

1. **SCN-06 — BLACKOUT // INFORMATION FOG** *(Flagship Synthetic Demo)*  
   Rapid multi-stage degradation, secondary relay failure, conflicting route reports, and emergency satcom recovery.
2. **SCN-01 — MARIA // COMMUNICATIONS SHOCK** *(Historical Basis: FCC Hurricane Maria)*  
   Extreme cellular backhaul collapse and delayed search-and-rescue field reports.
3. **SCN-02 — ANATOLIA // PARTIAL RESILIENCE** *(Historical Basis: ITU/EBU Türkiye 2023)*  
   Heterogeneous communications modeling where cellular links fail while emergency FM radio survives.
4. **SCN-03 — CHILE // FALLBACK WINDOW** *(Historical Basis: ITU Chile 2010)*  
   Primary microwave link failure forcing transition to emergency HF radio net.
5. **SCN-04 — STORM CORRIDOR** *(Historical Basis: NOAA IBTrACS & Storm Events)*  
   Atmospheric rain fade and progressive UHF RF degradation along tropical cyclone track.
6. **SCN-05 — SEISMIC WINDOW** *(Historical Basis: USGS FDSN Catalog & ShakeMap)*  
   Ground rupture severing fiber optic loop, generating observation blackout and route destruction.

---

## 5. Technology Stack

- **Framework**: Next.js 14 (App Router) & React 18
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Tactical Graphite Dark Palette)
- **State Management**: Zustand (Deterministic slices)
- **Telemetry Charts**: Recharts
- **Icons**: Lucide React
- **Validation**: Zod (Runtime Scenario & Inject Schemas)
- **Testing**: Vitest & React Testing Library
- **Offline / Standalone**: Zero external database or cloud API required for 100% functionality.

---

## 6. Installation & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (17 passing tests covering ICE, Q formulas, replay immutability, scoring)
npm test

# 3. Build production bundle
npm run build

# 4. Start local production server
npm start
```

Open `http://localhost:3000` in any modern web browser.

---

## 7. Safety, Ethical & Legal Boundaries

- **Synthetic Training Construct**: All tactical units, command callsigns, coordinates, formations, and injects are strictly fictional.
- **No Operational Military Intelligence**: NEXUS-C2 does not model weapons targeting, real military dispositions, classified facilities, or tactical doctrine.
- **Public Data Attribution**: Historical datasets (FCC, NOAA, USGS, ITU, OpenStreetMap) are used solely for environmental degradation calibration. Full provenance is documented on the `/data-sources` page.
