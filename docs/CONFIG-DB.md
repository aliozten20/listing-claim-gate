# Config in database (prompts · model · secrets)

Prompts and model/API configuration should **not** live only in Go/TS source.

## Tables (migration `003_settings.sql`)

| Table | Purpose |
|---|---|
| `system_prompts` | Gate system prompts by `slug` (versioned, activatable) |
| `app_settings` | JSON config: `llm.model`, `llm.endpoints`, `gate.thresholds` |
| `app_secrets` | Encrypted blobs (API keys, MLC tokens) — never public JSON |

## Runtime flow (target)

```
Analyze request
  → load active system_prompts.slug = listing-gate-v1
  → load app_settings llm.model + llm.endpoints
  → if MLC: call base_url with model_id (secret from app_secrets if needed)
  → Deci.Scoring + decision thresholds from app_settings
```

## Env still required

| Env | Why |
|---|---|
| `DATABASE_URL` | DB connection (local compose or **Supabase Postgres** URL) |
| `JWT_SECRET` | Auth signing |
| `APP_SECRETS_KEY` | AES key to encrypt `app_secrets` rows (not the vendor API keys themselves) |

## Supabase

Optional: use Supabase **only as managed Postgres** (`DATABASE_URL=postgresql://...supabase...`).  
Do **not** move Auth to Supabase Auth — capstone Auth[8+] stays on Go.

## Status

- Schema seeded in migration 003 ✅  
- Admin CRUD API + encrypt helper: next implementation slice  
- Analyze currently uses `listing-rules-v1` engine; will read prompt from DB when MLC path lands  
