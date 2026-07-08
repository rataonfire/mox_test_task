# TEST PLAN: Ферма невидимых кроликов
## Interactive Rabbit-Population Dashboard – QA Specification

**Product**: Ферма невидимых кроликов (Invisible Rabbit Farm) – React+Vite+TS dashboard
**Test Basis**: Binding spec v1.0 (frozen, not implementation)
**Planned by**: Senior Test Architect  
**Audit Object**: Vitest suite (35 tests), deployed URL or vite preview  
**Test Environment**: `TEST_ENV_URL` ← set at Gate 1 (Vercel URL or `http://localhost:4173`)

---

## 1. RISK ANALYSIS: TOP-5 PRODUCT RISKS

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|-----------|
| 1 | Engine math diverges from oracle (contribution, confidence, range formulas) | FR-4, FR-5, FR-6 broken; silent wrong advice to farmer | High | L2 oracle convergence table; G0–G9 crisp numeric checks per Layer 3 |
| 2 | Hardcoded explanations (FR-12 violation): changing data doesn't update «почему» text or numbers | Explanations become stale; farmer loses trust | High | L3 dynamic trace: edit signal → verify explanation text updates; grep for hardcoded numbers in UI source |
| 3 | JSON import/export round-trip failure or corruption (FR-3) | Data loss; farmer can't save/load work | Medium | L2 export → L3 import → L3 identical output check; G7 malformed-JSON error handling |
| 4 | Layout broken on mobile (390px; FR-5 UI rules) or horizontal scroll at 1280×800 | Job-story timeline failure: farmer can't finish in 60 s | Medium | L5 responsive audit: 1280×800 and 390×844 screenshots; scroll checks |
| 5 | Console errors or network calls at runtime (FR spec: "fully static") | Breaks cold-load contract; audit fails | Medium | L6 cold load < 3 s; L6 network activity monitor; L5 console-error scan |

---

## 2. TRACEABILITY MATRIX: Functional Requirements → Test Coverage

| FR ID | Requirement | Layer(s) | Test ID(s) | Golden Dataset(s) | Evidence Type | Status |
|-------|-------------|----------|------------|------------------|---------------|--------|
| **FR-1** | Seed JSON preloaded; "Сбросить к исходным данным" restores it | L1 L3 | T-1.1 T-1.2 | G0 (seed) | Screenshot + JSON export | ✓ Testable |
| **FR-2** | Add/edit/delete/toggle signals; fields validated (type dropdown, location text, count≥0, intensity 1–10, time HH:MM) | L1 L3 L4 | T-2.1 T-2.2 T-2.3 T-2.4 T-2.5 | G1, G5 | UI interaction + error messages | ✓ Testable |
| **FR-3** | JSON import (validated, Russian errors) + export; round-trip fidelity | L1 L3 L4 | T-3.1 T-3.2 T-3.3 T-3.4 | G0, G7 | Import/export JSON + comparator | ✓ Testable |
| **FR-4** | Headline estimate: integer + range, live recompute | L2 L3 | T-4.1 T-4.2 T-4.3 | G0, G3, G4 | L2 oracle table + screenshot | ✓ Oracle-bound |
| **FR-5** | Confidence 0–100% + label (низкая/средняя/высокая) + color + explanation | L2 L3 L5 | T-5.1 T-5.2 T-5.3 T-5.4 | G0, G1, G9_CONF_40, G9_CONF_70 | L2 score/label checks + CSS color audit | ✓ Oracle-bound + Color audit |
| **FR-6** | Ranked contribution breakdown, top-3 drivers obvious | L2 L3 | T-6.1 T-6.2 | G0 | Oracle contribution order; screenshot | ✓ Oracle-bound |
| **FR-7** | Per-location estimates; cards match oracle values | L2 L3 | T-7.1 T-7.2 T-7.3 | G0, G6 | L2 per-location oracle table | ✓ Oracle-bound |
| **FR-8** | 2–5 rule-based recommendations with data-referencing reasons | L3 L4 | T-8.1 T-8.2 T-8.3 T-8.4 T-8.5 | G0, G1, G3, G4 | Rec text + reason field | ✓ Testable |
| **FR-9** | Params panel: sliders (weights, overlap discount, uncertainty width, confidence threshold); reset-to-defaults | L3 L4 | T-9.1 T-9.2 T-9.3 T-9.4 T-9.5 | G0, G8 | Slider interaction + output verification | ✓ Testable |
| **FR-10** | 2–3 one-click scenario presets | L3 | T-10.1 T-10.2 T-10.3 | G0 (seed), QUIET_MORNING, INVASION | Screenshot per preset | ✓ Testable |
| **FR-11** | In-app "AI Worklog" tab with 5–7 checkpoints, six MOX themes | L1 L3 L5 | T-11.1 T-11.2 | Worklog data | Screenshot + checkpoint count | ✓ Testable |
| **FR-12** | Every computed number has a "почему" derived from computation, not hardcoded | L3 L4 L5 | T-12.1 T-12.2 T-12.3 | G0, G3 | Source code grep for hardcoded numbers + dynamic trace | ✓ Testable |

**Coverage Summary**: All 12 FRs mapped; 37 discrete test IDs across 6 layers; every numeric FR (4, 5, 6, 7) anchored to L2 oracle.

---

## 3. GOLDEN DATASET EXPECTED VALUES

All formulas and expected values derived from **binding spec § Oracle** only. Computed via `qa/oracle/oracle.mjs` (no product code imported).

