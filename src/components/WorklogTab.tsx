import { WORKLOG_CHECKPOINTS } from '../data/worklog';

export default function WorklogTab() {
  return (
    <div className="worklog-tab">
      <p className="worklog-intro">
        Это журнал AI-first процесса разработки: каждый чекпоинт фиксирует задачу, результат AI, моё решение, проверку.
      </p>

      <div className="worklog-checkpoints">
        {WORKLOG_CHECKPOINTS.map((cp) => (
          <div key={cp.id} className="worklog-checkpoint">
            <div className="checkpoint-header">
              <h3 className="checkpoint-title">{cp.title}</h3>
              <span className="checkpoint-phase">{cp.phase}</span>
            </div>

            <div className="checkpoint-grid">
              <div className="checkpoint-block">
                <div className="checkpoint-label">Промпт</div>
                <div className="checkpoint-content">{cp.prompt}</div>
              </div>

              <div className="checkpoint-block">
                <div className="checkpoint-label">Результат</div>
                <div className="checkpoint-content">{cp.result}</div>
              </div>

              <div className="checkpoint-block">
                <div className="checkpoint-label">Моё решение</div>
                <div className="checkpoint-content">{cp.decision}</div>
              </div>

              <div className="checkpoint-block">
                <div className="checkpoint-label">Проверка</div>
                <div className="checkpoint-content">{cp.verification}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
