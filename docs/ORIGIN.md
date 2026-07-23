# Origin — MasterFabric Go backend base

## Base template

This product backend is built on the Academy template:

- Upstream: https://github.com/mervegundogdu/masterfabric-go-backend
- Working fork: https://github.com/aliozten20/masterfabric-go-backend

Layout follows that clean architecture:

`cmd/server` · `internal/domain` · `internal/application` · `internal/infrastructure` · `internal/shared`

Go module (this monorepo): `github.com/aliozten20/listing-claim-gate/backend`

See also [`backend/PLATFORM.md`](../backend/PLATFORM.md).

## What we added on top

- Listing & Claim Gate domain (mock shop, analyze, Deci.Scoring commerce dims)
- FE-compatible routes: `/auth`, `/llm`, `/health`, `/metrics`, `/config`, `/ready`
- Authenticated MLC edge: ` /v1/mlc/*` reverse-proxy → local worker tunnel (`MLC_BASE_URL`)
- Redis/Kafka from the template are **optional** on Render free (reported as `skipped` in `/ready`)

## Worker / MLC edge

MLC stays on the student machine. Network flow is always via Render — see [WORKER.md](./WORKER.md).
