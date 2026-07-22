# Deploy to production

Stack: **Vercel (frontend)** + **Render (Go API)** + **Postgres**  
(First bootstrap uses **Render free Postgres**; swap `DATABASE_URL` to **Supabase** later.)

## One-click links (do these in order)

1. **Render API + DB (Blueprint)**  
   https://dashboard.render.com/blueprint/new?repo=https://github.com/aliozten20/listing-claim-gate  
   - Sign in with GitHub → Apply → wait until service is Live  
   - Copy the API URL (e.g. `https://listing-claim-gate-api.onrender.com`)

2. **Vercel frontend**  
   - CLI: `cd frontend && vercel --prod` (after `vercel login`)  
   - Or dashboard: https://vercel.com/new — import `aliozten20/listing-claim-gate`, **Root Directory = `frontend`**  
   - Env: `NEXT_PUBLIC_API_URL` = Render API URL (no trailing slash)

3. **CORS**  
   Render → Environment → `CORS_ORIGINS` = exact Vercel origin → Save (redeploy)

4. **Smoke**  
   `curl https://YOUR-API.onrender.com/health`

## Later: Supabase

Replace Render `DATABASE_URL` with Supabase URI — see [SUPABASE.md](./SUPABASE.md). Auth stays on Go.

## Checklist (manual)

1. Blueprint Apply (Render)  
2. Note API URL  
3. Vercel deploy + `NEXT_PUBLIC_API_URL`  
4. Set `CORS_ORIGINS`  
5. Register + Gate analyze in the live app

## Local full stack (demo Grafana / MLC)

```bash
docker compose --profile full up --build -d
# API :8080 · Grafana :3002 (admin/listing) · MLC stub :8000 · Prometheus :9090
cd frontend && npm run dev
```

See [DOCKER.md](./DOCKER.md).
