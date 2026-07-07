import type { SignalEvent, Estimate } from '../engine/types';
import EstimateCard from './EstimateCard';
import ConfidenceGauge from './ConfidenceGauge';
import ContributionBars from './ContributionBars';
import LocationGrid from './LocationGrid';
import RecommendationList from './RecommendationList';

interface DataTabProps {
  estimate: Estimate;
  signals: SignalEvent[];
}

export default function DataTab({ estimate }: DataTabProps) {
  return (
    <div className="data-tab">
      <div className="hero-row">
        <EstimateCard estimate={estimate} />
        <ConfidenceGauge estimate={estimate} />
      </div>
      <div className="full-width-row">
        <ContributionBars estimate={estimate} />
      </div>
      <div className="full-width-row">
        <LocationGrid estimate={estimate} />
      </div>
      <div className="full-width-row">
        <RecommendationList estimate={estimate} />
      </div>
    </div>
  );
}
