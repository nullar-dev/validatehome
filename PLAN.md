# ValidateHome Project: The Incentive & Rebate Radar

> This plan is structured for high-performance engineering and maximum RPM. It preserves your core "Incentive Engine" and "Diff-Engine" logic while optimizing for 2026 search trends and high-intent lead generation.

**Concept:** A real-time "Incentive Engine" providing live status, stackability, and net-cost calculations for home upgrades across Tier-1 countries.

---

## The Core Product: "The Incentive Engine"

Unlike static blogs, this is a Live Status Database that tracks programs at the ZIP/Postcode level.

- **Real-Time Data:** Tracks status (Open, Waitlist, Reserved, Funded) for Heat Pumps, Solar, Insulation, EV Chargers, and more.
- **The Net-Cost Calculator:** Shows the "Sticker Price" vs. the "Net Cost" after stacking Federal, State/Provincial, and Utility-level rebates.
- **Verified Proof:** Every data point includes a Last Verified timestamp, a link to the Canonical Source, and a Changelog Diff.

---

## The Developer Moat (The "AI-Killer")

Traditional AI and SEO blogs fail because they can't track Policy Churn. Your technical edge is a data pipeline that automates accuracy:

- **Crawl & Parse Engine:** Monitors official .gov, .org.uk, and utility portals.
- **Screenshot-Diff Tracking:** Automatically detects changes in program terms, budgets, or deadlines.
- **Normalization Schema:** Maps fragmented data into one universal structure: Jurisdiction -> Program Name -> Eligibility -> Max Amount -> Budget Status -> Deadlines.
- **The Stacker Logic:** A rule-based engine that validates which grants can be combined (e.g., "Cannot combine State Rebate A with Federal Credit B").

---

## Growth & Traffic Strategy (2026 Optimization)

Focus on High-Intent Program Pages to capture users who are ready to buy.

- **Program-Specific "Status" Pages:** SEO-optimized for queries like "Is the UK Boiler Upgrade Scheme still funded?" or "IRS 25C Tax Credit 2026 eligibility."
- **Local Landing Pages:** Programmatic SEO pages for every major State/Postcode (e.g., "Best Energy Rebates in [City/ZIP Code]").
- **The Alert Product:** A "Notify Me" feature for closed or "coming soon" programs (e.g., HEAR/HOMES programs in the US). This builds a high-value email list of homeowners.
- **Social Hook:** Shareable "Budget Alerts" on Reddit and X when a major program hits 90% capacity.

---

## Monetization & High RPM Logic

This niche sits in the "High-Consideration" category, leading to premium ad rates.

- **RPM Goal:** $25-$60+ Session RPM (Targeting Mediavine/Raptive-level stacks).
- **Lead-Gen:** High-margin referrals to vetted installers and energy auditors who handle the rebate paperwork.
- **Affiliate Revenue:** Strategic links for hardware (Smart Thermostats, DIY Insulation kits) and financing providers.
- **B2B Data Licensing:** Selling the "Live Rebate Feed" via API to HVAC/Solar contractors for their own websites.

---

## 2026 Market Verdict

This is a "Sure Bet" because of the Perfect Storm:

- **Policy Churn:** Constant changes in 2025-2026 (IRS credits, UK BUS scale-up, AU state shifts) create mass confusion.
- **AI Failure:** LLMs cannot provide the "Real-Time Status" required to avoid financial mistakes.
- **High Stakes:** Users aren't looking for "tips"; they are looking to avoid $5,000+ mistakes.

---

## Engineering & Architecture Requirements [Gold Standard 2026]

### Mandatory Requirements

Web research is REQUIRED (2026 best practices) for:

- Best practices relevant to this project scope (data pipeline, crawling/parsing, diffing, SEO/programmatic pages, calculators, alerting, API licensing).
- Best tech stack for this product in 2026 (frontend, backend, DB, search, queue, scraping, observability, infra).
- Best CI possible (2026) including testing, security, supply chain, code quality, and deployment automation.

### Preserve All Product Features

