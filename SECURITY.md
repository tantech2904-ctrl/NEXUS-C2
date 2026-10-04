# NEXUS-C2 — SECURITY SPECIFICATION

> **Document priority:** 7 of 10 in the source-of-truth hierarchy.  
> Defer to master prompt, data sources doc, DESIGN.md, ARCHITECTURE.md, SIMULATION.md, and DATA.md on all conflicts.

---

## 1. Security Philosophy

NEXUS-C2 is a **browser-based training simulator** with an optional lightweight server component. Its security posture is defined by three concerns:

1. **Content safety** — never expose, generate, or imply sensitive operational or classified military information.
2. **Application security** — standard web application best practices appropriate for a public hackathon demo.
3. **Credential safety** — no API keys or secrets in client-side code.

NEXUS-C2 is not processing classified information, PII beyond basic session identifiers, or financial data. The threat model is proportionate.

---

## 2. Content Safety Boundary

This is the highest-priority security concern.

### 2.1 Prohibited content (absolute)

The application must never contain, generate, or display:

- Classified or restricted military information.
- Real military unit locations, force dispositions, or order-of-battle data.
- Real military facility coordinates or sensitive installation data.
- Targeting workflows, weapons employment procedures, or attack optimization.
- Real operational military plans or command procedures.
- Sensitive intelligence fusion methods.
- Any content that could be mistaken for an operational military system.

### 2.2 Required labelling

Every scenario with a historical basis must display:

> **HISTORICAL BASIS — PUBLIC DATA**

> **Command entities and scenario injects are synthetic training constructs.**

Every page rendering historical data must attribute the source.

### 2.3 AI-generated content labelling

If AI-generated analysis is displayed (P2 feature), it must be labelled:

> **AI-GENERATED TRAINING ANALYSIS**

AI-generated text must never modify simulation state, scoring, or scenario facts.

### 2.4 Fictional entity requirement

All command units, callsigns, relay identifiers, field team names, routes, objectives, and geographic coordinates within the simulation are fictional. They must not coincide with known real military unit designations or sensitive coordinates.

---

## 3. Credential and Secrets Management

### 3.1 No secrets in client-side code

- No API keys, database credentials, or tokens in any file served to the browser.
- `.env.example` lists all expected environment variables with placeholder values.
- Actual secrets go in `.env.local` (gitignored).

### 3.2 Environment variable classification

| Variable | Side | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client (safe) | No | Only the project URL — not a secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (safe) | No | Supabase anon key is designed to be public |
| `AI_API_KEY` | **Server only** | No | Never exposed to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | No | Never exposed to browser |

### 3.3 .gitignore requirements

```gitignore
.env.local
.env.*.local
/data/raw/
```

### 3.4 No hardcoded credentials

CI/CD pipelines must not log or print environment variable values. Use secret scanning in the repository if available.

---

## 4. Application Security

### 4.1 Input validation

- All scenario JSON files are validated with Zod schemas before use. Invalid schemas trigger a graceful error boundary, never a crash or undefined behaviour.
- Instructor inject inputs are validated client-side with Zod before processing.
- Free-text rationale input: sanitised before storage (strip HTML, limit to 500 chars).
- Scenario builder JSON import: parsed through Zod schema; invalid imports are rejected with a user-facing error.

### 4.2 Content Security Policy

Recommended CSP header for production deployment (Vercel `vercel.json` or `next.config.ts`):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  worker-src 'self' blob:;
  frame-ancestors 'none';
```

> Note: `'unsafe-eval'` may be required by MapLibre GL JS WebGL shader compilation. Review and tighten once library versions are confirmed.

### 4.3 Local data safety

- `localStorage` and `IndexedDB` store session snapshots and user-created scenarios only. No sensitive data is persisted locally.
- Session IDs are randomly generated UUIDs (non-predictable, non-sequential). They contain no PII.
- Decision snapshots contain only synthetic training data.

### 4.4 XSS prevention

- React's default JSX escaping provides baseline XSS protection.
- `dangerouslySetInnerHTML` is prohibited except for trusted, sanitised, internally generated HTML (e.g., PDF export generation).
- Rationale text is stored as plain text and rendered via React (not raw HTML).
- Information feed content is template-driven; user input never appears in the feed verbatim.

### 4.5 Dependency management

- Dependencies are pinned with `package-lock.json` or `pnpm-lock.yaml`.
- `npm audit` is run as part of CI.
- No dependency with a known critical vulnerability is included.
- Dependencies are limited to those with concrete functional need (per architecture principle).

### 4.6 CORS (if API routes are used)

Next.js API routes (if added for optional backend features) must:
- Allow only expected origins.
- Reject unauthenticated requests to any route beyond public scenario data.
- Never expose internal server errors in response bodies.

---

## 5. Optional Backend Security (P2)

If Supabase is added:

### 5.1 Row Level Security (RLS)
- Enable RLS on all Supabase tables.
- Session data: readable and writable only by the owning session token.
- Instructor analytics: readable only by authenticated instructor sessions.

### 5.2 Authentication
- Use Supabase Auth for instructor sessions.
- Trainee sessions use anonymous UUIDs (no account required).
- No PII is collected beyond optional session label.

### 5.3 Graceful degradation
- If Supabase is unreachable, all features degrade to local mode.
- No error is shown to the user beyond "Operating in local mode."
- The application never fails to boot because Supabase is unavailable.

---

## 6. AI Feature Security (P2)

If AI-generated AAR explanation is added:

- AI API key stored server-side only (environment variable, never in client bundle).
- Requests to AI APIs made from Next.js API routes, not from the browser directly.
- AI-generated text is treated as untrusted content: rendered as plain text, never injected as HTML.
- AI-generated text never modifies simulation state, scoring parameters, or scenario JSON.
- Rate limiting on the AI route (e.g., 10 requests per session per hour).
- If AI API is unavailable, AAR degrades to a deterministic template-based explanation.

---

## 7. Privacy

- NEXUS-C2 collects no PII in demo mode.
- Session IDs are randomly generated and not linked to any real identity.
- No analytics, telemetry, or third-party tracking scripts are loaded in the base application.
- If Supabase is added, session data is stored only for the duration of the training exercise unless the user explicitly saves it.

---

## 8. Responsible Disclosure

As a hackathon prototype, NEXUS-C2 does not maintain a formal security disclosure programme. Vulnerabilities identified should be reported to the project team through the SIH submission channel.

---

## 9. Safety Self-Checklist

Before each release:

- [ ] No classified or restricted military data in any file.
- [ ] No real military unit designations, coordinates, or facility identifiers.
- [ ] No API keys or secrets in the client-side bundle (`npm run build` output).
- [ ] `.env.local` is in `.gitignore`.
- [ ] All historical scenarios display provenance labels.
- [ ] All synthetic entities are labelled as synthetic.
- [ ] AI-generated content (if present) is labelled.
- [ ] Zod validation active for all scenario JSON loads.
- [ ] `npm audit` shows no critical vulnerabilities.
- [ ] `dangerouslySetInnerHTML` usage reviewed and justified.

---

*Document version: 1.0 — October 2026*
