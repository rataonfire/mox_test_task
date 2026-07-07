import type { SignalEvent, Params } from '../engine/types';
import { SEED_DATA, DEFAULT_PARAMS } from '../engine/defaults';
import { QUIET_MORNING, INVASION } from '../data/scenarios';

interface ScenarioPresetsProps {
  onScenarioSelect: (signals: SignalEvent[], params: Params) => void;
}

export default function ScenarioPresets({
  onScenarioSelect,
}: ScenarioPresetsProps) {
  return (
    <div className="scenarios-card">
      <h3 className="card-title">Сценарии</h3>
      <div className="scenarios-buttons">
        <button
          className="btn-scenario"
          onClick={() => onScenarioSelect(SEED_DATA, DEFAULT_PARAMS)}
        >
          Исходные данные
        </button>
        <button
          className="btn-scenario"
          onClick={() => onScenarioSelect(QUIET_MORNING, DEFAULT_PARAMS)}
        >
          Тихое утро
        </button>
        <button
          className="btn-scenario"
          onClick={() => onScenarioSelect(INVASION, DEFAULT_PARAMS)}
        >
          Нашествие кроликов
        </button>
      </div>
    </div>
  );
}
