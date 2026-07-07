import { useState } from 'react';
import type { Params, EventType } from '../engine/types';
import { EVENT_LABELS, DEFAULT_PARAMS } from '../engine/defaults';

interface ParamsPanelProps {
  params: Params;
  onParamsChange: (params: Params) => void;
}

export default function ParamsPanel({
  params,
  onParamsChange,
}: ParamsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const eventTypes: EventType[] = [
    'missing_carrot',
    'new_hole',
    'motion_sensor',
    'rustle_detected',
    'footprints',
  ];

  const handleWeightChange = (event: EventType, value: number) => {
    const newWeights = { ...params.typeWeights, [event]: value };
    onParamsChange({ ...params, typeWeights: newWeights });
  };

  const handleOverlapChange = (value: number) => {
    onParamsChange({ ...params, overlapDiscount: value });
  };

  const handleUncertaintyChange = (value: number) => {
    onParamsChange({ ...params, uncertaintyWidth: value });
  };

  const handleThresholdChange = (value: number) => {
    onParamsChange({ ...params, lowConfidenceThreshold: value });
  };

  const handleReset = () => {
    onParamsChange(DEFAULT_PARAMS);
  };

  return (
    <div className="params-card">
      <button
        className="params-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span className="params-title">Параметры модели</span>
      </button>

      {isOpen && (
        <div className="params-content">
          <div className="params-section">
            <h3 className="params-section-title">Вес сигналов</h3>
            {eventTypes.map((event) => (
              <div key={event} className="param-slider">
                <label className="param-label">
                  Вес: {EVENT_LABELS[event]}
                </label>
                <div className="slider-row">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={params.typeWeights[event]}
                    onChange={(e) =>
                      handleWeightChange(event, parseFloat(e.target.value))
                    }
                  />
                  <span className="param-value">
                    {params.typeWeights[event].toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="params-section">
            <div className="param-slider">
              <label className="param-label">
                Скидка за пересечение: {params.overlapDiscount.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={params.overlapDiscount}
                onChange={(e) =>
                  handleOverlapChange(parseFloat(e.target.value))
                }
              />
            </div>

            <div className="param-slider">
              <label className="param-label">
                Ширина неопределённости: {params.uncertaintyWidth.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={params.uncertaintyWidth}
                onChange={(e) =>
                  handleUncertaintyChange(parseFloat(e.target.value))
                }
              />
            </div>

            <div className="param-slider">
              <label className="param-label">
                Порог низкой уверенности, %: {params.lowConfidenceThreshold}
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={params.lowConfidenceThreshold}
                onChange={(e) =>
                  handleThresholdChange(parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>

          <button className="btn-reset-params" onClick={handleReset}>
            Сбросить параметры
          </button>
        </div>
      )}
    </div>
  );
}
