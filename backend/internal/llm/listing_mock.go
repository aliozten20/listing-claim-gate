package llm

import (
	"strings"
	"time"
)

// mockCatalog is a stand-in Trendyol-like product feed used until real
// marketplace credentials exist. Mix of strong, weak, and risky listings.
var mockCatalog = []CanonicalProduct{
	{
		ExternalID: "mock-ty-001",
		Platform:   "mock-trendyol",
		ShopID:     "demo-shop",
		SKU:        "TSHIRT-NAVY-M",
		Title:      "Erkek Lacivert Pamuklu Basic Tişört",
		DescriptionText: "Nefes alan pamuk karışımlı kumaş. Günlük kullanım için rahat kalıp. " +
			"Makinede 30°C yıkama önerilir. Beden tablosu: S–XXL.",
		Brand:        "DemoWear",
		CategoryPath: []string{"Giyim", "Erkek", "Tişört"},
		Attributes:   []ProductAttr{{Key: "Materyal", Value: "Pamuk karışımı"}, {Key: "Renk", Value: "Lacivert"}},
		ClaimsHint:   []string{"pamuk"},
		Locale:       "tr-TR",
	},
	{
		ExternalID:      "mock-ty-002",
		Platform:        "mock-trendyol",
		ShopID:          "demo-shop",
		SKU:             "JEANS-SLIM-32",
		Title:           "Slim Fit Jean Pantolon",
		DescriptionText: "Esnek denim. Dar kesim. Yazlık / kışlık kullanım.",
		Brand:           "DemoDenim",
		CategoryPath:    []string{"Giyim", "Erkek", "Pantolon"},
		Attributes:      []ProductAttr{{Key: "Kalıp", Value: "Slim"}},
		Locale:          "tr-TR",
	},
	{
		ExternalID: "mock-ty-003",
		Platform:   "mock-trendyol",
		ShopID:     "demo-shop",
		SKU:        "CLAIM-ORG-01",
		Title:      "%100 Organik Yerli Pamuk Sweatshirt En Ucuz",
		DescriptionText: "Tamamen organik, sertifikasız. Yerli üretim garantili. " +
			"En ucuz fiyat bizde. İade yok.",
		Brand:        "RiskBrand",
		CategoryPath: []string{"Giyim", "Sweatshirt"},
		ClaimsHint:   []string{"organik", "%100", "yerli", "en ucuz"},
		Locale:       "tr-TR",
	},
	{
		ExternalID:      "mock-ty-004",
		Platform:        "mock-trendyol",
		ShopID:          "demo-shop",
		SKU:             "EMPTY-01",
		Title:           "Ürün",
		DescriptionText: "Güzel.",
		Brand:           "",
		CategoryPath:    []string{"Diğer"},
		Locale:          "tr-TR",
	},
	{
		ExternalID: "mock-ty-005",
		Platform:   "mock-trendyol",
		ShopID:     "demo-shop",
		SKU:        "SHOE-RUN-42",
		Title:      "Erkek Koşu Ayakkabısı Hafif Taban",
		DescriptionText: "Hafif EVA taban, nefes alan mesh üst. Günlük koşu ve yürüyüş için. " +
			"Numara: 40–45. Bakım: nemli bezle silin.",
		Brand:        "DemoStep",
		CategoryPath: []string{"Ayakkabı", "Spor"},
		Attributes:   []ProductAttr{{Key: "Taban", Value: "EVA"}, {Key: "Üst", Value: "Mesh"}},
		Locale:       "tr-TR",
	},
	{
		ExternalID: "mock-ty-006",
		Platform:   "mock-trendyol",
		ShopID:     "demo-shop",
		SKU:        "BAG-LEATHER",
		Title:      "Hakiki Deri Çanta El Yapımı",
		DescriptionText: "Hakiki deri görünümlü sentetik. El yapımı hissi. " +
			"Su geçirmez iddiası kanıtsız.",
		Brand:        "BagCo",
		CategoryPath: []string{"Aksesuar", "Çanta"},
		ClaimsHint:   []string{"hakiki deri", "el yapımı", "su geçirmez"},
		Locale:       "tr-TR",
	},
	{
		ExternalID: "mock-ty-007",
		Platform:   "mock-trendyol",
		ShopID:     "demo-shop",
		SKU:        "KIDS-SET-80",
		Title:      "Çocuk Pamuklu Pijama Takımı 2'li",
		DescriptionText: "Yumuşak pamuklu kumaş. 2'li set: üst + alt. Yaş aralığı 2–8. " +
			"Etiket bilgisi ve yıkama talimatı ürünle birlikte gelir.",
		Brand:        "DemoKids",
		CategoryPath: []string{"Çocuk", "Giyim"},
		Attributes:   []ProductAttr{{Key: "Adet", Value: "2"}, {Key: "Materyal", Value: "Pamuk"}},
		Locale:       "tr-TR",
	},
	{
		ExternalID:      "mock-ty-008",
		Platform:        "mock-trendyol",
		ShopID:          "demo-shop",
		SKU:             "TECH-CABLE",
		Title:           "Type-C Şarj Kablosu 1m",
		DescriptionText: "1 metre USB-C kablo. Hızlı şarj uyumlu (cihaz desteğine bağlı). Örgülü dış kılıf.",
		Brand:           "DemoTech",
		CategoryPath:    []string{"Elektronik", "Aksesuar"},
		Attributes:      []ProductAttr{{Key: "Uzunluk", Value: "1m"}, {Key: "Konnektör", Value: "USB-C"}},
		Locale:          "tr-TR",
	},
}

func init() {
	now := time.Now().UTC()
	for i := range mockCatalog {
		mockCatalog[i].SyncedAt = now
	}
}

// MockProducts returns the in-memory mock marketplace catalog.
func MockProducts() []CanonicalProduct {
	out := make([]CanonicalProduct, len(mockCatalog))
	copy(out, mockCatalog)
	return out
}

// MockProductByID finds a mock product by external_id (case-insensitive).
func MockProductByID(id string) (CanonicalProduct, bool) {
	want := strings.TrimSpace(id)
	for _, p := range mockCatalog {
		if strings.EqualFold(p.ExternalID, want) {
			return p, true
		}
	}
	return CanonicalProduct{}, false
}
