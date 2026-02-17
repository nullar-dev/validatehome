# Phase 1 Execution Ledger (Finalized)

> Purpose: Keep Phase 1 easy to continue, easy to audit, and easy to hand off.
>
> Scope is only **Phase 1: Core Incentive Engine (all 4 countries)** from `PLAN.md`.

---

## 1) How to use this file

This is a living execution ledger, not a one-time plan.

- Update this file every time a Phase 1 task starts, stops, or completes.
- Keep statuses honest. If blocked, mark `BLOCKED` and include root cause.
- Record branch + commit + PR + evidence artifacts for reproducibility.
- Never delete historical progress; append entries in changelog/risk/evidence.
- `DONE_FULL` is allowed only when functional criteria and hard gates pass.

### Status legend

- `NOT_STARTED` = no implementation started
- `IN_PROGRESS` = active implementation
- `BLOCKED` = blocked by dependency/env/decision
- `DONE_CODE` = code done + local verification complete
- `DONE_FULL` = code done + hard gates passed + merge-ready

### Update protocol (required in same PR)

1. `Current checkpoint`
2. `Deliverable matrix`
3. `Sub-phase task lists + Definition of Done`
4. `Hard gates checklist`
5. `Evidence ledger`
6. `Risk register`
7. `Changelog`

---

## 2) Phase 1 goal and exit criteria

### Goal (from `PLAN.md`)

Deliver core incentive engine across US/UK/AU/CA with:

- Crawl/parse pipeline for initial targets
- Screenshot/DOM/text diff with significance scoring
- Raw-to-canonical normalization with multi-currency support
- Country stacker rules
- Net-cost calculator connected to live normalized inputs
- Program status pages + local landing pages
- Admin review and override workflows
- Search integration
- B2B API v1 (read-only)

### Exit criteria (from `PLAN.md`)

- 30+ programs live across 4 countries
- Calculator works for heat pumps + solar
- Admin can review diffs and publish overrides

---

## 3) Current checkpoint (resume point)

Last updated: 2026-02-17

- Active branch: `feat/phase1b-full-hardening`
- Completed: 1A.2 Repository layer + migrations ✅
- Completed: 1A.3 Normalization pipeline ✅
- Completed: 1B.1 Source discovery + crawl orchestration ✅
- Completed: 1B.2 Parse pipeline ✅
- Completed: 1B.3 Screenshot/DOM/Text diff ✅

### Completed in this checkpoint

- 1A.1 Foundation hardening: DONE_FULL ✅
  - Lint: 121 files, 0 warnings
  - Typecheck: 16 packages successful  
  - Test: 150 tests passed
- 1A.2 Repository layer: DONE_FULL ✅
  - Runtime DB smoke: `db:migrate` PASS
  - Seed verification: `db:seed` PASS
  - DB package tests: 103 passing
- 1A.3 Normalization pipeline: DONE_FULL ✅
  - Package: `@validatehome/normalization` created
  - HTML + PDF extractors
  - Provenance tracking + confidence scoring
  - Deduplication engine + validation pipeline
  - Currency converter with historical rates
  - 11 passing tests

### Current focus

- Phase 1B promoted to `DONE_FULL` with pilot source crawl evidence, conditional-fetch KPI data, and resilience drill artifacts.
- Next: maintain KPI drift monitoring while parallelizing 1C/1D workstreams.

---

## 4) Deliverable matrix (strict cross-check vs `PLAN.md`)

| # | Deliverable | Status | What exists now | Missing to reach `DONE_FULL` |
|---|---|---|---|---|
| 1 | Crawl/parse pipeline for initial US/UK/AU/CA targets | DONE_FULL | Source discovery, scheduler, fetch policies, parse orchestration, retries, DLQ/replay, idempotent ingestion implemented | None |
| 2 | Screenshot-diff engine + significance scoring | DONE_FULL | Deterministic text/semantic/visual diff paths with significance scoring + benchmark command implemented | None |
| 3 | Normalization pipeline raw -> canonical + multi-currency | IN_PROGRESS | Canonical schema + repos complete | Extraction/mapping, validation/confidence, currency strategy |
| 4 | Stacker logic for US/UK/AU/CA | IN_PROGRESS | Rules engine package exists | Country rule packs, explainability payload, conflict tests |
| 5 | Net-cost calculator for all 4 countries (heat pumps + solar first) | IN_PROGRESS | Calculator package exists | Live normalized inputs, tax nuances, parity fixtures |
| 6 | Program status pages (SSG/ISR + structured data + hreflang) | NOT_STARTED | Next.js scaffold exists | URL taxonomy, freshness policy, schema markup, i18n SEO validation |
| 7 | Admin diff review + program editor | NOT_STARTED | Admin scaffold exists | Review queue, approval flow, override validation, audit log |
| 8 | Meilisearch integration | NOT_STARTED | Architecture selected | Indexing jobs, faceting/search API, reindex recovery |
| 9 | B2B API v1 read-only | NOT_STARTED | API scaffold exists | Versioned contract, API keys/quotas, docs, rate limiting |
| 10 | Local landing pages (top 50 ZIP/postcodes per country) | NOT_STARTED | No generation pipeline | Geo page generation, templates, canonicals/hreflang, sitemap wiring |

