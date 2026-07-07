# MOX Invisible Rabbits Farm Dashboard — Implementation Plan

**Author:** Frontend Architect  
**Date:** 2026-07-07  
**Deliverable:** React 18 + Vite + TypeScript dashboard for Russian-speaking farmer

---

## 1. COMPONENT TREE & PROPS FLOW

### Root: `App.tsx`
**Responsibility:** Top-level state container, tab switching (Данные | Worklog), localStorage persistence.  
**Props:** (none — entry point)  
**State:**
```
signals: SignalEvent[]                    // Editable list of signals
activeTab: 'data' | 'worklog'             // Tab selection
params: Params                            // Model tuning sliders
showJsonModal: boolean
showParamsPanel: boolean
lastEstimate?: Estimate                   // Cached from estimate()
```
**Children:**
- `Header` → tab UI
- `<DataTab>` (conditional)
- `<WorklogTab>` (conditional)

---

### `DataTab.tsx`
**Responsibility:** Main dashboard layout container.  
**Props:**
```
{
  signals: SignalEvent[]
  onSignalsChange: (signals: SignalEvent[]) => void
  params: Params
  onParamsChange: (params: Params) => void
  onResetToSeed: () => void
  lastEstimate: Estimate
}
```
**Layout (Grid):**
```
Row 1: EstimateCard (colspan=1)  | ConfidenceGauge (colspan=1)
Row 2: ContributionBars (full)
Row 3: LocationGrid (full)
Row 4: RecommendationList (full)
Row 5: SignalTable (full)
Row 6: [ScenarioPresets] | [ParamsPanel] (collapsible toggle)
Row 7: [JsonImportModal] (button + modal)
```

---

### `EstimateCard.tsx`
**Responsibility:** Hero card displaying rabbit count with uncertainty range.  
**Props:**
```
{
  rabbits: number
  range: [number, number]
  onExplain?: () => void  // Tooltip trigger (optional)
}
```
**Display:**  
```
≈ {rabbits} кроликов ({range[0]}–{range[1]})
[?] ← tooltip on click: "Итого rabbits = сумма по локациям с overlap discount 0.6"
```

---

### `ConfidenceGauge.tsx`
**Responsibility:** Radial/linear gauge + label + color indicator + "почему?" expander.  
**Props:**
```
{
  score: number              // 0–100
  label: string              // "низкая" | "средняя" | "высокая"
  factors: Factor[]          // Contribution breakdown
  onExplain?: () => void
}
```
**Display:**  
- Colored gauge (red <40, amber 40–70, green >70)
- Label + percentage
- Expandable list of factors with %values
- One-liner: "Оценка основана на {factor1} ({pct1}%) и {factor2} ({pct2}%)"

---

### `ContributionBars.tsx` (→ "Что повлияло на оценку")
**Responsibility:** Ranked breakdown of signal contributions to estimate.  
**Props:**
```
{
  contributions: { signalId: string; value: number; share: number; explanation: string }[]
  onSignalClick?: (id: string) => void
}
```
**Display:**  
- Sorted descending by `value`
- Top 3 bold/highlighted
- Bar width ∝ `share%`
- Hover: show `explanation` (e.g., "missing_carrot (Огород, count=5) → 1.8 кроликов")
- Min 2 rows, max 10 rows (scroll if >10)

---

### `LocationGrid.tsx` (→ "По локациям")
**Responsibility:** Per-location estimate breakdown.  
**Props:**
```
{
  byLocation: { location: string; estimate: number; signals: number }[]
  onExplain?: () => void
}
```
**Display:**  
- Cards or grid items, one per location
- "Огород: ≈2 (3 сигнала)" or similar
- Color-coded intensity (lighter → lower estimate)
- Tap to expand: list signals by location? (Optional UX refinement)

---

### `RecommendationList.tsx`
**Responsibility:** Render 2–5 rule-based recommendations with severity badges.  
**Props:**
```
{
  recommendations: { text: string; reason: string; severity: 'info'|'warn'|'alert' }[]
  onExplain?: () => void
}
```
**Display:**  
- Card per recommendation
- Badge (Ⓘ info, ⚠ warn, 🔴 alert) left of text
- Severity color: info=blue, warn=amber, alert=red
- Expand to show `reason`: e.g., "(максимум активности в Сарае, 3 сигнала)"

---

### `SignalTable.tsx`
**Responsibility:** Editable table/list of signals with add/edit/delete/toggle UI.  
**Props:**
```
{
  signals: SignalEvent[]
  onSignalAdd: (signal: SignalEvent) => void
  onSignalEdit: (id: string, updates: Partial<SignalEvent>) => void
  onSignalDelete: (id: string) => void
  onSignalToggle: (id: string, active: boolean) => void
}
```
**Columns:**
- Checkbox (toggle `active`)
- Event type (dropdown: missing_carrot, new_hole, motion_sensor, rustle_detected, footprints)
- Location (text input + datalist suggestions from existing)
- Count (number input, min=0)
- Intensity (slider 1–10)
- Time (HH:MM input)
- Actions (edit icon, delete button)

**Bottom:**
- "+ Добавить сигнал" button → inline form or modal

---

### `ParamsPanel.tsx` (→ "Параметры модели")
**Responsibility:** Tunable sliders for model weights and thresholds.  
**Props:**
```
{
  params: Params
  onParamsChange: (params: Params) => void
  onResetDefaults: () => void
}
```
**Sliders:**
- Per-type weights (each 0.1–2.0, default values from spec):
  - missing_carrot: 0.4
  - new_hole: 1.2
  - motion_sensor: 1.0
  - rustle_detected: 0.5
  - footprints: 0.3
