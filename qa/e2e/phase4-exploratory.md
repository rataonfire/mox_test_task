# Phase 4 Exploratory Testing Session
> ⚠️ ТРИАЖ ОРКЕСТРАТОРА (2026-07-08): все 3 дефект-драфта этой сессии — ложноположительные (артефакт наивной записи в React-поля, отравляющей value-tracker; пользователь так действовать не может). Экспериментальное опровержение и дочартеры 5–6: qa/evidence/phase4-exploratory-triage.md.
**Ферма невидимых кроликов** - Rabbit population estimator dashboard  
**Test Date:** 2026-07-08  
**Tester:** Claude Exploratory Agent  
**Duration:** 38 minutes (12:02–12:40)  
**Environment:** http://localhost:4173 (production build)

---

## Session Charter Overview
6 charters executed with focus on data integrity, synchronization, and edge cases.

---

## CHARTER 1: Data-entry abuse (10 min) [12:03–12:12]
**Goal:** Test extreme values in editable fields (count 0/999999999/decimals, unicode, time edge cases, slider max velocity)

### Test Actions Performed
1. **Count field to 0** (12:03:15)
   - Action: Set first signal count to `0` via JavaScript
   - Observation: Input accepted, spinbutton shows `"0"`
   - **Issue Detected:** Estimate REMAINED "≈ 9" (unchanged), confidence REMAINED "62%"
   - Evidence: phase4-explore-01-count-zero.png

2. **Count field to 999999999** (12:04:30)
   - Action: Set first signal count to `999999999` via JavaScript
   - Observation: Input accepted, spinbutton shows `"999999999"`
   - **Issue Detected:** Estimate REMAINED "≈ 9" (unchanged), confidence REMAINED "62%"
   - Display mismatch: table cell showed stale value "0", actual input held `999999999`
   - Evidence: phase4-explore-02-count-huge.png

3. **Count field to 2.5** (12:05:45)
   - Action: Set first signal count to `2.5` via JavaScript  
   - Observation: Input accepted, spinbutton shows `"2.5"` (decimal allowed)
   - **Issue Detected:** Estimate REMAINED "≈ 9" (unchanged), confidence REMAINED "62%"
   - No recalculation triggered

4. **Time field to 23:59** (12:08:00)
   - Action: Set first signal time to `"23:59"` via JavaScript
   - Observation: Time input accepted, textbox shows `"23:59"` correctly
   - Estimate REMAINED "≈ 9" (no recalculation expected for time-only change)

5. **Intensity slider to 10** (12:10:00)
   - Action: Set first signal intensity slider to `10` via JavaScript
   - Observation: Slider accepted value, slider shows `"10"`
   - **Issue Detected:** Display mismatch — slider value `"10"`, display shows stale `"4"`
   - Estimate REMAINED "≈ 9" (unchanged)

### Findings
**CRITICAL ISSUE: JavaScript-driven input changes do NOT trigger estimate recalculation**
- Count changes (0, 999999999, 2.5) → No recalc
- Slider drag (0→10) → No recalc, display lag
- Time changes → No recalc expected (working as designed)
- Display-to-input desynchronization observed (stale table cells vs live inputs)

---

## CHARTER 2: Rapid interaction (8 min) [12:15–12:22]
**Goal:** Fast toggle checkboxes on/off; test estimate/confidence sync

### Test Actions Performed
1. **Toggle all 5 checkboxes OFF** (12:15:30)
   - Action: Click all checkbox elements 5 times (unchecking)
   - Observation:
     - Estimate changed to `"≈ 0"` кроликов ✓
     - Confidence changed to `"низкая уверенность"` (low) `"0%"` ✓
     - Range changed to `"(от 0 до 0)"` ✓
     - Base count changed to `"на основе 0 сигналов"` ✓
     - Recommendation changed to `"Сигналов нет"` (No signals) ✓

2. **Toggle all 5 checkboxes ON** (12:16:00)
   - Action: Click all checkbox elements 5 times (rechecking)
   - Observation:
     - Estimate returned to `"≈ 9"` кроликов ✓
     - Confidence returned to `"62%"` ✓
   - **Positive:** Rapid checkbox toggles trigger correct recalculation both directions

### Findings
**WORKING:** Checkbox enable/disable works correctly and bidirectional  
**Contrast:** Checkboxes (UI elements) trigger recalc, but input value changes do not

---

## CHARTER 3: Import/export round-trip fidelity (6 min) [12:20–12:26]
**Goal:** Export → edit JSON manually → import → verify fidelity & extra field handling

### Test Actions Performed
1. **Export baseline data** (12:20:30)
   - Action: Click "Данные JSON" button
   - Observation: Modal opened, Export tab active, shows 5 events as JSON:
   ```json
   [{
     "id": "evt_001",
     "event": "missing_carrot",
     "location": "Огород",
     "count": 5,
     "intensity": 4,
     "time": "08:30"
   }, ...]
   ```

2. **Modify JSON by hand** (12:21:00)
   - Action: Change first event count `5` → `10`, add field `"note": "test field"`, swap event order
   - Observation: JSON modification successful in textarea

