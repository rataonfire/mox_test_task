import type { Estimate } from '../engine/types';

interface ConfidenceGaugeProps {
  estimate: Estimate;
}

export default function ConfidenceGauge({ estimate }: ConfidenceGaugeProps) {
  const { score, factors, explanation } = estimate.confidence;

  const gaugeColor = (() => {
    if (score < 40) return '#EF4444';
    if (score <= 70) return '#F59E0B';
    return '#10B981';
  })();

  const labelText = (() => {
    if (score < 40) return 'низкая';
    if (score <= 70) return 'средняя';
    return 'высокая';
  })();

  return (
    <div className="card confidence-card">
      <div className="confidence-header">
        <div className="confidence-label">{labelText}</div>
        <div className="confidence-score">{score}%</div>
      </div>
      <div className="confidence-gauge-container">
        <div className="confidence-gauge-bar">
          <div
            className="confidence-gauge-fill"
            style={{
              width: `${score}%`,
              backgroundColor: gaugeColor,
            }}
          />
        </div>
      </div>
      <details className="confidence-details">
        <summary className="summary-label">почему?</summary>
        <div className="details-content">
          {factors.map((factor) => (
            <div key={factor.name} className="factor-item">
              <div className="factor-name">{factor.name}</div>
              <div className="factor-score">{factor.score}%</div>
              <div className="factor-explanation">{factor.explanation}</div>
            </div>
          ))}
          <p className="confidence-explanation">{explanation}</p>
        </div>
      </details>
    </div>
  );
}
