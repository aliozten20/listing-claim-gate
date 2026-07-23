# Origin — how this repo relates to MasterFabric Go

## Did we fork `masterfabric-go`?

**No.** This backend is **not** a fork of
[gurkanfikretgunak/masterfabric-go](https://github.com/gurkanfikretgunak/masterfabric-go).

| Check | This project |
| --- | --- |
| GitHub remote | `https://github.com/aliozten20/listing-claim-gate` |
| Go module | `github.com/aliozten/llm-monitoring/backend` |
| Fork of masterfabric-go | ❌ |
| Git submodule / vendor copy of that repo | ❌ |

## What we did use from the Academy orbit

- **Capstone product brief / gist** from MasterFabric Academy (see [PLAN.md](./PLAN.md)).
- **Architectural habits** common in Academy Go backends: chi router, JWT auth + refresh sessions, Postgres, layered `cmd/` + `internal/`, health/config endpoints — **reimplemented** for Listing & Claim Gate.
- **Not** a line-by-line port of multi-tenant RBAC SaaS platform code from `masterfabric-go`.

Product surface (Gate / Deci.Scoring / mock shop) and the commerce UI are original to this repo.

## How to describe it to mentors

> Greenfield Go + Next.js app for the Academy Listing & Claim Gate brief. Inspired by MasterFabric Go service layout conventions; **not** a fork of `masterfabric-go`.
