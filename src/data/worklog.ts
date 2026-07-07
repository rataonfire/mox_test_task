// [DRAFT — human must edit before ship]

export interface WorklogCheckpoint {
  id: number;
  title: string;
  phase: string;
  prompt: string;
  result: string;
  decision: string;
  verification: string;
}

export const WORKLOG_CHECKPOINTS: WorklogCheckpoint[] = [
  {
    id: 1,
    title: 'Постановка задачи',
    phase: 'План',
    prompt:
      'Переформулировать ТЗ MOX в 5 пунктов, проверить стек (Node/npm), развернуть каркас Vite React-TS без продуктового кода.',
    result:
      '5 пунктов миссии (дашборд фермера, чистый движок estimate(), интерактивность, обязательный AI Worklog, стек React+Vite+TS+Vitest → Vercel). Node v24.18 / npm 11.16 подтверждены. Каркас react-ts скопирован в корень репозитория.',
    decision:
      'Принял, с одной поправкой: проект живёт в корне, а не в подпапке invisible-rabbits/. Шаблон create-vite поставил React 19 вместо React 18 из ТЗ — оставил как есть (даунгрейд не даёт ничего, для наших хуков API идентичен).',
    verification:
      'node -v (v24.18), npm -v (11.16), npm run build (✓ built in 178ms, exit 0)',
  },
  {
    id: 2,
    title: 'Архитектура и план',
    phase: 'План',
    prompt:
      'Составить PLAN.md по спецификации — дерево компонентов, модель состояния, замороженный API движка, 3 слайса сборки, edge-cases, out-of-scope. Кода не писать.',
    result:
      'Полный PLAN.md с 8 [DECISION] флагами, 17 edge-cases таблицей, 10 smoke-тестами. Архитектор предложил 3 неправильных решения.',
    decision:
      'Принял план с исправлениями: (1) [DECISION #2] отклонён — не нужна реверс-инженерия uncertaintyWidth, формула из ТЗ даёт эталон ровно 7–11. (2) [DECISION #6] отклонён КРИТИЧНО — архитектор прочитал FR-11 как runtime-лог, на самом деле это журнал AI-процесса разработки (5–7 чекпоинтов). Это бы означало автоматический незачёт. (3) Шаг 3 движка исправлен — не округлять по каждой локации, только итог.',
    verification:
      'Ручной пересчёт эталонного примера на бумаге (8.94 → ≈9; 62%; 7–11). Все правки внесены в PLAN.md с пометками [CORRECTED/AMENDED].',
  },
  {
    id: 3,
    title: 'Движок оценки и тесты',
    phase: 'Движок',
    prompt:
      'Workflow из трёх агентов: (1) имплементер: функция estimate() + recommendations.ts + validate.ts + defaults.ts + полный Vitest-набор; (2–3) два адверсариальных проверяющих НЕЗАВИСИМО пересчитывают seed-математику и проверяют чистоту функции.',
    result:
      'Движок зелёный с 32 тестами (эталон: 8.94 → 9 кроликов, 62% средняя, 7–11 диапазон). Проверяющие нашли 4 недочёта: (а) сумма count в рекомендации подписана как сигналов; (б) захардкоженные 0 в объяснениях факторов; (в) русские множественные формы; (г) floating-point при выводе весов.',
    decision:
      'Все 4 исправил сам (точечные правки). Добавил format.ts (pluralRu + round2), переписал объяснения факторов на интерполяцию, исправил множественные формы.',
    verification:
      'npm test — 32/32 зелёные, npm run build — exit 0. Независимый пересчёт верификатором сошёлся с тестовыми ожиданиями.',
  },
  {
    id: 4,
    title: 'Дашборд',
    phase: 'UI',
    prompt:
      'Read-only дашборд поверх замороженного движка — Header с табами, hero-карта ≈9 кроликов, шкала уверенности, вклад сигналов, карточки локаций, рекомендации. Почему через <details>. Вся копия русская.',
    result:
      '8 компонентов (все < 60 строк), layout на CSS Grid. Установка Tailwind упала (сеть) — агент ушёл на самописный CSS с кастомными переменными (globals.css).',
    decision:
      'Принял. UI не содержит модельной математики, только вывод готовых полей estimate().',
    verification:
      'npm test (32/32), npm run build (exit 0). Скриншот 1280×800 показал hero ≈9, 62% средняя, бары с формулами, 4 локации, 3 рекомендации. На 390px нет горизонтального скролла, консоль чистая.',
  },
  {
    id: 5,
    title: 'Интерактивность',
    phase: 'UI',
    prompt:
      'Слайс 3 — полная интерактивность. SignalTable с toggle/edit/delete. ParamsPanel со слайдерами (typeWeights, overlap, uncertainty, threshold). JsonImportModal export/import. ScenarioPresets (seed, quiet morning, invasion) с гарантиями на оценку. WorklogTab с реальным содержимым.',
    result:
      'SignalTable с inline редактированием, добавлением новых сигналов (автоинкремент evt_NNN), удалением. ParamsPanel с 6 слайдерами и reset. JsonImportModal с валидацией и русскими ошибками. ScenarioPresets с трумя сценариями. WorklogTab с 6 курируемыми чекпоинтами.',
    decision:
      'Все компоненты < 150 строк, React hooks для state. localStorage персистенция (debounce 300ms). Новые сигналы с детерминированным ID без рандома.',
    verification:
      'npm test (все тесты + scenario-assertions зелёные), npm run build (exit 0). Ручная проверка UI: edit сигнал → оценка пересчитывается мгновенно, слайдеры работают, JSON import/export работает, сценарии меняют оценку как ожидается.',
  },
  {
    id: 6,
    title: 'Финальная проверка',
    phase: 'Финал',
    prompt: 'Полный smoke-тест по чек-листу. Отзывчивость на 390/768/1280px. Проверка localStorage.',
    result: '[будет дополнено после финальной проверки]',
    decision: '[будет дополнено после финальной проверки]',
    verification: '[будет дополнено после финальной проверки]',
  },
];

export default WORKLOG_CHECKPOINTS;
