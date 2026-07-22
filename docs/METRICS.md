# Listing Gate metrics — what we measure and why

Default UI language is **English**; Turkish copy mirrors the same definitions.

## Decision outcomes

| Decision | Meaning | Typical cutoffs |
|---|---|---|
| **PASS** | Safe enough to publish | Score ≥ 80 and no critical flags |
| **REVIEW** | Human should check before go-live | Between reject and pass |
| **REJECT** | Do not publish as-is | Score &lt; 55, or missing title/description, or severe claim+thin copy |

Thresholds live in DB setting `gate.thresholds` (`pass_min: 80`, `reject_below: 55`).

---

## Commerce dimensions (Gate analyze)

These are the five bars on a listing score. Higher = better / safer.

### 1. Claim risk (`claim_risk`)

**What:** How free the copy is from absolute or medical-style claims that need proof.  
**Why it matters:** Marketplaces and consumer-protection rules (e.g. FTC advertising substantiation in the US; similar unfair-commercial-practice rules in the EU/TR) expect advertisers to be able to prove strong claims. Unproven “100%”, “clinically proven”, “cures in 7 days” language drives takedowns, ads rejection, and trust loss.  
**Good range:** ≥ 80  
**Sources / practice:** FTC *Advertising FAQ* / substantiation doctrine; platform listing quality policies (absolute superlatives & health claims flagged).

### 2. Title quality (`title_quality`)

**What:** Whether the title length and structure look usable for search & conversion.  
**Why:** Too-short titles under-rank; extremely long titles look spammy and hit marketplace character limits. Industry listing guides often recommend clear, attribute-rich titles in a mid length band (roughly tens of characters, not one word and not a paragraph).  
**Good range:** ≥ 75 (≈ 25–90 characters after trim)  
**Sources / practice:** Marketplace seller title guidelines (Trendyol/HB-style length limits); ecommerce SEO title-length heuristics.

### 3. Description completeness (`desc_complete`)

**What:** Enough detail for a buyer to know material, size, care, color, use.  
**Why:** Thin descriptions correlate with returns, WISMO tickets, and “not as described” disputes. Content-quality checklists in ecommerce ops explicitly score attribute coverage.  
**Good range:** ≥ 75 with material/size/care cues present  
**Sources / practice:** Ecommerce content QA / PDP completeness checklists; return-reason analyses citing missing specs.

### 4. Policy clarity (`policy_clarity`)

**What:** Return / warranty language that is not hostile or missing.  
**Why:** “No returns” and unclear guarantee wording hurt conversion and can conflict with platform or consumer rules. Clear return windows are a standard trust signal in marketplace UX research.  
**Good range:** ≥ 70  
**Sources / practice:** Marketplace return-policy requirements; trust-factor studies on returns messaging.

### 5. Content efficiency (`content_efficiency`)

**What:** Information density vs keyword stuffing / repetition.  
**Why:** Stuffing hurts readability and can trigger spam filters; benchmarks for “helpful content” favor unique, scannable copy over repeated tokens.  
**Good range:** ≥ 60 unique-token ratio heuristic  
**Sources / practice:** Helpful-content / anti-spam listing guidance; simple lexical-diversity proxies used in content QA tooling.

---

## LLM-run Deci dimensions (monitoring history)

Still used when scoring raw model runs (`completion`, `latency`, `efficiency`, `keywords`, `length`).  
They answer “did the model answer well and efficiently?”, not “is this listing publishable?”.

---

## Ops KPIs (Grafana)

| Metric | Meaning |
|---|---|
| `listing_gate_analyze_*_total` | PASS / REVIEW / REJECT counts |
| `listing_gate_inference_slots_*` | Active vs max (20) concurrent analyzes |
| `listing_gate_capacity_rejected_total` | Switch-out killer 503s |
| `listing_gate_analyze_latency_ms_avg` | Average Gate analyze latency |

See [DOCKER.md](./DOCKER.md) for Grafana access.
