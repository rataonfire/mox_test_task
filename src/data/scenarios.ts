import type { SignalEvent } from '../engine/types';

export const QUIET_MORNING: SignalEvent[] = [
  {
    id: 'evt_quiet_001',
    event: 'rustle_detected',
    location: 'Сарай',
    count: 1,
    intensity: 2,
    time: '06:30',
  },
  {
    id: 'evt_quiet_002',
    event: 'footprints',
    location: 'Огород',
    count: 2,
    intensity: 3,
    time: '07:00',
  },
];

export const INVASION: SignalEvent[] = [
  {
    id: 'evt_inv_001',
    event: 'missing_carrot',
    location: 'Огород',
    count: 12,
    intensity: 9,
    time: '08:00',
  },
  {
    id: 'evt_inv_002',
    event: 'new_hole',
    location: 'Огород',
    count: 8,
    intensity: 9,
    time: '08:15',
  },
  {
    id: 'evt_inv_003',
    event: 'new_hole',
    location: 'У забора',
    count: 5,
    intensity: 8,
    time: '08:30',
  },
  {
    id: 'evt_inv_004',
    event: 'footprints',
    location: 'Огород',
    count: 15,
    intensity: 8,
    time: '09:00',
  },
  {
    id: 'evt_inv_005',
    event: 'motion_sensor',
    location: 'Сарай',
    count: 7,
    intensity: 9,
    time: '09:30',
  },
  {
    id: 'evt_inv_006',
    event: 'rustle_detected',
    location: 'Теплица',
    count: 6,
    intensity: 7,
    time: '10:00',
  },
  {
    id: 'evt_inv_007',
    event: 'missing_carrot',
    location: 'Теплица',
    count: 8,
    intensity: 8,
    time: '10:30',
  },
];