### **G0: SEED + DEFAULTS** → BINDING REFERENCE
```
Input:
  evt_001: missing_carrot, Огород, count=5, intensity=4
  evt_002: new_hole, У забора, count=2, intensity=7
  evt_003: motion_sensor, Сарай, count=1, intensity=8
  evt_004: rustle_detected, Сарай, count=3, intensity=5
  evt_005: footprints, Теплица, count=6, intensity=6

Contributions (count × typeWeight × (0.5 + intensity/10)):
  evt_001: 5 × 0.4 × (0.5 + 0.4) = 5 × 0.4 × 0.9 = 1.8
  evt_002: 2 × 1.2 × (0.5 + 0.7) = 2 × 1.2 × 1.2 = 2.88
  evt_003: 1 × 1.0 × (0.5 + 0.8) = 1 × 1.0 × 1.3 = 1.3
  evt_004: 3 × 0.5 × (0.5 + 0.5) = 3 × 0.5 × 1.0 = 1.5
  evt_005: 6 × 0.3 × (0.5 + 0.6) = 6 × 0.3 × 1.1 = 1.98

Per-location estimates (sort contribs desc, apply d=0.6):
  Огород (1 signal): 1.8
  У забора (1 signal): 2.88
  Сарай (2 signals, sorted [1.5, 1.3]): 1.5 + 1.3×0.6 = 1.5 + 0.78 = 2.28
  Теплица (1 signal): 1.98

Raw estimate: 1.8 + 2.88 + 2.28 + 1.98 = 8.94
Rabbits: round(8.94) = 9

Confidence calculation:
  diversity = 5/5 = 1.0  → 30×1.0 = 30
  corroboration = 1/4 = 0.25 (only Сарай has ≥2)  → 30×0.25 = 7.5
  volume = min(5/8, 1) = 0.625  → 25×0.625 = 15.625
  quality = (4+7+8+5+6)/5 / 10 = 6.0/10 = 0.6  → 15×0.6 = 9.0
  scoreRaw = 30 + 7.5 + 15.625 + 9 = 62.125
  confidenceScore = round(62.125) = 62

Confidence label: 40 ≤ 62 ≤ 70 → "средняя"

Range:
  w = (1 - 62.125/100) × 0.5 = 0.37875 × 0.5 = 0.189375
  low = floor(9 × (1 - 0.189375)) = floor(9 × 0.810625) = floor(7.296) = 7
  high = ceil(9 × (1 + 0.189375)) = ceil(9 × 1.189375) = ceil(10.704) = 11
  min-width check: 7 ≤ 8 ✓, 11 ≥ 10 ✓

EXPECTED OUTPUT:
  rabbits = 9
  confidence = 62%
  label = "средняя"
  range = [7, 11]
  contributions (top-3): evt_002 (2.88), evt_003 + evt_004 agg by location (2.28 at Сарай)
  recommendations ≈ 3: hotspot (У забора), new-hole warn, missing-carrot warn
```

---

### **G1: EMPTY (no signals)**
```
Input: []

EXPECTED:
  rabbits = 0
  confidence = 0%
  label = "низкая"
  range = [0, 0]
  recommendations = 1: "Сигналов нет. Либо кроликов нет, либо они стали ещё невидимее — проверьте датчики."
  No NaN on screen; no crash
```

---

### **G2: ALL SIGNALS TOGGLED OFF** (treated same as empty for estimate; ignored in calculation)
```
Input: SEED with all active: false

EXPECTED:
  rabbits = 0
  confidence = 0%
  label = "низкая"
  (same as G1)
```

---

### **G3: SINGLE FOOTPRINT (count=1, intensity=1)**
```
Input: [{ id: 'tiny', event: 'footprints', location: 'Test', count: 1, intensity: 1 }]

Contribution: 1 × 0.3 × (0.5 + 0.1) = 1 × 0.3 × 0.6 = 0.18
Raw estimate: 0.18 → round(0.18) = 0 → min-1 rule → 1

Confidence:
  diversity = 1/5 = 0.2  → 30×0.2 = 6
  corroboration = 0/1 = 0  → 0
  volume = min(1/8, 1) = 0.125  → 25×0.125 = 3.125
  quality = 1/10 = 0.1  → 15×0.1 = 1.5
  scoreRaw = 6 + 0 + 3.125 + 1.5 = 10.625
  confidenceScore = round(10.625) = 11

Range:
  w = (1 - 10.625/100) × 0.5 = 0.89375 × 0.5 = 0.446875
  low = floor(1 × 0.553125) = floor(0.553) = 0
  high = ceil(1 × 1.446875) = ceil(1.446) = 2
  min-width: 0 ≤ 0 ✓, 2 ≥ 2 ✓

EXPECTED:
  rabbits = 1
  rawEstimate = 0.18
  confidence = 11%
  label = "низкая"
  range = [0, 2]
  Rule-4 recommendation (low confidence) should fire
```

[SPEC-GAP-1]: Range calculation: is the minimum width (±1) enforced when rabbits rounds to 0 via min-1 rule but rawEstimate < 0.5? Current formula suggests yes (enforced if rabbits >= 1). **RESOLUTION**: Per spec min-1 rule: if rawEstimate > 0 but rounds to 0, set rabbits=1. Range width is then enforced because rabbits >= 1. Verified in code: yes, min-width applied.

---

