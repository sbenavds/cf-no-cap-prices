# cf-NoCapPrices — CLAUDE.md

## Project Overview

cf-NoCapPrices is a single-screen web app where users paste a product URL (Amazon, eBay, etc.), compare prices across 4 competitor stores, and get an AI-generated verdict on whether the deal is legitimate or a scam. Built entirely on Cloudflare's ecosystem — no AWS, no external infrastructure.

---

## Tech Stack

### Frontend
- **React 19** — Server Components, Streaming, Suspense
- **React Router v7 (Remix)** — Full-stack framework with Cloudflare Pages adapter. File-based routing, loaders, actions, SSR.
- **TypeScript** — strict mode enabled
- **Tailwind CSS v4** — utility-first styling, configured via `app/globals.css` (`@import "tailwindcss"`), no `tailwind.config.js`
- **shadcn/ui** — component library built on Radix UI primitives. Components live in `app/components/ui/`. Add via `pnpm dlx shadcn@latest add <component>`.
- **Biome** — linting + formatting (replaces ESLint + Prettier). Config in `biome.json`.
- **Hooks used**: `useOptimistic`, `useFormStatus`, `useTransition`, `useDeferredValue`

### Backend / Cloudflare Services

| Service | Role |
|---|---|
| **Cloudflare Pages** | Hosts the React Router v7 app. Global CDN, automatic edge caching. |
| **Cloudflare Workers** | Serverless compute. Replaces Lambda + API Gateway. One Worker per concern. |
| **Hono** | Web framework for Workers. Type-safe routing, middleware, RPC client. |
| **Browser Rendering API** | Headless Chromium in a Worker. Scrapes 4 competitor stores in parallel. |
| **Cloudflare KV** | Edge key-value store. Caches scraped prices (1h TTL), form drafts (24h TTL). |
| **Durable Objects** | Stateful Workers. Handles real-time visitor heartbeat counters per product. |
| **Workers AI + AI Gateway** | AI inference at the edge. Calls Claude via Anthropic API proxied through AI Gateway for caching + rate limiting. |
| **Cloudflare D1** | SQLite-based edge database. Persists price history and user price alerts. |
| **Cloudflare Queues** | Decouples validation requests. Workers process scrape jobs asynchronously. |
| **Email Workers + MailChannels** | Sends email alerts when price drops below user threshold. |

### Infrastructure / Tooling
- **Wrangler** — Cloudflare CLI. Deploys Workers, Pages, D1 migrations, KV namespaces. Config in `wrangler.toml`.
- **pnpm** — package manager
- **Biome** — linting + formatting. Run with `pnpm biome check` and `pnpm biome format`.
- **Vitest** — unit tests
- **Playwright** — e2e tests

---

## Project Structure

