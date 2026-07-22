# Honest ops status — Listing & Claim Gate

## Docker

**Yes.** `docker compose up --build -d` → Postgres + API.  
**Full profile:** `docker compose --profile full up --build -d` → + MLC stub + Prometheus + Grafana.  
See [DOCKER.md](./DOCKER.md).

## Supabase

**Yes (production DB).** Auth stays on Go. Wire `DATABASE_URL` from Supabase — [SUPABASE.md](./SUPABASE.md).

## Grafana / MLC

| Piece | Local | Production |
|---|---|---|
| Grafana | `:3001` with `--profile full` | Optional / self-host |
| MLC stub | `:8000` with `--profile full` | Set `MLC_BASE_URL` if you host real MLC |
| Prometheus | scrapes API `/metrics` | API still exposes `/metrics` |

## Prompts

Seeded in `system_prompts` / `app_settings` (`003_settings.sql`). Gate analyze uses **commerce rules engine** (`listing-rules-v1`) + Deci commerce dimensions. Runtime DB prompt CRUD still a follow-up.

## i18n

EN default, TR via header / auth language toggle.

## Endpoints

≥20 (Config/docs/health + Auth + LLM/Gate + `/metrics`).

## MCP

Deploy automation via Render/Vercel MCP is optional; manual deploy steps in [DEPLOY.md](./DEPLOY.md).