### **G4: HUGE COUNT (count=9999, intensity=10)**
```
Input: [{ id: 'huge', event: 'missing_carrot', location: 'Huge', count: 9999, intensity: 10 }]

Contribution: 9999 × 0.4 × (0.5 + 1.0) = 9999 × 0.4 × 1.5 = 5999.4
Raw: 5999.4 → rabbits = 5999

Confidence (1 signal, 1 type, 1 location, intensity 10):
  diversity = 1/5 = 0.2  → 6
  corroboration = 0/1 = 0  → 0
  volume = min(1/8, 1) = 0.125  → 3.125
  quality = 10/10 = 1.0  → 15
  scoreRaw = 6 + 0 + 3.125 + 15 = 24.125
  confidenceScore = 24

Invasion alert (rabbits ≥ 10): should fire

EXPECTED:
  rabbits = 5999
  confidence = 24%
  range finite, no NaN/Infinity, no layout break
  Recommendation: "Похоже на нашествие: усильте периметр и пересчитайте запасы моркови."
```

---

### **G5: INVALID INPUT (negative count, NaN, intensity < 1, intensity > 10)**
```
Test cases via UI form and JSON import:

Case 1: negative count → UI form rejects / JSON import returns Russian error
Case 2: "count": "пять" (string) → JSON import error
Case 3: intensity = 0 → rejected
Case 4: intensity = 11 → rejected

EXPECTED:
  All rejected with Russian error message naming the problem
  Current data unchanged
  No crash
  Examples:
    "count должен быть числом ≥ 0, получено: -5"
    "count должен быть числом, получено: пять"
    "intensity должна быть число от 1 до 10, получено: 0"
```

---

### **G6: LOCATION CASING (Сарай vs сарай vs  сарай )**
```
Input: Two signals with same location, different casing/spacing:
  sig1: location = "Сарай"
  sig2: location = " сарай "

EXPECTED BEHAVIOR: Spec does not explicitly mandate merge, but engine normalizes (trim + lowercase key). Behavior: silent merge into one location entry "Сарай" (first-casing-seen or canonical).

[SPEC-GAP-2]: Casing normalization not explicitly stated. **RESOLUTION**: UI should display consistently by canonical casing (first occurrence or all uppercase first letter). No farmer-visible defect if merged silently; minor if split into two locations. Verify by: add "Сарай", then add " сарай " signal → check byLocation array length.
```

---

### **G7: MALFORMED JSON**
```
Test cases:
1. Trailing comma: [..., {...},]
2. Non-array: {"data": [...]}
3. Missing field: [{"id": "x", "event": "missing_carrot"}] (missing location)
4. Invalid enum: "event": "unknown_type"
5. Type mismatch: "count": "пять"
6. Invalid time: "time": "25:99"

EXPECTED:
  Each case: Russian error message naming the problem
  Current data preserved (import cancelled)
  No crash
  
  Examples:
    "Ошибка JSON: неверный формат"
    "Поле 'location' обязательно в объекте 0"
    "Неизвестный тип события: unknown_type. Допустимые: missing_carrot, new_hole, motion_sensor, rustle_detected, footprints"
    "Поле 'count' должно быть числом, получено: пять"
    "Неверный формат времени: 25:99. Ожидается HH:MM (00:00–23:59)"
```

---

### **G8: SLIDER EXTREMES (params grid)**
```
Overlap discount (default 0.6):
  d = 0.3 (min) → lower rawEstimate (more discount)
  d = 1.0 (max) → rawEstimate = plain sum (no discount)
  
  Test on multi-signal-per-location dataset (e.g., Сарай with 2 signals):
  With d=0.3: locEst = 1.5 + 1.3×0.3 = 1.5 + 0.39 = 1.89
  With d=0.6: locEst = 1.5 + 1.3×0.6 = 2.28
  With d=1.0: locEst = 1.5 + 1.3×1.0 = 2.8
  
  Change should be visible in final rabbits count (may not shift rounded headline if crossing 0.5 boundary).

Weight sliders (per type, default per spec):
  missing_carrot: 0–2.0 (default 0.4)
  Setting to 0 → zero contribution from that type
  Monotonicity: increase weight → increase estimate

Uncertainty width (default 0.5):
  0.0 → range collapses to [rabbits, rabbits]
  1.0 → range expands proportionally
  Effect visible on low-confidence estimates

Confidence threshold (default 40):
  Rule-4 fires if confidence < threshold
  Changing threshold → recommendation list changes
  
EXPECTED:
  All sliders monotonic in expected direction
  No NaN/Infinity/crash
  Output recomputes instantly (visible in estimate card)
```

---

### **G9_CONF_40: CONFIDENCE BOUNDARY AT EXACTLY 40%**
```
Oracle search yields:
  8 single-type signals (missing_carrot) at various locations, intensity=6:
    [{ id: 'b1', event: 'missing_carrot', location: 'L1', count: 1, intensity: 6 },
     { id: 'b2', event: 'missing_carrot', location: 'L2', count: 1, intensity: 6 },
     ...
     { id: 'b8', event: 'missing_carrot', location: 'L8', count: 1, intensity: 6 }]

Confidence = 30*(1/5) + 30*(0/8) + 25*(8/8) + 15*(6/10)
           = 6 + 0 + 25 + 9 = 40

EXPECTED:
  confidence = 40%
  label = "средняя" (because 40 ≤ score ≤ 70 per spec boundary definition)
  color = amber

This tests the exact boundary: 40 is inclusive to "средняя", not exclusive.
```

---