- "Incentive Engine" live status DB at ZIP/Postcode level.
- Status tracking: Open / Waitlist / Reserved / Funded.
- Categories: Heat Pumps, Solar, Insulation, EV Chargers, etc.
- Net-cost calculator: sticker price vs net cost after stacking federal/state/utility.
- Verified proof: last verified timestamp, canonical source link, changelog diff.
- Crawl & parse engine monitoring official .gov / .org.uk / utility portals.
- Screenshot-diff tracking for program terms/budgets/deadlines.
- Normalization schema: Jurisdiction -> Program Name -> Eligibility -> Max Amount -> Budget Status -> Deadlines.
- Stacker logic (rules engine) for combinability constraints.
- Growth: program status pages, local programmatic landing pages, "Notify Me" alert feature, shareable "Budget Alerts" for Reddit/X at 90% capacity.
- Monetization: premium ads RPM, referrals to installers/auditors, affiliate links, financing, B2B data licensing via API ("Live Rebate Feed").
- Multi-country Tier-1 focus and "policy churn / AI failure / high stakes" rationale.

### Deliverable Sections (Gold Standard 2026 Implementation Plan)

1. **Product Scope & User Journeys** — Primary user flows (search -> program page -> calculator -> notify me -> conversion). B2B/API consumer flows. Admin/internal ops flows for verification and overrides.

2. **System Architecture** (High-Level + Component Diagram) — Data acquisition layer (crawl/parse/screenshot/diff). Normalization + rules/stacker engine. Storage (raw snapshots + normalized + audit/diff history). Search/indexing strategy for SEO + internal search. API layer (public site + B2B feed). Frontend rendering (SEO/perf). Alerting + notification pipeline. Admin tools + moderation/verification workflow.

3. **Tech Stack Recommendation** (2026 Best Choice) — Web app framework (SSR/SSG/ISR strategy for programmatic SEO). Backend runtime/framework. Database(s): relational + document + time-series/object store. Queue/workflows/scheduler. Scraping/crawling tech (headless vs HTTP, anti-bot, robots, rate limits). Screenshot + diff approach (visual + DOM/text). Search engine/index. Caching + CDN. Auth (user + admin) and rate limiting. Email/SMS/push provider. Observability stack (logs/metrics/traces). Infra (IaC), hosting, regions, environments.

4. **Data Model & Normalization Schema** (Detailed) — Canonical entities and relationships (Jurisdiction, Program, Benefit, Eligibility, FundingStatus, Deadline, Source, Verification, Diff, Rule, StackabilityConstraint, ProductCategory, Geo mapping). Versioning strategy and audit trail. Storage for raw artifacts (HTML/PDF/screenshots) and extraction outputs.

5. **Crawl/Parse + Screenshot-Diff Pipeline** (Gold Standard) — Source discovery + allowlists. Fetching strategy (ETag/Last-Modified, incremental crawls). Parsing approach for HTML/PDF. Screenshot capture rules and change detection thresholds. Diff generation. Quality gates: confidence scoring, human review triggers. Rate limiting, politeness, legal/ToS considerations, resiliency.

6. **The Rules Engine: "Stacker Logic"** — Rule representation (DSL vs decision tables vs code rules). Conflict detection. Testing strategy for rules (golden cases by jurisdiction). Explainability.

7. **Net-Cost Calculator** (Implementation + UX) — Inputs, assumptions, range handling, edge cases. Currency, tax treatment differences by country. Output format. Caching and performance considerations.

8. **SEO / Programmatic Pages** (2026 Performance) — URL taxonomy. Indexation control, canonicals, sitemaps, hreflang (multi-country). Rendering strategy (SSG/ISR) + freshness policies. Structured data (schema.org). Internal linking strategy.

9. **Alert Product: "Notify Me" + Budget Alerts** — Subscription model. Threshold alerts. Deliverability best practices, double opt-in, preference center. Anti-spam, rate limiting, compliance (GDPR/UK GDPR/CASL). Social sharing automation.

10. **B2B Data Licensing API** ("Live Rebate Feed") — API design (REST/GraphQL), versioning, auth keys, quotas. SLAs, caching, webhooks, change feed endpoints. Customer onboarding, docs, and sample integrations.

11. **Admin / Ops Tooling** — Admin UI for program overrides, verification, rule edits. Review queue, diff review UX, approval workflow. Source management, blacklisting, and incident tooling.

12. **Security, Privacy, Compliance** (2026) — Threat model for crawling, API, user accounts, admin. Secrets management, least privilege, dependency security. Data retention policy. GDPR/UK GDPR considerations.

13. **Testing Strategy** (Unit -> Integration -> E2E) — What to test at each layer. Golden datasets + replayable crawls. Deterministic builds and hermetic tests.

