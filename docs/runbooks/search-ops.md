# Search Operations Runbook

This runbook covers common operational tasks for the Meilisearch search infrastructure.

## Table of Contents

1. [Health Check](#health-check)
2. [Full Reindex](#full-reindex)
3. [Stale Index Recovery](#stale-index-recovery)
4. [Troubleshooting](#troubleshooting)

---

## Health Check

### Quick Health Check

```bash
pnpm --filter @validatehome/workers search-ops health
```

### Manual Health Check

1. Check Meilisearch is running:
   ```bash
   curl http://localhost:7700/health
   ```

2. Check index stats:
   ```bash
   curl http://localhost:7700/indexes/programs/stats
   ```

### Health Check Criteria

- Meilisearch responds to `/health` endpoint
- Index document count matches database program count
- No tasks stuck in `processing` state for > 5 minutes

---

## Full Reindex

### When to Run a Full Reindex

- Index corruption detected
- Major schema changes
- Significant document count mismatch
- After Meilisearch upgrade

### Running Full Reindex

```bash
pnpm --filter @validatehome/workers search-ops reindex
```

### Reindex Process

1. Creates new index with timestamp suffix
2. Configures searchable, filterable, and sortable attributes
3. Fetches all programs from database
4. Indexes all documents
5. Swaps alias to point to new index
6. Deletes old indexes

### Expected Duration

- 100 programs: ~10 seconds
- 1,000 programs: ~30 seconds
- 10,000 programs: ~2 minutes

---

## Stale Index Recovery

### Detecting Stale Index

Run health check and look for:
- Document count mismatch
- Missing recent updates
- Search results not reflecting current data

### Recovery Steps

1. **Check last sync:**
   ```bash
   pnpm --filter @validatehome/workers search-health
   ```

2. **Run incremental sync:**
   ```bash
   pnpm --filter @validatehome/workers search-sync
   ```

3. **If incremental fails, run full reindex:**
   ```bash
   pnpm --filter @validatehome/workers search-ops reindex
   ```

---

## Troubleshooting

### Meilisearch Not Responding

1. Check if service is running:
   ```bash
   docker compose ps meilisearch
   ```

2. Check logs:
   ```bash
   docker compose logs meilisearch
   ```

3. Restart service:
   ```bash
   docker compose restart meilisearch
   ```

### Index Out of Sync

1. Check document counts:
   ```bash
   # Database count
   psql -c "SELECT COUNT(*) FROM programs"
   
   # Index count
   curl http://localhost:7700/indexes/programs/stats | jq .numberOfDocuments
   ```

2. If mismatch, run reindex.

### Search Performance Issues

1. Check index size:
   ```bash
   curl http://localhost:7700/indexes/programs/stats
   ```

2. Review filterable attributes - too many can slow down indexing

3. Consider increasing Meilisearch memory

---

## Monitoring

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Document count mismatch | > 5% |
| Task queue length | > 100 |
| Index size | > 1GB |
| Response time | > 500ms |

### Alerts

Set up alerts for:
- Meilisearch health check failures
- Document count drift > 5%
- Tasks stuck in processing > 5 minutes

---

## Contacts

- **Primary:** DevOps Team
- **Secondary:** Platform Team
- **Escalation:** Engineering Manager

---

*Last updated: 2026-02-19*
