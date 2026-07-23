# Docker — why and how

## Why Docker?

| Reason | Meaning |
|---|---|
| Same stack everywhere | Postgres + API (+ Grafana + MLC) start with one command |
| No “works on my machine” | Mentors / teammates get identical ports and env |
| Near-production topology | Compose mirrors how API talks to DB and optional MLC |
| Observability demo | Grafana scrapes Prometheus → backend `/metrics` |

Frontend stays on the host (`npm run dev`) for fast UI iteration.

## Start

```bash
# Core (Postgres + API)
docker compose up --build -d

# Full demo (adds MLC stub + Prometheus + Grafana)
docker compose --profile full up --build -d
```

## How do I see that it works?

```bash
docker compose ps
# Expect: postgres, backend = running
# With --profile full: also mlc, prometheus, grafana

curl -s http://localhost:8080/health
# {"status":"ok"}

curl -s http://localhost:8080/metrics | head
# Prometheus text metrics

open http://localhost:3002   # Grafana (admin / listing) — profile full
curl -s http://localhost:8000/health   # MLC stub — profile full
```

Docker Desktop → Containers also shows green/running status.

## Ports

| Service | Port |
|---|---|
| API | 8080 |
| Postgres | 5432 |
| MLC stub | 8000 |
| Prometheus | 9090 |
| Grafana | **3002** (not 3000 — that is the Next.js app) |
| Frontend (host) | 3000 |

> If Grafana used to be mapped to 3001 and the UI looked like a stuck Next “Loading…” page, a second `npm run dev` was likely bound to 3001. Use **http://localhost:3002** for Grafana.

## Production note

Render Blueprint deploys **API + Postgres + Prometheus + Grafana**.  
See [OBSERVABILITY.md](./OBSERVABILITY.md). Swap DB to Supabase later (`SUPABASE.md`).
MLC stub remains local-only unless you host it and set `MLC_BASE_URL`.