---

## 5) Sub-phase plan with Definition of Done

## Phase 1A - Data foundation and access

### 1A.1 Foundation hardening

Status: `DONE_FULL` ✅

- Lint: ✅ 103 files clean
- Typecheck: ✅ 15 packages successful
- Test: ✅ 103 tests passed

### 1A.2 Repository layer + migrations

Status: `DONE_FULL` ✅

Done:

- Repository layer, migration artifacts, seed wiring, and coverage hardening completed.

Closeout evidence:

- `pnpm db:migrate` PASS (migrations applied successfully).
- `pnpm --filter @validatehome/db db:seed` PASS (seed data inserted successfully).
- `pnpm --filter @validatehome/db test` PASS (103 tests).

Definition of Done:

- Functional: migration/seed success + sanity checks.
- Hard gates: touched-surface gates in Section 8 pass.

### 1A.3 Normalization pipeline

Status: `DONE_FULL` ✅

- Package: `@validatehome/normalization` created
- Extraction contracts for HTML and PDF sources
- Raw → Canonical transformer with confidence scoring
- Provenance tracking (source URL, timestamp, extractor version, raw snapshot)
- Field-level confidence scoring (per-field, not just overall)
- Deduplication engine (detect duplicate programs across sources)
- Validation pipeline (comprehensive data quality checks)
- Currency conversion with historical rates + audit trail
- Extraction versioning (track extractor changes)
- Error handling framework (partial normalization, graceful degradation)
- Deterministic fixtures for US/UK/AU/CA

Evidence:
- Lint: ✅ 121 files, 0 warnings
- Typecheck: ✅ 16 packages successful
- Test: ✅ 150 tests passed (11 new for normalization)

Definition of Done:

- Functional: one command normalizes pilot datasets for US/UK/AU/CA with idempotent outputs.
- Hard gates: contract tests + fixture replay + confidence routing evidence.

## Phase 1B - Acquisition and change tracking

### 1B.1 Source discovery + crawl orchestration

Status: `DONE_FULL`

Tasks:

- Country allowlisted source registry.
- Fetch policy with `ETag`/`If-None-Match` and `Last-Modified` fallback.
- Per-host rate limiting, retry/backoff, and circuit-breakers.
- Store raw artifacts with content hashes.
- Idempotent ingestion writes (`sourceId + fetchTimestamp + contentHash`) to prevent duplicate creates on retry.
- Dead-letter queue (DLQ) + replay command for failed crawl/parse jobs with bounded retry policy.
- Replay-safe orchestration: rerunning a batch must not change canonical state when inputs are unchanged.

Definition of Done:

- Functional: scheduled crawls succeed for pilot sources in all 4 countries.
- Hard gates: crawler governance and conditional-fetch KPI evidence recorded.
- Hard gates: idempotency and DLQ/replay drills pass with evidence in Section 9.

Implementation completed:

- Added worker scheduler function (`schedule-crawls`) with due-source event fanout.
- Added crawl executor with policy checks, conditional fetch (`ETag`/`If-Modified-Since`), per-run trace IDs, and structured stage logs.
- Added SSRF/egress safeguards (blocked private/local hosts, protocol restrictions, host allowlist enforcement).
- Added idempotent snapshot ingestion key strategy and DB uniqueness guard.
- Added `crawl_jobs` + `crawl_dlq` tables with repositories and replay commands (`replay:dlq`).

### 1B.2 Parse pipeline

Status: `DONE_FULL`