- overlapDiscount: 0.3–1.0 (default 0.6)
- uncertaintyWidth: 0.1–1.0 (default 0.5, per spec formula)
- lowConfidenceThreshold: 10–60% (default 40)

**Display:** Slider label + current value (e.g., "Вес missing_carrot: 0.40"). Reset button.

---

### `ScenarioPresets.tsx`
**Responsibility:** One-click demo scenarios with preset signal data.  
**Props:**
```
{
  onScenarioSelect: (signals: SignalEvent[], params: Params) => void
}
```
**Buttons:**
1. "Исходные данные" → restore seed JSON (also via "Сбросить к исходным данным")
2. "Тихое утро" → minimal signals (e.g., 1–2 weak signals, new_hole weight ↓)
3. "Нашествие кроликов" → dense signals (e.g., all 5 seed events + duplicates, high intensities)

---

### `JsonImportModal.tsx`
**Responsibility:** Import/export current state as JSON.  
**Props:**
```
{
  isOpen: boolean
  onClose: () => void
  currentSignals: SignalEvent[]
  onImport: (signals: SignalEvent[], params?: Params) => void
}
```
**Tabs/Sections:**
- **Export:** readonly textarea with current state serialized (pretty JSON)
- **Import:** textarea for pasting, "Загрузить" button, error messages (Russian, e.g., "Ошибка: поле 'count' обязательно и должно быть числом ≥ 0")

**Validation:**
- Required fields: id, event, location, count, intensity, time
- Type checks: count (int ≥ 0), intensity (1–10), time (HH:MM), event ∈ {5 known types}
- Location: non-empty string
- Duplicate ids: warning but allowed (auto-assign new id on import?)

---

### `WorklogTab.tsx`
**Responsibility:** Render the AI DEVELOPMENT worklog — 5–7 CURATED, STATIC checkpoints describing how the candidate built this app with AI (per MOX requirement). NOT a runtime event log.
**Props:**
```
{
  checkpoints: WorklogCheckpoint[]   // static content from src/data/worklog.ts
}
```
**Checkpoint schema (src/data/worklog.ts):**
```
type WorklogCheckpoint = {
  id: number;
  title: string;          // e.g. «Постановка задачи и структура»
  phase: string;          // badge: «План» | «Движок» | «UI» | «Ревью» | «Финал»
  prompt: string;         // Задача, которую я поставил AI (suть промпта)
  result: string;         // Что предложил AI
  decision: string;       // Моё решение: принял / изменил / отклонил — и почему
  verification: string;   // Проверка: тест / скриншот / ручной пересчёт / ревью
};
```
**Display:** ordered cards, each with title + phase badge + four labeled sections («Промпт → Результат → Моё решение → Проверка»). Content covers all six MOX themes: task formulation, architecture request, own-vs-AI decisions, logic/UX refinement, found bugs & fixes, final verification. Content is human-edited before ship; includes at least one honest miss.

---

### `Header.tsx`
**Responsibility:** Title + tab navigation.  
**Props:**
```
{
  activeTab: 'data' | 'worklog'
  onTabChange: (tab: 'data' | 'worklog') => void
  onShowJsonModal: () => void
  onResetToSeed: () => void
}
```
**Display:**
```
🐇 Ферма невидимых кроликов — пульт фермера

[Данные] [Worklog]     [JSON] [Сбросить]
```

---

## 2. STATE MODEL

### App.tsx State & Event Flow

```
┌─ App ──────────────────────────────────────────────────┐
│                                                         │
│  signals: SignalEvent[]         ← localStorage backup   │
│  params: Params                 ← localStorage backup   │
│  activeTab: 'data' | 'worklog'                          │
│  showJsonModal: boolean                                 │
│                                                         │
│  // Derived synchronously — no useEffect needed:        │
│  const result = useMemo(                                │
│    () => estimate(signals, params), [signals, params])  │
│  // localStorage save in a useEffect, try/catch,        │
│  // debounced 300ms (persistence only — recompute       │
│  // itself is INSTANT, per FR-4)                        │
└─────────────────────────────────────────────────────────┘

EVENTS (from child components):
  onSignalAdd(signal)     → signals.push → recompute
  onSignalEdit(id, upd)   → signals[idx] = {...} → recompute
  onSignalDelete(id)      → signals.filter(id) → recompute
  onSignalToggle(id, active) → signals[idx].active = active → recompute
  onParamsChange(params)  → params = {...} → recompute
  onResetToSeed()         → signals = SEED, params = DEFAULTS → recompute
  onScenarioSelect(...)   → signals = preset, params = preset → recompute
  onImport(signals)       → signals = validated import → recompute
  onTabChange(tab)        → activeTab = tab (no recompute)
```

### Derived State
- `result: Estimate = estimate(signals, params)` ← computed synchronously via useMemo on every change; never stored as source-of-truth state
- Worklog is STATIC content (`src/data/worklog.ts`) — not app state

### Persistence
- **On mount:** load signals & params from `localStorage['mox_signals']` and `localStorage['mox_params']` (with try/catch; fallback to seed + defaults)
- **On change:** debounce (300ms) save to localStorage

---

## 3. ENGINE API (Frozen)

