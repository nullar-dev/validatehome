# Crawl DLQ Replay Runbook

## Scope

Operational steps for replaying failed crawl jobs from DLQ without duplicate writes.

## Failure classes

- `transient`: retry/replay expected (network, timeout, temporary source failures).
- `permanent`: investigate parser/source issues before replay.
- `policy_blocked`: source violated policy checks.

## Replay commands

- Replay one entry:
  - `pnpm --filter @validatehome/workers replay:dlq -- --id=<dlqId>`
- Replay unresolved entries for a source:
  - `pnpm --filter @validatehome/workers replay:dlq -- --sourceId=<sourceId>`

## Verification checklist

1. `replay_count` increments in `crawl_dlq`.
2. Successful replay sets `resolved_at`.
3. No duplicate snapshot rows for same `ingestion_key`.
4. No duplicate canonical state writes for unchanged input hashes.

## Escalation

- If replay fails repeatedly for `transient`, inspect source availability and retry windows.
- If `policy_blocked`, review source URL/host and robots policy before override.