```
cf-no-cap-prices/
├── .claude/
│   ├── settings.json
│   ├── hooks/
│   │   └── README.md
│   └── skills/
│       ├── cf-orchestration/SKILL.md
│       ├── react19-router/SKILL.md
│       ├── workers-ai-verdict/SKILL.md
│       ├── kv-cache/SKILL.md
│       ├── d1-patterns/SKILL.md
│       ├── browser-rendering/SKILL.md
│       ├── durable-objects-counter/SKILL.md
│       ├── prd/SKILL.md
│       └── adr/SKILL.md
├── .learnings/
│   ├── LEARNINGS.md
│   ├── ERRORS.md
│   ├── CF_GOTCHAS.md
│   ├── PERFORMANCE.md
│   └── COST_OPTIMIZATIONS.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml                  # wrangler deploy + pages deploy
│       ├── d1-migrate.yml
│       ├── cost-alert.yml
│       └── playwright.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CF-SERVICES.md
│   ├── prd/
│   │   ├── TEMPLATE.md
│   │   └── PRD.md
│   ├── decisions/                      # ADRs — one file per architectural decision
│   │   ├── 001-react-router-v7.md
│   │   ├── 002-workers-ai-anthropic.md
│   │   ├── 003-d1-single-table.md
│   │   ├── 004-durable-objects-counter.md
│   │   ├── 005-kv-price-cache.md
│   │   ├── 006-browser-rendering.md
│   │   └── 007-queues-async.md
│   ├── runbooks/
│   │   ├── new-price-source.md
│   │   ├── new-scraper.md
│   │   ├── ai-prompt-update.md
│   │   ├── d1-backup.md
│   │   ├── kv-flush.md
│   │   └── incident-response.md
│   └── api/
│       ├── worker-endpoints.md
│       ├── durable-object-protocol.md
│       ├── queue-messages.md
│       └── cache-strategies.md
├── workers/                            # One directory per Cloudflare Worker
│   ├── scraper/                        # Browser Rendering: scrapes 4 stores in parallel
│   │   ├── index.ts
│   │   ├── sites/                      # One file per store (amazon.ts, ebay.ts, etc.)
│   │   └── wrangler.toml
│   ├── validator/                      # URL safety check before scraping
│   │   ├── index.ts
│   │   └── wrangler.toml
│   ├── ai-analyzer/                    # Calls Claude via AI Gateway, returns streaming verdict
│   │   ├── index.ts
│   │   ├── prompts/                    # Versioned prompt templates
│   │   └── wrangler.toml
│   ├── alert-worker/                   # Scheduled: checks prices in D1, sends email alerts
│   │   ├── index.ts
│   │   └── wrangler.toml
│   └── counter/                        # Durable Object: per-product visitor heartbeat
│       ├── index.ts                    # Worker entry + DO class
│       ├── counter.do.ts               # Durable Object class
│       └── wrangler.toml
├── app/                                # React Router v7 (Remix) app
│   ├── routes/
│   │   ├── _index.tsx                  # Single-screen UI (SSR)
│   │   ├── deal.$slug.tsx              # Shareable deal URL
│   │   └── alerts.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn/ui generated components (do not edit manually)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── skeleton.tsx
│   │   ├── deal-card/
│   │   │   ├── index.tsx
│   │   │   ├── price-display.tsx
│   │   │   └── verdict-badge.tsx       # GANGA / PRECIO JUSTO / CARO / ESTAFA
│   │   ├── price-comparison/
│   │   │   ├── index.tsx
│   │   │   └── competitor-row.tsx
│   │   ├── ai-verdict/
│   │   │   ├── index.tsx
│   │   │   └── streaming-text.tsx      # Streams Workers AI response word by word
│   │   ├── visitor-counter/
│   │   │   ├── index.tsx
│   │   │   └── use-visitor-count.ts
│   │   └── alert-form/
│   │       ├── index.tsx
│   │       └── use-optimistic-alert.ts
│   ├── hooks/
│   │   ├── use-optimistic-price.ts
│   │   └── use-cache-status.ts
│   ├── lib/
│   │   ├── cf/                         # One file per Cloudflare binding
│   │   │   ├── kv.ts                   # KV namespace helpers
│   │   │   ├── d1.ts                   # D1 query helpers
│   │   │   ├── queues.ts               # Queue producer helpers
│   │   │   ├── ai.ts                   # Workers AI / AI Gateway client
│   │   │   ├── do-counter.ts           # Durable Object stub helpers
│   │   │   └── email.ts                # Email Workers + MailChannels
│   │   ├── cache/
│   │   │   ├── strategies.ts
│   │   │   └── ttl-config.ts
│   │   ├── validators/
│   │   │   ├── url.ts
│   │   │   ├── price.ts
│   │   │   └── deal.ts
│   │   └── ai/
│   │       ├── prompts/                # Versioned prompt templates
│   │       ├── evaluations/            # Prompt quality evals
│   │       └── safety.ts               # Input sanitization before AI call
│   ├── types/
│   │   ├── deal.ts
│   │   ├── price.ts
│   │   ├── alert.ts
│   │   ├── cf.ts                       # Cloudflare binding types (Env interface)
│   │   └── api.ts
│   ├── globals.css
│   ├── root.tsx
│   └── entry.server.tsx
├── db/
│   └── migrations/                     # D1 SQL migrations (applied via wrangler d1 migrations apply)
│       ├── 0001_create_prices.sql
│       ├── 0002_create_alerts.sql
│       └── 0003_add_price_history.sql
├── tests/
│   ├── e2e/
│   │   ├── flows/
│   │   │   ├── deal-validation.spec.ts
│   │   │   ├── alert-setup.spec.ts
│   │   │   └── visitor-counter.spec.ts
│   │   ├── a11y/
│   │   └── visual/
│   ├── unit/
│   │   ├── workers/
│   │   ├── components/
│   │   └── lib/
│   └── ai-regression/
│       ├── verdict-quality.spec.ts
│       └── prompt-versions/
├── tools/
│   ├── playwright/
│   │   ├── axe-helper.ts
│   │   └── price-fixture.ts
│   └── prompts/
│       ├── ai-verdict.md
│       ├── scraper-instructions.md
│       ├── ai-safety.md
│       └── evaluation-criteria.md
├── CLAUDE.md
├── README.md
├── wrangler.toml                       # Root wrangler config (Pages + shared bindings)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── biome.json
├── components.json                     # shadcn/ui config
├── .env.example
└── .gitignore
```