### **G9_CONF_70: CONFIDENCE BOUNDARY AT EXACTLY 70%**
```
Verified exact dataset (orchestrator-corrected; lands at 70.0 with no rounding):
  All 5 event types at L1 + 3 extra missing_carrot at L2..L4, count 1, intensity 5:
    [{ id: 'h1', event: 'missing_carrot',  location: 'L1', count: 1, intensity: 5 },
     { id: 'h2', event: 'new_hole',        location: 'L1', count: 1, intensity: 5 },
     { id: 'h3', event: 'motion_sensor',   location: 'L1', count: 1, intensity: 5 },
     { id: 'h4', event: 'rustle_detected', location: 'L1', count: 1, intensity: 5 },
     { id: 'h5', event: 'footprints',      location: 'L1', count: 1, intensity: 5 },
     { id: 'h6', event: 'missing_carrot',  location: 'L2', count: 1, intensity: 5 },
     { id: 'h7', event: 'missing_carrot',  location: 'L3', count: 1, intensity: 5 },
     { id: 'h8', event: 'missing_carrot',  location: 'L4', count: 1, intensity: 5 }]

Confidence = 30*(5/5) + 30*(1/4) + 25*(8/8) + 15*(5/10)
           = 30 + 7.5 + 25 + 7.5 = 70.0 exactly

EXPECTED:
  confidence = 70%
  label = "средняя" (spec: >70 is «высокая», so exactly 70 stays «средняя»)
  color = amber

NOTE (history): the architect's first G9_70 dataset landed at 74.75→75 — caught by the
orchestrator running the oracle; replaced with this exact-70 set before Gate 1.
The 75% variant may be reused informally as a nearby «высокая» probe (75 > 70).
```

---

### **G10: DETERMINISM (cold load, reload)**
```
Action 1: Load G0 seed → observe output
Action 2: Reload page (F5 / Ctrl+R)
Action 3: Load G0 seed again → compare output

EXPECTED:
  Output identical byte-for-byte (same rabbits, confidence, range, rec list)
  No Date.now() or randomness in engine
  localStorage (if used) recovers state consistently
```

---

## 4. CONCRETE E2E SCRIPT FOR PHASE 3 (Playwright)

### **Assumptions**
- `TEST_ENV_URL` set to deployed URL or `http://localhost:4173` (vite preview)
- Playwright installed; evidence written to `qa/evidence/` with timestamps
- All test data computed from oracle; no product-code assumptions

### **E2E Test Skeleton**

