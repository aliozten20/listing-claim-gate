
# MasterFabric Capstone — Listing & Claim Gate

<a href="https://academy.masterfabric.co">
  <img src="https://academy.masterfabric.co/academy-badge.png" alt="MasterFabric Academy" width="220">
</a>

**Repository:** https://github.com/aliozten20/listing-claim-gate

Pazaryeri/D2C **listing title + description** kapısı: mock mağaza veya manuel girdi → **Deci.Scoring** ile `PASS` / `REVIEW` / `REJECT`. Hedef inference: Docker **MLC-LLM (Gemma)**. Raw LLM monitoring + efficiency KPI.

| | |
| --- | --- |
| **Frontend** (`frontend/`) | Next.js 16 SPA → **Vercel** |
| **Backend** (`backend/`) | Go (MasterFabric-style) + Postgres → **Render** |
| **Plan** | [`docs/MASTER-PLAN.md`](./docs/MASTER-PLAN.md) |
| **Live app** | _pending Vercel deploy_ |
| **Live API** | _pending Render deploy_ |

> Assignment base case: **Raw LLM Monitoring and Deci.Scoring**  
> Spec: [project gist](https://gist.github.com/gurkanfikretgunak/31d3b76fb2392f7a0e2e1c29420c8987)

## Repository layout

```
listing-claim-gate/
├── docs/              # MASTER-PLAN, PRODUCT, INFRA, …
├── .cursor/rules/     # agent conventions
├── render.yaml        # Render Blueprint
├── backend/           # Go API — auth, runs, Deci.Scoring, listings
└── frontend/          # Next.js SPA — Auth, Gate, Monitoring
```

See: [backend/README.md](./backend/README.md) · [frontend/README.md](./frontend/README.md) · [docs/MASTER-PLAN.md](./docs/MASTER-PLAN.md)

## Quick start (local)

```bash
# 1. Backend (Postgres running; DB auto-migrates on boot)
cd backend && cp .env.example .env && go run ./cmd/server   # :8080

# 2. Frontend
cd ../frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm install && npm run dev                                     # :3000
```

## Modes (Gate)

| Mode | Behavior |
| --- | --- |
| **Mock** | API returns mock marketplace products → analyze |
| **Manual** | User enters title + description → same analyze pipeline |

## Endpoint budget (≥20)

Config[2] + Common[2] + Auth[9] + WEB MLC-LLM / listings — see backend README.

## Deployment

- **Backend → Render:** [`render.yaml`](./render.yaml) (`rootDir: backend`) + Postgres  
- **Frontend → Vercel:** Root Directory `frontend`, `NEXT_PUBLIC_API_URL`  
- MCP: **Render** + **Vercel** + **MF Academy**

## License

No license specified yet.
