package metrics

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
)

// Registry is a tiny Prometheus text exposition without external deps.
type Registry struct {
	mu sync.Mutex

	httpRequests   atomic.Uint64
	analyzeTotal   atomic.Uint64
	analyzePass    atomic.Uint64
	analyzeReview  atomic.Uint64
	analyzeReject  atomic.Uint64
	capacityReject atomic.Uint64
	latencySumMs   atomic.Uint64
	latencyCount   atomic.Uint64
	activeSlots    atomic.Int64
	maxSlots       int64
}

func New(maxSlots int) *Registry {
	if maxSlots < 1 {
		maxSlots = 20
	}
	return &Registry{maxSlots: int64(maxSlots)}
}

func (r *Registry) IncHTTP() { r.httpRequests.Add(1) }

func (r *Registry) ObserveAnalyze(decision string, latencyMs int) {
	r.analyzeTotal.Add(1)
	if latencyMs > 0 {
		r.latencySumMs.Add(uint64(latencyMs))
		r.latencyCount.Add(1)
	}
	switch strings.ToUpper(decision) {
	case "PASS":
		r.analyzePass.Add(1)
	case "REJECT":
		r.analyzeReject.Add(1)
	default:
		r.analyzeReview.Add(1)
	}
}

func (r *Registry) IncCapacityReject() { r.capacityReject.Add(1) }

func (r *Registry) SetActiveSlots(n int64) { r.activeSlots.Store(n) }

func (r *Registry) MaxSlots() int64 { return r.maxSlots }

// Handler serves GET /metrics in Prometheus text format.
func (r *Registry) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		avgLat := 0.0
		if c := r.latencyCount.Load(); c > 0 {
			avgLat = float64(r.latencySumMs.Load()) / float64(c)
		}
		var b strings.Builder
		write := func(name, help, typ string, value any) {
			fmt.Fprintf(&b, "# HELP %s %s\n# TYPE %s %s\n%s %v\n", name, help, name, typ, name, value)
		}
		write("listing_gate_http_requests_total", "Total HTTP requests observed by metrics middleware", "counter", r.httpRequests.Load())
		write("listing_gate_analyze_total", "Listing analyze calls", "counter", r.analyzeTotal.Load())
		write("listing_gate_analyze_pass_total", "Analyze outcomes PASS", "counter", r.analyzePass.Load())
		write("listing_gate_analyze_review_total", "Analyze outcomes REVIEW", "counter", r.analyzeReview.Load())
		write("listing_gate_analyze_reject_total", "Analyze outcomes REJECT", "counter", r.analyzeReject.Load())
		write("listing_gate_capacity_rejected_total", "Requests killed by 20-slot switch-out", "counter", r.capacityReject.Load())
		write("listing_gate_analyze_latency_ms_avg", "Average analyze latency in ms", "gauge", avgLat)
		write("listing_gate_inference_slots_active", "Active inference slots", "gauge", r.activeSlots.Load())
		write("listing_gate_inference_slots_max", "Max concurrent inference slots", "gauge", r.maxSlots)
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		_, _ = w.Write([]byte(b.String()))
	}
}
