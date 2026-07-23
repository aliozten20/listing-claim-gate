// Package mlc provides an OpenAI-compatible client and reverse-proxy for the
// local worker MLC stack. Browser clients never call the laptop directly —
// they hit Render `/v1/mlc/*`, which proxies to MLC_BASE_URL (tunnel).
package mlc

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client talks to an MLC OpenAI-compatible HTTP API when BaseURL is set.
type Client interface {
	Healthy(ctx context.Context) error
	BaseURL() string
	Attached() bool
	ChatCompletions(ctx context.Context, body []byte) ([]byte, int, error)
}

// HTTPClient is a minimal MLC client. An empty BaseURL makes Attached false.
type HTTPClient struct {
	base   string
	client *http.Client
}

// NewClient builds a Client. baseURL may be empty (MLC not attached).
func NewClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		base: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *HTTPClient) BaseURL() string {
	if c == nil {
		return ""
	}
	return c.base
}

func (c *HTTPClient) Attached() bool {
	return c != nil && c.base != ""
}

// Healthy probes GET /health on the worker. Unconfigured → not attached (error).
func (c *HTTPClient) Healthy(ctx context.Context) error {
	if !c.Attached() {
		return fmt.Errorf("mlc not configured")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/health", nil)
	if err != nil {
		return err
	}
	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 500 {
		return fmt.Errorf("mlc unhealthy: status %d", res.StatusCode)
	}
	return nil
}

// ChatCompletions POSTs to /v1/chat/completions and returns raw body + status.
func (c *HTTPClient) ChatCompletions(ctx context.Context, body []byte) ([]byte, int, error) {
	if !c.Attached() {
		return nil, 0, fmt.Errorf("mlc not configured")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := c.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	if err != nil {
		return nil, res.StatusCode, err
	}
	return raw, res.StatusCode, nil
}

// EnrichListingPrompt is a small helper used by Gate when MLC is attached.
func EnrichListingPrompt(title, description string) []byte {
	payload := map[string]any{
		"model": "listing-gate-mlc",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are Listing & Claim Gate. Summarize marketplace listing risks in one short paragraph.",
			},
			{
				"role": "user",
				"content": fmt.Sprintf("Title: %s\nDescription: %s", title, description),
			},
		},
		"temperature": 0.2,
		"max_tokens":  256,
	}
	raw, _ := json.Marshal(payload)
	return raw
}

var _ Client = (*HTTPClient)(nil)
