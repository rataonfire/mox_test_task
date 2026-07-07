import { useMemo, useState } from 'react';
import { estimate } from './engine/estimate';
import { SEED_DATA, DEFAULT_PARAMS } from './engine/defaults';
import type { SignalEvent, Params } from './engine/types';
import Header from './components/Header';
import DataTab from './components/DataTab';
import WorklogTab from './components/WorklogTab';
import './styles/globals.css';

function App() {
  const [signals, setSignals] = useState<SignalEvent[]>(SEED_DATA);
  const [params] = useState<Params>(DEFAULT_PARAMS);
  const [activeTab, setActiveTab] = useState<'data' | 'worklog'>('data');

  const result = useMemo(() => estimate(signals, params), [signals, params]);

  const handleReset = () => {
    setSignals(SEED_DATA);
  };

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetToSeed={handleReset}
      />
      <main className="main-content">
        {activeTab === 'data' && (
          <DataTab estimate={result} signals={signals} />
        )}
        {activeTab === 'worklog' && <WorklogTab />}
      </main>
    </div>
  );
}

export default App;
