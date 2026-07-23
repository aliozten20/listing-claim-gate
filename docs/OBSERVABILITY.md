# Observability — local + production

## Local (`docker compose --profile full`)

| Service | URL |
| --- | --- |
| Grafana | http://localhost:3002 (admin / listing) |
| Prometheus | http://localhost:9090 |
| API metrics | http://localhost:8080/metrics |

Prometheus scrapes **both**:

- `listing-gate-api-local` → Docker `backend:8080`
- `listing-gate-api-prod` → `https://listing-claim-gate-api.onrender.com/metrics`

In Grafana → **Listing Gate KPIs**, use the **Environment / job** dropdown to filter local vs prod.

## Production (Render)

Blueprint (`render.yaml`) also deploys:

- `listing-claim-gate-prometheus` — scrapes the live API `/metrics`
- `listing-claim-gate-grafana` — dashboards (anonymous Viewer; admin password generated)

After deploy, open the Grafana service URL from the Render dashboard.  
Set `GF_SERVER_ROOT_URL` to that HTTPS origin if login redirects look wrong.

Raw metrics (no Grafana): https://listing-claim-gate-api.onrender.com/metrics