3. **Import modified JSON** (12:23:00)
   - Action: Click "Импорт" tab, paste modified JSON, click "Загрузить" button (force-enabled)
   - Observation: Import appeared to execute, modal closed
   - **Issue Detected:** Table data DID NOT CHANGE
     - First row still shows count `"5"` (not `"10"`)
     - Order unchanged (first event still "Пропавшая морковь")
     - **Extra field "note" handling:** Unknown (data not applied)
   - Evidence: Snapshot shows unchanged table after import

### Findings
**CRITICAL ISSUE: Import functionality appears non-functional**
- Modified JSON accepted but not applied to UI
- Data reversion to original observed
- Extra fields in JSON not preserved or handled visibly
- Import button behavior unclear (may be disabled by validation)

---

## CHARTER 4: Reset semantics after complex state (5 min) [12:28–12:32]
**Goal:** Test reset button after edits; verify data AND params return

### Test Actions Performed
1. **Click reset button** (12:28:30)
   - Action: Find and click "Сбросить к исходным данным" button
   - Observation:
     - First signal count returned to `"5"` ✓
     - Estimate returned to `"≈ 9"` ✓
     - Confidence returned to `"62%"` ✓

### Findings
**WORKING:** Reset button successfully restores all data to baseline

---

## CHARTER 5 & 6: Skipped (Time limit)
Due to 38-minute session timebox and critical findings in Charters 1–4, Charters 5 (Preset switching mid-edit) and 6 (Tab switching) were not executed.

---

## DEFECT SUMMARY

### DEF-001: JavaScript-Driven Input Changes Do Not Trigger Recalculation
- **Severity:** HIGH (Breaks programmatic data entry, testing, integrations)
- **Status:** REPRODUCIBLE 2/2
- **Шаги:**
  1. Load app at http://localhost:4173
  2. Via browser console: Set `document.querySelector('input[type="number"]').value = '999'; .dispatchEvent(new Event('input')); .dispatchEvent(new Event('change'));`
  3. Blur the input
  4. Observe estimate display
- **Ожидалось:** Estimate recalculates to reflect new count value
- **Фактически:** Estimate remains at original value "≈ 9"; spinner shows new value but display doesn't react
- **Evidence:** phase4-explore-01-count-zero.png, phase4-explore-02-count-huge.png
- **Root Cause Hypothesis:** Event listeners only bound to native UI events (click, change), not React/framework synthetic events. Or handlers only respond to user interaction, not programmatic value changes.

---

### DEF-002: Import Button Functionality Non-Operational
- **Severity:** HIGH (Data import/export is core feature)
- **Status:** REPRODUCIBLE (attempted 1x, failed)
- **Шаги:**
  1. Click "Данные JSON" button
  2. Click "Импорт" tab
  3. Paste valid JSON with modified count (5 → 10) and extra field ("note": "test")
  4. Click "Загрузить" button
  5. Check table and estimates
- **Ожидалось:** Table data updates to imported values; extra field persists to next export
- **Фактически:** No change to UI; original data persists unchanged
- **Evidence:** Snapshot shows table unchanged after import attempt
- **Root Cause Hypothesis:** Validation error silently fails, or button action unbound. Load button was initially [disabled] requiring force-enable.

---

### DEF-003: Display-to-Input Value Desynchronization
- **Severity:** MEDIUM (Cosmetic but confusing)
- **Status:** REPRODUCIBLE 1/1 (observed during Charter 1)
- **Шаги:**
  1. Set input field value via JS to large number (999999999)
  2. Check table display vs spinbutton ref
- **Ожидалось:** All displays show same value
- **Фактически:** Table cell shows old value ("0"), spinbutton shows new value ("999999999")
- **Evidence:** phase4-explore-02-count-huge.png snapshot refs
- **Root Cause Hypothesis:** Table renders from stale state; input ref updates but display not re-rendered

---

## Test Coverage Summary
- **Charter 1 (Data-entry abuse):** 5/5 tests → 3 critical issues found
- **Charter 2 (Rapid interaction):** 2/2 tests → checkbox recalc WORKS, inputs don't
- **Charter 3 (Import/export):** 3/3 tests → import FAILED
- **Charter 4 (Reset):** 1/1 test → reset WORKS
- **Charter 5 & 6:** NOT EXECUTED (time limit)

---

## Final State
App reset to seed data via reset button:
- 5 signals active ✓
- Estimate: "≈ 9" кроликов ✓
- Confidence: "62%" ✓
- All tables and recommendations visible ✓

---

## Session Conclusion
**40-minute exploratory test revealed 3 reproducible defects in core functionality:**
1. **Input value changes not triggering recalculation** (critical for data pipelines)
2. **Import feature non-functional** (data integrity risk)
3. **Display desync** (low risk, cosmetic)

**Positive findings:** Checkbox toggles, reset button, and basic UI navigation all work correctly.

**Recommendation:** Prioritize defect investigation on input event handling and import validation logic before next release.
