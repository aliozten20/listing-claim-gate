# Performance & bottleneck audit — Go backend

**Role:** Software Architect / Go performance review  
**Scope:** `backend/` (Listing & Claim Gate)  
**Method:** Hot-path read of auth, llm/store, listing analyze, middleware, pool, concurrency primitives  
**Not in scope:** Cosmetic refactors, “use more goroutines”, trendy micro-optimizations without load impact

---

## Executive ranking (ROI)

| Priority | Issue |
|---|---|
| P0 | Metrics scans `length(response)` (TOAST) twice on hottest dashboard path |
| P0 | `len([]rune(response))` on every GetRun / ScoreRun efficiency attach |
| P1 | Refresh token rotation not transactional |
| P1 | Pool MaxConns/MinConns hardcoded vs capacity + Supabase limits |
| P1 | Analyze CreateRun+UpsertScore non-atomic; MarshalIndent as stored response |
| P2 | Duplicate claim ToLower/scans; fat UserStore; Breakdown dual-domain |
| P3 | Rate-limit shard fill fail-closed; session DELETE unindexed |

Already sound: consumer-side `RunStore`/`TokenVerifier`, bcrypt CPU semaphore, capacity non-blocking 503, keyset ListRuns + `left(prompt)`, `Metadata` as `json.RawMessage`, response `sync.Pool`, HTTP server phase timeouts, no `reflect`.

---

## 1. Memory / GC

### 1.1 Heap escape via full rune slice on efficiency path

- **Sorun:** `AnalyzeEfficiency` uses `len([]rune(run.Response))`, which allocates a full `[]rune` copy of the response body. Called from `ScoreRun` and from `attachEfficiency` on every `GetRun`.
- **Mimari Etki:** Under concurrent detail views / auto-score, GC pressure scales with response size (up to body cap). Large TOAST-backed strings amplify pause time and allocator churn on the hottest read path.
- **Çözüm Önerisi:** Use `utf8.RuneCountInString(run.Response)` (zero alloc, already used in listing analyze). Optionally persist `response_chars` at write time and skip recomputation on read.

```go
import "unicode/utf8"

func AnalyzeEfficiency(run Run) EfficiencyReport {
	n := utf8.RuneCountInString(run.Response)
	if n == 0 {
		n = len(run.Response)
	}
	// ...
}
```

### 1.2 `json.MarshalIndent` + `map[string]any` on Gate analyze

- **Sorun:** `AnalyzeListingText` builds `map[string]any` and persists pretty-printed JSON as the synthetic “model response”.
- **Mimari Etki:** Extra heap for map boxing + indent whitespace; larger rows → more TOAST I/O on every Metrics/GetRun that touches `response`. Indent buys nothing for machines or Deci scoring.
- **Çözüm Önerisi:** Typed struct + `json.Marshal` (compact), or store only flags/insights columns and stop pretending the payload is an LLM completion.

### 1.3 Duplicate lowercasing and claim scans

- **Sorun:** One analyze request lowercases and scans claim markers in `listing_analyze.go`, then again in `ScoreListingCommerce` (`listing_score.go`) with overlapping marker sets.
- **Mimari Etki:** 2× string allocations and 2× linear scans per Gate request; policy drift between “flag” and “score” as lists diverge.
- **Çözüm Önerisi:** Single classifier → structured hits (`absolute` / `soft`) feeding both flags and claim_risk. Pre-size hit slices (`make([]string, 0, 4)`).

### 1.4 `strings.Fields` + unbounded uniqueness map

- **Sorun:** `scoreContentEfficiency` allocates `[]string` via `Fields` and a `map[string]struct{}` without capacity hint.
- **Mimari Etki:** Long descriptions (near 4k runes) create large transient maps on every analyze under the capacity slot.
- **Çözüm Önerisi:** Cap sampling (e.g. first N tokens), or streaming uniqueness with fixed hash set; `make(map[string]struct{}, estimated)`.

### 1.5 Response buffer pool (positive)

- **Sorun:** N/A — already correct.
- **Mimari Etki:** —
- **Çözüm Önerisi:** Keep `common.bufPool` with size cap. New pools only after `pprof` (Builder for metrics scrape is optional).

### 1.6 Slice growth without capacity (minor)

- **Sorun:** `foundClaims := make([]string, 0)` and several insight appends grow from zero.
- **Mimari Etki:** A few small reallocs per request — negligible vs TOAST/`[]rune`, but easy hygiene.
- **Çözüm Önerisi:** `make([]string, 0, 4)` for claims/flags/insights.

