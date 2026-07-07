import { pluralRu, round2 } from '../engine/format';
import type { Estimate } from '../engine/types';

interface EstimateCardProps {
  estimate: Estimate;
}

export default function EstimateCard({ estimate }: EstimateCardProps) {
  const { rabbits, range } = estimate;
  const plural = pluralRu(rabbits, 'кролик', 'кролика', 'кроликов');

  return (
    <div className="card estimate-card">
      <div className="estimate-header">
        <div className="estimate-main">
          <span className="estimate-symbol">≈</span>
          <span className="estimate-number">{rabbits}</span>
          <span className="estimate-label">{plural}</span>
        </div>
      </div>
      <div className="estimate-range">
        (от {range[0]} до {range[1]})
      </div>
      <div className="estimate-context" style={{fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px"}}>
        {(() => {
          const n = estimate.byLocation.reduce((sum, l) => sum + l.signals, 0);
          return `на основе ${n} ${pluralRu(n, 'сигнала', 'сигналов', 'сигналов')}`;
        })()}
      </div>
      <details className="estimate-details">
        <summary className="summary-label">почему?</summary>
        <div className="details-content">
          <p>
            Складываем оценки по локациям:{' '}
            {estimate.byLocation.map((l) => `«${l.location}» ≈ ${round2(l.estimate)}`).join(' + ')}{' '}
            = {round2(estimate.rawEstimate)}, округляем до {rabbits}.
          </p>
          <p>
            Вилка «от {range[0]} до {range[1]}» отражает уверенность ({estimate.confidence.score}%):
            чем меньше уверенность, тем шире разброс.
          </p>
        </div>
      </details>
    </div>
  );
}
