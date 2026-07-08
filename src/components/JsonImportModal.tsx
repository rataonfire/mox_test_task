import { useState } from 'react';
import type { SignalEvent, Params } from '../engine/types';
import { validateImport, exportSignals } from '../engine/validate';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignals: SignalEvent[];
  onImport: (signals: SignalEvent[], params?: Params) => void;
}

export default function JsonImportModal({
  isOpen,
  onClose,
  currentSignals,
  onImport,
}: JsonImportModalProps) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [tab, setTab] = useState<'export' | 'import'>('export');

  const handleClose = () => {
    setImportText('');
    setImportError(null);
    setImportWarnings([]);
    setTab('export');
    onClose();
  };

  const handleImport = () => {
    const result = validateImport(importText);
    if (!result.ok) {
      setImportError(result.error);
      setImportWarnings([]);
      return;
    }

    setImportError(null);
    setImportWarnings(result.warnings);
    onImport(result.signals);
    setImportText('');

    setTimeout(() => {
      handleClose();
    }, 800);
  };

  const handleExportCopy = async () => {
    const json = exportSignals(currentSignals);
    try {
      await navigator.clipboard.writeText(json);
      alert('Скопировано в буфер обмена');
    } catch {

      const textarea = document.getElementById(
        'export-textarea'
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>JSON Импорт/Экспорт</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'export' ? 'active' : ''}`}
            onClick={() => setTab('export')}
          >
            Экспорт
          </button>
          <button
            className={`modal-tab ${tab === 'import' ? 'active' : ''}`}
            onClick={() => setTab('import')}
          >
            Импорт
          </button>
        </div>

        <div className="modal-body">
          {tab === 'export' && (
            <div className="export-section">
              <label>Текущие данные:</label>
              <textarea
                id="export-textarea"
                readOnly
                value={exportSignals(currentSignals)}
                className="modal-textarea"
              />
              <button
                className="btn-primary modal-button-margin"
                onClick={handleExportCopy}
              >
                Скопировать
              </button>
            </div>
          )}

          {tab === 'import' && (
            <div className="import-section">
              <label>Вставьте JSON для загрузки:</label>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                  setImportWarnings([]);
                }}
                placeholder='[{"id": "evt_001", "event": "missing_carrot", ...}]'
                className="modal-textarea"
              />

              {importError && (
                <div className="import-error">
                  <strong>Ошибка:</strong> {importError}
                </div>
              )}

              {importWarnings.length > 0 && (
                <div className="import-warnings">
                  <strong>Предупреждения:</strong>
                  <ul>
                    {importWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                className="btn-primary modal-button-margin"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Загрузить
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