---

## 2. Concurrency / synchronization

### 2.1 Refresh rotation race (correctness + load)

- **Sorun:** `Refresh` revokes then `issueTokens` without `BEGIN` / `SELECT … FOR UPDATE` on the session row. Concurrent refreshes with the same token can both observe a live session.
- **Mimari Etki:** Duplicate live sessions, session table bloat, extra JWT/DB work under mobile retry storms; weakens reuse detection assumptions.
- **Çözüm Önerisi:** Single transaction: lock session by hash → if revoked/expired fail → revoke → insert new session → commit. Optionally rotate atomically with `UPDATE … RETURNING`.

### 2.2 Context timeout does not preempt CPU once started

- **Sorun:** `common.Timeout` only cancels `context.Context`. In-flight bcrypt (after sem acquire) and pure Go scoring cannot be interrupted mid-hash / mid-scan.
- **Mimari Etki:** Under overload, cancelled requests still consume CPU/sem slots until completion; tail latency extends while clients already abandoned.
- **Çözüm Önerisi:** Keep bcrypt sem; check `ctx.Err()` before acquire (already done). Bound body size (done). Accept hash non-preemptibility; ensure request timeout > worst bcrypt wait+hash. Do not start expensive analyze if `ctx.Done()`.

### 2.3 Capacity limiter scope

- **Sorun:** 20-slot killer wraps only `POST /llm/listings/analyze`. `CreateRun`, `ScoreRun`, `Metrics` share the same pool unbound.
- **Mimari Etki:** Dashboard fan-out + write bursts can exhaust `MaxConns=25` while analyze slots sit idle → acquire wait until request timeout.
- **Çözüm Önerisi:** Separate budgets: inference slots (analyze) vs DB concurrency semaphore, or raise/tune pool and apply light concurrency limit on Metrics.

### 2.4 Rate limiter shard saturation

- **Sorun:** Per-shard visitor map hard-caps; when full, `Allow` returns false (fail-closed). Eviction interval = TTL (10m).
- **Mimari Etki:** Unique-IP flood fills shards → legitimate new clients 429 until eviction; looks like outage.
- **Çözüm Önerisi:** LRU/random eviction on insert when full; or fail-open with global token bucket for auth; shorten TTL under attack.

### 2.5 Positive findings

- Capacity: non-blocking `select`/`default` → 503 (no goroutine park queue).
- bcrypt: `NumCPU()`-bounded channel semaphore.
- Workers: session cleanup + rate-limit cleanup share cancellable `workerCtx` on shutdown.
- No unbounded fan-out goroutines per request in handlers reviewed.
- Rate limiter stores `visitor` by value (GC-friendly vs pointer maps).

---

## 3. I/O, network, database

### 3.1 Metrics TOAST decompression (critical)

- **Sorun:** `Metrics` CTE selects `length(r.response)` and a second query again uses `length(r.response)` for per-model chars/token. Postgres must fetch TOAST for large text.
- **Mimari Etki:** Hottest dashboard endpoint scales with total stored response bytes, not row count. Dual scan doubles pool checkout pressure (comments already note pool > latency).
- **Çözüm Önerisi:** Persist `response_chars INT` (or use `completion_tokens` only). Drop `length(response)` from aggregates. Fold model efficiency into the same CTE (one round-trip).

### 3.2 GetScore loads full run

- **Sorun:** `GetScore` calls `GetRun` (full prompt/response) then returns only `score`.
- **Mimari Etki:** Unnecessary TOAST + JSON + efficiency attach for a metadata fetch.
- **Çözüm Önerisi:** `SELECT score… WHERE run_id AND user_id` with ownership join; skip `attachEfficiency` unless requested.

### 3.3 Hardcoded pool sizing

- **Sorun:** `MaxConns=25`, `MinConns=5`, idle/lifetime fixed in `common/db.go` — not env-driven.
- **Mimari Etki:** Capacity(20) + Metrics + auth can block on pool; Supabase free/pooler `max_connections` can be lower → cascading 5s timeouts. `MinConns=5` reserves quota idle.
- **Çözüm Önerisi:**

