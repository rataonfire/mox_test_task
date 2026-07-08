import { describe, it, expect } from 'vitest';
import { estimate } from './estimate';
import { DEFAULT_PARAMS, SEED_DATA } from './defaults';
import type { SignalEvent } from './types';

describe('estimate engine', () => {
  describe('seed data hand-check', () => {
    it('should produce exact numbers from seed data', () => {
      const result = estimate(SEED_DATA, DEFAULT_PARAMS);

      const contribMap = Object.fromEntries(
        result.contributions.map((c) => [c.signalId, c.value]),
      );

      expect(contribMap['evt_001']).toBeCloseTo(1.8, 10);
      expect(contribMap['evt_002']).toBeCloseTo(2.88, 10);
      expect(contribMap['evt_003']).toBeCloseTo(1.3, 10);
      expect(contribMap['evt_004']).toBeCloseTo(1.5, 10);
      expect(contribMap['evt_005']).toBeCloseTo(1.98, 10);

      const locMap = Object.fromEntries(
        result.byLocation.map((l) => [l.location, l.estimate]),
      );

      expect(locMap['У забора']).toBeCloseTo(2.88, 10);
      expect(locMap['Сарай']).toBeCloseTo(2.28, 10);
      expect(locMap['Теплица']).toBeCloseTo(1.98, 10);
      expect(locMap['Огород']).toBeCloseTo(1.8, 10);

      expect(result.rawEstimate).toBeCloseTo(8.94, 10);

      expect(result.rabbits).toBe(9);

      expect(result.confidence.score).toBe(62);
      expect(result.confidence.label).toBe('средняя');

      expect(result.range[0]).toBe(7);
      expect(result.range[1]).toBe(11);

      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0].severity).toBe('info');
      expect(result.recommendations[0].text).toContain('Установите камеру');
      expect(result.recommendations[1].severity).toBe('warn');
      expect(result.recommendations[1].text).toContain('Осмотрите');
      expect(result.recommendations[2].severity).toBe('warn');
      expect(result.recommendations[2].text).toContain('Накройте');
    });
  });

  describe('weight effects', () => {
    it('should increase rawEstimate when increasing a present type weight', () => {
      const params1 = { ...DEFAULT_PARAMS };
      const params2 = { ...DEFAULT_PARAMS, typeWeights: { ...DEFAULT_PARAMS.typeWeights, missing_carrot: 0.8 } };

      const result1 = estimate(SEED_DATA, params1);
      const result2 = estimate(SEED_DATA, params2);

      expect(result2.rawEstimate).toBeGreaterThan(result1.rawEstimate);
    });

    it('should zero contribution when weight is 0', () => {
      const params = { ...DEFAULT_PARAMS, typeWeights: { ...DEFAULT_PARAMS.typeWeights, missing_carrot: 0 } };
      const result = estimate(SEED_DATA, params);

      const contrib = result.contributions.find((c) => c.signalId === 'evt_001');
      expect(contrib?.value).toBeCloseTo(0, 10);
    });
  });

  describe('overlap discount monotonicity', () => {
    it('should have lower rawEstimate with d=0.3 than d=0.9', () => {
      const params1 = { ...DEFAULT_PARAMS, overlapDiscount: 0.3 };
      const params2 = { ...DEFAULT_PARAMS, overlapDiscount: 0.9 };

      const result1 = estimate(SEED_DATA, params1);
      const result2 = estimate(SEED_DATA, params2);

      expect(result1.rawEstimate).toBeLessThan(result2.rawEstimate);
    });
  });

  describe('confidence boundaries', () => {
    it('should give score 0 and label низкая when no signals', () => {
      const result = estimate([], DEFAULT_PARAMS);
      expect(result.confidence.score).toBe(0);
      expect(result.confidence.label).toBe('низкая');
    });

    it('should have diversity factor score of 20 with single signal type', () => {
      const singleEvent: SignalEvent = {
        id: 'single',
        event: 'footprints',
        location: 'Test',
        count: 1,
        intensity: 5,
        time: '12:00',
      };
      const result = estimate([singleEvent], DEFAULT_PARAMS);

      const diversityFactor = result.confidence.factors.find((f) =>
        f.name.includes('Разнообразие'),
      );
      expect(diversityFactor?.score).toBe(20);
    });

    it('should have diversity factor score of 100 with seed (all 5 types)', () => {
      const result = estimate(SEED_DATA, DEFAULT_PARAMS);
      const diversityFactor = result.confidence.factors.find((f) =>
        f.name.includes('Разнообразие'),
      );
      expect(diversityFactor?.score).toBe(100);
    });

    it('should have volume factor score of 100 with 8+ signals', () => {
      const signals: SignalEvent[] = [];
      for (let i = 0; i < 8; i++) {
        signals.push({
          id: `sig${i}`,
          event: 'footprints',
          location: `loc${i}`,
          count: 1,
          intensity: 5,
          time: '12:00',
        });
      }
      const result = estimate(signals, DEFAULT_PARAMS);
      const volumeFactor = result.confidence.factors.find((f) =>
        f.name.includes('Объём'),
      );
      expect(volumeFactor?.score).toBe(100);
    });
  });

  describe('toggle-off signal', () => {
    it('should exclude signal with active:false from calculation', () => {
      const toggled = SEED_DATA.map((e) => (e.id === 'evt_002' ? { ...e, active: false } : e));

      const result = estimate(toggled, DEFAULT_PARAMS);

      expect(result.rabbits).toBe(6);

      expect(result.confidence.score).toBeLessThan(62);
    });
  });

  describe('min-1 rule', () => {
    it('should return rabbits 1 when single small signal rounds to 0', () => {
      const signal: SignalEvent = {
        id: 'tiny',
        event: 'footprints',
        location: 'Test',
        count: 1,
        intensity: 1,
        time: '12:00',
      };

      const result = estimate([signal], DEFAULT_PARAMS);
      expect(result.rabbits).toBe(1);
    });
  });

  describe('junk input exclusion', () => {
    it('should exclude rows with invalid count, intensity, location', () => {
      const junk: SignalEvent[] = [
        {
          id: 'bad1',
          event: 'missing_carrot',
          location: 'Valid',
          count: -5,
          intensity: 5,
          time: '12:00',
        },
        {
          id: 'bad2',
          event: 'missing_carrot',
          location: 'Valid',
          count: NaN,
          intensity: 5,
          time: '12:00',
        },
        {
          id: 'bad3',
          event: 'missing_carrot',
          location: 'Valid',
          count: 1,
          intensity: 0,
          time: '12:00',
        },
        {
          id: 'bad4',
          event: 'missing_carrot',
          location: 'Valid',
          count: 1,
          intensity: 11,
          time: '12:00',
        },
        {
          id: 'bad5',
          event: 'missing_carrot',
          location: '   ',
          count: 1,
          intensity: 5,
          time: '12:00',
        },
        {
          id: 'good',
          event: 'missing_carrot',
          location: 'Valid',
          count: 2,
          intensity: 5,
          time: '12:00',
        },
      ];

      const result = estimate(junk, DEFAULT_PARAMS);

      expect(result.contributions).toHaveLength(1);
      expect(result.contributions[0].signalId).toBe('good');
    });
  });

  describe('empty and all-toggled-off', () => {
    it('should return rabbits 0 and range [0,0] with one recommendation', () => {
      const result = estimate([], DEFAULT_PARAMS);

      expect(result.rabbits).toBe(0);
      expect(result.range).toEqual([0, 0]);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].text).toContain('Сигналов нет');
    });

    it('should handle all signals toggled off', () => {
      const toggled = SEED_DATA.map((e) => ({ ...e, active: false }));
      const result = estimate(toggled, DEFAULT_PARAMS);

      expect(result.rabbits).toBe(0);
      expect(result.range).toEqual([0, 0]);
      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe('location normalization', () => {
    it('should merge identical locations with different casing', () => {
      const signals: SignalEvent[] = [
        {
          id: 'sig1',
          event: 'missing_carrot',
          location: 'Сарай',
          count: 1,
          intensity: 5,
          time: '12:00',
        },
        {
          id: 'sig2',
          event: 'motion_sensor',
          location: ' сарай ',
          count: 2,
          intensity: 6,
          time: '12:00',
        },
      ];

      const result = estimate(signals, DEFAULT_PARAMS);

      expect(result.byLocation).toHaveLength(1);
      expect(result.byLocation[0].location).toBe('Сарай');
      expect(result.byLocation[0].signals).toBe(2);
    });
  });

  describe('range sanity', () => {
    it('should enforce min width ±1 when rabbits >= 1', () => {
      const result = estimate(SEED_DATA, DEFAULT_PARAMS);

      expect(result.rabbits).toBeGreaterThanOrEqual(1);
      expect(result.range[1] - result.range[0]).toBeGreaterThanOrEqual(2);
      expect(result.range[0]).toBeLessThanOrEqual(result.rabbits - 1);
      expect(result.range[1]).toBeGreaterThanOrEqual(result.rabbits + 1);
    });

    it('should clamp low >= 0', () => {
      const result = estimate(SEED_DATA, DEFAULT_PARAMS);
      expect(result.range[0]).toBeGreaterThanOrEqual(0);
    });

    it('should fire invasion alert when rabbits >= 10', () => {
      const signals: SignalEvent[] = [];
      for (let i = 0; i < 20; i++) {
        signals.push({
          id: `sig${i}`,
          event: 'missing_carrot',
          location: `loc${i}`,
          count: 10,
          intensity: 10,
          time: '12:00',
        });
      }

      const result = estimate(signals, DEFAULT_PARAMS);

      expect(result.rabbits).toBeGreaterThanOrEqual(10);
      const invasionRec = result.recommendations.find((r) =>
        r.text.includes('нашествие'),
      );
      expect(invasionRec).toBeDefined();
      expect(invasionRec?.severity).toBe('alert');
    });
  });
});
