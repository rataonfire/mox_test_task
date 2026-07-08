# Phase 2 — UI-rendered values (TEST_ENV_URL = http://localhost:4173, vite preview, commit 457f1cc)

Extracted by the QA orchestrator via browser automation (localStorage cleared before the run;
datasets injected through the UI: «Данные JSON» → Импорт → «Загрузить»; params via «Параметры модели» sliders).
Recorded 2026-07-08. Each block = exactly what the UI rendered.

## G0 — seed + defaults
rabbits 9; range «(от 7 до 11)»; confidence 62% «средняя»; locations: У забора ≈3, Сарай ≈2, Теплица ≈2, Огород ≈2; recommendations: 3.

## G0 × params grid
| Variant | UI hero | UI range | Note |
|---|---|---|---|
| overlap d=0.3 | 9 | — | Сарай card ≈2 (oracle raw 1.89) |
| overlap d=1.0 | 9 | — | Сарай card ≈3 (oracle raw 2.8) |
| new_hole weight = 0 | 6 | (от 4 до 8) | oracle raw 6.06 → 6 ✓ |
| new_hole weight = 2 | 11 | — | oracle raw 10.86 → 11 ✓ |
| uncertaintyWidth = 0.1 | 9 | (от 8 до 10) | ✓ |
| uncertaintyWidth = 1.0 | 9 | (от 5 до 13) | ✓ |
| after «Сбросить параметры» | 9 | (от 7 до 11) | reset works ✓ |

## G1 — empty (import `[]` accepted without error)
rabbits 0; range «(от 0 до 0)»; confidence 0% «низкая»; rec «Сигналов нет…» present; no NaN/Infinity on screen.

## G2 — seed, all 5 signals toggled off
rabbits 0; range «(от 0 до 0)»; confidence 0%; rec «Сигналов нет…»; rows remain visible in the table (5) — correct, toggled ≠ deleted; no NaN. Reset restores 9.

## G3 — single footprints, count 1, intensity 1
rabbits 1 (min-1 rule); range «(от 0 до 2)»; confidence 11% «низкая»; rec «ненадёжна» fires; no NaN; no layout break.
CONVERGES with oracle (11%, [0,2]).

## G4 — single missing_carrot, count 9999, intensity 10
rabbits 5999; confidence 24% «низкая»; invasion + unreliable recs fire; no NaN/Infinity; no horizontal overflow.
range UI = «(от 3723 до 8275)» vs oracle [3719, 8279] → **[SPEC-GAP-5 sub-case CONFIRMED]**:
the app derives width from the RAW confidence (24.125 → w=0.379375 → [3723, 8275]);
the oracle used the ROUNDED score (24 → w=0.38 → [3719, 8279]). Spec pins neither.
Divergence visible only at large magnitudes (G0/G3 identical under both readings).
→ Escalate to human at Gate 2: accept raw-confidence reading as conformant (recommended; it is the more precise
reading and G0 binding numbers hold under it) or file Minor + change oracle definition.

## G9_40 — 8 × missing_carrot, 8 locations, intensity 6 (engineered exact 40%)
UI: confidence 40% label «средняя» ✓ (boundary inclusive per SPEC-GAP-3); rabbits 4 (oracle 8×0.44=3.52→4 ✓); no NaN.

## G9_70 — 5 types in L1 + 3 missing_carrot in L2..L4, intensity 5 (engineered exact 70%)
UI: confidence 70% label «средняя» ✓ (70 is NOT «высокая»); rabbits 3 (oracle 2.105+1.2=3.305→3 ✓); no NaN.

## Verdict summary (UI column)
CONVERGE: G0, G0×grid (7/7), G1, G2, G3, G9_40, G9_70, G4 (all values except range).
MISMATCH → [SPEC-GAP]: G4 range only (raw-vs-rounded confidence in width formula).
Product defects found in this pass: none.
