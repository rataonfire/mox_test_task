import type { Estimate } from '../engine/types';

interface RecommendationListProps {
  estimate: Estimate;
}

export default function RecommendationList({
  estimate,
}: RecommendationListProps) {
  const { recommendations } = estimate;

  const getBadge = (severity: string) => {
    switch (severity) {
      case 'info':
        return '🔵';
      case 'warn':
        return '⚠️';
      case 'alert':
        return '🔴';
      default:
        return '';
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return '#3B82F6';
      case 'warn':
        return '#F59E0B';
      case 'alert':
        return '#EF4444';
      default:
        return '#ccc';
    }
  };

  return (
    <div className="card recommendation-card">
      <h2 className="card-title">Рекомендации</h2>
      <div className="recommendations-list">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="recommendation-item"
            style={{
              borderLeftColor: getBorderColor(rec.severity),
            }}
          >
            <div className="recommendation-header">
              <span className="recommendation-badge">
                {getBadge(rec.severity)}
              </span>
              <span className="recommendation-text">{rec.text}</span>
            </div>
            <div className="recommendation-reason">{rec.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
