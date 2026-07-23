package postgres

import (
	"bytes"
	"encoding/json"
	"math"
	"time"

	listingapp "github.com/aliozten20/listing-claim-gate/backend/internal/application/listing"
	"github.com/aliozten20/listing-claim-gate/backend/internal/domain/listing"
)

// This file holds small serialization helpers used by the store. Keeping them
// separate keeps the SQL in store.go readable.

// emptyJSONObject is what a jsonb column gets when the client sent no metadata,
// so the column is never NULL and readers never have to special-case it.
var emptyJSONObject = []byte("{}")

// normalizeMeta prepares client metadata for a jsonb column. The bytes pass
// through untouched when present: the server never reads inside metadata, and
// Postgres validates the JSON on insert, so decoding and re-encoding it here
// would be pure allocation for no gain.
func normalizeMeta(m listing.Metadata) []byte {
	if len(bytes.TrimSpace(m)) == 0 {
		return emptyJSONObject
	}
	return m
}

// metaOrEmpty keeps an absent jsonb value from reaching the client as a bare
// `null`, which would break callers that expect an object.
func metaOrEmpty(b []byte) listing.Metadata {
	if len(b) == 0 {
		return emptyJSONObject
	}
	return b
}

// attachEfficiency fills listing.Score.EfficiencyAnalysis from the parent run so stored
// scores still return live throughput telemetry without a new DB column.
func attachEfficiency(run listing.Run, sc *listing.Score) {
	if sc == nil {
		return
	}
	eff := listingapp.AnalyzeEfficiency(run)
	eff.DimensionScore = sc.Breakdown.Efficiency
	sc.EfficiencyAnalysis = &eff
}

// unmarshalBreakdown decodes the stored component scores. A malformed value
// yields a zeroed listing.Breakdown rather than an error: a presentation detail of the
// score is not worth failing an otherwise good read over.
func unmarshalBreakdown(b []byte) listing.Breakdown {
	var out listing.Breakdown
	if len(b) == 0 {
		return out
	}
	_ = json.Unmarshal(b, &out)
	return out
}

func deref(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// derefTime flattens the nullable timestamp a LEFT JOIN produces when a run has
// no score yet.
func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
