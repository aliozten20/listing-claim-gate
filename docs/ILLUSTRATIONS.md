# Illustration Prompt Pack — Listing & Claim Gate

Amaç: UI’da **aynı dilde, az yer kaplayan** spot illüstrasyonlar (hero değil; ~320–480px genişlik, sade).

## Master style (her prompt’un başına yapıştır)

```
Flat vector product illustration, consistent design system, soft geometric shapes,
limited palette: deep slate #0B0F17, elevated blue-gray #121826, electric blue #4F8CFF,
mint #34D399, warm amber #FBBF24, coral #F87171, off-white #E7ECF3.
Clean lines, generous negative space, no text, no logos, no photorealism,
no 3D gloss, no purple gradients, no clutter, single focal metaphor,
centered composition, square or 4:3, small UI spot illustration, minimal detail.
```

## Prompt seti (aynı yapı: [style] + sahne + kısıt)

Hepsi şu kalıpta:

`{MASTER_STYLE} Scene: {SCENE}. Constraint: single object group, max 5 shapes, readable at 128px.`

| ID | Kullanım yeri | SCENE |
|---|---|---|
| `ill-gate` | Gate boş durum / hero spot | A small product tag passing through a glowing circular gate checkpoint |
| `ill-score` | Deci.Scoring kartı yanı | A simple gauge dial with three zones mint / amber / coral, needle at center |
| `ill-claim` | İddia / risk | A shield inspecting a tiny clothing label icon |
| `ill-monitor` | Monitoring | Minimal telemetry bars and a pulse line on a flat dashboard slab |
| `ill-docker` | Infra / about | Two rounded containers linked by a thin blue pipe |
| `ill-capacity` | 20-user killer | Twenty small dots in a ring, one red dot blocked outside the ring |
| `ill-bot` | Telegram / MCP gelecek | A chat bubble plugged into the same circular gate |
| `ill-cloud` | Bulut ölçek | Two container shapes under a thin cloud outline with arrows left-right |

## Örnek tam prompt (`ill-gate`)

```
Flat vector product illustration, consistent design system, soft geometric shapes,
limited palette: deep slate #0B0F17, elevated blue-gray #121826, electric blue #4F8CFF,
mint #34D399, warm amber #FBBF24, coral #F87171, off-white #E7ECF3.
Clean lines, generous negative space, no text, no logos, no photorealism,
no 3D gloss, no purple gradients, no clutter, single focal metaphor,
centered composition, square or 4:3, small UI spot illustration, minimal detail.
Scene: A small product tag passing through a glowing circular gate checkpoint.
Constraint: single object group, max 5 shapes, readable at 128px.
```

## Üretim notları

- Aynı seed / aynı model / aynı aspect (1:1 veya 4:3) kullan.  
- PNG şeffaf arka plan tercihen; yoksa `#0B0F17` ile kes.  
- Dosya yolu: `frontend/public/illustrations/{id}.png`  
- Boyut hedefi: ≤ 80–120 KB; UI’da `w-24` / `w-32`.  
- Metin illüstrasyona yazdırma — label CSS ile.