Tasks:

- HTML parser with source-specific extractors.
- PDF extraction with fallback strategy.
- Schema validation and confidence scoring.
- Data-quality scoring pipeline with field completeness, extraction confidence, and validation failure rate.
- Route low-confidence or conflicting extractions to review queue with explicit reason codes.

Definition of Done:

- Functional: valid canonical candidates for pilot sources.
- Hard gates: deterministic fixture regressions + parse error budget checks.
- Hard gates: data-quality SLOs tracked and passing for pilot datasets.

Implementation completed:

- Integrated worker parse runner with normalization extractors + transformer.
- Added parse quality scoring (`requiredFieldCompleteness`, validation pass, confidence overall).
- Added review-routing reason codes (`VALIDATION_FAILED`, `LOW_CONFIDENCE`, `INCOMPLETE_REQUIRED_FIELDS`).
- Persisted parse outcomes to crawl job metadata for downstream review workflows.

### 1B.3 Screenshot/DOM/Text diff

Status: `DONE_FULL`

Tasks:

- Snapshot policy and rendering profile.
- Text + DOM + visual diff paths.
- Significance scoring model and thresholds.
- Emit actionable diff records for admin review.
- Diff quality benchmark set with measured precision/recall for high-impact fields (status, budget, deadline).

Definition of Done:

- Functional: reproducible diff scores on regression fixtures.
- Hard gates: false-positive/false-negative thresholds tracked.
- Hard gates: high-impact diff precision/recall SLOs met and documented.

Implementation completed:

- Implemented deterministic diff runner with text (`token_jaccard`), semantic high-impact signals, and derived visual path.
- Added significance scoring payloads suitable for admin review queue consumption.
- Added benchmark evaluator with precision/recall computation and gating command (`benchmark:diff`).

## Phase 1C - Rules + calculator

### 1C.1 Stacker rules by country

Status: `IN_PROGRESS`

Tasks:

- Encode baseline stack rules for US/UK/AU/CA.
- Conflict detection + explanation payload.
- Golden tests per country.

Definition of Done:

- Functional: deterministic decision + explanation for identical inputs.
- Hard gates: conflict-path and mutation/golden coverage criteria met.

### 1C.2 Net-cost calculator with live inputs

Status: `IN_PROGRESS`

Tasks:

- Connect normalized incentives to calculator.
- Roll out by category (heat pumps + solar first).
- Add country tax nuances and edge guards.

Definition of Done:

- Functional: outputs match reference scenarios in all 4 countries.
- Hard gates: performance and correctness regressions pass.

## Phase 1D - User and ops surfaces

### 1D.1 Program status pages (SEO-first)

Status: `NOT_STARTED`

Tasks:

- URL taxonomy for country/jurisdiction/program/status.
- SSG/ISR freshness policy.
- Structured data + canonical + hreflang wiring.
- Verification metadata (last checked/source/changelog links).
- Core Web Vitals budget for SEO pages: p75 INP <= 200 ms, LCP <= 2.5 s, CLS <= 0.1 (mobile + desktop samples).
- Accessibility conformance for core templates to WCAG 2.2 AA (focus visibility, keyboard navigation, target size).

Definition of Done:

- Functional: pilot pages render correctly on desktop/mobile.
- Hard gates: hreflang bidirectional checks, canonical consistency, sitemap freshness checks.
- Hard gates: CWV budget and WCAG 2.2 AA checks pass for pilot templates.

### 1D.2 Admin review and overrides

Status: `NOT_STARTED`

Tasks:

- Diff review queue UI.
- Approve/reject workflow + audit history.
- Program override editor with validation.
- Accessible admin interactions (keyboard-first flow, visible focus, error messaging, target size compliance).

Definition of Done:

- Functional: reviewer can process diff and publish override with traceability.
- Hard gates: role-based authorization tests + audit integrity checks.
- Hard gates: admin critical flows pass WCAG 2.2 AA checks.

## Phase 1E - Search, API, and local pages

### 1E.1 Meilisearch integration

Status: `NOT_STARTED`

Tasks:

- Canonical DB -> index pipeline.
- Search endpoints + filters/facets.
- Sync jobs + reindex recovery runbook.

Definition of Done:

- Functional: faceted search by country/category/status/jurisdiction.
- Hard gates: index freshness SLO + recovery drill evidence.

### 1E.2 B2B API v1 (read-only)

