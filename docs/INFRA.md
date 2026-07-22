# Infra Plan — Docker MLC + Backend + Grafana + Gateway

## Container topolojisi

| Servis | Image / rol | Port (local) |
|---|---|---|
| **mlc-llm** | MLC-LLM runtime, Gemma model serve (OpenAI-compatible HTTP) | `8000` |
| **backend** | MF Go API: auth, runs, Deci.Scoring, metrics export | `8080` |
| **grafana** *(gözlem)* | LLM KPI dashboards (Prometheus veya Loki datasource) | `3001` |
| **postgres** *(data)* | Run ledger / users (veya Supabase URL) | `5432` |

Sunum cümlesi: **“İki iş container’ı — `mlc-llm` ve `backend` — konuşur; Grafana backend’in yayınladığı LLM KPI’larını sürekli izler.”**

```
Client → Gateway(:8080) → backend → http://mlc-llm:8000/v1/chat/completions
                              ↓
                     /metrics (Prometheus)
                              ↓
                          Grafana
```

## MLC-LLM container’da nasıl parçalanır?

1. **Model katmanı:** Gemma weights volume’da (`/models`) — image’a gömülmez (boyut).  
2. **Runtime katmanı:** `mlc-llm` / `mlc_llm.serve` OpenAI-style API.  
3. **Tek sorumluluk:** Sadece inference. Auth, skor, DB yok.  
4. **Backend sözleşmesi:** `MLC_BASE_URL=http://mlc-llm:8000` — Go client timeout + retry.  
5. **Sağlık:** `GET /health` (veya models list) → backend `/ready` MLC’yi de ping’ler.

Local `docker-compose` taslağı (hedef):

```yaml
services:
  mlc-llm:
    image: # mlcai/mlc-llm-server veya custom Dockerfile
    volumes: ["./models:/models"]
    deploy: { resources: { reservations: { devices: [gpu...] } } } # GPU varsa
    # CPU fallback: daha yavaş, demo için kabul

  backend:
    build: ./backend
    environment:
      MLC_BASE_URL: http://mlc-llm:8000
      DATABASE_URL: ...
      MAX_CONCURRENT_INFERENCES: "20"
    depends_on: [mlc-llm, postgres]

  grafana:
    image: grafana/grafana
    volumes: ["./infra/grafana:/etc/grafana/provisioning"]
```

## Gateway + Switch-out Killer (20 kullanıcı)

**Kural:** Aynı anda en fazla **20** inference. 21. istek **kabul edilmez** (veya kuyruk doluysa `503`).

Uygulama yeri: **backend gateway middleware** (tek binary’de semaphore) — ilk fazda ayrı Envoy şart değil.

```
acquire(slot):
  if active >= 20 → 503 { code: "capacity_exceeded", retry_after }
  else active++ ; defer active--
```

| Terim | Anlamı |
|---|---|
| Switch-out killer | Slot yoksa isteği öldür / reddet (kaynak koruma) |
| Yatay büyüme | `mlc-llm` replica N + LB; killer limiti `20 * N` veya global Redis semaphor |
| Load balance | Cloud’da gateway (nginx/Traefik/Render LB) → backend pods → MLC pool |

## Local performans (ölçülecek metrikler)

Perşembe sunumunda tablo:

| KPI | Nasıl | Hedef (örnek, ölçünce doldur) |
|---|---|---|
| Cold start (model load) | container up → first token | _sn_ |
| P50 / P95 latency | 20 ardışık listing score | _ms_ |
| Tok/s | completion_tokens / latency | _tok/s_ |
| Concurrent 20 | 20 parallel `/llm/runs` | başarı oranı |
| 21st request | parallel 21 | `503 capacity_exceeded` |
| GPU vs CPU | aynı prompt | fark |

Backend her run’da zaten: `latency_ms`, tokens, score, efficiency → **Prometheus histograms** + Grafana panelleri.

## Grafana — LLM KPI panelleri

| Panel | Kaynak |
|---|---|
| Requests / min | `llm_requests_total` |
| Active inferences (0–20) | `llm_inflight` gauge |
| Latency P95 | `llm_latency_ms` histogram |
| Tok/s | derived |
| Grade distribution | Deci score labels |
| PASS / REVIEW / REJECT | publish decision counter |
| 503 capacity kills | `llm_rejected_total{reason="capacity"}` |
| MLC upstream errors | `mlc_errors_total` |

Backend: Prometheus `/metrics` endpoint (Common veya ops). Grafana scrape `backend:8080`.

## Buluta çıkınca (yatay büyüme)

```
Internet
   → Managed LB / API Gateway
   → backend Deployment (HPA: CPU / inflight)
   → mlc-llm Deployment (GPU node pool, replica 1..N)
   → Managed Postgres / Supabase
   → Managed Grafana / Grafana Cloud
```

| Local | Cloud |
|---|---|
| compose, 1 MLC | GPU node + N replica |
| semaphore=20 process-local | Redis/distributed limiter veya gateway rate |
| volume `./models` | PVC / model registry |
| tek makine VRAM | node affinity + queue |

**Ölçek formülü (sunum):**  
`max_concurrent ≈ replicas_mlc × slots_per_replica`  
İlk replica: 20 slot. İkinci MLC pod: +20 (LB round-robin) — killer eşiği güncellenir.

## MCP (teslim)

| MCP | Rol |
|---|---|
| Render MCP | backend (+ opsiyonel containers) deploy |
| Vercel MCP | frontend |
| MF Academy MCP | mentor teslim |

Ürün MCP’si (sonra): `score_listing` → aynı Go API.

## Riskler

| Risk | Mitigasyon |
|---|---|
| Ödev “web mlc-llm” bekler | README’de Docker MLC + isteğe bağlı WebLLM fallback; mentora sor |
| GPU yok local | CPU demo + latency’yi dürüst raporla |
| Model boyutu | volume mount; CI’da model indirme cache |
| Compose 2 vs 3 servis | Sunumda “2 iş + 1 gözlem” de |
