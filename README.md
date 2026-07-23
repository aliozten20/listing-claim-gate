<div align="center">

<a href="https://academy.masterfabric.co">
  <img src="https://academy.masterfabric.co/academy-badge.png" width="120" alt="MasterFabric Academy">
</a>

<p>
  <sub>
    academy.masterfabric.co is a
    <a href="https://masterfabric.co">MasterFabric</a>
    subsidiary.
  </sub>
</p>

</div>

# Listing & Claim Gate

**MasterFabric Academy** capstone · [Brand assets](https://academy.masterfabric.co/en/brand-assets)  
**Repository:** https://github.com/aliozten20/listing-claim-gate

Marketplace / D2C **listing title + description** gate: mock shop or manual paste → commerce **Deci.Scoring** → `PASS` / `REVIEW` / `REJECT`.

| | |
| --- | --- |
| **Live app (FE)** | https://listing-claim-gate.vercel.app |
| **Live API** | https://listing-claim-gate-api.onrender.com |
| **Health** | https://listing-claim-gate-api.onrender.com/health |

| Layer | Tech | Host |
| --- | --- | --- |
| Frontend | Next.js SPA (EN default + TR) | **Vercel** |
| Backend | Go API (≥20 endpoints) | **Render** |
| Database | Postgres | **Render free DB** (first live) → **Supabase** later |
| Observability | Prometheus `/metrics` + Grafana | Local `:3002` **and** Render (see [OBSERVABILITY.md](./docs/OBSERVABILITY.md)) |
| Inference demo | MLC OpenAI-compatible stub | Docker `--profile full` (`:8000`) |

## Links for mentors / delivery

| Item | URL |
| --- | --- |
| GitHub | https://github.com/aliozten20/listing-claim-gate |
| Deploy guide | [docs/DEPLOY.md](./docs/DEPLOY.md) |
| Render Blueprint | https://dashboard.render.com/blueprint/new?repo=https://github.com/aliozten20/listing-claim-gate |
| Academy | https://academy.masterfabric.co |
| Brand assets | https://academy.masterfabric.co/en/brand-assets |

## Docs

| Doc | Topic |
| --- | --- |
| [docs/DOCKER.md](./docs/DOCKER.md) | Why Docker + how to verify running services |
| [docs/OBSERVABILITY.md](./docs/OBSERVABILITY.md) | Local + prod Grafana / Prometheus |
| [docs/ORIGIN.md](./docs/ORIGIN.md) | Not a fork of masterfabric-go — how the backend was built |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Vercel + Render (+ later Supabase) |
| [docs/SUPABASE.md](./docs/SUPABASE.md) | Swap production DB to Supabase |
| [docs/METRICS.md](./docs/METRICS.md) | Gate metric meanings + good ranges |
| [docs/PERF-AUDIT.md](./docs/PERF-AUDIT.md) | Go performance / bottleneck audit |
| [docs/SECURITY-AUDIT.md](./docs/SECURITY-AUDIT.md) | OWASP AppSec audit |
| [docs/MASTER-PLAN.md](./docs/MASTER-PLAN.md) | Capstone plan |
| [Brand assets](https://academy.masterfabric.co/en/brand-assets) | Official Academy badge & usage |

## Quick start (local)

```bash
# Core API + Postgres
docker compose up --build -d
curl http://localhost:8080/health

# Frontend (port 3000)
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm install && npm run dev
```

Full demo (Grafana + MLC stub + Prometheus):

```bash
docker compose --profile full up --build -d
open http://localhost:3002   # Grafana — admin / listing
# API :8080 · MLC :8000 · Prometheus :9090 · FE :3000
```

## Product surface

- **Auth** — login / register (Academy `[Auth][Subviews]`)
- **Listing Gate** — mock catalog or manual analyze
- **Decisions** — score history / KPI summary
- **Language** — EN (default) / TR toggle

## Metrics (Gate)

`claim_risk` · `title_quality` · `desc_complete` · `policy_clarity` · `content_efficiency`  
Each bar has an **(i)** info tip. Details: [docs/METRICS.md](./docs/METRICS.md).

## Production (live)

| | |
| --- | --- |
| Frontend | https://listing-claim-gate.vercel.app |
| API | https://listing-claim-gate-api.onrender.com |
| Health | https://listing-claim-gate-api.onrender.com/health |

CORS is set to the Vercel origin. Redeploy / DB swap steps: [docs/DEPLOY.md](./docs/DEPLOY.md).  
Later: point `DATABASE_URL` at Supabase ([docs/SUPABASE.md](./docs/SUPABASE.md)) before Render free Postgres expires.

## Academy

- Site: [academy.masterfabric.co](https://academy.masterfabric.co)
- Brand kit: [academy.masterfabric.co/en/brand-assets](https://academy.masterfabric.co/en/brand-assets)
- Parent: [masterfabric.co](https://masterfabric.co)

## License

No license specified yet.