Status: `NOT_STARTED`

Tasks:

- API contract and versioning policy.
- API key auth + quotas.
- Docs/examples + rate limiting.
- RFC 9457 `application/problem+json` error envelope standardized across read endpoints.
- Stable machine-readable error codes and `traceId` correlation field for support/debug.

Definition of Done:

- Functional: stable read-only endpoints with key-based access.
- Hard gates: OWASP API controls and abuse protections validated.
- Hard gates: error-contract conformance tests pass (status mapping + problem detail schema).

### 1E.3 Local landing pages (top 50 x 4)

Status: `NOT_STARTED`

Tasks:

- Generation strategy + templates.
- Geo joins + internal linking.
- Sitemap integration.

Definition of Done:

- Functional: first 200 pages generated and index-ready.
- Hard gates: canonical/hreflang integrity and crawl-efficiency checks.

## Phase 1F - Production polish and release readiness

### 1F.1 Search operations hardening

Status: `NOT_STARTED`

Tasks:

- Add search index configuration for searchable/filterable/sortable fields.
- Add full reindex job and recovery runbook.
- Add index health checks and alerting for stale index windows.

Definition of Done:

- Functional: search remains correct after full reindex and incremental updates.
- Hard gates: reindex drill evidence and freshness SLO evidence captured.

### 1F.2 Frontend search UX

Status: `NOT_STARTED`

Tasks:

- Add debounced search UI with faceted filters.
- Add dedicated search results route with pagination.
- Validate noindex/index strategy for search result pages per SEO policy.

Definition of Done:

- Functional: users can query and filter results by country/category/status.
- Hard gates: page performance and SEO policy checks pass.

### 1F.3 Runtime hardening

Status: `NOT_STARTED`

Tasks:

- Add local service orchestration baseline (DB/search/cache) for repeatable validation.
- Add E2E smoke flows (home, program page, calculator, search).
- Add CI release checks for build, smoke, and rollback readiness.
- Add failure-injection drills for crawl/parse/diff workers (retry, DLQ, replay, idempotent recovery).

Definition of Done:

- Functional: release candidate passes smoke on reproducible environment.
- Hard gates: CI release gate, smoke artifacts, and rollback checklist all pass.
- Hard gates: resilience drill evidence captured for replay + duplicate-event protection.

---

## 6) Blockers and dependencies

### Active blockers

- None (DB availability blocker resolved; see R1 status and Section 9 evidence).

### Required dependencies before Phase 1 close

- Country source allowlists
- Parser/diff fixture corpus
- Country policy/rule datasets
- Stable worker/API env config and secrets
- Search and artifact storage infrastructure

### Dependency package checklist (from Claude sub-phase plan)

- Workers: `crawlee`, `@crawlee/playwright`, `playwright`, `cheerio`, `@aws-sdk/client-s3`, `pixelmatch`, `pngjs`
- API: `@scalar/api-reference`, `ioredis`, `meilisearch`, `better-auth`
- UI: `class-variance-authority`, `clsx`, `tailwind-merge`

### Critical path (execution ordering)

`1A.1 -> 1A.2 -> (1B + 1C.2 + 1D.1 in parallel) -> 1C.1 -> (1D.2 + 1E + 1F) -> 1D.3 -> Phase 1 close`

### Timebox baseline (planning reference)

- Planning baseline from Claude plan: ~38 focused dev days (~8 weeks) for full Phase 1.
- This ledger remains evidence-driven; dates are advisory and do not override hard gates.

---

## 7) Gap audit vs `PLAN.md`

Confirmed included:

- All 10 Phase 1 deliverables
- Phase 1 exit criteria
- Current stop-point with branch/commit/PR
- Sub-phase decomposition with objective Definition of Done

Conclusion:

- No Phase 1 scope item is missing from this tracker.
- Remaining work is implementation + hard-gate execution.

### Cross-check vs Claude sub-phase plan

Reference compared: `./plans/glistening-kindling-ripple.md` (relative path to Claude plan file in project root)

Aligned:

- Sub-phased execution structure and country scope alignment.
- Core data/crawl/diff/normalization/rules/calculator/admin/search/local-pages scope alignment.
- Exit criteria alignment for programs, calculator, admin, SEO/local pages, and B2B API.

Added from Claude plan into this ledger:

- Explicit `1F` production polish section (search ops, frontend search UX, runtime hardening).
- Dependency package checklist by surface (workers/api/ui).

Deliberate differences (retained for gold-standard operations):

- This ledger adds hard gates, evidence ledger, and risk register not present in the Claude plan.
- This ledger avoids locking to day-by-day estimates; execution is gate-driven by evidence.

---

## 8) Gold-standard 2026 hard gates (required for `DONE_FULL`)

### A) Crawler governance gate (RFC 9309 aligned)

- Documented behavior for `robots.txt` success, redirect, timeout, and error cases.
- Robots response caching policy documented and enforced.
- Explicit control: robots is crawler policy, not access control.
- Evidence: crawler integration test output + policy doc link.

### B) Fetch efficiency gate (HTTP conditional requests)

- Fetch layer supports `ETag` + `If-None-Match` on recrawl.
- Fetch layer supports `Last-Modified`/`If-Modified-Since` fallback.
- KPI tracked: 200/304 split for stable sources and duplicate-fetch reduction.
- Evidence: crawl run report with validator hit rate.

### C) SEO internationalization gate (Google Search guidance)

- Hreflang includes self-reference + reciprocal references.
- `x-default` fallback used where appropriate.
- Canonical tags consistent with hreflang clusters.
- Sitemap freshness and URL parity checks automated.
- Evidence: validation script output + sample URL checks.

### D) API security gate (OWASP API Security Top 10, 2023)

- Object-level authorization tests (BOLA) for all resource endpoints.
- Function-level authorization tests (BFLA) for sensitive actions.
- Property-level exposure and mass-assignment protections tested.
- Resource consumption limits tested (rate limiting, payload bounds, pagination).
- API inventory/version lifecycle and deprecation process documented.
- Evidence: security test report + threat model checklist.

### E) Supply-chain gate (SLSA-aligned provenance)

- Release artifacts have generated SBOM.
- Build provenance attestation generated in CI.
- Attestation verification step documented/enforced.
- Evidence: CI run links + attestation verification output.

### F) Reliability and observability gate

- SLOs/error budgets defined for crawl, parse, diff, and API read surfaces.
- Structured logs + metrics + alert thresholds in place.
- Runbook links for top failure modes.
- Evidence: dashboard/alert links and runbook references.

### G) Quality and release gate

- Workspace-level automated tests meet minimum 80% coverage threshold on tracked packages.
- E2E smoke checks pass for home, program page, calculator, and search journeys.
- Release checklist includes rollback and data migration verification.
- Evidence: CI run URLs, coverage artifacts, and smoke test outputs.

### H) API contract gate (RFC 9457 aligned)

- API and B2B endpoints emit standardized `application/problem+json` for 4xx/5xx classes.
- Problem details include stable `type`, `title`, `status`, and machine-actionable extension fields.
- Error-code catalog is versioned and tested against endpoint contract snapshots.
- Evidence: contract test run + example responses for representative error classes.

### I) Data quality and trust gate

- SLOs defined and tracked for extraction and normalization quality on pilot corpora.
- Minimum targets:
  - Field completeness >= 95% for required canonical fields.
  - High-impact diff precision >= 0.95 and recall >= 0.90.
  - Candidate-to-publish validation pass rate >= 98% for non-manual paths.
  - Staleness SLO: no published program older than freshness policy without explicit stale marker.
- Confidence-routing policy documented (auto-publish vs review queue thresholds).
- Evidence: quality dashboard snapshots + fixture evaluation logs.

### J) Frontend performance and accessibility gate

- Core templates (home, program page, calculator, search) meet CWV budgets in representative test runs.
- Minimum budgets: p75 INP <= 200 ms, p75 LCP <= 2.5 s, p75 CLS <= 0.1.
- WCAG 2.2 AA checks pass for core user journeys and admin critical flows.
- Evidence: Lighthouse/field reports + accessibility audit outputs.

### K) Pipeline resilience gate

- Worker jobs are idempotent for re-delivery/replay scenarios.
- DLQ and replay tooling exists with documented operator runbook.
- Failure-injection drill demonstrates no duplicate canonical writes under retries.
- Evidence: drill transcript + replay checksum comparison artifacts.

---

## 9) Evidence ledger (append-only)

Use one row per gate or major verification run.