### Type Definitions

```typescript
// Signal types (5 known)
type EventType = 'missing_carrot' | 'new_hole' | 'motion_sensor' | 'rustle_detected' | 'footprints';

// Input signal (user-editable)
type SignalEvent = {
  id: string;                  // Unique identifier (e.g., "evt_001")
  event: EventType;
  location: string;            // Free-form text
  count: number;               // Integer ≥ 0
  intensity: number;           // 1–10 (inclusive)
  time: string;                // HH:MM format (e.g., "08:30")
  active?: boolean;            // Default true; user can toggle off
};

// Model parameters (user-tunable)
type Params = {
  typeWeights: Record<EventType, number>;  // Per-type multipliers
  overlapDiscount: number;                 // 0.3–1.0 (discount for 2nd, 3rd+ signal in location)
  uncertaintyWidth: number;                // 0.1–0.8 (multiplier for range ± calculation)
  lowConfidenceThreshold: number;          // 10–60% (trigger for confidence-warning rec)
};

// Per-signal contribution
type Contribution = {
  signalId: string;
  value: number;              // Raw contribution (count × weight × intensityFactor)
  share: number;              // Share of total (0–1)
  explanation: string;        // Human-readable: "Ямки в Огороде (count=2) → 2.88 кроликов"
};

// Confidence factors breakdown
type Factor = {
  name: string;               // "Разнообразие" | "Подтверждение" | "Объём" | "Качество"
  score: number;              // 0–100
  weight: number;             // 0.15, 0.25, 0.30, 0.30
  explanation: string;        // "4 типа из 5 возможных (80%)"
};

// Recommendation
type Recommendation = {
  text: string;               // Main message (Russian)
  reason: string;             // Why? (e.g., "(максимум в Сарае, 3 сигнала)")
  severity: 'info' | 'warn' | 'alert';
};

// Location breakdown
type LocationBreakdown = {
  location: string;
  estimate: number;           // Rounded estimate for this location
  signals: number;            // Count of active signals
};

// Output estimate
type Estimate = {
  rabbits: number;                         // Final rounded estimate
  range: [number, number];                 // [low, high] uncertainty
  confidence: {
    score: number;                         // 0–100
    label: 'низкая' | 'средняя' | 'высокая';
    factors: Factor[];
    explanation: string;                   // Top 2–3 factors in one sentence
  };
  contributions: Contribution[];           // Sorted descending by value
  byLocation: LocationBreakdown[];
  recommendations: Recommendation[];       // Max 5, priority order
};

// Engine entry point
function estimate(signals: SignalEvent[], params: Params): Estimate
```

### Algorithm (Immutable, Pure, Deterministic)

#### Step 1: Filter & Validate
- Exclude `active: false` signals
- Skip signals with empty location, count < 0, intensity < 1 || > 10
- If no valid signals remain, return zeroed estimate (rabbits=0, recommendations include "Сигналов нет…")

#### Step 2: Per-Signal Contribution
For each active signal:
```
intensityFactor = 0.5 + intensity / 10      // Range 0.6–1.5
contribution = count × typeWeights[event] × intensityFactor
```

Stored with full explanation:
```
"{event} в {location} (count={count}, intensity={intensity}) → {contribution:.2f} кроликов"
```

#### Step 3: Location Aggregation (with Overlap Discount)
Group signals by location (normalize key: trim + lowercase; display first-seen casing). Per location:
- Sort contributions descending
- Apply discount: `locationEstimate = c₁ + c₂×d + c₃×d² + …` where `d = overlapDiscount`
- Keep UNROUNDED for the global sum; round only for per-location display

Example (Сарай, contributions [1.5, 1.3], d=0.6):
```
est = 1.5 + 1.3×0.6 = 2.28  (display «≈ 2», sum uses 2.28)
```

#### Step 4: Global Estimate
```
rawEstimate = Σ(locationEstimate) over all locations
finalEstimate = max(round(rawEstimate), 1) if any signal active, else 0
```

#### Step 5: Uncertainty Range
```
confidence_score = calculated in Step 6
width_factor = (1 - confidence_score / 100) × uncertaintyWidth
low = finalEstimate × (1 - width_factor), rounded down, min 0
high = finalEstimate × (1 + width_factor), rounded up
Enforce: low ≤ high, min width = ±1
```

#### Step 6: Confidence Score (Weighted Blend)
```
diversity = (count distinct event types among active) / 5        [0–1]
corroboration = (count locations with ≥2 signals) / (total locs) [0–1]
volume = min(active signal count / 8, 1)                         [0–1]
quality = mean(intensity across active) / 10                     [0–1]

score = 30×diversity + 30×corroboration + 25×volume + 15×quality [0–100]
```

