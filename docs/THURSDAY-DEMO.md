# Perşembe Sunum Planı — Ekip Teyit Konuşması

Bir kişi tüm ekip adına konuşur; amaç: **ne yaptık / nasıl parçaladık / local’de ne ölçtük / bulutta ne olur**.

## Süre (≈ 8–10 dk)

| Dk | Başlık | Söyle |
|---|---|---|
| 0:00 | Sorun | Pazaryeri listing + iddia kaos; yayın kararı audit edilemiyor |
| 0:45 | Ürün | Listing & Claim Gate — üret / skorla / PASS·REVIEW·REJECT |
| 1:30 | Orkestra diyagramı | UI → Gateway(20) → Go → MLC container → Deci.Scoring → Grafana |
| 3:00 | MLC nasıl parçalandı | Ayrı container; sadece inference; model volume; backend HTTP client |
| 4:00 | İki container | `mlc-llm` ↔ `backend` network; Grafana KPI |
| 5:00 | Local performans | Tablo: latency, tok/s, 20 concurrent, 21st = killer |
| 6:30 | Bulut | Replica × slot; LB; HPA; managed DB/Grafana |
| 7:30 | MCP | Render + Vercel + Academy; sonra `score_listing` |
| 8:30 | Demo | 1 listing PASS, 1 REVIEW; Grafana panel; 21st 503 |
| 9:30 | Kapanış | Ekip rolleri tek cümle + sorular |

## Zorunlu cümleler (ezber)

1. **“Inference MLC container’da; karar ve skor Go’da; gözlem Grafana’da.”**  
2. **“Eşzamanlı 20 slot; 21. istek switch-out killer ile düşer.”**  
3. **“Raw run loglanmadan yayın kararı yok — Deci.Scoring şeffaf.”**  
4. **“Local’de ölçtük; bulutta MLC replica ile yatay büyürüz.”**  

## Ekip teyit checklist (sunumdan önce)

- [ ] `docker compose up` → mlc-llm healthy, backend `/health` ok  
- [ ] Grafana’da en az 3 panel (RPS, inflight, latency P95)  
- [ ] Script: 20 parallel OK, 21 → 503  
- [ ] 1 canlı listing score (PASS veya REVIEW)  
- [ ] Repo README’de mimari + MCP notu  
- [ ] Roller yazılı (kim infra, kim scoring, kim FE, kim sunum)

## Roller (örnek)

| Rol | Sorumluluk |
|---|---|
| Sunucu | Bu konuşma + demo tıklamaları |
| Infra | Compose, MLC image, Grafana |
| Backend | Gateway killer, metrics, Deci publish decision |
| Frontend | Gate + Monitoring + illüstrasyonlar |
| Docs | PRODUCT / INFRA / ölçüm tablosu |

## Yedek (bir şey kırılırsa)

- Önceden kaydedilmiş Grafana screenshot  
- `curl` ile 503 kanıtı terminalden  
- Mimari diyagram (INFRA.md) slayt olarak  
