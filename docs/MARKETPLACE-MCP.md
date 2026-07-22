# Marketplace Connectors + MCP

Listing & Claim Gate’in genişlemesi: mağazayı bağla → ürünleri çek → title/açıklama analizi → Deci.Scoring.

## Akış

```
MCP / UI / Telegram
        │
        ▼
   Go Gateway (auth, 20-slot killer)
        │
        ├─► Connector Hub
        │      ├─ TrendyolAdapter
        │      ├─ HepsiburadaAdapter
        │      ├─ TicimaxAdapter
        │      └─ IdeaSoftAdapter
        │              │
        │              ▼
        │      CanonicalProduct (tek model)
        │
        └─► MLC (Gemma) + Deci.Scoring
                 │
                 ▼
            ListingDecision (PASS|REVIEW|REJECT)
```

## Sorun: her platform modeli farklı

| Platform | Tipik alanlar (örnek) |
|---|---|
| Trendyol | `barcode`, `title`, `description`, `attributes[]`, `brandId`, `categoryId` |
| Hepsiburada | `merchantSku`, `productName`, `productDescription`, `baseAttributes` |
| Ticimax | ürün kartı + varyant; HTML açıklama sık |
| IdeaSoft | `name`, `content`/`detail`, SEO title/meta ayrı olabiliyor |

**Çözüm:** Adapter her API’yi **CanonicalProduct**’a map eder. Analiz motoru sadece canonical’ı görür.

## CanonicalProduct (tek sözleşme)

```json
{
  "external_id": "string",
  "platform": "trendyol|hepsiburada|ticimax|ideasoft",
  "shop_id": "string",
  "sku": "string",
  "title": "string",
  "description_text": "string",
  "description_html": "string|null",
  "brand": "string|null",
  "category_path": ["string"],
  "attributes": [{ "key": "string", "value": "string" }],
  "claims_hint": ["string"],
  "locale": "tr-TR",
  "currency": "TRY",
  "raw_ref": { "platform_payload_id": "..." },
  "synced_at": "ISO-8601"
}
```

- `description_text`: HTML strip edilmiş düz metin (MLC’ye giden)  
- `raw_ref`: orijinal payload’a geri dönüş (debug / re-sync)  
- Analiz **asla** platform-specific struct’a bağlanmaz  

## Adapter arayüzü (Go)

```go
type MarketplaceAdapter interface {
    Name() string
    Auth(ctx context.Context, creds ShopCredentials) error
    ListProducts(ctx context.Context, page Page) (ProductPage, error)
    GetProduct(ctx context.Context, externalID string) (CanonicalProduct, error)
    // opsiyonel sonraki faz:
    // UpdateListing(ctx, id, patch) error
}
```

Her platform: `MapToCanonical(raw) (CanonicalProduct, error)`.

## MCP tools (ürün MCP’si)

Teslim MCP’leri (Render/Vercel/Academy) ayrı. Bu **ürün MCP**:

| Tool | Ne yapar |
|---|---|
| `shop.connect` | platform + credentials kaydet (şifreli) |
| `shop.sync_products` | sayfalı çek → canonical store |
| `listing.score` | tek ürün (id veya serbest metin) → Deci.Scoring |
| `listing.score_batch` | mağaza / kategori filtresi ile batch (slot limit 20!) |
| `listing.get_decision` | son PASS/REVIEW/REJECT + rationale |

Agent örneği: *“Trendyol mağazamdaki son 50 ürünü skorla, REVIEW olanları listele.”*

## Veri modeli (backend)

- `shops` — platform, credentials (encrypted), status  
- `products` — CanonicalProduct satırları + `platform` + `external_id` unique  
- `llm_runs` — mevcut raw monitoring  
- `listing_decisions` — product_id, grade, decision, score breakdown  

## Dikkat (gerçek dünya)

| Konu | Not |
|---|---|
| Resmi API | Trendyol Partner, HB Merchant, Ticimax/IdeaSoft REST — API key / OAuth |
| Rate limit | Sync kuyruk + backoff; 20 inference slot ile batch’i parçala |
| HTML | Ticimax/IdeaSoft açıklama HTML → sanitize + text extract |
| Yetki | Shop credentials kullanıcıya özel; MCP token = kullanıcı JWT |
| Yazma | İlk faz **read-only sync + score**; update listing sonra |

## Fazlar

1. Canonical + 1 adapter (ör. Trendyol **veya** IdeaSoft — hangisinin sandbox’ı kolaysa)  
2. Sync + Gate UI’da “mağazadan seç”  
3. MCP tools  
4. Diğer marketplace’ler  
5. (Opsiyonel) skor sonrası title/description rewrite önerisi  

## Capstone sınırı

Perşembe demosu için: **1 mock adapter + canonical + score** yeterli olabilir.  
Canlı Trendyol/HB anahtarları demo riski yüksekse `MockMarketplaceAdapter` ile 20 sahte ürün.
