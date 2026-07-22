# Supabase (production Postgres)

Auth stays on **Go** (Academy Auth endpoints). Supabase is used as **managed Postgres only**.

## 1. Create a project

1. Open [https://supabase.com](https://supabase.com) → New project  
2. Pick a region close to Render  
3. Save the database password  

## 2. Connection string

**Project Settings → Database → Connection string → URI**

Prefer the **Transaction** pooler (port `6543`) for Render free/shared, or Direct (`5432`) for simplicity.

Example:

```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Set as Render env `DATABASE_URL` (and local `.env` if testing against cloud).

Add `?sslmode=require` if not already present.

## 3. Schema

The API **auto-migrates on boot** (embedded `001`–`003` SQL).  
You do **not** need to paste SQL manually unless you want to inspect tables first.

Optional manual apply: SQL Editor → run files in order from `backend/migrations/`:

1. `001_init.sql`  
2. `002_indexes.sql`  
3. `003_settings.sql`  

`CREATE EXTENSION pgcrypto` is allowed on Supabase.

## 4. Verify

After Render deploy:

```bash
curl https://YOUR-API.onrender.com/ready
# {"status":"ready","mlc_configured":false}
```

Register a user from the Vercel app — row appears in Supabase **Table Editor → users**.

## 5. What we do NOT use (yet)

| Supabase feature | Status |
|---|---|
| Supabase Auth | Not used — Go JWT auth |
| Storage | Not used |
| Edge Functions | Not used |
| Realtime | Not used |

## Local vs prod

| Env | Database |
|---|---|
| Local Docker | Compose `postgres` service |
| Production | Supabase `DATABASE_URL` |
