# Master Plan — Listing & Claim Gate

Tüm konuşmanın tek kaynak planı. Uygulama bu dokümana göre fazlanır.  
Son güncelleme: 2026-07-22

---

## 0) Tek cümle

**Pazaryeri/D2C satıcısı listing title+açıklamasını (mock mağazadan veya elle) gönderir → backend Deci.Scoring yayın kararı verir (`PASS`/`REVIEW`/`REJECT`) → raw run loglanır → Grafana KPI. Inference hedefi: Docker MLC (Gemma). Gerçek Trendyol/HB yokken Mock API + Manuel form.**

---

## 1) Ürün kapsamı (şimdi / sonra)

### Şimdi (capstone + Perşembe)

| Mod | Davranış |
|---|---|
| **Mock** | Backend mock “Trendyol-like” API → ürün listesi çekilir → seçilen ürün analyze |
| **Manuel** | Kullanıcı title + description yazar → aynı analyze pipeline |
| **Monitoring** | Run history, score, efficiency, karar |
| **Auth** | MF Go auth (register/login/refresh/…) |

### Sonra (büyüme)

- Gerçek Trendyol / HB / Ticimax / IdeaSoft adapter’ları  
- Telegram bot + ürün MCP (`score_listing`)  
- Grafana full dashboards + gateway 20-slot killer (infra’da planlı)  
- Docker MLC container (Gemma serve)

### Değil (şimdi)

- Herhangi bir markanın public kataloğunu çekmek (Trendyol sadece kendi seller key)  
- Assembly ile hız “hack”i  
- WebLLM zorunlu yolu (ödev keyword riski → mentora sor; odak backend MLC)

---

## 2) Mimari (MasterFabric + Docker)

```
┌─────────────────────────────────────────────────────────┐
│  frontend/  Next.js SPA (Vercel)                        │
│  Auth | Gate (Mock|Manual) | Monitoring                 │
└──────────────────────────┬──────────────────────────────┘
                           │ JWT
┌──────────────────────────▼──────────────────────────────┐
│  backend/  MF Go (Render / compose)                     │
│  Config · Auth · Common · LLM runs · Listings           │
│  Deci.Scoring · /metrics → Grafana                      │
│  Gateway semaphore (max 20)                             │
└──────────────┬─────────────────────┬────────────────────┘
               │                     │
               ▼                     ▼
     ┌─────────────────┐    ┌─────────────────┐
     │ mlc-llm         │    │ postgres        │
     │ (Gemma serve)   │    │ or Supabase     │
     └─────────────────┘    └─────────────────┘
               │
               ▼
     ┌─────────────────┐
     │ grafana         │  LLM KPI panelleri
     └─────────────────┘
```

**Kural:** `backend/` = MF Go iskeleti (mevcut `internal/{config,common,auth,llm}`) + **listings** eklentisi.  
**İki iş container’ı:** `backend` ↔ `mlc-llm`. Grafana gözlem.

Detay: [INFRA.md](./INFRA.md) · [PRODUCT.md](./PRODUCT.md) · [MARKETPLACE-MCP.md](./MARKETPLACE-MCP.md)

---

## 3) Backend endpoint planı (≥20 korunur)

Mevcut 21 EP aynen kalır. **Listings eklentisi** (LLM grubuna sayılır / ayrı mount):

| Method | Path | Auth | Açıklama |
|---|---|:---:|---|
| GET | `/llm/listings/mock/products` | ✓ | Mock mağaza ürünleri (canonical) |
| GET | `/llm/listings/mock/products/{id}` | ✓ | Tek mock ürün |
| POST | `/llm/listings/analyze` | ✓ | Manual veya mock id → karar + score + run log |

Analyze body:

```json
{
  "source": "manual" | "mock",
  "product_id": "optional-if-mock",
  "title": "...",
  "description": "...",
  "platform": "mock-trendyol"
}
```

Response: canonical echo + `decision` + `score` + `run_id` + `efficiency_analysis` + flags/insights.