```yaml
PHASE 3A: ORACLE VERIFICATION (Layer 2)

Step 1: Run oracle script
  Action: node qa/oracle/oracle.mjs
  Expected: G0 = 9 rabbits, 62%, 7–11; G3 = 1 rabbit, 11%, 0–2; all golden datasets computed
  Evidence: qa/evidence/oracle_output.txt (stdout)

Step 2: Compare UI values vs oracle
  Action: Load TEST_ENV_URL, inspect initial state (G0 seed pre-loaded)
  Expected: Headline shows "≈ 9 кроликов (7–11)", confidence "62% — средняя"
  Evidence: qa/evidence/g0_initial_headline.png

---

PHASE 3B: FUNCTIONAL WALK-THROUGH (Layer 3)

Step 3: Add signal (T-2.1)
  Action: Click "Добавить сигнал", fill type="новая ямка", location="Новое место", count=1, intensity=5, time="12:00", submit
  Expected: 
    - Signal appears in table
    - Estimate recomputes visibly (rabbits may increase)
    - No page reload
  Evidence: qa/evidence/add_signal.png

Step 4: Edit signal (T-2.2)
  Action: Click evt_001, change count=5→10, save
  Expected:
    - Estimate increases (more carrots missing)
    - Confidence may change
  Evidence: qa/evidence/edit_signal.png

Step 5: Toggle signal off (T-2.4)
  Action: Uncheck checkbox for evt_001
  Expected:
    - evt_001 excluded from calculation
    - Estimate drops
    - Recommendation list changes (fewer signals)
  Evidence: qa/evidence/toggle_signal_off.png

Step 6: Delete signal (T-2.3)
  Action: Click delete icon for evt_002
  Expected:
    - evt_002 removed
    - Estimate changes
    - UI updates instantly
  Evidence: qa/evidence/delete_signal.png

Step 7: Reset to seed (T-1.2)
  Action: Click "Сбросить к исходным данным"
  Expected:
    - All SEED_DATA signals restored
    - Estimate = 9, confidence = 62%
    - Previous edits reverted
  Evidence: qa/evidence/reset_to_seed.png

---

PHASE 3C: PARAMETERS (Layer 3)

Step 8: Adjust overlap-discount slider (T-9.1)
  Action: Move "Скидка за пересечение" slider from 0.6 → 0.3
  Expected:
    - Estimate decreases (more discount = lower aggregate)
    - Confidence may not change (independent metric)
  Evidence: qa/evidence/overlap_discount_0.3.png

Step 9: Adjust type weight (T-9.2)
  Action: Increase "Новая ямка" weight 1.2 → 1.8
  Expected:
    - evt_002 contribution increases (since it's new_hole)
    - Estimate increases
  Evidence: qa/evidence/weight_new_hole_1.8.png

Step 10: Reset params to defaults (T-9.5)
  Action: Click "Сброс" button in Params panel
  Expected:
    - All sliders return to defaults
    - Estimate returns to pre-adjustment value
  Evidence: qa/evidence/reset_params.png

---

PHASE 3D: JSON IMPORT/EXPORT (Layer 3)

Step 11: Export current signals (T-3.2)
  Action: Click "Экспорт JSON"
  Expected:
    - Modal with JSON text appears
    - JSON is valid, formatted, includes all 5 seed signals
    - "active" field omitted for true, included for false
  Evidence: qa/evidence/export_json.txt (raw JSON)

Step 12: Round-trip import (T-3.3)
  Action: Copy exported JSON, clear signals, click "Импорт JSON", paste, submit
  Expected:
    - Import succeeds (no error modal)
    - Signals restored identical
    - Estimate matches original
  Evidence: qa/evidence/import_roundtrip.png

Step 13: Malformed JSON error (T-3.4, G7)
  Action: Click "Импорт JSON", paste: [{"id":"x","event":"missing_carrot"}], submit
  Expected:
    - Error modal: Russian message naming missing field "location"
    - Current signals unchanged
    - Modal can be closed
  Evidence: qa/evidence/malformed_json_error.png

Step 14: Negative count rejection (T-2.5, G5)
  Action: Via JSON import, paste: [{"id":"x","event":"missing_carrot","location":"L","count":-5,"intensity":5,"time":"12:00"}]
  Expected:
    - Error: Russian message mentioning -5, count must be ≥ 0
    - Import rejected
  Evidence: qa/evidence/negative_count_error.png

---

PHASE 3E: SCENARIOS (Layer 3)

Step 15: Load "Тихое утро" scenario (T-10.1)
  Action: Click preset button "Тихое утро"
  Expected:
    - Signals table updates to QUIET_MORNING (2 signals, low intensity)
    - Estimate decreases to 2–3 rabbits
    - Confidence lower (fewer signal types)
  Evidence: qa/evidence/scenario_quiet_morning.png

Step 16: Load "Нашествие" scenario (T-10.2)
  Action: Click preset button "Нашествие"
  Expected:
    - Signals table updates to INVASION (7 high-count signals)
    - Estimate increases significantly (≥10)
    - Invasion alert recommendation appears
  Evidence: qa/evidence/scenario_invasion.png

---

PHASE 3F: CONFIDENCE & RECOMMENDATIONS (Layer 3)

Step 17: Verify confidence label and color (T-5.1)
  Action: On G0 seed, inspect confidence gauge
  Expected:
    - Text: "62% — средняя"
    - Color: amber (CSS var or hex)
    - Factors listed: Разнообразие, Перекрёстные сигналы, Объём, Чёткость
  Evidence: qa/evidence/confidence_gauge.png + CSS inspection output

Step 18: Low confidence alert (T-5.2, G9_CONF_40)
  Action: Clear all signals except 1 low-intensity → confidence < 40
  Expected:
    - Label: "низкая" (red)
    - Recommendation: "Оценка ненадёжна — добавьте датчики..."
  Evidence: qa/evidence/low_confidence_alert.png

Step 19: Invasion alert (T-8.4, G4)
  Action: Add signal: missing_carrot, count=50, intensity=10
  Expected:
    - rabbits ≥ 10
    - Recommendation: "Похоже на нашествие: усильте периметр..."
    - Severity: alert (red)
  Evidence: qa/evidence/invasion_alert.png

Step 20: Per-location cards (T-7.1)
  Action: On G0 seed, inspect byLocation grid
  Expected:
    - 4 cards: Огород, У забора, Сарай, Теплица
    - Estimates match oracle: 1.8, 2.88, 2.28, 1.98
    - Sorted by estimate desc
  Evidence: qa/evidence/per_location_cards.png

---

PHASE 3G: WORKLOG TAB (Layer 3)

Step 21: Navigate to Worklog (T-11.1)
  Action: Click "AI Worklog" tab
  Expected:
    - Tab renders
    - 5–7 checkpoints visible
    - Each checkpoint has: title, phase, prompt, result, decision, verification
  Evidence: qa/evidence/worklog_tab.png

Step 22: Verify MOX themes (T-11.2)
  Action: Skim checkpoint titles and descriptions
  Expected:
    - Six themes covered: постановка задачи, архитектура, свои решения vs AI, доработка логики/UX, найденные ошибки, финальная проверка
  Evidence: qa/evidence/worklog_themes_checklist.txt

---

PHASE 3H: HARDCODE DETECTION (Layer 3, T-12)

Step 23: Hardcode detector (T-12.1)
  Action: Edit evt_001 count 5 → 8, observe explanation text
  Expected:
    - Contribution explanation updates (not static)
    - "вклад" number changes from 1.8 → 2.88 (approximately)
  Evidence: qa/evidence/hardcode_explanation_change.png

Step 24: Source code grep (T-12.2)
  Action: grep -r "≈ [0-9]+" src/ (look for hardcoded numbers in UI text)
  Expected:
    - No matches of expected-value numbers (9, 62%, 7–11, 1.8, etc.)
    - Explanation strings are template/dynamic, not hardcoded
  Evidence: qa/evidence/hardcode_grep_output.txt

---

PHASE 3I: RESPONSIVE & UX (Layer 5)

Step 25: Responsive at 1280×800 (T-5.4)
  Action: Set viewport to 1280×800, reload
  Expected:
    - All content visible without horizontal scroll
    - Layout intact (header, main, sidebar)
    - No cutoff
  Evidence: qa/evidence/responsive_1280x800.png

Step 26: Responsive at 390×844 (mobile, T-5.4)
  Action: Set viewport to 390×844, reload
  Expected:
    - Columns stack vertically
    - No horizontal scroll
    - Touch-friendly spacing
    - Sliders usable
  Evidence: qa/evidence/responsive_390x844.png

Step 27: Copy check (jargon hunt, T-5.4)
  Action: Inspect all visible text on screen
  Expected:
    - All UI text in Russian (no untranslated English like "intensity", "confidence score", "AI Worklog" is OK per spec)
    - No lorem ipsum
    - Friendly-concrete tone ("кроликов", "морковь", "сигналы")
  Evidence: qa/evidence/ui_copy_audit.txt

Step 28: Job-story timing (T-5.4)
  Action: Simulate non-technical farmer interaction
    1. Cold load → read headline estimate  (< 10 s?)
    2. Edit signal → see recalc (< 1 s)
    3. Add signal → see recalc (< 1 s)
    4. Reset → see restore (instant)
  Expected: All edits recompute within 60 s total (per job story)
  Evidence: qa/evidence/job_story_timing.md (checklist + timestamps)

---

PHASE 3J: NON-FUNCTIONAL (Layer 6)

Step 29: Cold load time (T-6 L6)
  Action: Hard-reload (Ctrl+Shift+R, clear cache), measure time to page interactive
  Expected: < 3 s
  Evidence: qa/evidence/cold_load_time.txt (browser DevTools metrics)

Step 30: Console errors (T-6 L6)
  Action: Open DevTools → Console, reload, wait 5 s
  Expected:
    - No red errors
    - No warnings mentioning API, fetch, XHR
    - Only info/debug if any
  Evidence: qa/evidence/console_errors.png (screenshot)

Step 31: Network calls (T-6 L6)
  Action: Open DevTools → Network, reload, wait 5 s
  Expected:
    - No outgoing XHR/fetch (except favicon, fonts)
    - No API calls
    - All resources local (HTML, JS, CSS from vite)
  Evidence: qa/evidence/network_requests.txt (filtered list)

Step 32: localStorage guard (if used, T-6 L6)
  Action: Dev console: set localStorage to invalid JSON, reload
  Expected:
    - No crash
    - App loads with seed (fallback to default)
    - try/catch caught the error
  Evidence: qa/evidence/localstorage_fallback.txt

---

PHASE 3K: BUILD & DEPLOYMENT (Layer 1, L6)

Step 33: Verify deliverables (T-11.2, L6 L7)
  Action: Check repo for:
    - README.md (Russian, 5-min read)
    - WORKLOG.md (with checkpoints)
    - .git/tags: v1.0 exists
    - No .env, secrets, paths in source
  Expected:
    - All present
    - No secrets/emails/API keys
  Evidence: qa/evidence/deliverables_audit.txt

Step 34: Build & test baseline (L1, already done)
  Action: npm ci && npm run build && npm test
  Expected:
    - exit 0
    - 35 tests pass
    - zero errors
  Evidence: qa/evidence/ci_baseline.txt (stdout)
```

