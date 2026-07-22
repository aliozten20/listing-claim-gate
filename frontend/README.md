# frontend — Listing & Claim Gate (SPA)

Next.js SPA for the MasterFabric capstone: **marketplace listing** title/description
→ Deci.Scoring → **PASS / REVIEW / REJECT**.

- **Live app:** _pending Vercel deploy_
- **Live API:** _pending Render deploy_
- **Stack:** Next.js · React · Tailwind

## Master views

| View | Role |
| --- | --- |
| **Auth** | Login · Register (Academy requirement) |
| **Listing Gate** | Mock shop catalog or manual paste → analyze |
| **Decisions** | Score history / publish outcomes |

No browser WebLLM playground in the product shell.

```
src/
  app/            layout, providers, single page → AppShell
  components/     AppShell + views/ + ui/
  lib/            api.ts, types.ts
  store/          auth.tsx
```

## Local development

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev          # → http://localhost:3000
```

API + DB: from repo root `docker compose up --build -d`
