import { estimate } from './src/engine/estimate.ts';
import { DEFAULT_PARAMS } from './src/engine/defaults.ts';

// Test: signal with empty location should be excluded
const testEmptyLocation = [
  {
    id: 'test1',
    event: 'missing_carrot',
    location: '',
    count: 5,
    intensity: 5,
    time: '12:00',
  },
  {
    id: 'test2',
    event: 'missing_carrot',
    location: 'Огород',
    count: 5,
    intensity: 5,
    time: '12:00',
  }
];

const result = estimate(testEmptyLocation, DEFAULT_PARAMS);
console.log('Empty location test:');
console.log('  Contributions count:', result.contributions.length);
console.log('  Should be 1:', result.contributions.length === 1);
console.log('  Locations:', result.byLocation.length);