---

## 5. EXIT CRITERIA & DEFECT SEVERITY RUBRIC

### **Exit Criteria (All must be met to pass)**

1. **Oracle Convergence**: Layer 2 oracle verification table shows ≤0.5% numerical deviation on G0–G10 (rabbits, confidence, range).
2. **FR Traceability**: All 12 FRs traced to ≥1 executed test; no untested FRs.
3. **E2E Walkthrough**: Phase 3A–3K executed; all evidence screenshots/logs present in `qa/evidence/`.
4. **Console Clean**: Zero errors in DevTools console; warnings only if acknowledged as non-blocking.
5. **Static Guarantee**: No API calls, no network timeouts, no localStorage corruption.
6. **Worklog Present**: "AI Worklog" tab renders; 5–7 checkpoints; six MOX themes identifiable.
7. **Deliverables**: README, WORKLOG.md, no secrets, v1.0 tag present.
8. **Build & Tests**: `npm test` exit 0, 35 tests pass.

### **Defect Severity Rubric**

| Severity | Definition | Product Impact | Examples |
|----------|------------|-----------------|----------|
| **BLOCKER** | Breaks core functionality, app crash, math wrong, missing mandatory feature, repo compromise | FR entirely non-functional; farmer gets wrong advice; data loss | FR-4 broken: estimate always 0; FR-12: hardcoded "≈ 9 кроликов" doesn't change; console uncaught error; secret in repo (email, API key); Worklog tab missing; any algorithm divergence >1% vs oracle |
| **MAJOR** | Feature partially broken, wrong output, user-blocking error, untranslated text, broken key flow | Farmer can't complete job story; confusing/untrusted UI; data corruption | FR-3: import corrupts data; FR-5: color not showing or label wrong; FR-8: no recommendations at all; Russian error text missing or English jargon ("intensity") leaks into UI; JSON export has trailing comma (invalid JSON); form rejects valid input |
| **MINOR** | UX/layout/copy issue, non-blocking edge case, ambiguity in spec, cosmetic deviation | Farmer can work around; usability reduced slightly | G6: location casing causes split (two cards for same place); layout broken at one breakpoint; "Сбросить к исходным данным" button label typo; excessive padding/spacing not matching mockup; rounded value off by ±1 due to rounding order ambiguity (handled as SPEC-GAP, not defect) |
| **TRIVIAL** | Cosmetic only, no user impact | None | Font weight differs slightly; icon color shade off by 5%; whitespace inconsistency in JSON export |

