import { describe, it, expect } from 'vitest';
import { estimate } from '../engine/estimate';
import { DEFAULT_PARAMS } from '../engine/defaults';
import { QUIET_MORNING, INVASION } from './scenarios';

describe('Scenario Presets', () => {
  it('QUIET_MORNING yields confidence score < 40 (низкая уверенность)', () => {
    const result = estimate(QUIET_MORNING, DEFAULT_PARAMS);
    expect(result.confidence.score).toBeLessThan(40);
    expect(result.confidence.label).toBe('низкая');
  });

  it('INVASION yields rabbits >= 10 (invasion alert)', () => {
    const result = estimate(INVASION, DEFAULT_PARAMS);
    expect(result.rabbits).toBeGreaterThanOrEqual(10);
  });

  it('INVASION should include invasion alert in recommendations', () => {
    const result = estimate(INVASION, DEFAULT_PARAMS);
    const invasionRec = result.recommendations.find(
      (r) => r.text.includes('Похоже на нашествие')
    );
    expect(invasionRec).toBeDefined();
    expect(invasionRec?.severity).toBe('alert');
  });
});