---

## Core Data Flows

### Validation Request Flow
1. User pastes URL → draft saved to KV on every keystroke (500ms debounce)
2. User clicks "Validar" → `useOptimistic` shows "Analizando..." immediately
3. React Router action → Worker Validator checks URL safety (not malicious, not private IP)
4. If safe: message enqueued to Cloudflare Queues
5. Worker Scraper uses Browser Rendering API to fetch 4 competitor prices in parallel
6. Worker AI Analyzer calls Claude via AI Gateway, returns streaming verdict
7. Result saved to D1 (permanent) + KV (1h TTL)
8. Client receives: prices (from KV cache hit or fresh scrape) + streaming AI text

### FOMO Tracker (Real-Time Visitor Count via Durable Objects)
1. On page load: browser generates anonymous session ID (no PII, no cookies)
2. Every 10s: client POSTs to `/api/heartbeat` with session ID + product ID
3. Request routes to the Durable Object instance for that product ID
4. DO stores: `Map<sessionId, expiresAt>`. On each heartbeat, sets/refreshes TTL.
5. DO alarm fires every 30s, evicts expired sessions, broadcasts updated count.
6. Counter value delivered via Server-Sent Events (SSE) from the DO WebSocket or short-polling.
7. Tab closed → heartbeats stop → DO alarm evicts session after 30s → counter decrements

### Price Alert Flow
1. User checks "Notify me if drops below $X"
2. `useOptimistic` marks as "Saved" immediately
3. React Router action writes alert to D1
4. Scheduled Worker (`cron: "0 * * * *"`) queries D1 for active alerts
5. If threshold met: Worker sends email via Email Workers + MailChannels (free tier)

---

## UI Spec

Single screen, no navigation, no footer. Sections top to bottom:

```
[ Input Zone ]
  - Large URL text input
  - Single "Validar Deal" button

[ Result Zone ]
  - Large bold price
  - Verdict badge: GANGA (green) | PRECIO JUSTO (yellow) | CARO (orange) | ESTAFA (red)

[ Detail Zone ]
  - Price comparison list (text only, no charts)
  - AI verdict streaming text block

[ Action Zone ]
  - Price alert checkbox + number input
  - Small "X personas viendo este deal ahora" counter
```

---

## Key Patterns & Constraints

### React Router v7 Patterns
- Routes use `loader` for server-side data fetching. Prices and initial verdict come in HTML.
- Streaming via `defer()` + `<Await>` + `<Suspense>` for AI verdict.
- `action` functions used for all mutations — no manual fetch calls from components.
- `useOptimistic` on alert save: show success before server confirms, revert on error.
- `useFormStatus` drives button disabled/loading state inside `<Form>`.
- All Cloudflare bindings accessed through `context.cloudflare.env` in loaders/actions.

### Cloudflare Bindings Pattern (Env Interface)
Every Worker and the Pages app declares bindings in `wrangler.toml` and the `Env` TypeScript interface:
```typescript
interface Env {
  PRICES_KV: KVNamespace;           // Price cache + form drafts
  DB: D1Database;                    // Price history + alerts
  SCRAPE_QUEUE: Queue;               // Async scrape jobs
  VISITOR_COUNTER: DurableObjectNamespace; // Per-product counters
  AI: Ai;                            // Workers AI binding
  // Secrets (set via wrangler secret put)
  ANTHROPIC_API_KEY: string;
  AI_GATEWAY_URL: string;
}
```

### Caching Strategy
- **Pages CDN**: caches full HTML per product URL. Cache-Control headers set in loader.
- **KV**: caches raw price data per product. TTL = 1h.
- **KV**: form drafts per session. TTL = 24h.
- **AI Gateway**: caches identical AI prompts. TTL = 1h. Reduces cost on repeat requests.
- **D1**: persistent price history, no TTL.