### **Product-Specific Examples**

**BLOCKER Example 1**: 
  - Test T-4.1 loads seed, expects headline "≈ 9 кроликов (7–11)".
  - Product shows "≈ 10 кроликов (8–12)" consistently.
  - Oracle confirms correct answer is 9.
  - **Verdict**: BLOCKER — algorithm mismatch, advice wrong.

**BLOCKER Example 2**:
  - Test T-12.1 edits evt_001 count 5→10.
  - Contribution explanation text shows "1.8 кроликов" (unchanged).
  - Headline updates to 10, but explanation stale.
  - **Verdict**: BLOCKER — hardcoded explanation (FR-12 violation).

**MAJOR Example 1**:
  - Test T-3.4 imports malformed JSON (missing "location" field).
  - Error modal shows untranslated message: "Required field 'location' missing at index 0" (English).
  - **Verdict**: MAJOR — FR-3 requires Russian errors.

**MAJOR Example 2**:
  - Test T-5.1 checks confidence color on G0.
  - Confidence is 62% (средняя), but color is green (high).
  - CSS var used correctly, but logic routes to wrong variable.
  - **Verdict**: MAJOR — FR-5 violated; user misled.

**MINOR Example 1**:
  - Test G6 adds signal "Сарай", then " сарай ".
  - Result: two byLocation cards shown (not merged).
  - Spec doesn't forbid split, but UI could normalize display.
  - **Verdict**: MINOR (or SPEC-GAP note) — ambiguous expectation, no farmer confusion if understood as two separate locations.

**MINOR Example 2**:
  - Test T-25 (responsive 1280×800) shows layout intact.
  - Test T-26 (responsive 390×844) shows excessive bottom padding.
  - Farmer can still use, but feels cramped.
  - **Verdict**: TRIVIAL — cosmetic UX only.

---

## 6. OUT OF SCOPE (Explicit Exclusions)

- **No product code fixes**: This plan audits, not modifies product. Any defects flagged are reported; fixes are out of scope.
- **No perf/load testing beyond cold-load < 3 s**: No stress testing, no concurrent users, no large datasets (e.g., 1000 signals).
- **No pen-testing beyond junk input**: SQL injection, XSS via JSON import, etc. are NOT tested. Form validation checks (FR-2, G5) are limited to correctness, not security hardening.
- **No spec expansion**: Spec is frozen. Feature requests (e.g., "add email export", "dark mode") are not in scope.
- **No implementation review**: This plan does not audit code style, refactoring, tech debt, or architecture. Engine tests (L1 Vitest) are audit objects, not targets.
- **No locale/i18n beyond Russian**: English UI or other languages not tested.
- **No accessibility (A11y/WCAG)**: Screen readers, keyboard navigation, color contrast not audited (could be future MINOR layer).

---

## 7. TEST ENVIRONMENT SETUP (Gate 1)

### **Prerequisites**
- Node.js 18+ installed
- `npm install` completed (node_modules/ present)
- `npm run build` successful
- Decision: **TEST_ENV_URL** ← Vercel URL OR `http://localhost:4173` (vite preview)

### **Local Execution (if chosen)**
```bash
cd <repo-root>
npm run preview &
# Wait 5 s for Vite to bind to :4173
# Export TEST_ENV_URL=http://localhost:4173
# Run Playwright tests
```

### **Vercel Execution (if chosen)**
```bash
# Product owner deploys to Vercel
# Export TEST_ENV_URL=https://[vercel-url]
# Run Playwright tests (no local vite needed)
```

---

## 8. SPEC-GAPS & PROPOSED RESOLUTIONS

| ID | Gap | Spec Statement | Ambiguity | Proposed Resolution |
|----|----|---|---|---|
| **SPEC-GAP-1** | Range minimum width on tiny estimates | "min width ±1 when rabbits ≥ 1" | What if rabbits rounds to 0 via min-1 rule, then is set to 1? | Per spec, min-1 rule applies first (rabbits = 1), then min-width enforced (range ≥ [0, 2]). **RESOLUTION**: Test G3 verifies this. Accept as implemented. |
| **SPEC-GAP-2** | Location casing normalization | Spec is silent on «Сарай» vs «сарай» | Merge into one location or split into two? Neither is spec-mandated | **RESOLUTION**: G6 OBSERVES actual behavior (no implementation assumption). Merge with consistent display = PASS; silent split into two locations = Minor defect candidate (inflates estimate via lost overlap discount); crash/NaN = Major. Human confirms at Gate 1. |
| **SPEC-GAP-3** | Confidence rounding boundary | "≤70 → средняя, >70 → высокая" | Does exactly 70 round up or stay at 70? Does scoreRaw=70.5 round to 71? | Spec: "70 ≤ score ≤ 70 → средняя" (explicit). Round scoreRaw to int, then check int. 70.5 → 71 (alta). **RESOLUTION**: Test G9 boundaries at ±0.5 of 40 and 70; verify label. Accept rounding order as implemented. |
| **SPEC-GAP-4** | "AI Worklog" as tab name | Spec calls it "AI Worklog" (English) in FR-11 | Is English tab name acceptable or anglicism defect? | Spec explicitly names it "AI Worklog", so this is NOT a defect. It's the assignment's own artifact name. **RESOLUTION**: Verify tab renders with this exact label; not a jargon violation. |
| **SPEC-GAP-5** | Range calculation on displayed vs raw estimate | "range = estimate × (1 ± (1−confidence)×width)" — «estimate» unpinned | From raw 8.94 or displayed 9? Also: «confidence» in the width — raw score (62.125) or rounded (62)? | **RESOLUTION**: oracle computes range from the DISPLAYED rabbits (G0 → [7,11]; G3 → [0,2] pins the choice: raw 0.18 would give [0,1]). Raw-vs-rounded confidence in the width is also unpinned; either is conformant unless the outward rounding lands differently — the L2 convergence table must surface any such diff as a [SPEC-GAP] escalation, not an automatic defect. |
| **SPEC-GAP-6** | "почему" explanation for zero values | If count=0 or intensity=1 edge cases, what's the explanation template? | Spec doesn't detail 0-contribution explanation format | Follow product implementation (if explained at all) or skip zero-contrib rows. **RESOLUTION**: L3 test T-12.1 verifies explanation updates dynamically; exact text format not binding as long as it changes. |

