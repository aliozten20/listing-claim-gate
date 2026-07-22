-- 003_settings.sql — system prompts, model config, encrypted secrets (org-level)
-- Applied automatically on server start (idempotent).

CREATE TABLE IF NOT EXISTS system_prompts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL,
    locale      TEXT NOT NULL DEFAULT 'tr-TR',
    active      BOOLEAN NOT NULL DEFAULT true,
    version     INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Secrets never returned in plaintext via public APIs.
-- value_enc is application-encrypted (AES-GCM) with APP_SECRETS_KEY.
CREATE TABLE IF NOT EXISTS app_secrets (
    key         TEXT PRIMARY KEY,
    value_enc   BYTEA NOT NULL,
    hint        TEXT NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO system_prompts (slug, title, body, locale)
VALUES (
  'listing-gate-v1',
  'Listing & Claim Gate',
  $prompt$You are Listing & Claim Gate for marketplace / D2C product copy.
Analyze the title and description. Return structured risk flags for unproven claims
(organic, 100%, cheapest, guaranteed), missing attributes, and publish readiness.
Be concise. Do not invent certifications.$prompt$,
  'en'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO app_settings (key, value, description)
VALUES (
  'llm.model',
  '{"provider":"mlc","model_id":"gemma-2-2b-it-q4f16_1-MLC","engine":"listing-rules-v1","temperature":0.2}'::jsonb,
  'Active inference model for Gate (MLC container id when wired)'
),
(
  'llm.endpoints',
  '{"mlc_base_url":"http://mlc-llm:8000","timeout_ms":60000}'::jsonb,
  'Upstream MLC / OpenAI-compatible base URL'
),
(
  'gate.thresholds',
  '{"pass_min":80,"reject_below":55}'::jsonb,
  'Deci.Scoring → PASS / REVIEW / REJECT cutoffs'
)
ON CONFLICT (key) DO NOTHING;
