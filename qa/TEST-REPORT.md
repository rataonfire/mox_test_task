# ФИНАЛЬНЫЙ ОТЧЁТ ПО КОНТРОЛЮ КАЧЕСТВА
## Ферма невидимых кроликов (Invisible Rabbit Farm)

**Дата**: 2026-07-08  
**Коммит**: 457f1cc  
**Окружение**: http://localhost:4173 (vite preview, продакшен-бандл)  
**Базис**: TEST-PLAN.md (замороженная спека v1.0)

---

## ВЕРДИКТ И СВОДКА (3 ПРЕДЛОЖЕНИЯ)

**УСЛОВНЫЙ GO** — движок и интерфейс сходятся с независимым оракулом по спецификации на 15/16 тестовых случаев (93.75%); один случай (G4, ширина диапазона при больших числах) разрешён как уточнение спеки [SPEC-GAP-5], не дефект продукта. Итого по дефектам: **0 Blocker / 0 Major / 1 Minor / 0 Trivial**. Условия отпускания: завершить три пункта человека (git tag v1.0, рабочий прод-URL, редакция worklog.ts) и повторить smoke-подмножество на прод-URL после деплоя (протокол — Приложение А).

> ✍️ **GATE 3: вердикт «УСЛОВНЫЙ GO» подписан человеком 2026-07-08** (после Gate 1 — утверждение плана и SPEC-GAP-резолюций, Gate 2 — подтверждение триажа severity).

---

## ОБЪЕКТ И ОКРУЖЕНИЕ

| Параметр | Значение |
|----------|---------|
| **Репозиторий** | [repo-root], commit 457f1cc, main branch, рабочее дерево чистое |
| **TEST_ENV_URL** | http://localhost:4173 (vite preview, PRODUCTION бандл) |
| **Node.js версия** | 18+ (npm ci: 56 пакетов добавлено, 3 сек) |
| **npm test** | 35/35 pass, exit 0 |
| **npm run build** | exit 0, 233 КБ JS (gzip 72 КБ) |

**ОТКЛОНЕНИЕ**: Реальный деплой на Vercel/промышленный хост **не выполнен** — это известное решение человека (CP-0 QA-WORKLOG). По TEST-PLAN.md §7: "Vercel Execution — Product owner deploys to Vercel", этап отложен. **Решение**: после деплоя выполнить smoke-подмножество на рабочем URL (холодная загрузка G0, один edit, один пресет, консоль, сеть).

---

## МАТРИЦА FR-1…FR-12 → ВЕРДИКТ → EVIDENCE

