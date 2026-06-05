# PQC Deal Readout

Generate a board-ready post-quantum-cryptography (PQC) deal readout for a target account. Pick a vertical (defense, finance, or healthcare) and optionally a company name, and the app produces a tailored five-part briefing:

- **Discovery brief** — the account's likely crypto exposure and regulatory surface.
- **Harvest-now-decrypt-later risk** — quantified with the Mosca inequality and shown on a timeline.
- **Regulatory clock** — the specific PQC deadlines that apply to the vertical, anchored to the current year.
- **Migration sketch** — where the finalized NIST suite (ML-KEM, ML-DSA, SLH-DSA) slots in.
- **CISO one-pager** — a ready-to-send leave-behind you can copy to the clipboard or save as a PDF.

Every readout is shareable via a stateless link and prints cleanly to PDF.

> **Scope.** This is a go-to-market translation tool. It does not scan or detect cryptography in code, and it does not produce a CBOM. It consumes a vertical profile and produces the deal narrative on top.

## How it stays factually correct

The credibility of a PQC briefing rests on never getting a regulatory date or algorithm name wrong. The architecture enforces that:

- **Facts come from a versioned data file** (`src/data/verticals.ts`), never the language model's memory. Every regulatory deadline and NIST standard is sourced and cited in the readout.
- **The Mosca risk score is computed in code** (`src/lib/mosca.ts`), never by the model — deterministic and identical across runs.
- **A grounding gate** (`src/lib/facts-grounding.ts`) inspects every generated readout and rejects it if it contains any year or algorithm name not present in the data file. Generation fails closed rather than ship an invented fact.
- The model composes prose around the injected facts only; it never sources a number or a standard from memory.

The net effect: the model writes the narrative, but the facts are verified and cannot be hallucinated — a tampered share link can't even surface a fake date.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Anthropic Claude API for prose composition (server-side only)
- Vitest for tests · deployed on Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (used server-side only)
npm run dev                  # http://localhost:3000
```

The app renders a complete, grounded readout with no API call (a per-vertical archetype). Add an API key to generate tailored, live readouts; if generation is unavailable it falls back to the archetype, so the page is never blank.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the test suite |
| `npm run lint` | Lint |

## Project structure

```
src/
  app/                  routes: / (readout), /r (shared link), /api/generate
  components/readout/   the readout UI
  data/verticals.ts     the sourced PQC facts — the single source of truth
  lib/                  mosca (risk math), readout (generation), facts-grounding, share
tests/                  mosca, facts-grounding, generation, route handler
```

## Security

The Claude API key is used only in the server-side generation route and never reaches the client bundle. The generation endpoint is rate-limited per IP, and no user data is stored.

## A note on the data

The regulatory timelines (CNSA 2.0 / NSM-10, EU DORA and the EU PQC roadmap, the HIPAA Security Rule update) are transcribed from primary sources and cited in-app. Several are hedged — proposed rules or approximate dates — and are labelled as such in the readout. Confirm against the cited primary sources before any high-stakes use.
