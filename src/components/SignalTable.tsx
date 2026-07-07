import { useState } from 'react';
import type { SignalEvent, EventType } from '../engine/types';
import { EVENT_LABELS } from '../engine/defaults';

interface SignalTableProps {
  signals: SignalEvent[];
  onSignalAdd: (signal: SignalEvent) => void;
  onSignalEdit: (id: string, updates: Partial<SignalEvent>) => void;
  onSignalDelete: (id: string) => void;
  onSignalToggle: (id: string, active: boolean) => void;
}

export default function SignalTable({
  signals,
  onSignalAdd,
  onSignalEdit,
  onSignalDelete,
  onSignalToggle,
}: SignalTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<Partial<SignalEvent>>({
    event: 'motion_sensor',
    location: '',
    count: 1,
    intensity: 5,
    time: '12:00',
  });

  const locations = Array.from(
    new Set(signals.map((s) => s.location).filter(Boolean))
  ).sort();

  const handleAddSignal = () => {
    // Validate location is not empty
    if (!formData.location || formData.location.trim().length === 0) {
      setFormError('Укажите локацию — без неё сигнал не попадёт в расчёт.');
      return;
    }
    setFormError('');

    // Generate unique ID using UUID instead of regex-based increment
    const newId = `evt_${crypto.randomUUID().slice(0, 8)}`;

    const newSignal: SignalEvent = {
      id: newId,
      event: (formData.event || 'motion_sensor') as EventType,
      location: formData.location || '',
      count: formData.count ?? 1,
      intensity: formData.intensity ?? 5,
      time: formData.time || '12:00',
      active: true,
    };

    onSignalAdd(newSignal);
    setFormData({
      event: 'motion_sensor',
      location: '',
      count: 1,
      intensity: 5,
      time: '12:00',
    });
    setShowAddForm(false);
  };

  const handleCountChange = (value: string) => {
    let count = parseInt(value, 10);
    if (isNaN(count) || count < 0) count = 0;
    setFormData({ ...formData, count });
  };

  return (
    <div className="signals-card">
      <h2 className="card-title">Сигналы (данные для расчёта)</h2>

      <div className="signals-table-container">
        <table className="signals-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Вкл</th>
              <th style={{ width: '120px' }}>Событие</th>
              <th style={{ width: '120px' }}>Локация</th>
              <th style={{ width: '70px' }}>Кол-во</th>
              <th style={{ width: '100px' }}>Интенсив</th>
              <th style={{ width: '80px' }}>Время</th>
              <th style={{ width: '50px' }}>Удал</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr key={signal.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={signal.active !== false}
                    onChange={(e) =>
                      onSignalToggle(signal.id, e.target.checked)
                    }
                  />
                </td>
                <td>
                  <select
                    value={signal.event}
                    onChange={(e) =>
                      onSignalEdit(signal.id, {
                        event: e.target.value as EventType,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  >
                    {Object.entries(EVENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={signal.location}
                    onChange={(e) =>
                      onSignalEdit(signal.id, { location: e.target.value })
                    }
                    list="locations-list"
                    style={{
                      width: '100%',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={signal.count}
                    onChange={(e) => {
                      let count = parseInt(e.target.value, 10);
                      if (isNaN(count) || count < 0) count = 0;
                      onSignalEdit(signal.id, { count });
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={signal.intensity}
                      onChange={(e) =>
                        onSignalEdit(signal.id, {
                          intensity: parseInt(e.target.value, 10),
                        })
                      }
                      style={{ flex: 1 }}
                    />
                    <span style={{ width: '20px', textAlign: 'center' }}>
                      {signal.intensity}
                    </span>
                  </div>
                </td>
                <td>
                  <input
                    type="time"
                    value={signal.time}
                    onChange={(e) =>
                      onSignalEdit(signal.id, { time: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '4px',
                      fontSize: '14px',
                    }}
                  />
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => onSignalDelete(signal.id)}
                    title="Удалить сигнал"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <datalist id="locations-list">
        {locations.map((loc) => (
          <option key={loc} value={loc} />
        ))}
      </datalist>

      {!showAddForm && (
        <button
          className="btn-add"
          onClick={() => setShowAddForm(true)}
        >
          + Добавить сигнал
        </button>
      )}

      {showAddForm && (
        <div className="add-signal-form">
          <div className="form-row">
            <label>
              События:
              <select
                value={formData.event || 'motion_sensor'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event: e.target.value as EventType,
                  })
                }
              >
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Локация:
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                list="locations-list"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Кол-во:
              <input
                type="number"
                min="0"
                step="1"
                value={formData.count ?? 1}
                onChange={(e) => handleCountChange(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Интенсивность:
              <input
                type="range"
                min="1"
                max="10"
                value={formData.intensity ?? 5}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    intensity: parseInt(e.target.value, 10),
                  })
                }
              />
              <span>{formData.intensity ?? 5}</span>
            </label>
          </div>

          <div className="form-row">
            <label>
              Время:
              <input
                type="time"
                value={formData.time || '12:00'}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </label>
          </div>

          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions">
            <button className="btn-save" onClick={handleAddSignal}>
              Сохранить
            </button>
            <button
              className="btn-cancel"
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
                setFormData({
                  event: 'motion_sensor',
                  location: '',
                  count: 1,
                  intensity: 5,
                  time: '12:00',
                });
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
