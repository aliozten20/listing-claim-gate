package mlc

import "testing"

func TestNewProxyHandlerEmpty(t *testing.T) {
	if NewProxyHandler("") != nil {
		t.Fatal("expected nil for empty base")
	}
	if NewProxyHandler("not-a-url") != nil {
		t.Fatal("expected nil for invalid url")
	}
}

func TestNewClientAttached(t *testing.T) {
	c := NewClient("")
	if c.Attached() {
		t.Fatal("empty should not be attached")
	}
	c = NewClient("https://worker.example.com/")
	if !c.Attached() || c.BaseURL() != "https://worker.example.com" {
		t.Fatalf("base=%q attached=%v", c.BaseURL(), c.Attached())
	}
}