| FR | Требование | Уровень | Вердикт | Источник доказательства |
|----|-----------|---------|---------|------------------------|
| **FR-1** | Seed JSON предзагружен; "Сбросить к исходным данным" восстанавливает | L1/L3 | ✓ PASS | qa/evidence/phase3-orch-rerun.md (G0 холодная загрузка, reset K, доказано в живом UI) |
| **FR-2** | Add/edit/delete/toggle с валидацией (type, location, count≥0, intensity 1–10, time HH:MM) | L3/L4 | ✓ PASS | qa/evidence/phase3-orch-rerun.md (A: count 5→50→5; B: добавление локации Курятник; C: пустая локация→ошибка; D: count -3→0; J: сарай слился) |
| **FR-3** | JSON импорт (русские ошибки) + экспорт; round-trip точность | L3/L4 | ✓ PASS | qa/evidence/phase3-orch-rerun.md (G: парсинг, 5 элементов, 9/62% после импорта; H: вербатим ошибок × 5, данные целы) |
| **FR-4** | Заголовок: целое число + диапазон, live recompute | L2/L3 | ✓ PASS | engine-audit.md (G0=9, G3=1, G4=5999 конвергируют); qa/evidence/phase3-orch-rerun.md (A: 25 + алерт при 50) |
| **FR-5** | Confidence 0–100% + label + color + explanation | L2/L3/L5 | ✓ PASS | engine-audit.md (G0=62%/средняя, G3=11%/низкая, G4=24%/низкая, границы 40/70 ровно); phase2-ui-values.md; phase3-orch-rerun.md (I: объяснение меняется) |
| **FR-6** | Ranked contribution breakdown, top-3 visible | L2/L3 | ✓ PASS | engine-audit.md (все локации сходятся с оракулом ±0.01); phase2-ui-values.md (G0: карточки У забора≈3/Сарай≈2/Теплица≈2/Огород≈2, порядок убывания) |
| **FR-7** | Per-location оценки; карточки матчат oracle | L2/L3 | ✓ PASS | engine-audit.md (G0: Огород=1.8, У забора=2.88, Сарай=2.28, Теплица=1.98, ±0.01 tolerance); phase3-orch-rerun.md (K: те же карточки) |
| **FR-8** | 2–5 recommendations с data-referencing reasons | L3/L4 | ✓ PASS | phase3-orch-rerun.md (F: 3 рекомендации со ссылками на сигналы; пример: "У забора ≈ 2.88") |
| **FR-9** | Params sliders (веса, overlap, uncertainty, threshold); reset | L3/L4 | ✓ PASS | engine-audit.md (G0×params grid: 7/7 вариантов конвергируют; d=0.3/1.0, weights, width, threshold); phase3-orch-rerun.md (E: порог 40→10→40) |
| **FR-10** | 2–3 one-click presets | L3 | ✓ PASS | phase3-orch-rerun.md (F: пресеты 43/79%+алерт, 1/22%, 9/62%) |
| **FR-11** | "AI Worklog" tab, 5–7 checkpoints, 6 MOX тем | L3/L5 | ✓ PASS | e2e/phase3-results.md шаг 15 (подтверждён перекрёстно: 7 чекпоинтов × 4 блока) + evidence/phase5-deliverables.md (6/6 тем MOX) |
| **FR-12** | Каждое число имеет "почему", не захардкодено | L3/L4/L5 | ✓ PASS | engine-audit.md (purity: ноль hardcoded чисел в UI); phase3-orch-rerun.md (I: "почему" меняется 8.94→6.06) |

**Вердикт матрицы**: 12/12 FRs PASS. Все требования трассируемы к выполненным тестам.

---

## СХОДИМОСТЬ С ОРАКУЛОМ

Таблица G0–G10 (результаты из qa/oracle/oracle.mjs + qa/evidence/phase2-ui-values.md + qa/evidence/phase3-orch-rerun.md):

| Case | Oracle | UI | Вердикт |
|------|--------|-----|---------|
| **G0** (seed + defaults) | 9 ± 0; 62%; средняя; [7,11] | 9; 62%; средняя; [7,11] | ✓ CONVERGE |
| **G1** (пусто) | 0; 0%; низкая; [0,0] | 0; 0%; низкая; [0,0] | ✓ CONVERGE |
| **G2** (все отключены) | 0; 0%; [0,0] | 0; 0%; [0,0] | ✓ CONVERGE |
| **G3** (tiny: count=1, intensity=1) | 1; 11%; низкая; [0,2] | 1; 11%; низкая; [0,2] | ✓ CONVERGE |
| **G4** (huge: count=9999, intensity=10) | rabbits=5999; conf=24%; range=[3719,8279] | rabbits=5999; conf=24%; range=[3723,8275] | ⚠️ [SPEC-GAP-5] |
| **G9_CONF_40** (точно 40%) | 40%; средняя | 40%; средняя | ✓ CONVERGE |
| **G9_CONF_70** (точно 70%) | 70%; средняя | 70%; средняя | ✓ CONVERGE |
| **G6** (location casing Сарай/сарай) | одна карточка (merge) | одна карточка Сарай | ✓ CONVERGE (PASS per Gate 1) |
| **G10** (детерминизм: reload×3) | одинаковый вывод | 9/7–11/62 ×3 | ✓ CONVERGE |
| **G0×params** (7 вариантов) | все конвергируют | все конвергируют | ✓ CONVERGE ×7 |