```go
cfg.MaxConns = int32(getEnvInt("DB_MAX_CONNS", 25))
cfg.MinConns = int32(getEnvInt("DB_MIN_CONNS", 2))
cfg.MaxConnIdleTime = getEnvDuration("DB_MAX_CONN_IDLE", 5*time.Minute)
cfg.MaxConnLifetime = getEnvDuration("DB_MAX_CONN_LIFETIME", 30*time.Minute)
cfg.HealthCheckPeriod = 30 * time.Second
```

Size: `instances × MaxConns ≤ Postgres max_connections − reserve`.

### 3.4 Non-transactional multi-write paths

- **Sorun:** Analyze / CreateRun+auto-score: `CreateRun` then `UpsertScore` without transaction.
- **Mimari Etki:** Partial failure → orphan runs; two checkouts while holding capacity slot.
- **Çözüm Önerisi:** `Begin` → insert run → upsert score → `Commit`; release capacity after commit.

### 3.5 Session cleanup DELETE

- **Sorun:** Hourly `DELETE … WHERE expires_at < now() OR revoked_at < …` with no supporting index / batch limit.
- **Mimari Etki:** Table growth → sequential scans and lock/I/O spikes during reap.
- **Çözüm Önerisi:** Index `(expires_at)`, `(revoked_at)`; batched `DELETE … WHERE ctid IN (SELECT … LIMIT 1000)`.

### 3.6 Context propagation (positive / gaps)

- **Positive:** Store methods take `ctx`; middleware timeout attaches to request; ready/ping use short timeouts.
- **Gap:** No per-query statement timeout (`SET LOCAL statement_timeout`) for Metrics on huge tenants — middleware alone leaves a slow query holding a conn until cancel reaches the driver.

### 3.7 Buffering

- **Sorun:** No `bufio` on JSON path.
- **Mimari Etki:** Irrelevant for small JSON APIs; pooled `bytes.Buffer` + `WriteTo` is appropriate.
- **Çözüm Önerisi:** Do not add `bufio` without evidence; keep pool.

---

## 4. Coupling & type efficiency

### 4.1 Interface segregation

- **Sorun:** `UserStore` (~13 methods) mixes user CRUD and all session operations. `RunStore` (~6) is appropriately narrow. Interfaces are correctly defined on the **consumer** (`auth.Handler`, `llm.Handler`).
- **Mimari Etki:** Tests/mocks bloat; accidental coupling of session lifecycle to user module; harder to swap session store.
- **Çözüm Önerisi:** Split `UserRepository` + `SessionRepository` on the handler side (ISP). Keep `TokenVerifier` as func type (already good).

### 4.2 Dual-domain `Breakdown`

- **Sorun:** One struct holds LLM Deci dims and Gate commerce dims with `omitempty`.
- **Mimari Etki:** Schema ambiguity in JSONB; Metrics efficiency extraction assumes `breakdown.efficiency` which Gate scores may omit; feature churn crosses product boundaries.
- **Çözüm Önerisi:** `RunBreakdown` vs `ListingBreakdown` (or `json.RawMessage` + typed decode per engine).

### 4.3 Handler product coupling

- **Sorun:** Listing Gate persists synthetic runs into `llm_runs`, inflating monitoring metrics.
- **Mimari Etki:** Dashboard averages mix Gate rules engine with real model runs; capacity and Metrics share fate incorrectly.
- **Çözüm Önerisi:** `listing_analyses` table or `model`/`engine` filter defaults on Metrics; separate write path.

### 4.4 `reflect` / `any`

- **Sorun:** No `reflect` usage. `any` limited to JSON envelopes (`map[string]any` for small responses).
- **Mimari Etki:** Minor boxing on low-QPS endpoints; listing meta/`MarshalIndent` path is the costly `any` use.
- **Çözüm Önerisi:** Prefer typed response DTOs; generics add little at the `encoding/json` boundary.

---

## Recommended remediation sequence (SDLC)

1. **Measure:** `pprof` heap + `EXPLAIN (ANALYZE, BUFFERS)` on Metrics with realistic `response` sizes.  
2. **P0 fixes:** `utf8.RuneCountInString`; Metrics without `length(response)`; compact listing payload.  
3. **P1 correctness:** transactional refresh; transactional analyze write; env-based pool.  
4. **P2 structure:** shared claim classifier; split stores; separate breakdown types.  
5. **Gate:** regression benchmarks (`BenchmarkScoreRun` style) + load test on `/llm/metrics` and `/llm/listings/analyze`.

Do **not** introduce worker pools, microservices, or Redis for this stage — the bottlenecks are data amplification and transactional integrity, not missing distributed infrastructure.
