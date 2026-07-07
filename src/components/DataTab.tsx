import type { SignalEvent, Params, Estimate } from '../engine/types';
import EstimateCard from './EstimateCard';
import ConfidenceGauge from './ConfidenceGauge';
import ContributionBars from './ContributionBars';
import LocationGrid from './LocationGrid';
import RecommendationList from './RecommendationList';
import SignalTable from './SignalTable';
import ParamsPanel from './ParamsPanel';
import ScenarioPresets from './ScenarioPresets';

interface DataTabProps {
  estimate: Estimate;
  signals: SignalEvent[];
  params: Params;
  onSignalAdd: (signal: SignalEvent) => void;
  onSignalEdit: (id: string, updates: Partial<SignalEvent>) => void;
  onSignalDelete: (id: string) => void;
  onSignalToggle: (id: string, active: boolean) => void;
  onParamsChange: (params: Params) => void;
  onScenarioSelect: (signals: SignalEvent[], params: Params) => void;
}

export default function DataTab({
  estimate,
  signals,
  params,
  onSignalAdd,
  onSignalEdit,
  onSignalDelete,
  onSignalToggle,
  onParamsChange,
  onScenarioSelect,
}: DataTabProps) {
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
      <div className="full-width-row">
        <SignalTable
          signals={signals}
          onSignalAdd={onSignalAdd}
          onSignalEdit={onSignalEdit}
          onSignalDelete={onSignalDelete}
          onSignalToggle={onSignalToggle}
        />
      </div>
      <div className="scenarios-params-row">
        <ScenarioPresets onScenarioSelect={onScenarioSelect} />
        <ParamsPanel params={params} onParamsChange={onParamsChange} />
      </div>
    </div>
  );
}