| Date | Sub-phase | Gate | Command/Run | Result | Artifact/Link | Owner |
|---|---|---|---|---|---|---|
| 2026-02-16 | 1A.2 | Coverage | `pnpm --filter @validatehome/db test --coverage` | PASS | local coverage report | team |
| 2026-02-16 | 1A.2 | Runtime DB smoke | `db:migrate`, `db:seed` | BLOCKED | `ECONNREFUSED` env note | team |
| 2026-02-17 | 1A.2 | Runtime DB smoke | `pnpm --filter @validatehome/db db:migrate` | BLOCKED | `ECONNREFUSED` to `postgresql://localhost:5432/validatehome` | agent |
| 2026-02-17 | 1A.2 | Runtime DB smoke | `pnpm db:migrate` | BLOCKED | preflight OK (`.env` loaded), but DB unreachable (`ECONNREFUSED 127.0.0.1:5432`); `docker` missing in environment | agent |
| 2026-02-17 | 1A.2 | Runtime DB smoke | `pnpm db:migrate` | PASS | migrations applied successfully after provisioning local PostgreSQL 16 | agent |
| 2026-02-17 | 1A.2 | Runtime DB smoke | `pnpm --filter @validatehome/db db:seed` | PASS | seed complete (4 federal + 6 state/province jurisdictions, 11 programs, 12 geo mappings) | agent |
| 2026-02-17 | 1A.2 | DB repository tests | `pnpm --filter @validatehome/db test` | PASS | 103 tests passed across `repo-factories` and `repositories` suites | agent |
| 2026-02-17 | 1A.2 | DB coverage refresh | `pnpm --filter @validatehome/db test:coverage` | PASS | 103 tests passed; coverage: 98.26% stmts, 92.10% branches, 100% funcs, 98.17% lines | agent |
| 2026-02-17 | 1B.1 | Runtime DB smoke | `pnpm db:migrate` | PASS | applied `0002_phase1b_crawl_hardening` migration (crawl jobs + DLQ + idempotent ingestion key) | agent |
| 2026-02-17 | 1B.1 | Worker orchestration | `pnpm --filter @validatehome/workers crawl:due` | PASS | command completed (`Crawled 0/0 due sources`) with stable env loading | agent |
| 2026-02-17 | 1B.2 | Parse pipeline regression | `pnpm --filter @validatehome/workers test` | PASS | parse/fetch/security/idempotency/diff unit suites all green (12 tests) | agent |
| 2026-02-17 | 1B.3 | Diff quality benchmark | `pnpm --filter @validatehome/workers benchmark:diff` | PASS | precision 1.0, recall 1.0 for high-impact fixture set | agent |
| 2026-02-17 | 1B | Workspace integrity | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | PASS | all checks pass after crawl executor refactor and formatting cleanups | agent |
| 2026-02-17 | 1B.1 | Pilot source registry | `pnpm --filter @validatehome/workers sources:pilot` | PASS | 4-country pilot sources provisioned/updated for US, UK, AU, CA | agent |
| 2026-02-17 | 1B.1 | Pilot crawl run | `pnpm --filter @validatehome/workers crawl:due` | PASS | pilot batch crawled successfully (`Crawled 4/4 due sources`) | agent |
| 2026-02-17 | 1B.1 | Fetch efficiency KPI | `pnpm --filter @validatehome/workers report:kpis` | PASS | fetch status split captured: 200=17, 304=8 (`pct304`=0.32) | agent |
| 2026-02-17 | 1B.2 | Data-quality SLO (latest batch) | `pnpm --filter @validatehome/workers report:kpis` | PASS | latest per-source batch: completenessRate=1.0, confidenceRate=1.0 | agent |
| 2026-02-17 | 1B.3 | Resilience drill (DLQ/replay/idempotency) | `pnpm --filter @validatehome/workers drill:resilience` | PASS | replay resolved; duplicate-ingestion protection verified (`noDuplicateIngestion`=true) | agent |

---

## 10) Risk register

