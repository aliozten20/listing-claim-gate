# Security audit — AppSec / OWASP (SAST-style)

**Role:** Application Security Engineer / DevSecOps  
**Scope:** `backend/` + `frontend/src/lib/api.ts` (+ docs CSP)  
**Method:** Manual SAST of auth, stores, middleware, config, FE token storage  
**Not in scope:** Generic “enable HTTPS”, buzzword SCA without version CVEs, speculative MLC SSRF (no outbound client today)

---

## Executive summary

| Area | State |
|---|---|
| SQL injection | Clean — parameterized `$n` only |
| XSS sinks (React) | Clean — text nodes; no `dangerouslySetInnerHTML` |
| SSRF | N/A today — `MLC_BASE_URL` not used for HTTP fetches |
| IDOR on runs/sessions | Mitigated — `user_id` in queries |
| JWT alg confusion | Mitigated — HMAC-only verify |
| Refresh tokens | Hashed at rest (SHA-256); rotation + reuse kill (race remains) |
| Highest actionable risk | Published Compose/example JWT secret bypasses production deny-list |

---

## Findings

### 1. Published JWT secret bypasses production Validate

- **Zafiyet / OWASP Kategorisi:** Weak / known secret acceptance — **A02 Cryptographic Failures** / **A07 Identification & Authentication Failures**
- **Risk Seviyesi:** Yüksek
- **Sömürü Senaryosu:** Operatör `APP_ENV=production` ile deploy eder ama `JWT_SECRET` olarak repo’daki `dev-insecure-secret-change-me-but-32b-min!!` değerini bırakır. `Validate()` yalnızca kısa constant `dev-insecure-secret-change-me` değerini reddeder; uzun örnek secret uzunluk kontrolünden geçer. Saldırgan public repo’dan secret’ı okuyup herhangi bir `sub` için HS256 access token üretir.
- **Çözüm (Remediation):** Bilinen tüm published secret’ları deny-list’e al; veya production’da secret’ın repo/example ile equality check’i yap. Render blueprint `generateValue` kullanmaya devam etsin.

```go
var insecureSecrets = []string{
    InsecureDefaultSecret,
    "dev-insecure-secret-change-me-but-32b-min!!",
}
// Validate: reject any match + require entropy/length
```

---

### 2. Refresh token rotation is not atomic

- **Zafiyet / OWASP Kategorisi:** Session fixation / concurrent session mint — **A07 Identification & Authentication Failures**
- **Risk Seviyesi:** Orta
- **Sömürü Senaryosu:** Aynı refresh token ile eşzamanlı iki `POST /auth/refresh` (çalıntı token + meşru istemci, veya çift sekme). İkisi de revoke öncesi “live” görür; ikisi de yeni refresh zinciri alır. Reuse detection yalnızca *zaten revoked* hash tekrar sunulunca tetiklenir.
- **Çözüm (Remediation):** Tek transaction: `SELECT … FOR UPDATE` → revoke if live → insert new session → commit. `UPDATE sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL RETURNING id` ile conditional revoke.

---

### 3. `APP_ENV` exact-match bypass of security gates

- **Zafiyet / OWASP Kategorisi:** Security Misconfiguration — **A05**
- **Risk Seviyesi:** Orta
- **Sömürü Senaryosu:** Host’ta `APP_ENV=Production` / `prod` / boş bırakılırsa `Validate()` hiç çalışmaz; zayıf JWT ve `CORS_ORIGINS=*` ile süreç ayağa kalkabilir.
- **Çözüm (Remediation):** Production benzeri env’leri normalize et (`strings.EqualFold` + allowlist: `production`, `prod`, `staging` için sıkı kurallar) veya “secure mode” flag’ini ayrı zorunlu kıl (`SECURE_MODE=true`).

---

### 4. Authenticated storage / CPU DoS via large persisted bodies

- **Zafiyet / OWASP Kategorisi:** Unrestricted Resource Consumption — **A04 Insecure Design** / API4 (OWASP API)
- **Risk Seviyesi:** Orta
- **Sömürü Senaryosu:** Kimliği doğrulanmış kullanıcı 1 MiB’lik `prompt`/`response` ile tekrarlı `POST /llm/runs` veya analyze yazar. Disk/TOAST şişer; `/llm/metrics` tüm kullanıcı run’larını tarar → CPU/IO exhaustion (özellikle shared Supabase).
- **Çözüm (Remediation):** Alan bazlı limitler (örn. prompt/response ≤ 32–64 KiB); kullanıcı başına run kotası; Metrics’e zaman penceresi. Capacity limiter’ı yalnızca analyze’a değil, ağır yazma yollarına da uygula.

---

### 5. Register display name not capped (UpdateMe is)

- **Zafiyet / OWASP Kategorisi:** Insufficient input validation — **A03 Injection** (integrity) / **A04**
- **Risk Seviyesi:** Orta
- **Sömürü Senaryosu:** `POST /auth/register` ile ~1 MiB `name`. Değer her `/auth/me` ve token response’ta geri döner → bandwidth/DB şişmesi. `UpdateMe` `maxNameBytes=100` uygular; Register uygulamaz.
- **Çözüm (Remediation):** Register’da aynı `maxNameBytes` (ve trim) kontrolü.

```go
name := strings.TrimSpace(req.Name)
if len(name) > maxNameBytes {
    return common.ErrBadRequest("name is too long")
}
```

---

### 6. Unauthenticated `/metrics` telemetry exposure

