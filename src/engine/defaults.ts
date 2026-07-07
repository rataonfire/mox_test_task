import type { EventType, Params, SignalEvent } from './types';

export const EVENT_LABELS: Record<EventType, string> = {
  missing_carrot: 'Пропавшая морковь',
  new_hole: 'Новая ямка',
  motion_sensor: 'Датчик движения',
  rustle_detected: 'Шорох',
  footprints: 'Следы',
};

export const DEFAULT_PARAMS: Params = {
  typeWeights: {
    new_hole: 1.2,
    motion_sensor: 1.0,
    rustle_detected: 0.5,
    missing_carrot: 0.4,
    footprints: 0.3,
  },
  overlapDiscount: 0.6,
  uncertaintyWidth: 0.5,
  lowConfidenceThreshold: 40,
};

export const SEED_DATA: SignalEvent[] = [
  {
    id: 'evt_001',
    event: 'missing_carrot',
    location: 'Огород',
    count: 5,
    intensity: 4,
    time: '08:30',
  },
  {
    id: 'evt_002',
    event: 'new_hole',
    location: 'У забора',
    count: 2,
    intensity: 7,
    time: '09:10',
  },
  {
    id: 'evt_003',
    event: 'motion_sensor',
    location: 'Сарай',
    count: 1,
    intensity: 8,
    time: '10:05',
  },
  {
    id: 'evt_004',
    event: 'rustle_detected',
    location: 'Сарай',
    count: 3,
    intensity: 5,
    time: '10:20',
  },
  {
    id: 'evt_005',
    event: 'footprints',
    location: 'Теплица',
    count: 6,
    intensity: 6,
    time: '11:45',
  },
];
