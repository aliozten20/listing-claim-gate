# Listing & Claim Gate — Ürün Brief

## Sorun

Pazaryeri ve D2C satıcıları ürün başlığı, açıklama ve iddiaları (`%100 pamuk`, `organik`, `yerli üretim`, `24 saatte kargo`) dağınık kanallarda yazar. Sonuç:

- Yanlış / eksik attribute → filtrede kayıp satış  
- Abartılı iddia → iade, ceza, marka riski  
- Destek botu veya junior operatör tutarsız “yayınla / düzelt” kararı verir  
- Kararın **neden** verildiği audit edilemez  

Eksik olan chatbot değil; **yayın kapısı (gate)**.

## Çözüm

1. Satıcı veya operatör listing metnini (ve isteğe bağlı expected keywords / zorunlu alanları) gönderir.  
2. **MLC-LLM (Gemma)** container’ı yapılandırılmış JSON üretir: iddialar, eksik alanlar, risk bayrakları, önerilen düzeltme.  
3. Go backend **raw run**’ı kaydeder (prompt, response, latency, tokens).  
4. **Deci.Scoring** güven skoru üretir + publish kararı:
   - `PASS` — yayına uygun  
   - `REVIEW` — insan kuyruğu  
   - `REJECT` — kritik iddia / boş / refusal  
5. Monitoring’de KPI + Grafana’da sistem telemetrisi.  
6. Aynı API → Telegram bot + MCP `score_listing`.
7. **Mağaza bağlama (sonraki faz):** Trendyol / HB / Ticimax / IdeaSoft → ürünleri çek → canonical model → aynı analiz.  
   Detay: [MARKETPLACE-MCP.md](./MARKETPLACE-MCP.md)

## Kullanıcılar (B2B)

| Rol | Ne yapar |
|---|---|
| Satıcı / merchandiser | Listing gönderir, skoru görür |
| Kalite / compliance | REVIEW kuyruğunu çözer |
| Ops lead | Grafana + dashboard KPI |
| Agent / bot | MCP veya Telegram ile aynı gate |

## Master views (SPA)

| View | İçerik |
|---|---|
| **Auth** | Login / Register |
| **Gate (Playground)** | Listing yapıştır → çalıştır → karar + efficiency |
| **Monitoring** | Run history, grade, publish decision, model KPI |
| **Settings** (sub) | Eşikler, system prompt şablonları, oturumlar |

## Deci.Scoring → yayın kararı

Skor boyutları (mevcut motor + domain kuralları):

| Boyut | Listing bağlamı |
|---|---|
| completion | JSON/cevap üretildi mi, refusal mı? |
| latency | Gate SLA içinde mi? |
| efficiency | Token verimi |
| keywords | Zorunlu attribute / yasaklı iddia kapsamı |
| length | Açıklama aşırı kısa/uzun mu? |

Eşik örneği: `score ≥ 80` ve kritik bayrak yok → `PASS`; `60–79` → `REVIEW`; aksi → `REJECT`.

## Sonraki faz ( Persembe sonrası )

- Telegram: `/score` + ürün metni  
- MCP tool: `score_listing({ title, body, claims[] })`  
- Chrome extension: pazaryeri formunda yan panel  

## Değil

- Tam PIM / stok / ödeme sistemi değil  
- Görsel kusur tespiti (CV) değil — metin + iddia orkestrası  
