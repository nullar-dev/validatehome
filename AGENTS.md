# AGENTS.md

Operational guide for agentic coding assistants working in this repository.

## 1) Repository Overview
- Monorepo: `pnpm` workspaces + `turbo`.
- Runtime baseline: Node `>=22`.
- Package manager: `pnpm` (`9.15.9` in `packageManager`).
- Workspace globs: `apps/*`, `packages/*`, `infra`.

Primary apps:
- `@validatehome/web` (Next.js)
- `@validatehome/api` (Hono)
- `@validatehome/admin` (Vite/Refine)
- `@validatehome/workers` (Inngest workers)

Primary packages:
- `@validatehome/db`
- `@validatehome/shared`
- `@validatehome/calculator`
- `@validatehome/rules-engine`
- `@validatehome/normalization`
- `@validatehome/ui`

## 2) Setup Commands
- Install dependencies: `pnpm install`
- Install git hooks: `pnpm prepare`

## 3) Root Commands (Build/Lint/Test)
- Dev all: `pnpm dev`
- Build all: `pnpm build`
- Lint all: `pnpm lint`
- Lint autofix: `pnpm lint:fix`
- Format all: `pnpm format`
- Typecheck all: `pnpm typecheck`
- Test all: `pnpm test`
- Coverage all: `pnpm test:coverage`
- Clean artifacts: `pnpm clean`

Recommended pre-PR gate:
- `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`

## 4) Workspace-Scoped Commands
- Build one package: `pnpm --filter @validatehome/db build`
- Typecheck one app: `pnpm --filter @validatehome/workers typecheck`
- Test one package: `pnpm --filter @validatehome/calculator test`
- Coverage one package: `pnpm --filter @validatehome/db test:coverage`

Turbo filtering from root scripts is also valid:
- `pnpm test --filter=@validatehome/workers`
- `pnpm typecheck --filter=@validatehome/api`

## 5) Running a Single Test (Important)
Vitest args must come after `--`.

- Single file:
  - `pnpm --filter @validatehome/workers test -- src/__tests__/security.test.ts`
  - `pnpm --filter @validatehome/db test -- src/__tests__/repo-factories.test.ts`

- Single test by name (`-t`):
  - `pnpm --filter @validatehome/workers test -- -t "blocks private ipv6 ranges"`
  - `pnpm --filter @validatehome/calculator test -- -t "returns zero when sticker price is <= 0"`

- Pattern in package:
  - `pnpm --filter @validatehome/workers test -- src/**/*.test.ts`

Test layout defaults:
- Typical location: `src/__tests__/`
- File names: `*.test.ts` or `*.spec.ts`
- Shared Vitest defaults: `packages/config/vitest.shared.ts`

## 6) Notable Workspace Scripts
- `@validatehome/workers`:
  - `crawl:source`, `crawl:due`, `sources:pilot`, `sources:reset`, `sources:deactivate`
  - `replay:dlq`, `drill:resilience`, `benchmark:diff`, `report:kpis`
- `@validatehome/db`:
  - `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`, `db:check`

## 7) Formatting and Import Rules
Source of truth: `biome.json`.

- Indentation: 2 spaces.
- Max line width: 100.
- Quotes: double quotes.
- Semicolons: required.
- Trailing commas: enabled for JS/TS; disabled for JSON.
- Import sorting/organization: enabled.
- Use `import type` where possible (`useImportType` enforced).
- Unused imports/variables: disallowed.
- Avoid non-null assertions (`!`) unless unavoidable.

Import style in this repo:
- ESM modules (`"type": "module"`).
- Relative TS imports usually include `.js` extension; preserve this convention.
- Prefer package exports over deep ad-hoc relative paths when available.

## 8) TypeScript Guidelines
Source of truth: `packages/config/tsconfig.base.json` (+ derivatives).

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`

Coding expectations:
- Prefer explicit return types on exported functions in core libs.
- Prefer narrow unions/literals for domain values.
- Keep `any` narrowly scoped; avoid introducing new broad `any`.
- Prefer readonly fields in shared/domain contracts.

## 9) Naming Conventions
- Variables/functions: `camelCase`
- Types/interfaces/components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Domain literals: `snake_case` (e.g., `policy_blocked`, `coming_soon`)
- Repository file names: `*.repo.ts`

## 10) Error Handling Rules
- Use guard clauses for invalid input and invalid state.
- Throw explicit `Error` for invariants/data integrity failures.
- Return `undefined` for not-found reads when API contract expects it.
- In HTTP handlers, return structured responses with explicit error fields.
- Do not silently swallow errors.
- If catching, rethrow or emit clear telemetry/context.

## 11) Testing and Coverage Expectations
- Test framework: Vitest.
- Shared defaults include:
  - `globals: true`
  - `environment: "node"`
  - include: `src/**/*.test.ts`, `src/**/*.spec.ts`
  - exclude: `node_modules`, `dist`
  - `passWithNoTests: true`
- Coverage threshold baseline is 80% (lines/branches/functions/statements).

When changing behavior:
- Add/adjust tests in touched packages.
- Prefer deterministic unit tests over fragile timing-based tests.

## 12) Git Hooks and Commit Rules
- Lefthook pre-commit runs Biome checks and TypeScript typecheck.
- Commit messages must be Conventional Commits.
- Common allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## 13) CI Expectations
CI validates:
- Lint
- Typecheck
- Tests and coverage
- Security checks (`gitleaks`, `pnpm audit`)
- Full build

Agents should avoid merging assumptions without passing local equivalents when feasible.

## 14) Agent Working Style
- Make minimal, targeted diffs.
- Follow established patterns before introducing new abstractions.
- Keep behavior changes and test updates together.
- Avoid toolchain changes unless explicitly requested.
- Use workspace filtering during iteration for faster feedback loops.

## 15) Cursor and Copilot Rule Files
Checked paths:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

Current status:
- No Cursor/Copilot rule files were found in this repository.

If these files are added later, treat them as high-priority instructions and update this file.
