import { useMemo, useState } from 'react';
import { estimate } from './engine/estimate';
import type { SignalEvent, Params } from './engine/types';
import { useFarmState } from './hooks/useFarmState';
import Header from './components/Header';
import DataTab from './components/DataTab';
import WorklogTab from './components/WorklogTab';
import JsonImportModal from './components/JsonImportModal';
import './styles/globals.css';

function App() {
  const {
    signals,
    setSignals,
    params,
    setParams,
    resetToSeed,
    setSignalsAndParams,
  } = useFarmState();

  const [activeTab, setActiveTab] = useState<'data' | 'worklog'>('data');
  const [showJsonModal, setShowJsonModal] = useState(false);

  const result = useMemo(() => estimate(signals, params), [signals, params]);

  const handleSignalAdd = (signal: SignalEvent) => {
    setSignals([...signals, signal]);
  };

  const handleSignalEdit = (id: string, updates: Partial<SignalEvent>) => {
    setSignals(
      signals.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleSignalDelete = (id: string) => {
    setSignals(signals.filter((s) => s.id !== id));
  };

  const handleSignalToggle = (id: string, active: boolean) => {
    setSignals(
      signals.map((s) => (s.id === id ? { ...s, active } : s))
    );
  };

  const handleParamsChange = (newParams: Params) => {
    setParams(newParams);
  };

  const handleScenarioSelect = (
    scenarioSignals: SignalEvent[],
    scenarioParams: Params
  ) => {
    setSignalsAndParams(scenarioSignals, scenarioParams);
  };

  const handleImport = (importedSignals: SignalEvent[]) => {
    setSignals(importedSignals);
  };

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetToSeed={resetToSeed}
        onShowJsonModal={() => setShowJsonModal(true)}
      />
      <main className="main-content">
        {activeTab === 'data' && (
          <DataTab
            estimate={result}
            signals={signals}
            params={params}
            onSignalAdd={handleSignalAdd}
            onSignalEdit={handleSignalEdit}
            onSignalDelete={handleSignalDelete}
            onSignalToggle={handleSignalToggle}
            onParamsChange={handleParamsChange}
            onScenarioSelect={handleScenarioSelect}
          />
        )}
        {activeTab === 'worklog' && <WorklogTab />}
      </main>

      <JsonImportModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        currentSignals={signals}
        onImport={handleImport}
      />
    </div>
  );
}

export default App;
