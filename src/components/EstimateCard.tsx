import { pluralRu } from '../engine/format';
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
      <details className="estimate-details">
        <summary className="summary-label">почему?</summary>
        <div className="details-content">
          <p>
            Итого {rabbits} {plural} = сумма по локациям с overlap discount{' '}
            {(estimate.confidence.score / 100).toFixed(2)}
          </p>
        </div>
      </details>
    </div>
  );
}
