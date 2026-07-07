import { pluralRu } from '../engine/format';
import type { Estimate } from '../engine/types';

interface LocationGridProps {
  estimate: Estimate;
}

export default function LocationGrid({ estimate }: LocationGridProps) {
  const { byLocation } = estimate;

  return (
    <div className="card location-card">
      <h2 className="card-title">По локациям</h2>
      <div className="location-grid">
        {byLocation.map((loc) => {
          const signalPlural = pluralRu(
            loc.signals,
            'сигнал',
            'сигнала',
            'сигналов'
          );
          return (
            <div key={loc.location} className="location-item">
              <details className="location-details">
                <summary className="location-summary">
                  <div className="location-name">{loc.location}</div>
                  <div className="location-estimate">
                    ≈ {Math.round(loc.estimate)}
                  </div>
                </summary>
                <div className="location-details-content">
                  <p className="location-signals">
                    {loc.signals} {signalPlural}
                  </p>
                  <p className="location-explanation">{loc.explanation}</p>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
