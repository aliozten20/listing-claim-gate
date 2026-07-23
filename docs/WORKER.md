# Local worker edge — MLC stays on your machine; Render reaches it via tunnel.
#
# Why this exists
# ---------------
# Mentors want microservices-style access from Render to student machines:
#   Browser → Render API → /v1/mlc/* reverse-proxy → Cloudflare tunnel → Caddy → MLC
# MLC never faces the public internet directly; network flow is always via Render.
#
# Topology
# --------
#   mlc          OpenAI-compatible stub (or real MLC) on :8000
#   mlc-proxy    Caddy reverse-proxy on :8088 → mlc:8000
#   tunnel       cloudflared named tunnel → http://mlc-proxy:8088
#
# Quick start
# -----------
# 1. Create a Cloudflare Zero Trust tunnel (named) whose public hostname
#    routes to http://mlc-proxy:8088 (service in the compose network).
# 2. Copy infra/worker/.env.example → infra/worker/.env and set TUNNEL_TOKEN.
# 3. Start worker stack:
#
#      docker compose --profile worker up -d --build
#
# 4. On Render → listing-claim-gate-api → Environment:
#
#      MLC_BASE_URL=https://<your-tunnel-hostname>
#
# 5. Smoke (with a logged-in access token):
#
#      curl -H "Authorization: Bearer $TOKEN" \
#        https://listing-claim-gate-api.onrender.com/v1/mlc/v1/models
#
#      curl https://listing-claim-gate-api.onrender.com/ready
#      # expect mlc_configured=true, mlc_attached=true when tunnel is up
#
# Fallback without a named tunnel (ephemeral demo only)
# -----------------------------------------------------
# You can run a quick tunnel manually:
#
#   docker run --rm --network llm-monitoring_default cloudflare/cloudflared:latest \
#     tunnel --url http://mlc-proxy:8088
#
# Copy the https://*.trycloudflare.com URL into Render MLC_BASE_URL.
# Note: quick tunnels change URL on every restart — named tunnels are preferred.
#
# Local backend without Render
# ----------------------------
# For local API + local worker:
#
#   MLC_BASE_URL=http://mlc-proxy:8088   # from compose network
#   # or from host: http://127.0.0.1:8088
#
# Core API stack remains:
#   docker compose up -d
# Full observability:
#   docker compose --profile full up -d
# Worker edge:
#   docker compose --profile worker up -d