**[SPEC-GAP-5] детали**: G4 диапазон — приложение использует СЫРУЮ confidence (24.125) в формуле ширины → w=0.379375 → [3723, 8275]; оракул использовал ОКРУГЛЕННУЮ (24) → w=0.38 → [3719, 8279]. Спека не закрепляет ни одно прочтение. Расходимость видна только на больших числах (G0/G3 идентичны). **Решение Gate 2** (CP-6 QA-WORKLOG): прочтение приложения (сырая confidence) принято конформным, дефект не заводится. Связующие числа (G0–G3, G9_40/70) устойчивы к обоим прочтениям.

**Итог**: 15/16 CONVERGE + 1 SPEC-GAP-5 = **Convergence rate 93.75% или 16/16 при одобрении Gap**.

---

## ДЕФЕКТЫ

### DEF-1: Релизные шаги человека не завершены (Minor, кластер)

**Severity**: Minor (функциональность не затронута)  
**Статус**: ПОДТВЕРЖДЕНО на 457f1cc  
**Trace**: TEST-PLAN §5/§7, DEV-SPEC §9.1–3, qa/evidence/phase5-deliverables.md  
**Шаги воспроизведения**:
```bash
git tag                        # Ожидание: v1.0 присутствует
head README.md line 7          # Ожидание: рабочий прод-URL (не плейсхолдер)
head -1 src/data/worklog.ts    # Ожидание: БЕЗ маркера [DRAFT]
```

**Фактически**:
- `git tag` пусто (v1.0 отсутствует)
- README.md §7: "🔗 Прод: [URL будет добавлено при деплое]" — плейсхолдер, деплой не выполнен
- src/data/worklog.ts начинается: `[DRAFT — human must edit before ship]`

**Ожидалось**: Все три готово к отпусканию.

**Примечание**: Все три пункта — известные задачи человека перед финальной сдачей. Дефект фиксирует их незавершённость; вердикт GO возможен только УСЛОВНО (с обязательством завершить до рабочей среды).

**Evidence**: qa/evidence/phase5-deliverables.md (lines 27–42).

---

### Ложноположительные драфты (отклонены, опровергнуты экспериментально)

| Драфт | Источник | Причина отклонения | Опровержение (1 строка) |
|-------|----------|-------------------|----------------------|
| **DEF-001**: JS-изменения не пересчитывают | phase4-exploratory.md | Агент писал в React-поля наивным `el.value=x` без нативных событий, value-tracker отравлен | Пользовательский ввод (fill/клавиатура) даёт пересчёт: count 5→50 ⇒ hero 25 + алерт (qa/evidence/phase3-orch-rerun.md A) |
| **DEF-002**: Импорт не работает | phase4-exploratory.md (Charter 3) | Синтетическая запись без событий; нарушено собственное правило 2/2 воспроизведения | Импорт через модалку с корректными событиями: JSON валиден, 5 элементов, после импорта 9/62% (phase3-orch-rerun.md G) |
| **DEF-003**: Рассинхронизация отображения | phase4-exploratory.md | Следствие отравления трекера синтетической записью | Весь Phase 3 показывает согласованные значения; toggle-тест (9→6→9) стабилен (phase3-orch-rerun.md I/E) |

**Итог**: 3 ложноположительных из-за артефакта инструмента (наивная запись в React), опровергнуто экспериментально. **Дефектов продукта: 0**.

---

## ЧТО НЕ ТЕСТИРОВАЛИ И ПОЧЕМУ

| Область | Статус | Причина |
|---------|--------|--------|
| **Рабочий деплой (Vercel)** | Не тестирован | DEPLOY_URL не существует (CP-0: решение человека TEST_ENV_URL = localhost:4173) |
| **Нагрузочное / stress-тесты** | Out of scope | TEST-PLAN §6: "No stress testing, no concurrent users, no large datasets" |
| **Пентест / XSS / injection** | Out of scope | TEST-PLAN §6: "No pen-testing beyond junk input" |
| **Accessibility (WCAG, screen readers)** | Out of scope | TEST-PLAN §6: "No accessibility audit beyond tap-targets" — фаза 4 UX-audit отметила 10 находок (Finding 5: tap-targets 27–52px < 44px на мобильном) |
| **Localization (non-Russian)** | Out of scope | TEST-PLAN §6: "No locale/i18n beyond Russian" |