- **Zafiyet / OWASP Kategorisi:** Security Misconfiguration / Sensitive data exposure — **A01** / **A05**
- **Risk Seviyesi:** Orta (operasyonel istihbarat; secret değil)
- **Sömürü Senaryosu:** İnternete açık API’de herkes PASS/REVIEW/REJECT sayaçlarını, capacity reject ve latency ortalamasını scrap eder; trafik deseni / kapasite doluluğu öğrenilir.
- **Çözüm (Remediation):** Production’da `/metrics` için network allowlist, basic auth, veya ayrı internal listen. Grafana scrape’i private network’ten yapsın.

---

### 7. Tokens stored in `localStorage` (XSS amplifier)

- **Zafiyet / OWASP Kategorisi:** Sensitive Data Exposure / XSS impact — **A02** / **A03**
- **Risk Seviyesi:** Orta (bugün aktif XSS sink yok; etki çarpanı)
- **Sömürü Senaryosu:** Gelecekte FE origin’de XSS olursa `localStorage` access+refresh çalınır → tam hesap ele geçirme.
- **Çözüm (Remediation):** Refresh için `HttpOnly; Secure; SameSite` cookie (BFF veya API set-cookie); access kısa ömürlü memory’de. CSP sıkılaştır; `unsafe-inline` kaldır.

---

### 8. `/docs` loads Redoc from CDN `latest` + CSP `unsafe-inline`

- **Zafiyet / OWASP Kategorisi:** Supply-chain / XSS on API origin — **A03** / **A08 Software and Data Integrity Failures**
- **Risk Seviyesi:** Orta (API origin; FE token’ları ayrı origin’de)
- **Sömürü Senaryosu:** CDN `latest` bundle ele geçirilirse API origin’de script çalışır. Integrity riski; FE cookie yoksa token hırsızlığı sınırlı kalır.
- **Çözüm (Remediation):** Pin version + SRI hash; self-host Redoc; production’da `/docs` kapat veya auth arkasına al; CSP’den `unsafe-inline` çıkar.

---

### 9. Access JWT survives password change until TTL

- **Zafiyet / OWASP Kategorisi:** Insufficient session invalidation — **A07**
- **Risk Seviyesi:** Düşük (default access TTL 15m)
- **Sömürü Senaryosu:** Çalınmış access token, kurban şifre değiştirdikten sonra TTL dolana kadar API’yi kullanmaya devam eder. Refresh’ler revoke edilir.
- **Çözüm (Remediation):** Kısa access TTL tut; kritik işlemlerde `token_version`/password_changed_at claim ile DB re-check; veya access denylist (maliyetli).

---

### 10. Weak password policy (min length only; no max)

- **Zafiyet / OWASP Kategorisi:** Identification Failures — **A07**
- **Risk Seviyesi:** Düşük
- **Sömürü Senaryosu:** `password1` ile kayıt. bcrypt 12 + rate limit mitigasyon sağlar. Aşırı uzun parola bcrypt 72-byte limitinde 500 üretebilir.
- **Çözüm (Remediation):** Max 72 byte enforce; isteğe bağlı entropy/hibp check; mevcut min 8 kalsın.

---

### 11. Unbounded `ListSessions`

- **Zafiyet / OWASP Kategorisi:** Resource Exhaustion — **A04**
- **Risk Seviyesi:** Düşük
- **Sömürü Senaryosu:** Yıllarca birikmiş session satırları tek response’ta döner (cleanup ile kısmen mitigasyon).
- **Çözüm (Remediation):** `LIMIT 50` + pagination.

---

### 12. Role claim unused (latent Broken Access Control)

- **Zafiyet / OWASP Kategorisi:** Broken Access Control (latent) — **A01**
- **Risk Seviyesi:** Bilgi / Düşük
- **Sömürü Senaryosu:** Bugün admin route yok; escalation API yok. İleride yalnızca JWT `role` claim’ine güvenilirse stale/forged trust riski.
- **Çözüm (Remediation):** RBAC eklenince yetkiyi DB’den yeniden oku; JWT role’ü hint kabul et.

---

## Cleared (explicit non-findings)

| Kontrol | Sonuç |
|---|---|
| SQL injection | Parametreli sorgular; SQL’e `fmt.Sprintf` yok |
| XSS (React) | Kullanıcı metni text node; HTML sink yok |
| SSRF | Outbound HTTP client yok |
| IDOR runs/sessions | `id AND user_id` / `RevokeSessionForUser` |
| JWT `alg:none` / RSA confusion | HMAC-only keyfunc |
| Refresh at rest | SHA-256 hash; opaque 32-byte token |
| Refresh reuse after revoke | Tüm session’lar revoke + 401 (testli) |
| Login timing oracle | Unknown-email decoy bcrypt |
| CORS `*` in production | Validate fatal |
| TrustProxy | `RealIP` yalnızca `TRUST_PROXY=true` |
| Auth brute force | Per-IP limiter on register/login/refresh/logout |
| Deserialization gadgets | Typed decode + `DisallowUnknownFields`; Metadata = `json.RawMessage` |
| Command/LDAP injection | OS/LDAP call surface yok |
| Hardcoded prod API keys in source | Yok (yalnızca local example/compose) |

---

## Remediation priority (SDLC)

1. Deny-list published JWT secrets; document “never use Compose secret in prod”.  
2. Transactional refresh rotation.  
3. Cap Register name + field sizes on CreateRun.  
4. Protect `/metrics` and pin/self-host `/docs`.  
5. Plan HttpOnly refresh cookies before any rich HTML/markdown rendering on FE.

Do **not** treat “add WAF” as a substitute for (1)–(3).