Labels:
- score < 40: "низкая" (red, #EF4444)
- 40 ≤ score ≤ 70: "средняя" (amber, #F59E0B)
- score > 70: "высокая" (green, #10B981)

Factors (for explanation):
```
[
  { name: "Разнообразие", score: diversity*100, weight: 0.30, explanation: "{X} типов из 5 ({pct}%)" },
  { name: "Подтверждение", score: corroboration*100, weight: 0.30, explanation: "{Y} локаций с ≥2 сигналов ({pct}%)" },
  { name: "Объём", score: volume*100, weight: 0.25, explanation: "{Z} сигналов (норма 8)" },
  { name: "Качество", score: quality*100, weight: 0.15, explanation: "средняя интенсивность {mean_intensity:.1f}/10" }
]
// Top 2 by weight × score used in explanation
```

#### Step 7: Recommendations (Priority Order, Max 5)
1. **Hotspot:** If max location estimate ≥ 1:
   - "Установите камеру/датчик в {loc} — там максимальная активность ({signals} сигналов)."
   - severity: 'info'

2. **New hole:** If any new_hole signal exists:
   - "Осмотрите и заделайте ямки {locs} — свежие подкопы ведут под забор."
   - (list all locations with new_hole)
   - severity: 'warn'

3. **Missing carrot:** If any missing_carrot with count ≥ 3:
   - "Накройте грядки сеткой в {locs} — пропало {total_count} морковок."
   - severity: 'warn'

4. **Low confidence:** If confidence_score < lowConfidenceThreshold:
   - "Оценка ненадёжна: добавьте датчики или наблюдения — сигналов мало/они однотипны."
   - severity: 'alert'

5. **Invasion:** If finalEstimate ≥ 10:
   - "Похоже на нашествие: усильте периметр и пересчитайте запасы моркови."
   - severity: 'alert'

6. **No signals:** If no active signals:
   - "Сигналов нет. Либо кроликов нет, либо они стали ещё невидимее — проверьте датчики."
   - severity: 'info'

Reason strings reference actual data: e.g., "(максимум в Сарае, 3 сигнала)", "(всего {count} морковок в {locs})".

#### Step 8: Sort & Return
- Sort contributions by `value` descending
- Include only top 10 contributions in output (UI can collapse long lists)
- Return complete `Estimate` object

### Hand-Check (Seed Data, Default Params)
```
Seed signals (all active):
  evt_001: 5×0.4×(0.5+4/10) = 5×0.4×0.9 = 1.8 (Огород)
  evt_002: 2×1.2×(0.5+7/10) = 2×1.2×1.2 = 2.88 (У забора)
  evt_003: 1×1.0×(0.5+8/10) = 1×1.0×1.3 = 1.3 (Сарай)
  evt_004: 3×0.5×(0.5+5/10) = 3×0.5×1.0 = 1.5 (Сарай)
  evt_005: 6×0.3×(0.5+6/10) = 6×0.3×1.1 = 1.98 (Теплица)

By location (d=0.6):
  Огород: 1.8
  У забора: 2.88
  Сарай: 1.5 + 1.3×0.6 = 2.28
  Теплица: 1.98

Raw total: 1.8 + 2.88 + 2.28 + 1.98 = 8.94 → round to 9 ✓

Confidence:
  diversity: 5/5 = 1.0
  corroboration: 4 locs (all except Огород? or 3 of 4?) = assume 1/4 = 0.25
  volume: 5/8 = 0.625
  quality: (4+7+8+5+6)/5 = 6.0/10 = 0.6

  score = 30×1.0 + 30×0.25 + 25×0.625 + 15×0.6 = 30 + 7.5 + 15.625 + 9 = 62.125 → 62% ✓
  label: "средняя" ✓

Range (confidence=62%, uncertaintyWidth default = 0.5, per spec formula estimate × (1 ± (1 − confidence) × uncertaintyWidth)):
  width_factor = (1 - 0.62) × 0.5 = 0.19
  low = 9×(1 - 0.19) = 7.29 → floor → 7
  high = 9×(1 + 0.19) = 10.71 → ceil → 11
  Range 7–11 ✓ matches spec hand-check exactly. [RESOLVED by orchestrator: no reverse-engineering needed]
```

### Default Parameters
```typescript
const DEFAULT_PARAMS: Params = {
  typeWeights: {
    new_hole: 1.2,
    motion_sensor: 1.0,
    rustle_detected: 0.5,
    missing_carrot: 0.4,
    footprints: 0.3,
  },
  overlapDiscount: 0.6,
  uncertaintyWidth: 0.5,  // spec formula: estimate × (1 ± (1 − confidence) × uncertaintyWidth); slider 0.1–1.0
  lowConfidenceThreshold: 40,
};
```

### Code Structure

**File: `src/engine/estimate.ts`**
```typescript
// Pure functions, zero imports from React or external UI libs
export function estimate(signals: SignalEvent[], params: Params): Estimate { … }
export function calculateConfidence(signals: SignalEvent[]): ConfidenceResult { … }
export function generateRecommendations(estimate: Estimate, signals: SignalEvent[]): Recommendation[] { … }
```

**File: `src/engine/defaults.ts`**
```typescript
export const SEED_SIGNALS: SignalEvent[] = [ … ];
export const DEFAULT_PARAMS: Params = { … };
export const DEFAULT_WORKLOG_CHECKPOINTS: Checkpoint[] = [ … ];
```

**File: `src/engine/validate.ts`**
```typescript
export function validateSignal(s: any): { ok: boolean; error?: string };
export function validateParams(p: any): { ok: boolean; error?: string };
export function validateImport(json: string): { signals?: SignalEvent[]; params?: Params; error?: string };
```

**File: `src/engine/estimate.test.ts`**
```typescript
// Vitest suite
describe('estimate', () => {
  test('hand-check: seed data with defaults yields 9±2, confidence 62%', () => { … });
  test('no active signals yields estimate=0, no rabbits', () => { … });
  test('single signal of each type with intensity=5 matches expected', () => { … });
  test('overlap discount applies correctly', () => { … });
  test('confidence labels match thresholds', () => { … });
  test('recommendations fire in priority order', () => { … });
});
```

---

## 4. BUILD SLICES (Sequential)

### SLICE 1: Engine + Tests (2–3 days)
**Acceptance:** Unit tests pass, hand-check validates, CI green

**Subtasks:**
- [ ] `estimate.ts`: implement core algorithm (per-signal, location agg, confidence, range)
- [ ] `recommendations.ts`: implement 6 rule-based recommendations with reason strings
- [ ] `defaults.ts`: seed JSON, default params, worklog skeleton
- [ ] `validate.ts`: JSON schema validation (return Russian error messages)
- [ ] `estimate.test.ts`: ≥8 test cases covering nominal, edge cases, hand-check
- [ ] `src/data/worklog.ts`: checkpoint log data structure and initial values
- [ ] Verify: `npm run test` passes, no console errors, hand-check produces 9±2 confidence 62%

**Reviewer can check:**
- Open `src/engine/estimate.test.ts`, run `npm run test`, see PASS
- Feed seed JSON to `estimate()` directly (CLI or Node REPL), confirm output matches spec

---

### SLICE 2: Dashboard UI & Estimate Display (3–4 days)
**Acceptance:** All FR-1, FR-4, FR-5, FR-6, FR-7 visible and recompute on mock data change

**Subtasks:**
- [ ] `Header.tsx`: title + tab nav + reset button
- [ ] `EstimateCard.tsx`: hero card with ≈N кроликов (range) + tooltip
- [ ] `ConfidenceGauge.tsx`: radial/linear gauge + label + "почему?" expander
- [ ] `ContributionBars.tsx`: sorted bar chart of contributions, top 3 bold
- [ ] `LocationGrid.tsx`: cards per location with estimate + signal count
- [ ] `RecommendationList.tsx`: cards with badges (info/warn/alert) and reason
- [ ] `DataTab.tsx`: grid layout assembling above components
- [ ] `App.tsx` state: signals (hardcoded seed), params (hardcoded defaults), useEffect to recompute
- [ ] Styling (Tailwind OR hand-rolled CSS; decide once [DECISION])
- [ ] Mock signal toggle in App state, verify all components recompute

**Reviewer can check:**
- `npm run dev`, open localhost:5173, see hero card with estimate ≈9, confidence 62%, 5 recommendation cards, location grid with 4 items
- Change seed signals in App.tsx (e.g., evt_001.count 5→3), verify estimate drops to ~8

---

### SLICE 3: Interactivity + Worklog + Polish (4–5 days)
**Acceptance:** All FR complete, e2e smoke test passes, no regressions

**Subtasks:**
- [ ] `SignalTable.tsx`: editable rows with toggle, add/edit/delete
- [ ] `ParamsPanel.tsx`: per-type sliders, overlap/uncertainty/threshold, reset defaults
- [ ] `JsonImportModal.tsx`: textarea + export/import tabs, validation with Russian errors
- [ ] `ScenarioPresets.tsx`: 3 buttons (seed, quiet morning, invasion), wire onScenarioSelect
- [ ] `WorklogTab.tsx`: render checkpoints (5–7), summary + expandable details
- [ ] `App.tsx`: wire all event handlers, localStorage save/restore with try/catch
- [ ] Responsive: test at 390px, 768px, 1280px viewports (no horizontal scroll)
- [ ] Explainability: verify every computed number has nearby tooltip/expander
- [ ] Polish:
  - [ ] Russian copy audit (no English UI strings except code identifiers)
  - [ ] Color + icon consistency (info/warn/alert, confidence levels)
  - [ ] Recompute is instant on every change (FR-4); debounce ONLY the localStorage write (300ms)
  - [ ] Disable submit until JSON is valid
- [ ] E2E smoke test: `e2e/smoke.spec.md` (see §5 below)

**Reviewer can check:**
- `npm run dev`, complete a full user journey:
  1. Load page, see seed estimate (9±2)
  2. Edit a signal (evt_001 count 5→3), see estimate drop, worklog updated
  3. Adjust a slider (new_hole weight 1.2→0.8), see estimate drop further
  4. Open JSON modal, copy state, paste into new browser tab (fresh page), verify restore
  5. Click "Тихое утро" scenario, verify estimate drops, recommendations change
  6. Toggle a signal off (evt_002), confirm estimate recomputes
  7. Switch to Worklog tab, see 7+ checkpoints logged
  8. Resize to 390px, verify no horizontal scroll, all UI readable

---

## 5. EDGE CASES TABLE

| Scenario | Input | Expected Behavior | Notes |
|----------|-------|-------------------|-------|
| **Empty data** | signals=[], params=defaults | estimate=0, recommendations include "Сигналов нет", confidence N/A | Must not crash |
| **All signals off** | signals all have active=false | Same as empty | Treat as no active signals |
| **Single weak signal** | count=1, intensity=1, event=footprints | estimate≥1, confidence "низкая" | Minimum 1 if any active |
| **Huge count** | count=9999, event=new_hole | estimate≈12000 (no clipping) | Confidence → "высокая" likely |
| **Negative count attempt** | count=-5 (input) | Validation error: "count должно быть ≥0", signal rejected | Form input type=number blocks, but validate on import |
| **NaN intensity** | intensity=null or undefined | Validation error: "intensity обязательно (1–10)" | Catch on import & form |
| **Malformed time** | time="25:99" or "abc" | Validation error: "time должно быть в формате HH:MM (00:00–23:59)" | Optionally relax to free text field; note in [DECISION] |
| **Duplicate location (case)** | "Сарай" + "сарай" (Cyrillic) | Grouped as ONE location (trim + case-insensitive key); display first-seen casing | [DECISION #4, amended]; unit-tested |
| **Duplicate IDs on import** | [{ id: "x", ... }, { id: "x", ... }] | Merge into one, or re-assign second to new ID (UUID) [DECISION] | Spec says "warning but allowed" |
| **Empty JSON string** | import "" or "{}" | Validation error: "JSON должен содержать массив объектов сигналов" | Show human-readable error |
| **Invalid JSON syntax** | import "{ invalid }" | Validation error: "Ошибка парсинга JSON: SyntaxError…" | Catch JSON.parse, show user-friendly msg |
| **Unknown event type** | event="alien_signals" | Validation error: "event должен быть одним из: missing_carrot, new_hole, …" | Show valid options |
| **Slider extremes** | typeWeight=0.0 or 10.0 | Clamp to min/max, recompute (estimate may be 0 or very large) | UI should enforce range visually |
| **Confidence threshold at 0** | lowConfidenceThreshold=0 | All estimates "high confidence" for recommendations | Edge case; may not fire rec#4 |
| **Rapid changes** | User rapidly edits 10 signals | Worklog spams checkpoints [DECISION: debounce 300ms] | Consider batching or throttling |
| **localStorage disabled** | Browser blocks localStorage | Fallback to in-memory, warn in console | Use try/catch in load/save |
| **Very long location name** | location="Северо-восточный край теплицы за курятником" | Display truncates or wraps, UI remains readable | Test at 390px |
| **Zero intensity** | intensity=0 (below min) | Validation error: "intensity должна быть 1–10" | Also: intensityFactor would be 0.5, which is valid; decide if 0 is allowed [DECISION] |

---

## 6. OUT OF SCOPE

The following are explicitly not included in this build:
- **Backend / API.** All data in-memory (optionally localStorage); no server, no database.
- **Real-time sensor integration.** Signals are user-entered, not from hardware.
- **Authentication / multi-user.** Single farmer, single browser session.
- **Historical analytics / time-series.** Only current snapshot of signals.
- **Map UI.** "ПО ЛОКАЦИЯМ" is a grid of cards, not a visual map.
- **Image/video upload.** No photos of holes or footprints.
- **Dark mode toggle.** Single light theme (Tailwind default or hand-rolled).
- **Localization beyond Russian.** UI is Russian only; code comments/identifiers are English.
- **Accessibility (WCAG AAA).** WCAG AA compliance (keyboard nav, color contrast) is nice-to-have post-MVP.
- **Mobile app (iOS/Android).** Web browser only.
- **Export to PDF / print.** JSON export only.
- **WebSocket / real-time collaboration.** Single user.
- **Advanced ML / statistical confidence intervals.** Deterministic rule-based model only.
- **Third-party chart library.** SVG/div bars only (Recharts, Chart.js, etc. not needed).

---

## 7. TECH STACK DECISIONS

### [DECISION #1] Styling Framework: Tailwind CSS
**Rationale:** Faster iteration for MVP, built-in responsive utilities, no CSS-in-JS overhead.  
**Alternative:** Hand-rolled CSS modules (`src/styles/Component.module.css`) if Tailwind setup conflicts with Vite.  
**Action:** Try Tailwind first (npm install -D tailwindcss). If peer-dependency or build issues arise, switch to CSS modules + common utility class file (`src/styles/globals.css`).  
**Status:** TBD on first build run.

---

### [DECISION #2] Uncertainty Range Calculation
**Rationale:** Spec hand-check shows range 7–11 for estimate 9, confidence 62%. Reverse-engineer `uncertaintyWidth` default.  
**Formula:** `width_factor = (1 - confidence/100) × uncertaintyWidth`  
`width_factor ≈ 0.38/9 ≈ 0.042` (if range ±0.38)  
If `confidence=0.62`, then `uncertaintyWidth ≈ 0.042 / 0.38 ≈ 0.11`  
**Rough estimate:** uncertaintyWidth default ≈ 0.20–0.30; test on hand-check.  
**Action:** Implement, run test, adjust constant until range matches ≈7–11.

---

### [DECISION #3] Time Input Field Format
**Spec says:** time: "HH:MM" (e.g., "08:30").  
**Options:**
  1. HTML `<input type="time">` (native browser picker, returns 08:30 string)
  2. Text field with regex validation `^\d{2}:\d{2}$`
  3. Relax to free-form (any string), validate only on import

**Choice:** Option 1 (native `<input type="time">`) for UX; fallback to validation on import.

---

### [DECISION #4] Duplicate Location Handling (Case Sensitivity)
**Spec silent on:** "Сарай" vs "сарай" (lowercase Cyrillic).  
**Options:**
  1. Case-sensitive (Сарай ≠ сарай) — simpler, matches data as-entered
  2. Case-insensitive (normalize to lowercase) — more user-friendly, fewer location duplicates
  3. Case-insensitive with pretty-print (store lowercase, display seed case)

**Choice [AMENDED by orchestrator]:** Option 3 — normalize for grouping (trim + lowercase), display first-seen casing. Rationale: a farmer typing «сарай» must not silently inflate the estimate by splitting one territory into two; cost is one normalize function in the engine. Covered by a unit test («Сарай» + «сарай» → one location).

---

### [DECISION #5] Duplicate Signal IDs on Import
**Spec says:** "warning but allowed."  
**Behavior:** When importing JSON with duplicate IDs:
  - Accept first occurrence
  - Generate new UUID for duplicates (e.g., evt_002_dup_1)
  - Log warning in modal: "Обнаружены дублирующиеся ID: автоматически переименованы."

---

### [DECISION #6] Worklog = AI development log, NOT runtime log [CORRECTED by orchestrator]
**Original architect proposal (runtime recompute log) misread FR-11 and was REJECTED.**
**Correct reading (MOX spec §8):** the «AI Worklog» tab renders 5–7 curated, static checkpoints about the AI-assisted DEVELOPMENT process (prompts given to AI, what AI returned, what the candidate accepted/changed/rejected, how it was verified). Content lives in `src/data/worklog.ts`, drafted from WORKLOG.md, human-edited before ship. No runtime appending, no state, no localStorage for worklog.

---

### [DECISION #7] Intensity Slider: Allow 0?
**Spec says:** intensity 1–10.  
**Edge case:** What if user tries to import intensity=0?  
**Action:** Validation rejects; error "intensity должна быть 1–10". No special case for 0.

---

### [DECISION #8] Zero-Signal Estimate Display
**Current logic:** If no active signals, estimate=0, rabbits=0.  
**UI affordance:** Hero card still renders "≈ 0 кроликов", confidence N/A or grayed out.  
**Recommendation auto-added:** "Сигналов нет. Либо кроликов нет, либо они стали ещё невидимее — проверьте датчики."

---

## 8. IMPLEMENTATION NOTES

### File Structure (Final)
```
C:\Users\rat\mox_test_task\
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── engine/
│   │   ├── estimate.ts           (pure core algorithm)
│   │   ├── recommendations.ts    (rule-based logic)
│   │   ├── validate.ts           (JSON validation)
│   │   ├── defaults.ts           (seed, params, initial worklog)
│   │   └── estimate.test.ts      (Vitest suite)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── DataTab.tsx
│   │   ├── WorklogTab.tsx
│   │   ├── EstimateCard.tsx
│   │   ├── ConfidenceGauge.tsx
│   │   ├── ContributionBars.tsx
│   │   ├── LocationGrid.tsx
│   │   ├── RecommendationList.tsx
│   │   ├── SignalTable.tsx
│   │   ├── ParamsPanel.tsx
│   │   ├── JsonImportModal.tsx
│   │   └── ScenarioPresets.tsx
│   ├── data/
│   │   └── worklog.ts
│   └── styles/
│       └── globals.css           (if hand-rolled CSS)
├── e2e/
│   └── smoke.spec.md
├── package.json
├── vite.config.ts
├── tsconfig.json
└── PLAN.md (this file)
```

### Component Size Limit
- Keep each component ≤ 150 lines (excluding comments/blanks)
- If a component grows larger, split into subcomponents
- Example: if SignalTable > 150 lines, extract SignalTableRow and SignalTableForm into separate files

### Type Safety
- Strict `tsconfig.json`: `strict: true`, `noImplicitAny: true`
- Zero `any` types; use explicit unions or generics
- Engine functions return complete `Estimate` or `ValidationResult`, never partial/null

### Testing Strategy
- **Engine:** Vitest, ≥8 unit tests (nominal, edge cases, hand-check)
- **Components:** Manual smoke test (see SLICE 3 reviewer checklist)
- **E2E:** `e2e/smoke.spec.md` (checklist format, human-executable)

---

## 9. SMOKE TEST (e2e/smoke.spec.md)

```markdown
# MOX Dashboard Smoke Test

## Pre-test
- [ ] `npm install && npm run dev`
- [ ] Browser open to http://localhost:5173
- [ ] Open DevTools console; no errors on page load

## Test 1: Page Load & Seed Data
- [ ] Hero card shows estimate ≈ 9 кроликов (7–11)
- [ ] Confidence gauge shows 62% средняя (amber/yellow)
- [ ] "Что повлияло" bar chart shows 5 contributions, top 3 bold
- [ ] "По локациям" shows 4 cards: Огород, У забора, Сарай, Теплица
- [ ] "Рекомендации" shows ≥2 cards (info/warn/alert badges visible)
- [ ] "Сигналы" table shows 5 rows (evt_001 to evt_005), all toggled on
- [ ] "Параметры модели" panel collapsed (button visible)
- [ ] "AI Worklog" tab available in header

## Test 2: Signal Editing
- [ ] Click "Добавить сигнал"
- [ ] Fill form: event=new_hole, location=Огород, count=1, intensity=5, time=12:00
- [ ] Click save; new row appears in table
- [ ] Estimate recomputes (should increase slightly)
- [ ] Delete new signal; estimate reverts

## Test 3: Parameter Tuning
- [ ] Open "Параметры модели" panel
- [ ] Adjust "Вес missing_carrot" slider from 0.4 to 0.2
- [ ] Estimate recomputes (should decrease)
- [ ] Adjust "overlap discount" from 0.6 to 0.3 (more discount)
- [ ] Estimate recomputes again
- [ ] Click "Сбросить к умолчаниям"; sliders return to defaults, estimate reverts

## Test 4: JSON Import/Export
- [ ] Open JSON modal (button in header)
- [ ] Tab "Экспорт"; copy full JSON from textarea
- [ ] Tab "Импорт"; paste same JSON
- [ ] Click "Загрузить"; data unchanged, no error
- [ ] Modify pasted JSON: change count of evt_001 to 10
- [ ] Click "Загрузить"; estimate increases, signals table updated
- [ ] Try importing invalid JSON (missing "count" field); error message appears in Russian

## Test 5: Scenarios
- [ ] Click "Тихое утро" preset
- [ ] Estimate drops significantly, signals show fewer/weaker events
- [ ] Click "Исходные данные" (or "Сбросить" button)
- [ ] Data and estimate restore to original seed values
- [ ] Click "Нашествие кроликов"
- [ ] Estimate jumps high (≥10), recommendations include alert-level "Похоже на нашествие"

## Test 6: AI Worklog
- [ ] Click "AI Worklog" tab
- [ ] See 5–7 curated development checkpoints, each with title + phase badge + «Промпт → Результат → Моё решение → Проверка»
- [ ] Together they cover all six MOX themes (task formulation, architecture, own decisions vs AI, logic/UX refinement, found bugs & fixes, final verification)
- [ ] At least one checkpoint describes a real found-and-fixed mistake
- [ ] Switch back to "Данные" tab and return; content unchanged (static)

## Test 7: Responsive (390px)
- [ ] Open DevTools, set viewport to 375×812 (mobile)
- [ ] All content stacks vertically (no horizontal scroll)
- [ ] Hero card, gauge, and bars readable at full width
- [ ] Signals table columns stack or scroll horizontally within container only
- [ ] Buttons and sliders remain tap-friendly (≥44px height)

## Test 8: Explainability
- [ ] Hover over hero card estimate; tooltip appears with explanation
- [ ] Hover over confidence gauge; "почему?" expands, shows 4 factors with %
- [ ] Click "Что повлияло" row; hover text shows full explanation (e.g., "missing_carrot в Огороде (count=5, intensity=4) → 1.8 кроликов")
- [ ] Each recommendation has reason text visible (not hidden)

## Test 9: All Toggles
- [ ] In signals table, toggle evt_002 off (checkbox)
- [ ] Estimate recomputes (should decrease by ~2.88)
- [ ] Recommendation "У забора" hotspot no longer appears (if it was ranked #1)
- [ ] Toggle back on; estimate and recommendations revert
- [ ] Toggle all off; estimate → 0, recommendations include "Сигналов нет"

## Test 10: localStorage Persistence
- [ ] Edit a signal (e.g., evt_001 count 5→3)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Data persists; estimate matches edited state (not original seed)
- [ ] Check browser DevTools Storage tab; `mox_signals` and `mox_params` keys exist with valid JSON
- [ ] Clear localStorage, refresh; data reverts to seed

## Result
- [ ] All 10 tests PASS → ship to Vercel
- [ ] Any FAIL → debug, iterate, re-test
```

---

## 10. OPEN QUESTIONS & ASSUMPTIONS

1. **Uncertainty width default:** RESOLVED — spec formula `estimate × (1 ± (1 − confidence) × uncertaintyWidth)` with default 0.5 reproduces the 7–11 hand-check exactly. [DECISION #2 closed]

2. **Styling framework:**  
   Tailwind CSS assumed; may fall back to hand-rolled CSS modules if Vite + Tailwind conflicts. [DECISION #1]

3. **Worklog:** RESOLVED — static curated AI development checkpoints in `src/data/worklog.ts`, not a runtime log. [DECISION #6 corrected]

4. **Location case sensitivity:** RESOLVED — normalize (trim + lowercase) for grouping, display first-seen casing. [DECISION #4 amended]

5. **Confidence threshold for recommendations:**  
   Spec says "Confidence < 40 → trigger rec #4". Confirm `lowConfidenceThreshold` slider default is 40. [DECISION: Confirmed at 40.]

6. **Intensity = 0:**  
   Spec says 1–10; does 0 get rejected on import or clamped to 1? Will validate & reject. [DECISION #7]

---

## SUMMARY

This plan delivers a complete, testable specification for a Russian-language farmer dashboard that estimates rabbit populations from signal data. The architecture is simple: pure engine functions, React state hooks, no external state management or backend.

**Key architectural decisions:**
- [DECISION #1] Tailwind CSS (fallback: CSS modules)
- [DECISION #2] uncertaintyWidth = 0.5 (spec formula reproduces 7–11 hand-check; architect's "reverse-engineer" proposal rejected)
- [DECISION #3] Native HTML time input (`<input type="time">`)
- [DECISION #4] Locations normalized for grouping (trim + case-insensitive), first-seen casing displayed
- [DECISION #5] Duplicate IDs auto-renamed on import
- [DECISION #6] AI Worklog = static curated development checkpoints (runtime-log proposal rejected as FR-11 misread)
- [DECISION #7] Intensity 0 rejected
- [DECISION #8] Zero-signal estimate displays as "≈ 0 кроликов"

**Build sequence:** SLICE 1 (engine + tests) → SLICE 2 (dashboard UI) → SLICE 3 (interactivity + worklog + polish).

**Acceptance:** All FRs (1–12) traced to components or engine logic; smoke test checklist covers nominal + edge cases.

No external libraries beyond React 18, Vite, TypeScript, Tailwind (or CSS modules), Vitest. All UI copy in Russian. Deterministic, pure-function engine is unit-testable and human-auditable.

Ready for implementation by a fresh session. 🐇