### Cloudflare-Specific Constraints
- Workers run in V8 isolates — no Node.js built-ins. Use Web APIs (`fetch`, `crypto`, `ReadableStream`).
- Workers have 128MB memory limit and 50ms CPU time (Paid: 30s). Keep scraper logic lean.
- Browser Rendering has concurrency limits — use Queues to smooth burst traffic.
- Durable Objects are single-threaded per instance — no race conditions on counter updates.
- D1 is SQLite — use simple schemas. No JSON columns. No `ALTER TABLE ADD COLUMN NOT NULL` without defaults.
- KV is eventually consistent — suitable for cache, not for counters (use Durable Objects for that).
- Email Workers require domain ownership verification in Cloudflare dashboard.

### Security
- Worker Validator runs before any scraping. Rejects non-HTTP(S), private IPs, and known phishing domains.
- No user accounts, no persistent session cookies, no PII stored.
- Visitor IDs are ephemeral browser-generated UUIDs, discarded after tab closes.
- Input sanitized before passing to AI prompt.
- All secrets stored via `wrangler secret put`, never in `wrangler.toml`.

### Performance Targets
- 90% of repeat visits: served from Pages CDN cache, zero Worker cold starts
- Fresh validation: target < 8s end-to-end (Browser Rendering is the bottleneck)
- AI streaming starts within 2s of scraping completing
- FOMO counter update latency: < 4s

---

## Environment Variables & Secrets

```toml
# wrangler.toml — bindings (non-secret)
[[kv_namespaces]]
binding = "PRICES_KV"
id = "..."

[[d1_databases]]
binding = "DB"
database_name = "cf-nocap-prices"
database_id = "..."

[[queues.producers]]
binding = "SCRAPE_QUEUE"
queue = "cf-nocap-scrape"

[[durable_objects.bindings]]
name = "VISITOR_COUNTER"
class_name = "VisitorCounter"

[ai]
binding = "AI"
```

```bash
# Secrets (wrangler secret put KEY)
ANTHROPIC_API_KEY=
AI_GATEWAY_ACCOUNT_ID=        # Cloudflare account ID for AI Gateway
AI_GATEWAY_GATEWAY_ID=        # AI Gateway name slug
```

---

## Commands

```bash
pnpm dev                                # Start local dev (Wrangler + Vite)
pnpm build                              # Production build
pnpm test                               # Run Vitest unit tests
pnpm test:e2e                           # Run Playwright e2e tests
pnpm test:ai                            # Run AI regression suite
pnpm biome check --write                # Lint + format all files

wrangler deploy                         # Deploy Pages app
wrangler deploy --config workers/scraper/wrangler.toml    # Deploy a Worker
wrangler d1 migrations apply DB --local # Apply D1 migrations locally
wrangler d1 migrations apply DB         # Apply D1 migrations to production
wrangler kv key list --binding PRICES_KV # Inspect KV
wrangler tail                           # Live Worker logs
wrangler secret put ANTHROPIC_API_KEY   # Set a secret

pnpm dlx shadcn@latest add <component>  # Add a shadcn/ui component
```

---

## Coding Conventions

- All files in TypeScript, strict mode. No `any`.
- React Router loaders/actions are the server boundary — no Cloudflare bindings accessed from client components.
- Cloudflare bindings accessed only through `context.cloudflare.env` in loaders/actions, or through `env` param in Workers.
- No Node.js APIs in Workers or loaders. Only Web APIs + `cloudflare:*` modules.
- Tailwind CSS v4 only — no CSS modules, no inline styles. All theme customization in `app/globals.css` using `@theme`.
- shadcn/ui for all base UI primitives. Add via `pnpm dlx shadcn@latest add <component>`. Do not edit `components/ui/` directly.
- Biome for linting and formatting. No ESLint, no Prettier. Run `pnpm biome check --write` before committing.
- Error boundaries wrap every async segment that can fail independently.
- No `console.log` in production code. Use `pino` in the app; in Workers, structured `console.log` goes to Wrangler tail (acceptable).
- D1 queries use prepared statements. Never string-interpolate SQL.
- One `wrangler.toml` per Worker. Shared types live in a `packages/cf-types` workspace package.
```
