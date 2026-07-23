package common

import (
	"net/http"
	"sync/atomic"
)

// CapacityLimiter is the switch-out killer: at most max concurrent handlers.
// The 21st request receives 503 capacity_exceeded.
type CapacityLimiter struct {
	sem      chan struct{}
	active   atomic.Int64
	onReject func()
	onActive func(n int64)
}

func NewCapacityLimiter(max int, onReject func(), onActive func(n int64)) *CapacityLimiter {
	if max < 1 {
		max = 20
	}
	return &CapacityLimiter{
		sem:      make(chan struct{}, max),
		onReject: onReject,
		onActive: onActive,
	}
}

func (c *CapacityLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case c.sem <- struct{}{}:
			n := c.active.Add(1)
			if c.onActive != nil {
				c.onActive(n)
			}
			defer func() {
				<-c.sem
				n := c.active.Add(-1)
				if c.onActive != nil {
					c.onActive(n)
				}
			}()
			next.ServeHTTP(w, r)
		default:
			if c.onReject != nil {
				c.onReject()
			}
			Error(w, ErrCapacityExceeded())
		}
	})
}

// ErrCapacityExceeded is used by the 20-slot gateway.
func ErrCapacityExceeded() *APIError {
	return &APIError{
		Status:  http.StatusServiceUnavailable,
		Code:    "capacity_exceeded",
		Message: "inference capacity full (max 20 concurrent); retry later",
	}
}
