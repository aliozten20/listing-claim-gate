# run-local-stack

Start Listing & Claim Gate locally:

1. `docker compose up --build -d` (Postgres + backend on :8080)
2. `cd frontend && npm install && npm run dev` (:3000)
3. Open http://localhost:3000 — register — Gate → Mock or Manual analyze

If register fails with network error, backend is down; check `docker compose logs backend`.