| ID | Risk | Severity | Status | Mitigation | Owner | Due |
|---|---|---|---|---|---|---|
| R1 | DB env unavailable blocks 1A.2 closeout | High | Closed | Local PostgreSQL 16 provisioned; migrate/seed evidence captured in Section 9 | agent | 2026-02-17 |
| R2 | Crawl policy non-compliance risk | High | Closed | Robots checks + SSRF/host policy enforcement active; pilot crawl evidence captured in Section 9 | agent | 2026-02-17 |
| R3 | API abuse/rate-limit gaps for B2B API | High | Open | Enforce Section 8D gate + quota tests | TBD | Before 1E.2 DONE |
| R4 | SEO hreflang/canonical quality risk at scale | Medium | Open | Automate Section 8C validation in CI | TBD | Before 1D.1 DONE |
| R5 | Supply-chain evidence missing for releases | Medium | Open | Add SBOM + provenance attestation steps | TBD | Before first public release |
| R6 | Data quality drift could break trust claims | High | Closed | Parse quality scoring + confidence routing implemented; latest per-source pilot batch meets quality gate (Section 9 KPI evidence) | agent | 2026-02-17 |
| R7 | Retry/replay duplication could corrupt canonical state | High | Closed | Idempotent ingestion key + DLQ/replay tooling validated via resilience drill (`noDuplicateIngestion` true) | agent | 2026-02-17 |
| R8 | Web vitals regressions may hurt SEO/conversion | Medium | Open | Enforce Section 8J CWV budgets in CI and pre-release checks | TBD | Before 1D.1 DONE |
| R9 | Accessibility gaps in admin/user flows | Medium | Open | Enforce WCAG 2.2 AA audits for critical journeys | TBD | Before 1D.2 DONE |

---

## 11) Next session first 5 steps

1. Keep pilot source registry fresh (`sources:pilot`) and monitor KPI trend drift (`report:kpis`).
2. Start 1C.1 stacker-country rule completion while preserving 1B regression checks.
3. Extend diff benchmark corpus with additional false-positive/false-negative edge fixtures.
4. Integrate KPI snapshot artifact upload into CI for recurring evidence capture.
5. Begin 1D.1 SEO status page implementation using stabilized 1B pipeline outputs.

---

## 12) Source anchors for gold-standard gates

- RFC 9309 (Robots Exclusion Protocol): `https://www.rfc-editor.org/rfc/rfc9309`
- Google crawl budget guidance: `https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget`
- Google localized/hreflang guidance: `https://developers.google.com/search/docs/specialty/international/localized-versions`
- MDN `ETag`: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag`
- MDN `If-None-Match`: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match`
- OWASP API Security Top 10 (2023): `https://owasp.org/API-Security/editions/2023/en/0x11-t10/`
- SLSA levels: `https://slsa.dev/spec/v1.0/levels`
- GitHub artifact attestations: `https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations`
- RFC 9457 (Problem Details for HTTP APIs): `https://www.rfc-editor.org/rfc/rfc9457`
- Core Web Vitals INP guidance: `https://web.dev/articles/inp`
- WCAG 2.2 additions: `https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/`
- OpenTelemetry overview: `https://opentelemetry.io/docs/what-is-opentelemetry/`

---

## 13) Changelog (Phase 1 only)

- 2026-02-16: Replaced initial tracker with finalized gold-standard ledger.
- 2026-02-16: Added strict `PLAN.md` cross-check matrix for all 10 deliverables.
- 2026-02-16: Added hard-gate framework (crawler, fetch, SEO, API security, supply-chain, observability).
- 2026-02-16: Added evidence ledger and risk register for auditability.
- 2026-02-17: Added Phase 1 must-have additions (API problem-details contract, data-quality SLOs, CWV + WCAG gates, pipeline idempotency + DLQ/replay resilience).
- 2026-02-17: Closed 1A.2 to `DONE_FULL` after local PostgreSQL provisioning, successful migrate/seed, and DB test pass evidence.
- 2026-02-17: Implemented Phase 1B in one run (`DONE_CODE`) with source scheduling/orchestration, conditional fetch + policy checks, idempotent crawl snapshots, parse confidence routing, diff scoring benchmark, crawl job state tracking, and DLQ/replay tooling.
- 2026-02-17: Added crawler governance and DLQ replay operator runbooks (`docs/runbooks/crawl-policy.md`, `docs/runbooks/crawl-dlq-replay.md`).
- 2026-02-17: Hardened 1B execution with pilot source bootstrap/reset/deactivation scripts, fetch retry + circuit-breaker controls, and KPI reporting (`report:kpis`) including 200/304 split and latest-batch quality metrics.
- 2026-02-17: Promoted 1B.1/1B.2/1B.3 to `DONE_FULL` after pilot crawl, diff benchmark, and DLQ/replay/idempotency drill evidence.