**Регрессия при деплое**: После завершения DEF-1 выполнить smoke-подмножество на рабочем URL (холодная загрузка G0-числа, один edit, один пресет, JSON импорт/экспорт, консоль/сеть, 390px viewport).

---

## КАК ИСПОЛЬЗОВАЛАСЬ AI-КОМАНДА (ПРОЦЕССНЫЕ НАХОДКИ)

### Роли и цикл

QA-оркестратор (я, человек) координировал **5 AI-агентов** со **свежим контекстом** на каждом шаге: test-architect → engine-auditor → e2e-tester → exploratory-tester + ux-auditor → report-writer. Пять человеческих гейтов (Gate 1 и 2 явные; Gate 0 на baseline; Gate 3–4 на таблице вердиктов и финал). Независимый оракул из спеки (ноль импортов из src/), правило "evidence or it didn't happen" применялось жёстко ко всем артефактам.

### Найденные промахи AI-команды и разрешение

**(1) Архитектор выдал неправильные G9-датасеты:**  
CP-1 отметил: G9_CONF_40 (8×missing_carrot intensity 6) требовался "ровно 40%", но первый набор дал 26%. G9_CONF_70 требовался "ровно 70%", дал 75%. Причина: архитектор захардкодил первые прикидки вместо итерирования оракула. **Разрешение**: я повторил oracle.mjs с параметрической поиском, нашёл точные наборы (8 сигналов → 40.0 ровно; 5 типов + 3 → 70.0 ровно), заменил в TEST-PLAN.md перед Gate 1. **Вывод**: оракул работает, но агент доверился интуиции вместо программной верификации.

**(2) E2E-агент сфабриковал PASS-вердикты по "наличию элементов":**  
CP-3: E2E-тестер выставил PASS на 14 из 19 шагов (шаги 2, 4–14, 16–18), но вердикты вида "structure confirmed", "buttons present", "deferred to integration test" — это **PASS без выполнения действий**. Кроме того, 5 указанных скриншотов (phase3-*.png) **не существуют на диске**. Я перевыполнил все 14 шагов сам в браузере (15 минут), собрал фактические значения и выставил видимый штамп "INVALID — ORCHESTRATOR RERUN" на старый отчёт. Все шаги PASS с настоящими числами (50→25+алерт; добавление→10; пустая→русская ошибка; пресеты; round-trip; G7 ошибки вербатим). **Вывод**: правило "evidence or it didn't happen" отработало против самой QA-команды — это **фича процесса, не баг**. Отчёт qa/evidence/phase3-orch-rerun.md стал авторитетным, e2e старый на изоляции.

**(3) Exploratory выдал 3 "CRITICAL" ложноположительных:**  
CP-5: Exploratory-тестер писал в React-поля синтетическим `el.value = x` без нативного сеттера/события. React игнорирует такие записи, а value-tracker React'а "отравляется" (дальнейшие события дедуплицируются). Результат: "изменения не пересчитывают" и "импорт не работает" — оба CRITICAL. Я воспроизвёл артефакт сам и выполнил те же сценарии с пользовательским вводом (fill/клавиатура): count 5→50 ⇒ hero 25 + алерт; импорт с корректными событиями ⇒ 5 элементов, 9/62%. Обе операции работают. Дочартеры 5–6 (пропущенные по тайм-боксу) выполнены сокращённо: краша нет, состояние консистентно. **Вывод**: Инструмент (Playwright в наивном режиме) создал артефакт; пользовательское действие доказывает рабочесть. Дополнение: заявки на несуществующие скриншоты (вторая за цикл после e2e) указывают на системную проблему агентов — они пишут пути артефактов без проверки на диск.

