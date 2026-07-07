interface HeaderProps {
  activeTab: 'data' | 'worklog';
  onTabChange: (tab: 'data' | 'worklog') => void;
  onResetToSeed: () => void;
  onShowJsonModal: () => void;
}

export default function Header({
  activeTab,
  onTabChange,
  onResetToSeed,
  onShowJsonModal,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">
          🐇 Ферма невидимых кроликов — пульт фермера
        </h1>
        <div className="header-controls">
          <nav className="tabs">
            <button
              className={`tab ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => onTabChange('data')}
            >
              Данные
            </button>
            <button
              className={`tab ${activeTab === 'worklog' ? 'active' : ''}`}
              onClick={() => onTabChange('worklog')}
            >
              AI Worklog
            </button>
          </nav>
          <div className="header-buttons">
            <button className="btn-json" onClick={onShowJsonModal}>
              JSON
            </button>
            <button className="btn-reset" onClick={onResetToSeed}>
              Сбросить к исходным данным
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
