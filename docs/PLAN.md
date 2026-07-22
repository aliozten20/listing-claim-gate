# Project Plan — Listing & Claim Gate

> **Tek kaynak:** [MASTER-PLAN.md](./MASTER-PLAN.md) (ürün, tasarım, Docker, mock/manuel, model atama)

MasterFabric Academy capstone · e-ticaret (Pazaryeri / D2C)  
Base case: **Raw LLM Monitoring + Deci.Scoring**  
Spec: https://gist.github.com/gurkanfikretgunak/31d3b76fb2392f7a0e2e1c29420c8987

## Product one-liner

**Listing & Claim Gate** — Mock mağaza veya manuel title/desc → Deci.Scoring ile `PASS`/`REVIEW`/`REJECT`. Hedef inference: Docker MLC (Gemma). Sonra Telegram + MCP + gerçek pazaryerleri.

Detay: [PRODUCT.md](./PRODUCT.md) · [INFRA.md](./INFRA.md) · [ILLUSTRATIONS.md](./ILLUSTRATIONS.md) · [THURSDAY-DEMO.md](./THURSDAY-DEMO.md) · [MARKETPLACE-MCP.md](./MARKETPLACE-MCP.md)


## Target architecture (revised)

```
                    ┌─────────────────────────────┐
  Next.js (Vercel)  │  Gateway / Load Balancer    │
  Telegram / MCP ──►│  concurrency = 20           │
                    │  21st → 503 / queue (killer) │
                    └───────────┬─────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                                   ▼
     ┌────────────────┐                  ┌────────────────┐
     │ backend (Go)   │◄──metrics/logs──►│ Grafana        │
     │ Deci.Scoring   │                  │ LLM KPIs       │
     │ run ledger     │                  └────────────────┘
     └───────┬────────┘
             │ OpenAI-compatible HTTP
             ▼
     ┌────────────────┐
     │ mlc-llm        │  ← ayrı container (Gemma)
     │ (GPU/CPU)      │
     └────────────────┘
             │
             ▼
        Postgres / Supabase
```

**İki ana iş container’ı:** `backend` ↔ `mlc-llm` (iletişim).  
**Gözlem:** Grafana (compose’ta 3. servis veya backend’in scrape ettiği metrics; sunumda “backend Grafana’ya loglar / KPI yayınlar”).

## Ödev checklist (hala geçerli)

| Gereksinim | Bu üründe |
|---|---|
| Next.js SPA ≥3 master views + Auth | Gate / Monitoring / Settings (+ Auth) |
| MLC + Gemma | **Docker MLC container** (capstone keyword: dokümante et; hibrit WebLLM opsiyonel) |
| Go ≥20 EP | Config[2]+Auth[8+]+LLM[6–8]+Cmn |
| Vercel + Render | FE Vercel, API(+containers) Render veya local compose |
| MCP | Render + Vercel + MF Academy (teslim) |
| Raw monitoring + Deci.Scoring | Her listing run log + yayın skoru |

## Delivery phases

1. Ürün + infra planı (bu docs) + illüstrasyon prompt seti  
2. `docker-compose`: `mlc-llm` + `backend` (+ Grafana/Prometheus)  
3. Gateway concurrency killer (max 20)  
4. Listing score API + Deci.Scoring publish decision  
5. Frontend SPA + Grafana dashboards  
6. MCP deploy + Perşembe ekip sunumu  

## Definition of done (Perşembe)

- [ ] Ürün hikâyesi net (sorun → orkestra → karar)  
- [ ] 2 container ayakta, birbirleriyle konuşuyor  
- [ ] Grafana’da LLM KPI’ları görünüyor  
- [ ] 21. eşzamanlı istek reject / queue (gateway killer)  
- [ ] Local performans sayıları ölçülmüş  
- [ ] Bulut ölçek (yatay büyüme) anlatılabiliyor  
- [ ] Bir kişi tüm ekip adına teyit sunumu yapıyor  
