# ValidateHome: Implementation Plan

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
- [x] Next.js 15 web app (App Router, Tailwind, shadcn/ui CSS vars, SSG)
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
apps/web          → Next.js 15 (SSG/ISR, programmatic SEO)
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
| Frontend | Next.js 15 (App Router) |
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