**Şimdilik MLC yoksa:** rule-based listing analyzer + mevcut Deci.Scoring (run kaydı `model: listing-rules-v1`).  
**MLC gelince:** aynı endpoint, response’u Gemma üretir, skor aynı motor.

---

## 4) Frontend — tasarım netliği

### Tasarım sistemi

| Karar | Seçim |
|---|---|
| Stack | Next.js 16 + Tailwind v4 + **shadcn/ui** (Radix) |
| Referans rules | [shadcn/ui SKILL](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md) — compose, semantic tokens, `gap-*`, responsive |
| Görsel dil | Instrument panel / gate — slate canvas, tek accent `#4F8CFF` (mevcut CSS tokens) |
| İllüstrasyon | [ILLUSTRATIONS.md](./ILLUSTRATIONS.md) master prompt — küçük spot, aynı palet |
| Responsive | Mobile-first: Gate tek kolon; `md:` split; nav sheet/hamburger `<md` |

### Master views

| View | Mobil | Desktop |
|---|---|---|
| Auth | tek kart | 2 kolon brand + form |
| **Gate** | Tabs: Mock \| Manual → sonuç altta | Sol girdi / sağ sonuç |
| Monitoring | metrik grid 2col → liste | 6 metrik + split list/detail |
| Settings (opsiyon) | stack | 2 kolon |

### Gate UX (kritik)

1. Segmented control: **Mock mağaza** | **Manuel**  
2. Mock: “Ürünleri çek” → liste → seç → **Analiz et**  
3. Manuel: Title + Description (+ opsiyonel keywords) → **Analiz et**  
4. Sonuç: `PASS|REVIEW|REJECT` badge + Deci.Scoring + EfficiencyPanel + insights  
5. Empty state: `ill-gate` spot (küçük)

### shadcn / Cursor rule (eklenecek)

`.cursor/rules/frontend-design.mdc`:
- shadcn compose-first  
- semantic colors, no purple AI-slop  
- responsive breakpoints zorunlu  
- illüstrasyonlar `public/illustrations/`, max ~120KB  

Kullanıcı frontend kuralı (zaten var): brand-first landing değil; bu bir **app shell** — dashboard kuralları geçerli, hero yok.

---

## 5) Docker planı

```yaml
# hedef compose servisleri
services:
  mlc-llm:     # Gemma OpenAI-compatible
  backend:     # MF Go
  postgres:
  grafana:     # scrape backend /metrics
```

Faz A (şimdi): `backend` + `postgres` (+ isteğe bağlı grafana stub).  
Faz B: `mlc-llm` + analyze’ı MLC’ye bağla.  
Faz C: gateway killer + Grafana panelleri.

---

## 6) MCP planı

| MCP | Ne zaman |
|---|---|
| Render + Vercel + MF Academy | Live deploy / teslim |
| Ürün MCP `score_listing` | Mock/manual stabilize olduktan sonra |

---

## 7) İş → model atama (kim neyi yapar)

Cursor’da paralel / ayrı agent çalıştırırken:

| İş paketi | En uygun model tipi | Neden | Çıktı |
|---|---|---|---|
| **Ürün + domain orkestra + endpoint sözleşmesi** | Claude Opus (yüksek reasoning) | Mimari trade-off, B2B netlik | Bu planın kilidi, OpenAPI taslağı |
| **MF Go backend + listings + scoring + tests** | Claude Opus veya Sonnet (kod usta) | Layered Go, chi, pgx, test | `backend/internal/llm/listing*` |
| **Docker / compose / Grafana / concurrency killer** | Claude Sonnet veya GPT (infra net) | Compose, metrics, semaphore | `docker-compose.yml`, `/metrics` |
| **UI / responsive / shadcn Gate** | Claude Opus veya Composer + **görsel kontrol** | Layout + a11y; görsel için screenshot | `GateView`, tokens |
| **İllüstrasyon üretimi** | Image model (GenerateImage / dış generator) | Aynı master prompt | `public/illustrations/*.png` |
| **Deci.Scoring / efficiency matematik** | Claude Sonnet + unit test | Saf fonksiyon, hızlı iterasyon | `listing_score.go` tests |
| **Perşembe sunum metni** | Claude Opus veya Sonnet | Net anlatım | [THURSDAY-DEMO.md](./THURSDAY-DEMO.md) güncelle |
| **Hızlı FE polish / bugfix** | Composer 2.5 fast | Dar diff | CSS/TSX fix |

