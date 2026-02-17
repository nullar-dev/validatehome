# AGENTS.md

Operational guidance for coding agents in this repository.

## 1) Repo + Toolchain
- Monorepo managed by `pnpm` workspaces + `turbo`.
- Node version: `>=22`.
- PNPM version: `9.15.9` (from `packageManager`).
- Workspaces: `apps/*`, `packages/*`, and `infra`.
- Main apps: `@validatehome/api`, `@validatehome/web`, `@validatehome/admin`, `@validatehome/workers`.
- Main libs: `@validatehome/db`, `@validatehome/shared`, `@validatehome/calculator`, `@validatehome/rules-engine`, `@validatehome/normalization`, `@validatehome/ui`.

## 2) Setup
- Install deps: `pnpm install`.
- Install hooks: `pnpm prepare` (runs `lefthook install`).

## 3) Root Build/Lint/Test Commands
- Build all: `pnpm build`.
- Dev (multi-workspace via turbo): `pnpm dev`.
- Lint all: `pnpm lint`.
- Lint autofix: `pnpm lint:fix`.
- Format all: `pnpm format`.
- Typecheck all: `pnpm typecheck`.
- Test all: `pnpm test`.
- Coverage run: `pnpm test:coverage`.
- Clean outputs: `pnpm clean`.

## 4) Workspace-Scoped Commands
- Build one workspace: `pnpm --filter @validatehome/api build`.
- Typecheck one workspace: `pnpm --filter @validatehome/web typecheck`.
- Test one workspace: `pnpm --filter @validatehome/db test`.
- Coverage one workspace: `pnpm --filter @validatehome/shared test:coverage`.
- Dev one workspace: `pnpm --filter @validatehome/workers dev`.

Turbo filters are also valid from root scripts:
- `pnpm test --filter=@validatehome/calculator`
- `pnpm typecheck --filter=@validatehome/api`

## 5) Running a Single Test (Important)
Use Vitest args after `--`.

- Single file:
  - `pnpm --filter @validatehome/calculator test -- src/__tests__/calculate.test.ts`
- Single test by name (`-t`):
  - `pnpm --filter @validatehome/calculator test -- -t "returns zero when sticker price is <= 0"`
- Single file in API app:
  - `pnpm --filter @validatehome/api test -- src/**/*.test.ts`
- Single file in DB package:
  - `pnpm --filter @validatehome/db test -- src/__tests__/repositories.test.ts`

Notes:
- Most tests live under `src/__tests__/` with `*.test.ts`.
- Shared Vitest defaults are in `packages/config/vitest.shared.ts`.
- Shared coverage threshold is 80% (lines/branches/functions/statements).

## 6) App/Package Script Notes
- `@validatehome/api`: `dev`, `build`, `start`, `typecheck`, `test`, `test:coverage`.
- `@validatehome/web`: `dev` (Next on 3000), `build`, `start`, `typecheck`, tests.
- `@validatehome/admin`: `dev` (Vite on 3001), `build`, `preview`, `typecheck` (no test script).
- `@validatehome/workers`: `dev`, `build`, `start`, `typecheck`, tests.
- `@validatehome/db`: plus `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`.

## 7) Formatting + Imports (Biome)
Source of truth: `biome.json`.

- Indentation: 2 spaces.
- Max line width: 100.
- Quote style: double quotes.
- Semicolons: always.
- Trailing commas: all in JS/TS, none in JSON.
- Import organization is enabled.
- Use type-only imports (`import type`) where applicable (`useImportType` is error).
- Remove unused imports/variables (both error-level).
- Avoid non-null assertions (`!`) unless necessary (warn-level rule).

Import path conventions observed in codebase:
- ESM modules are used (`"type": "module"`).
- Relative TS imports typically include `.js` extension (preserve this style).
- Prefer explicit module boundaries via package exports where available.

## 8) TypeScript Rules
Source of truth: `packages/config/tsconfig.base.json` and derivatives.

- `strict: true`.
- `noUncheckedIndexedAccess: true`.
- `noUnusedLocals: true` and `noUnusedParameters: true`.
- `verbatimModuleSyntax: true`.
- `isolatedModules: true`.
- Prefer precise unions/literal types for domain values.
- Prefer explicit return types on exported functions in core libs.
- Avoid `any` (warn-level rule); if unavoidable, keep narrowly scoped.
- Favor `readonly` fields in API/shared data contracts.

## 9) Naming Conventions
- Functions/variables: `camelCase`.
- Types/interfaces/components: `PascalCase`.
- Global constants: `UPPER_SNAKE_CASE`.
- Domain string values: usually `snake_case` literals (example: `tax_credit`, `coming_soon`).
- Repository files often use `*.repo.ts` naming.
- Test files: `*.test.ts` (or `*.spec.ts`).
- Barrel exports are common via `src/index.ts`.

## 10) Error Handling Guidelines
- Prefer guard clauses for invalid input/state.
- Throw `Error` for invariant/integrity failures (e.g., expected DB return missing).
- Return `undefined` for "not found" repository reads when that is the existing API contract.
- In HTTP handlers, return structured JSON with explicit success/error fields.
- Do not silently swallow errors.
- Avoid broad catch blocks unless you rethrow or map to a clear response.

## 11) Testing Conventions
- Framework: Vitest.
- Shared defaults:
  - `globals: true`
  - `environment: "node"`
  - include: `src/**/*.test.ts`, `src/**/*.spec.ts`
  - exclude: `node_modules`, `dist`
  - `passWithNoTests: true`
- DB package has extra coverage excludes for schema/config style files.
- Keep tests near source under `src/__tests__/`.

## 12) Git Hooks + Commit Rules
- Pre-commit hook runs:
  - `pnpm biome check --no-errors-on-unmatched {staged_files}`
  - `pnpm typecheck` for TS changes
- Commit message must follow conventional commits.
- Accepted types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## 13) CI Expectations
CI runs Node 22 and expects:
- Lint passes.
- Typecheck passes.
- Tests and coverage pass.
- Security checks (`gitleaks`, `pnpm audit`) pass.
- Full build passes.

Recommended local preflight before opening PR:
- `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`

## 14) Agent Working Style
- Make focused, minimal diffs.
- Follow existing architecture and naming over introducing new patterns.
- Update/add tests when behavior changes.
- Do not change package manager, Node baseline, or core toolchain unless asked.
- Prefer workspace-filtered commands during iteration for speed.

## 15) Cursor/Copilot Rule Files
Checked locations requested by user:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

Result:
- No Cursor or Copilot instruction files were found in this repository.

If these files are added later, treat them as high-priority repository instructions.
