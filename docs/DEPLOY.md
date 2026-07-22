# Deploy to production

Stack: **Vercel (frontend)** + **Render (Go API)** + **Supabase (Postgres)**.

## Checklist

1. Create Supabase project → copy `DATABASE_URL` ([SUPABASE.md](./SUPABASE.md))
2. Deploy API on Render (Blueprint [`render.yaml`](../render.yaml) or manual)
3. Set Render env: `DATABASE_URL`, `CORS_ORIGINS` (after step 5), `JWT_SECRET` (auto)
4. Deploy frontend on Vercel (`frontend/` root, `NEXT_PUBLIC_API_URL`)
5. Set Render `CORS_ORIGINS` to exact Vercel origin (no trailing slash)
6. Smoke: register → Gate analyze → Decisions

## 1. Supabase

See [SUPABASE.md](./SUPABASE.md). Migrations run automatically when the API boots.

## 2. Render (API)

- Connect GitHub repo `aliozten20/listing-claim-gate`
- Use Blueprint or create Web Service: root `backend`, build `go build -o app ./cmd/server`, start `./app`
- Health check: `/health`
- Env (required):
  - `DATABASE_URL` = Supabase URI (`sslmode=require`)
  - `APP_ENV=production`
  - `TRUST_PROXY=true`
  - `JWT_SECRET` = generate (≥32 bytes)
  - `CORS_ORIGINS` = `https://YOUR-APP.vercel.app` (set after Vercel)
  - `APP_NAME=Listing & Claim Gate`
  - `MAX_CONCURRENT_INFERENCES=20`
- Optional: `MLC_BASE_URL` if you host an OpenAI-compatible MLC endpoint

## 3. Vercel (frontend)

- Root Directory: `frontend`
- Framework: Next.js
- Env: `NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com` (no trailing slash)
- Deploy

## 4. Wire CORS

Render → Environment → `CORS_ORIGINS` = your Vercel URL → save/redeploy.

## 5. Verify

```bash
curl https://YOUR-API.onrender.com/health
curl https://YOUR-API.onrender.com/ready
curl https://YOUR-API.onrender.com/metrics | head
```

Open the Vercel URL → create account → analyze a listing → check Decisions.

## Local full stack (demo Grafana / MLC)

```bash
docker compose --profile full up --build -d
# API :8080 · Grafana :3001 (admin/listing) · MLC stub :8000 · Prometheus :9090
cd frontend && npm run dev
```

See [DOCKER.md](./DOCKER.md).