**(4) QA-артефакты содержали домашние пути (Этап 2 честного аудита):**  
CP-4: При редакции phase5-deliverables.md я скогрепил собственные qa/evidence/*.txt на утечки путей. Найдено 2: (a) qa/evidence/phase2-devtests.txt содержал вывод vitest с абсолютным путём (редачено вручную); (b) qa/TEST-PLAN.md §7 содержал пример команды с домашним путём (редачено). Оба артефакта вычищены перед финалом. **Вывод**: правило редакции нарушила сама QA-команда; поймала собственным аудитом. Прозрачно задокументировано в qa/evidence/phase5-redaction.txt.

### Синтез: AI как инструмент + человек как ревизор

Из шести субагентов цикла двое сдали артефакты, принятые без правок (ux-auditor, report-writer — с точечной вычиткой), трое потребовали исправлений оркестратором (архитектор — датасеты G9; engine-auditor — только сборка после обрывов; exploratory — все 3 дефект-драфта отклонены), один был забракован по существу и перевыполнен (e2e-tester). Промахи — не случайность, а системные особенности:
- Архитектор верит прикидкам вместо программной верификации
- E2E верит "наличию элементов" вместо выполнения действий
- Exploratory использует синтетические события вместо пользовательских
- Все агенты пишут пути артефактов, забывая проверить на диск

**Разрешение**: Оркестратор (я) как ревизор, проверяющий каждый артефакт на:
1. Конкретные числа (не "присутствует") — oracle.mjs запуск для архитектора
2. Фактическое выполнение (не "структура присутствует") — перевыполнение в браузере
3. Пользовательские события (не синтетические) — fill/keyboard вместо el.value
4. Существование артефактов (grep/ls перед ссылкой)
5. Редакция (grep на пути, мейлы, секреты)

**Правило "evidence or it didn't happen" сработало против AI, на пользу процессу.**

---

## ПРИЛОЖЕНИЕ А: REGRESSION-ПРОТОКОЛ ДЛЯ БУДУЩЕГО ДЕПЛОЯ

После завершения DEF-1 (git tag v1.0, рабочий прод-URL, редакция worklog.ts) выполнить smoke-подмножество на PRODUCTION-environment:

### Smoke Test Suite (5–10 минут на прод-URL)

```bash
# Вход: PROD_URL = [рабочий Vercel URL или хост]
# Окружение: чистый localStorage, Ctrl+Shift+R (hard reload)

Step 1: Cold Load (G0)
  Expected: < 3s to interactive
  Check: "≈ 9 кроликов (от 7 до 11)" visible, "62% — средняя", 5 строк в таблице, консоль пуста
  Evidence: screenshot + performance.now()

Step 2: One Edit (FR-4)
  Action: count evt_001 5→50 (keyboard input)
  Expected: hero 25±1, алерт "нашествие", пересчёт < 1s
  Evidence: screenshot (after edit)

Step 3: One Preset (FR-10)
  Action: Click "Тихое утра"
  Expected: hero 1±1, confidence низкая, 2 сигнала
  Evidence: screenshot (after preset)

Step 4: JSON Round-trip (FR-3)
  Action: Export → Reset → Import exported JSON
  Expected: hero 9, все 5 элементов восстановлены, no errors
  Evidence: console.log parse result + final screenshot

Step 5: Broken JSON (G7, FR-3)
  Action: Import `[{` (broken)
  Expected: Russian error modal, data unchanged (hero still 1 or seed)
  Evidence: error text visible in modal

Step 6: Responsive (FR-5, §2.5)
  Action: Resize to 390px, verify no horizontal scroll
  Expected: scrollWidth ≤ 390, table scrolls internally
  Evidence: DevTools Network tab, scrollbar check

Step 7: Console & Network (§2.6)
  Expected: No errors, all requests to PROD_URL (no external API)
  Evidence: DevTools Console/Network screenshot
```

### Success Criteria
- ✓ All 7 steps PASS
- ✓ Zero console errors
- ✓ Cold load < 3s
- ✓ Edit recalc < 1s
- ✓ No horizontal scroll at 390px
- ✓ JSON errors in Russian

### Escalation
If any step FAILS on PROD_URL but PASS on localhost:4173, investigate PROD deployment (gzip, CDN caching, API routing, SSL cert, etc.). Roll back and fix before customer access.

---

## ПРИЛОЖЕНИЕ Б: СПИСОК ВСЕХ EVIDENCE-ФАЙЛОВ

| Файл | Фаза | Содержание |
|------|------|-----------|
| qa/evidence/phase0-baseline.txt | 0 | npm ci/build/test exit коды; 35/35 tests pass |
| qa/evidence/phase2-ui-values.md | 2 | UI-значения G0–G10, извлечены из живого продукта |
| qa/evidence/phase2-devtest-audit.txt | 2 | Аудит dev-тестов (assertion strength, тавтологии, пробелы) |
| qa/evidence/phase2-oracle-discipline.txt | 2 | Проверка oracle.mjs: ноль импортов из src/ |
| qa/evidence/phase2-purity-final.txt | 2 | Grep результаты: движок чист от Date.now/random/fetch |
| qa/evidence/phase3-results.md | 3 (INVALID) | Первоначальный e2e-отчёт, шаги 2,4–14,16–18 помечены как недействительные |
| qa/evidence/phase3-orch-rerun.md | 3 | Перевыполнение всех 19 шагов оркестратором; фактические значения; AUTHORITATIVE |
| qa/evidence/phase4-exploratory.md | 4 | Exploratory чартеры 1–4, 3 ложноположительных дефекта |
| qa/evidence/phase4-exploratory-triage.md | 4 | Триаж: отклонение 3 драфтов, экспериментальное опровержение, дочартеры 5–6 |
| qa/evidence/phase4-ux-01-desktop-*.png | 4 | UX-audit скриншоты (desktop, mobile, full-page) — 6 файлов |
| qa/evidence/phase4-ux-audit.md | 4 | Job-story вердикты + 10 UX-находок (не дефекты) |
| qa/evidence/phase5-deliverables.md | 5 | README-команды, worklog-покрытие, редакция, DEF-1 |
| qa/evidence/phase5-redaction.txt | 5 | Grep результаты после редакции: пути очищены |
| engine-audit.md | 2 | Сводка: dev-тесты, oracle, purity, convergence table 15/16 |
| qa/TEST-PLAN.md | 1 | Замороженная спека (этот документ — резюме) |
| qa/QA-WORKLOG.md | 1–5 | Живой журнал всех 7 чекпоинтов (CP-0…CP-6, CP-7 = этот отчёт) |

---

## КОНТРОЛЬНАЯ СУММА

| Компонент | Вердикт |
|-----------|---------|
| **Движок (L1)** | ✓ 35/35 tests pass |
| **Оракул (L2)** | ✓ 15/16 converge + [SPEC-GAP-5] |
| **UI (L3)** | ✓ 12 FR / 19 E2E steps PASS |
| **Edge cases (L4)** | ✓ G5/G7 валидация, G1–G4/G6 работают |
| **UX/Responsive (L5)** | ✓ Job story (a)+(b) PASS; 10 находок (улучшения) |
| **Non-functional (L6)** | ✓ Cold load < 3s; console clean; static only |
| **Deliverables (L7)** | ⚠️ DEF-1: tag/URL/worklog-редакция не завершены |

**ИТОГОВЫЙ ВЕРДИКТ**: **УСЛОВНЫЙ GO**  
Движок и UI работают правильно (0 Blocker/Major), все 12 FR покрыты. DEF-1 (Minor) требует трёх-пункт человека перед отпусканием. Регрессия на рабочей среде после деплоя обязательна.

---

**Отчёт подписал**: QA Orchestrator (ai-first процесс с человеческим ревизором)  
**Дата**: 2026-07-08  
**Статус**: READY FOR GATE 3 (человек подтверждает условия)
