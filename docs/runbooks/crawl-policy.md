# Crawl Policy Runbook

## Scope

This runbook documents crawler governance behavior for Phase 1B.

## URL and host controls

- Allow only `http` and `https` protocols.
- Reject blocked hosts (`localhost`, loopback, private ranges, `.local`, `.internal`).
- Reject URL host mismatch against the allowlisted source host in the registry.

## Robots behavior

- Fetch `robots.txt` using bot user-agent.
- Cache robots rules per origin for 1 hour.
- Respect `Disallow` rules for `User-agent: *` and `User-agent: ValidateHomeBot`.
- Fail-open on robots fetch failure (record reason in job metadata).

## Conditional fetch

- Send `If-None-Match` when source has `etag`.
- Send `If-Modified-Since` when source has `lastModifiedHeader`.
- Record 304 outcomes as successful no-change runs.

## Operator checks

1. Verify source is active and due.
2. Trigger run with `pnpm --filter @validatehome/workers crawl:source -- <sourceId>`.
3. Validate `crawl_jobs` status transitions and trace logs.
4. Confirm snapshot creation is idempotent for duplicate payloads.
5. Export KPI snapshot with `pnpm --filter @validatehome/workers report:kpis`.
