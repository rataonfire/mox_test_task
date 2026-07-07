import type { SignalEvent, EventType } from './types';

const VALID_EVENT_TYPES: EventType[] = [
  'missing_carrot',
  'new_hole',
  'motion_sensor',
  'rustle_detected',
  'footprints',
];

function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function isValidEventType(event: string): event is EventType {
  return VALID_EVENT_TYPES.includes(event as EventType);
}

export function validateImport(
  text: string,
): { ok: true; signals: SignalEvent[]; warnings: string[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: 'Невозможно распарсить JSON.',
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'Данные должны быть массивом JSON.',
    };
  }

  const signals: SignalEvent[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    if (typeof item !== 'object' || item === null) {
      return {
        ok: false,
        error: `Элемент ${i}: должен быть объектом.`,
      };
    }

    // Check required fields
    if (!('id' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "id" отсутствует.`,
      };
    }
    if (!('event' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "event" отсутствует.`,
      };
    }
    if (!('location' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "location" отсутствует.`,
      };
    }
    if (!('count' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "count" отсутствует.`,
      };
    }
    if (!('intensity' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "intensity" отсутствует.`,
      };
    }
    if (!('time' in item)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "time" отсутствует.`,
      };
    }

    // Validate types and values
    if (typeof item.id !== 'string') {
      return {
        ok: false,
        error: `Элемент ${i}: поле "id" должно быть строкой (получено: ${typeof item.id}).`,
      };
    }

    if (typeof item.event !== 'string' || !isValidEventType(item.event)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "event" должно быть одним из: ${VALID_EVENT_TYPES.join(', ')} (получено: ${item.event}).`,
      };
    }

    if (typeof item.location !== 'string') {
      return {
        ok: false,
        error: `Элемент ${i}: поле "location" должно быть строкой (получено: ${typeof item.location}).`,
      };
    }

    if (!Number.isInteger(item.count) || item.count < 0) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "count" должно быть целым числом ≥ 0 (получено: ${item.count}).`,
      };
    }

    if (!Number.isInteger(item.intensity) || item.intensity < 1 || item.intensity > 10) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "intensity" должно быть целым числом от 1 до 10 (получено: ${item.intensity}).`,
      };
    }

    if (typeof item.time !== 'string' || !isValidTime(item.time)) {
      return {
        ok: false,
        error: `Элемент ${i}: поле "time" должно быть в формате HH:MM (получено: ${item.time}).`,
      };
    }

    // Handle active field (optional)
    let active: boolean | undefined;
    if ('active' in item) {
      if (typeof item.active !== 'boolean') {
        return {
          ok: false,
          error: `Элемент ${i}: поле "active" должно быть булевым (получено: ${typeof item.active}).`,
        };
      }
      active = item.active;
    }

    // Check for duplicate ids
    let id = item.id;
    if (seenIds.has(id)) {
      const newId = `${id}_${signals.length}`;
      warnings.push(`ID дублируется: "${id}" переименован в "${newId}".`);
      id = newId;
    }
    seenIds.add(id);

    const signal: SignalEvent = {
      id,
      event: item.event,
      location: item.location,
      count: item.count,
      intensity: item.intensity,
      time: item.time,
    };

    if (active === false) {
      signal.active = false;
    }

    signals.push(signal);
  }

  return {
    ok: true,
    signals,
    warnings,
  };
}

export function exportSignals(signals: SignalEvent[]): string {
  const toExport = signals.map((signal) => {
    const obj: Record<string, unknown> = {
      id: signal.id,
      event: signal.event,
      location: signal.location,
      count: signal.count,
      intensity: signal.intensity,
      time: signal.time,
    };

    // Only include active if it's false
    if (signal.active === false) {
      obj.active = false;
    }

    return obj;
  });

  return JSON.stringify(toExport, null, 2);
}