**Bu sohbette varsayılan yürütücü:** tek agent (Auto) — ama işleri yukarıdaki sırayla **paket paket** aç; tasarımı koddan önce kilitle.

Önerilen yürütme sırası:

```
1. Opus/plan: sözleşme + tasarım tokens (bu doküman)     ← DONE skeleton
2. Backend model: mock products + analyze + tests
3. FE design model: Gate Mock|Manual responsive + shadcn
4. Infra model: compose backend/postgres (+ grafana stub)
5. Image: 4–5 spot illüstrasyon
6. Opus: Perşembe demo checklist doğrula
```

---

## 8) Fazlar ve DoD

### Faz 1 — Sözleşme + UI iskelet (1–2 gün)
- [ ] CanonicalProduct + analyze response JSON freeze  
- [ ] `.cursor/rules/frontend-design.mdc`  
- [ ] Gate view Mock|Manual (henüz fake data OK)

### Faz 2 — Backend listings
- [ ] Mock catalog (8–12 ürün, iyi/kötü/iddialı karışık)  
- [ ] `POST /llm/listings/analyze` → run + score + decision  
- [ ] Go tests  

### Faz 3 — FE bağla + responsive
- [ ] Gerçek API  
- [ ] ScoreCard + Efficiency + decision badge  
- [ ] md/lg layout QA  

### Faz 4 — Docker
- [ ] compose: backend + postgres  
- [ ] README local up  

### Faz 5 — MLC + Grafana + killer (Perşembe+)
- [ ] mlc-llm service  
- [ ] /metrics + 1 Grafana dashboard  
- [ ] max 20 semaphore  

### Perşembe DoD
- [ ] Mock çek → analiz demo  
- [ ] Manuel title/desc → analiz demo  
- [ ] Monitoring’de run görünür  
- [ ] Mimari cümleler hazır (INFRA + THURSDAY-DEMO)

---

## 9) Riskler

| Risk | Mitigasyon |
|---|---|
| Ödev “web mlc-llm” | Mentora sor; README’de Docker MLC + gerekirse WebLLM fallback |
| MLC GPU yok | Analyze önce rules; MLC opsiyonel |
| Tasarım dağılması | shadcn skill + ILLUSTRATIONS master prompt |
| Scope creep (4 marketplace) | Sadece mock + manual |

---

## 10) Doküman haritası

| Dosya | Rol |
|---|---|
| [MASTER-PLAN.md](./MASTER-PLAN.md) | Bu dosya — tek kaynak |
| [PRODUCT.md](./PRODUCT.md) | Ürün brief |
| [INFRA.md](./INFRA.md) | Docker / MLC / Grafana / 20-slot |
| [MARKETPLACE-MCP.md](./MARKETPLACE-MCP.md) | Gerçek mağaza + MCP (sonra) |
| [ILLUSTRATIONS.md](./ILLUSTRATIONS.md) | İllüstrasyon prompt seti |
| [THURSDAY-DEMO.md](./THURSDAY-DEMO.md) | Sunum |

---

## 11) Onay soruları (uygulamaya geçmeden)

1. Gate varsayılan sekme: **Mock** mi **Manuel** mi?  
2. Analyze şimdi **sadece rules** mi, yoksa MLC gelmeden UI’da “model: rules” açık mı yazılsın?  
3. shadcn’i mevcut custom CSS’in üstüne mi ekleyelim, yoksa mevcut card/btn token’larıyla mı devam?  

Onay → Faz 2 backend + Faz 3 Gate koduna geçilir.
