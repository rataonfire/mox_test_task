import type { Estimate } from '../engine/types';

interface ContributionBarsProps {
  estimate: Estimate;
}

export default function ContributionBars({ estimate }: ContributionBarsProps) {
  const { contributions } = estimate;

  return (
    <div className="card contribution-card">
      <h2 className="card-title">Что повлияло на оценку</h2>
      <div className="bars-container">
        {contributions.map((contrib, idx) => {
          const isTopThree = idx < 3;
          const opacity = isTopThree ? 1 : 0.6;
          const fontWeight = isTopThree ? 'bold' : 'normal';

          return (
            <div key={contrib.signalId} className="bar-row" style={{ opacity }}>
              <div className="bar-label" style={{ fontWeight }}>
                {contrib.explanation}
              </div>
              <div className="bar-background">
                <div
                  className="bar-fill"
                  style={{
                    width: `${contrib.share * 100}%`,
                  }}
                />
              </div>
              <div className="bar-value">{(contrib.share * 100).toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