14. **CI/CD "Best CI Possible"** (2026 Gold Standard) — Monorepo management. Linting/formatting, type checks, unit/integration/e2e gates. Test parallelization and flaky-test handling. Security scanning (SAST/DAST/dependency/SBOM), secrets scanning. Code coverage thresholds, mutation testing. Preview environments per PR. Container builds + provenance/signing. Release strategy. Infra as Code pipeline. Observability checks in CI.

15. **Infra & Deployment Plan** — Environments (dev/stage/prod), migrations, backups, DR. Scaling plan. Cost controls and multi-region considerations.

16. **Milestones & Roadmap** (High RPM Execution) — Phase 0: foundation + MVP. Phase 1: core incentive engine + key countries. Phase 2: programmatic SEO scale + notify-me. Phase 3: API licensing + advanced diffing. For each phase: deliverables, timeboxed goals, risks, and exit criteria.

17. **Open Questions / Missing Inputs** — Prioritized list of questions to finalize together.

---
---

# Full Implementation Plan

This plan is structured for high-performance engineering and maximum RPM. It preserves your core "Incentive Engine" and "Diff-Engine" logic while optimizing for 2026 search trends and high-intent lead generation.

## Project: ValidateHome (The Incentive & Rebate Radar)

**Concept:** A real-time "Incentive Engine" providing live status, stackability, and net-cost calculations for home upgrades across Tier-1 countries.

### The Core Product: "The Incentive Engine"

Unlike static blogs, this is a Live Status Database that tracks programs at the ZIP/Postcode level.

- **Real-Time Data:** Tracks status (Open, Waitlist, Reserved, Funded) for Heat Pumps, Solar, Insulation, EV Chargers, and more.
- **The Net-Cost Calculator:** Shows the "Sticker Price" vs. the "Net Cost" after stacking Federal, State/Provincial, and Utility-level rebates.
- **Verified Proof:** Every data point includes a Last Verified timestamp, a link to the Canonical Source, and a Changelog Diff.

### The Developer Moat (The "AI-Killer")

Traditional AI and SEO blogs fail because they can't track Policy Churn. Your technical edge is a data pipeline that automates accuracy:

- **Crawl & Parse Engine:** Monitors official .gov, .org.uk, and utility portals.
- **Screenshot-Diff Tracking:** Automatically detects changes in program terms, budgets, or deadlines.
- **Normalization Schema:** Maps fragmented data into one universal structure: Jurisdiction -> Program Name -> Eligibility -> Max Amount -> Budget Status -> Deadlines.
- **The Stacker Logic:** A rule-based engine that validates which grants can be combined (e.g., "Cannot combine State Rebate A with Federal Credit B").

### Growth & Traffic Strategy (2026 Optimization)

Focus on High-Intent Program Pages to capture users who are ready to buy.

- **Program-Specific "Status" Pages:** SEO-optimized for queries like "Is the UK Boiler Upgrade Scheme still funded?" or "IRS 25C Tax Credit 2026 eligibility."
- **Local Landing Pages:** Programmatic SEO pages for every major State/Postcode (e.g., "Best Energy Rebates in [City/ZIP Code]").
- **The Alert Product:** A "Notify Me" feature for closed or "coming soon" programs (e.g., HEAR/HOMES programs in the US). This builds a high-value email list of homeowners.
- **Social Hook:** Shareable "Budget Alerts" on Reddit and X when a major program hits 90% capacity.

### Monetization & High RPM Logic

This niche sits in the "High-Consideration" category, leading to premium ad rates.

- **RPM Goal:** $25-$60+ Session RPM (Targeting Mediavine/Raptive-level stacks).
- **Lead-Gen:** High-margin referrals to vetted installers and energy auditors who handle the rebate paperwork.
- **Affiliate Revenue:** Strategic links for hardware (Smart Thermostats, DIY Insulation kits) and financing providers.
- **B2B Data Licensing:** Selling the "Live Rebate Feed" via API to HVAC/Solar contractors for their own websites.

### 2026 Market Verdict

This is a "Sure Bet" because of the Perfect Storm:

- **Policy Churn:** Constant changes in 2025-2026 (IRS credits, UK BUS scale-up, AU state shifts) create mass confusion.
- **AI Failure:** LLMs cannot provide the "Real-Time Status" required to avoid financial mistakes.
- **High Stakes:** Users aren't looking for "tips"; they are looking to avoid $5,000+ mistakes.

---

# Implementation Plan

> Living document tracking implementation progress. Update as phases complete.

## Milestones & Roadmap

### Phase 0: Foundation (Weeks 1-3) — IN PROGRESS

