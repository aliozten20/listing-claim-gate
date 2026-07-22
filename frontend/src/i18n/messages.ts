export type Locale = "en" | "tr";

export const DEFAULT_LOCALE: Locale = "en";

type Dict = { readonly [K in keyof typeof en]: string };

export const en = {
  brand: "Listing Gate",
  brandSub: "Marketplace publish control",
  navGate: "Listing Gate",
  navDecisions: "Decisions",
  signOut: "Sign out",
  loading: "Loading workspace…",
  langEn: "EN",
  langTr: "TR",

  authEyebrow: "Marketplace publish control",
  authDisplay1: "Score every claim",
  authDisplay2: "before it goes live.",
  authLede:
    "Title & description in → PASS / REVIEW / REJECT out. Built for marketplace and D2C shops that need a decision, not a dashboard toy.",
  authFoot: "Deci.Scoring · Mock shop · Manual paste",
  authTabSignIn: "Sign in",
  authTabRegister: "Create account",
  authWelcome: "Welcome back",
  authOpen: "Open your workspace",
  authWelcomeSub: "Enter your shop credentials to continue scoring listings.",
  authOpenSub: "One account — listing decisions, scores, and publish history.",
  authName: "Full name",
  authEmail: "Work email",
  authPassword: "Password",
  authPwHint: "Min. 8 characters",
  authShow: "Show",
  authHide: "Hide",
  authSubmitLogin: "Sign in to Gate",
  authSubmitRegister: "Create workspace",
  authWorking: "Working…",
  authNewShop: "New shop?",
  authCreateLink: "Create an account",
  authHaveAccess: "Already have access?",
  authSignInLink: "Sign in",
  authApiDown:
    "Cannot reach the API. Make sure the backend is running on http://localhost:8080.",

  gateTitle: "Listing & Claim Gate",
  gateSub:
    "Mock shop or manual title/description → commerce Deci.Scoring publish decision (engine: listing-rules-v1)",
  gateMock: "Mock shop",
  gateManual: "Manual",
  gateSelectProduct: "Select product",
  gateTitleLabel: "Title",
  gateDescLabel: "Description",
  gateKeywords: "Expected keywords (optional, comma-separated)",
  gateAnalyze: "Analyze listing",
  gateAnalyzing: "Analyzing…",
  gateDecision: "Publish decision",
  gateFlags: "Flags",
  gateInsights: "Insights",
  gateLoadFail: "Could not load mock products.",
  gateAnalyzeFail: "Analyze failed.",
  gateEmptyDecisions: "No decisions yet. Score a listing in Listing Gate.",

  scoreTitle: "Deci.Scoring",
  scoreOutOf: "out of 100 · rule-based · transparent breakdown",
  scoreInfo: "What is this?",
  scoreGoodRange: "Good range",
  scoreWhy: "Why it matters",

  dim_completion: "Completion",
  dim_latency: "Latency",
  dim_efficiency: "Efficiency",
  dim_keywords: "Keywords",
  dim_length: "Length",
  dim_claim_risk: "Claim risk",
  dim_title_quality: "Title quality",
  dim_desc_complete: "Description completeness",
  dim_policy_clarity: "Policy clarity",
  dim_content_efficiency: "Content efficiency",

  info_claim_risk:
    "How free the copy is from absolute or medical-style claims that need proof. Unproven “100% / clinically proven / cures in 7 days” language drives takedowns and ads rejection (FTC-style substantiation).",
  info_title_quality:
    "Whether title length looks usable for search & conversion. Too short under-ranks; extremely long titles look spammy and hit marketplace limits.",
  info_desc_complete:
    "Enough detail for material, size, care, color. Thin PDPs correlate with returns and “not as described” disputes.",
  info_policy_clarity:
    "Return / warranty language that is not hostile. “No returns” hurts trust and may conflict with platform rules.",
  info_content_efficiency:
    "Information density vs keyword stuffing. Unique, scannable copy beats repeated tokens.",
  info_completion: "Did the model answer (not empty / not a refusal)?",
  info_latency: "Was the response fast enough for interactive use?",
  info_efficiency: "Characters produced per completion token (throughput quality).",
  info_keywords: "Coverage of expected keywords in the model answer.",
  info_length: "Answer neither too short nor excessively long.",

  good_claim_risk: "≥ 80",
  good_title_quality: "≥ 75 (≈ 25–90 chars)",
  good_desc_complete: "≥ 75 with attribute cues",
  good_policy_clarity: "≥ 70",
  good_content_efficiency: "≥ 60",
  good_completion: "≥ 80",
  good_latency: "≥ 70",
  good_efficiency: "≥ 70",
  good_keywords: "≥ 70",
  good_length: "≥ 70",

  dashTitle: "Decisions",
  dashSub: "Publish outcomes and score history for your shop workspace.",
} as const;

export type Messages = Dict;