**Total SPEC-GAPs**: 6 identified, all with proposed resolutions; none block test execution.

---

## 9. LAYER DEFINITIONS & EVIDENCE MAPPING

| Layer | Purpose | Tools | Evidence Artifact | Example Test IDs |
|-------|---------|-------|-------------------|------------------|
| **L1** | Engine baseline (unit test audit) | Vitest | `qa/evidence/ci_baseline.txt` | (pre-done: 35 tests) |
| **L2** | Oracle convergence (spec-only reference values) | Node.js oracle.mjs | `qa/evidence/oracle_output.txt`, `qa/oracle/oracle.mjs` | T-4.1, T-5.1, T-6.1, T-7.1 |
| **L3** | Functional E2E via UI (Playwright) | Playwright + TEST_ENV_URL | `qa/evidence/{step}_{description}.png` | T-1.1 thru T-12.3 |
| **L4** | Negative/edge via UI & JSON | Playwright | `qa/evidence/{test}_{case}.png` | T-2.5, T-3.4, T-5.2 (G1, G5, G7) |
| **L5** | UX/copy/responsive audit | Visual inspection + grep | `qa/evidence/responsive_*.png`, `qa/evidence/ui_copy_audit.txt` | T-5.4, T-11.2, T-12.2 |
| **L6** | Non-functional (cold load, errors, network) | DevTools + Playwright | `qa/evidence/cold_load_time.txt`, `qa/evidence/console_errors.png`, `qa/evidence/network_requests.txt` | T-6 (Light) |
| **L7** | Deliverables & redaction audit | Bash + grep | `qa/evidence/deliverables_audit.txt` | (Separate from FR; final gate) |

---

## 10. TEST EXECUTION CHECKLIST (Phase 3)

- [ ] Gate 1: TEST_ENV_URL decided (Vercel or localhost:4173)
- [ ] Step 1–2: Oracle script runs; G0–G10 computed
- [ ] Step 3–34: All E2E steps executed sequentially
- [ ] All evidence files present in `qa/evidence/`
- [ ] Console clean (no red errors)
- [ ] Build & tests baseline (npm test exit 0)
- [ ] Worklog tab renders (FR-11)
- [ ] No secrets in repo (FR deliverables)
- [ ] All 12 FRs traced; at least 1 test per FR
- [ ] Zero BLOCKER or MAJOR defects found (or defects logged with rejection criteria)
- [ ] Test plan sign-off: Senior test architect confirms coverage

---

## 11. DEFINITIONS & GLOSSARY

| Term | Definition |
|------|-----------|
| **Oracle** | Binding reference model (spec formulas only, no code); source of truth for expected values |
| **Golden Dataset** | Spec-prescribed input + oracle-computed expected output; used as crisp acceptance criteria |
| **Binding Numbers** | Expected values from oracle; illustrative figures in mockups are NOT binding |
| **"почему"** | Russian for "why"; spec term for explanation text (derivation of every computed number) |
| **Hardcode Detector** | Check that explanations and numbers update when data changes (not static in code) |
| **E2E** | End-to-end; user-facing workflow test via Playwright (not unit tests) |
| **Smoke Test** | Quick sanity check (e.g., cold load, seed loads, headline renders) |
| **TEST_ENV_URL** | Placeholder for deployed environment (Vercel URL or vite preview) |
| **Spec-Gap** | Ambiguity in spec not resolved by oracle formula; noted and proposed resolution provided |

---

## 12. APPENDIX: Oracle Script Location

**File**: `qa/oracle/oracle.mjs`

**Execution**:
```bash
node qa/oracle/oracle.mjs
```

**Output**: Console table of G0–G10 expected values (rabbits, confidence%, label, range, per-location estimates, contributions).

**Scope**: Spec formulas only; no product imports; pure derivation.

---

## SUMMARY

This test plan covers all 12 functional requirements (FRs) across 6 test layers, with explicit oracle-bound golden datasets (G0–G10) and a 34-step E2E walkthrough. Every numeric expectation is derived from spec formulas, not product code. Defect severity rubric and spec-gap resolutions ensure consistent gate decisions. Evidence traces every test to `qa/evidence/` artifacts. Plan is executable by a fresh session given only this document and `TEST_ENV_URL`.

**Next Step**: Gate 1 → Decide TEST_ENV_URL → Execute Phase 3A–3K E2E script → Collect evidence → Compare to this plan's oracle table → PASS/FAIL verdict.

---

**Plan Generated**: 2026-07-08  
**Spec Frozen**: Binding (no changes accepted)  
**Status**: Ready for Phase 3 execution