**Deliverables:**
- [x] Monorepo scaffolding (pnpm + Turborepo + Biome + Vitest)
- [x] CI/CD pipeline (lint, test, security, build + SonarCloud + Dependabot)
- [x] Database schema + Drizzle ORM (11 core entities, multi-country)
- [x] Git hooks (lefthook + Biome + conventional commits)
- [x] Shared packages (types, constants, utils for US/UK/AU/CA)
- [x] Net-cost calculator package with 26 passing tests
- [x] Rules engine package (json-rules-engine stackability)
- [x] Next.js 16 web app (App Router, Tailwind v4, shadcn/ui CSS vars, SSG)
- [x] Hono API server (programs, calculator, health routes)
- [x] Refine admin dashboard scaffold (Ant Design)
- [x] Inngest crawl worker scaffold
- [ ] AWS account creation + domain registration (validatehome.com)
- [ ] SST infra setup (dev + staging environments)
- [ ] Simple admin auth (single admin login)

**Exit criteria:** Green CI, deployable empty shell, schema migrations running, shadcn/ui rendering

### Phase 1: Core Incentive Engine — All 4 Countries (Weeks 4-12)

**Deliverables:**
- [ ] Crawl/parse pipeline: US federal + 3 states, UK BUS/ECO4, AU federal + 1 state, CA federal + 1 province
- [ ] Screenshot-diff engine with significance scoring
- [ ] Normalization pipeline (raw → canonical schema) with multi-currency support
- [ ] Rules engine with stacker logic (US federal + UK + AU + CA stacking rules)
- [ ] Net-cost calculator (all 4 countries, heat pumps + solar as first categories)
- [ ] Program status pages (SSG/ISR with structured data, hreflang for all 4 countries)
- [ ] Admin dashboard (diff review queue, program editor)
- [ ] Meilisearch integration (program search, faceted by country)
- [ ] B2B API v1 (read-only program data)
- [ ] Basic local landing pages for top 50 ZIPs/postcodes per country

**Exit criteria:** 30+ programs live across 4 countries, calculator working for heat pumps + solar, admin can review and override

### Phase 2: Scale + Notify (Weeks 13-20)

**Deliverables:**
- [ ] Expand to all major states/provinces per country
- [ ] Local landing pages (programmatic SEO: 1000+ ZIP/postcodes)
- [ ] "Notify Me" subscription system + Resend integration
- [ ] Budget capacity alerts (90% threshold)
- [ ] Full sitemap generation (50k+ URLs, sitemap index)
- [ ] Affiliate/installer referral integration
- [ ] Ad integration (Mediavine/Raptive application)
- [ ] Performance optimization (Lighthouse CI gates)
- [ ] Additional product categories (insulation, EV chargers, windows, water heaters)

**Exit criteria:** 1000+ program pages indexed, notification system live, first ad revenue

### Phase 3: API Licensing + Advanced (Weeks 21-28)

**Deliverables:**
- [ ] B2B API v2 (webhooks, change feed, calculator endpoint)
- [ ] API documentation portal (Scalar)
- [ ] Customer onboarding flow + API key self-service
- [ ] Advanced diff engine (semantic comparison, LLM-assisted extraction)
- [ ] Comparison pages (program A vs B)
- [ ] Social sharing automation (budget alert cards)
- [ ] Mutation testing in CI (Stryker on rules + calculator)
- [ ] Multi-region deployment (US + EU)

**Exit criteria:** First B2B customer live, full CI maturity, comprehensive multi-country coverage

---

## Architecture Overview

```
apps/web          → Next.js 16 (SSG/ISR, programmatic SEO)
apps/api          → Hono (REST API, OpenAPI)
apps/admin        → Refine + Ant Design (ops dashboard)
apps/workers      → Inngest (crawl/parse/diff pipeline)
packages/db       → Drizzle ORM (PostgreSQL on Neon)
packages/shared   → Types, constants, utilities
packages/rules-engine → json-rules-engine (stacker logic)
packages/calculator   → Net-cost calculator
packages/config   → Shared TypeScript + Vitest config
packages/ui       → Shared React components
infra/            → SST v3 (AWS IaC)
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | pnpm 9 + Turborepo |
| Frontend | Next.js 16 (App Router) |
| API | Hono |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Queue | Inngest |
| Search | Meilisearch |
| Cache | Valkey |
| Storage | Cloudflare R2 |
| Email | Resend |
| IaC | SST v3 |
| Lint | Biome |
| Test | Vitest |
| CI | GitHub Actions |
