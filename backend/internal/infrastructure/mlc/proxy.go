package mlc

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// NewProxyHandler returns an authenticated-mountable reverse proxy to the
// worker MLC origin. Requests to /v1/mlc/... are stripped to /... on upstream.
// Returns nil when baseURL is empty or invalid (caller must not mount).
//
// SSRF: the Director only ever targets the configured base host.
func NewProxyHandler(baseURL string) http.Handler {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		return nil
	}
	target, err := url.Parse(baseURL)
	if err != nil || (target.Scheme != "http" && target.Scheme != "https") || target.Host == "" {
		return nil
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, _ *http.Request, err error) {
		http.Error(w, `{"error":"mlc_unreachable","message":"worker MLC tunnel unavailable"}`, http.StatusBadGateway)
		_ = err
	}
	proxy.Director = func(req *http.Request) {
		// Strip /v1/mlc prefix so /v1/mlc/v1/models → {base}/v1/models
		path := req.URL.Path
		path = strings.TrimPrefix(path, "/v1/mlc")
		if path == "" {
			path = "/"
		}
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = singleJoiningSlash(target.Path, path)
		req.Host = target.Host
		// Drop hop-by-hop identity headers that could confuse the worker.
		req.Header.Del("Authorization")
	}
	return proxy
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		if a == "" {
			return b
		}
		return a + "/" + b
	}
	return a + b
}
