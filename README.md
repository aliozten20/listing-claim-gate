# MasterFabric Capstone — Listing & Claim Gate

**Repository:** https://github.com/aliozten20/listing-claim-gate

Marketplace / D2C **listing title + description** gate: mock shop or manual paste → commerce **Deci.Scoring** → `PASS` / `REVIEW` / `REJECT`.

| Layer | Tech | Host |
| --- | --- | --- |
| Frontend | Next.js SPA (EN default + TR) | **Vercel** |
| Backend | Go API (≥20 endpoints) | **Render** |
| Database | Postgres | **Supabase** (prod) / Docker (local) |
| Observability | Prometheus `/metrics` + Grafana | Docker `--profile full` |
| Inference demo | MLC OpenAI-compatible stub | Docker `--profile full` |

## Docs

| Doc | Topic |
| --- | --- |
| [docs/DOCKER.md](./docs/DOCKER.md) | Why Docker + how to verify it is running |
| [docs/SUPABASE.md](./docs/SUPABASE.md) | Production Postgres |
| [docs/METRICS.md](./docs/METRICS.md) | Metric meanings + good ranges |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Live deploy checklist |
| [docs/MASTER-PLAN.md](./docs/MASTER-PLAN.md) | Capstone plan |

## Quick start (local)

```bash
# Core API + Postgres
docker compose up --build -d
curl http://localhost:8080/health

# Frontend
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm install && npm run dev
```

Full demo (Grafana + MLC stub + Prometheus):

```bash
docker compose --profile full up --build -d
open http://localhost:3001   # Grafana admin / listing
```

## Product surface

- **Auth** — login / register (Academy requirement)
- **Listing Gate** — mock catalog or manual analyze
- **Decisions** — score history / KPI summary
- **Language** — EN (default) / TR toggle

## Metrics (Gate)

`claim_risk` · `title_quality` · `desc_complete` · `policy_clarity` · `content_efficiency`  
Each bar has an **(i)** info tip in the UI. Details: [docs/METRICS.md](./docs/METRICS.md).

## Production

Follow [docs/DEPLOY.md](./docs/DEPLOY.md): Supabase → Render → Vercel → CORS.

## License

No license specified yet.