export const tr: Messages = {
  brand: "Listing Gate",
  brandSub: "Pazaryeri yayın kontrolü",
  navGate: "Listing Gate",
  navDecisions: "Kararlar",
  signOut: "Çıkış",
  loading: "Çalışma alanı yükleniyor…",
  langEn: "EN",
  langTr: "TR",

  authEyebrow: "Pazaryeri yayın kontrolü",
  authDisplay1: "Her iddiayı puanla",
  authDisplay2: "yayına almadan önce.",
  authLede:
    "Başlık ve açıklama gir → PASS / REVIEW / REJECT çık. Karar isteyen pazaryeri ve D2C mağazaları için; oyuncak dashboard değil.",
  authFoot: "Deci.Scoring · Mock mağaza · Manuel yapıştır",
  authTabSignIn: "Giriş",
  authTabRegister: "Hesap oluştur",
  authWelcome: "Tekrar hoş geldiniz",
  authOpen: "Çalışma alanını aç",
  authWelcomeSub: "Listing skorlamak için mağaza bilgilerinizi girin.",
  authOpenSub: "Tek hesap — listing kararları, skorlar ve yayın geçmişi.",
  authName: "Ad soyad",
  authEmail: "İş e-postası",
  authPassword: "Şifre",
  authPwHint: "En az 8 karakter",
  authShow: "Göster",
  authHide: "Gizle",
  authSubmitLogin: "Gate’e giriş yap",
  authSubmitRegister: "Çalışma alanı oluştur",
  authWorking: "İşleniyor…",
  authNewShop: "Yeni mağaza?",
  authCreateLink: "Hesap oluştur",
  authHaveAccess: "Zaten erişiminiz var mı?",
  authSignInLink: "Giriş yap",
  authApiDown:
    "API’ye ulaşılamıyor. Backend’in http://localhost:8080 üzerinde çalıştığından emin olun.",

  gateTitle: "Listing & Claim Gate",
  gateSub:
    "Mock mağaza veya manuel title/açıklama → ticaret Deci.Scoring yayın kararı (motor: listing-rules-v1)",
  gateMock: "Mock mağaza",
  gateManual: "Manuel",
  gateSelectProduct: "Ürün seç",
  gateTitleLabel: "Başlık",
  gateDescLabel: "Açıklama",
  gateKeywords: "Beklenen anahtar kelimeler (opsiyonel, virgülle)",
  gateAnalyze: "Listing’i analiz et",
  gateAnalyzing: "Analiz ediliyor…",
  gateDecision: "Yayın kararı",
  gateFlags: "Bayraklar",
  gateInsights: "Öneriler",
  gateLoadFail: "Mock ürünler yüklenemedi.",
  gateAnalyzeFail: "Analiz başarısız.",
  gateEmptyDecisions: "Henüz karar yok. Listing Gate’te bir listing skorlayın.",

  scoreTitle: "Deci.Scoring",
  scoreOutOf: "100 üzerinden · kural tabanlı · şeffaf kırılım",
  scoreInfo: "Bu nedir?",
  scoreGoodRange: "İyi aralık",
  scoreWhy: "Neden önemli",

  dim_completion: "Tamamlama",
  dim_latency: "Gecikme",
  dim_efficiency: "Verimlilik",
  dim_keywords: "Anahtar kelimeler",
  dim_length: "Uzunluk",
  dim_claim_risk: "İddia riski",
  dim_title_quality: "Başlık kalitesi",
  dim_desc_complete: "Açıklama bütünlüğü",
  dim_policy_clarity: "Politika netliği",
  dim_content_efficiency: "İçerik verimliliği",

  info_claim_risk:
    "Kanıt gerektiren mutlak veya tıbbi tarz iddialardan ne kadar uzak. “%100 / klinik kanıtlı / 7 günde tedavi” gibi ifadeler yayından kaldırma ve reklam reddi riski taşır.",
  info_title_quality:
    "Başlık uzunluğunun arama ve dönüşüm için uygunluğu. Çok kısa zayıf kalır; aşırı uzun spam görünümü ve pazaryeri limitleri riski.",
  info_desc_complete:
    "Materyal, beden, bakım, renk için yeterli detay. İnce PDP’ler iade ve “açıklamaya uymuyor” şikayetleriyle ilişkilidir.",
  info_policy_clarity:
    "Düşman olmayan iade/garanti dili. “İade yok” güveni düşürür ve platform kurallarıyla çatışabilir.",
  info_content_efficiency:
    "Bilgi yoğunluğu vs anahtar kelime doldurma. Tekrarlayan token yerine benzersiz, taranabilir metin.",
  info_completion: "Model cevap verdi mi (boş / red değil)?",
  info_latency: "Yanıt etkileşim için yeterince hızlı mıydı?",
  info_efficiency: "Tamamlama tokenı başına üretilen karakter (throughput).",
  info_keywords: "Beklenen anahtar kelime kapsamı.",
  info_length: "Cevap ne çok kısa ne aşırı uzun.",

  good_claim_risk: "≥ 80",
  good_title_quality: "≥ 75 (≈ 25–90 karakter)",
  good_desc_complete: "≥ 75 + özellik ipuçları",
  good_policy_clarity: "≥ 70",
  good_content_efficiency: "≥ 60",
  good_completion: "≥ 80",
  good_latency: "≥ 70",
  good_efficiency: "≥ 70",
  good_keywords: "≥ 70",
  good_length: "≥ 70",

  dashTitle: "Kararlar",
  dashSub: "Mağaza çalışma alanınız için yayın sonuçları ve skor geçmişi.",
};

export const catalogs: Record<Locale, Messages> = { en, tr };
