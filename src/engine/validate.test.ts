import { describe, it, expect } from 'vitest';
import { validateImport, exportSignals } from './validate';
import { SEED_DATA } from './defaults';

describe('validate', () => {
  describe('validateImport', () => {
    it('should reject garbage string', () => {
      const result = validateImport('this is not json');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('JSON');
      }
    });

    it('should reject non-array JSON', () => {
      const result = validateImport('{"foo": "bar"}');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('массивом');
      }
    });

    it('should reject item missing required field', () => {
      const result = validateImport('[{"id": "test"}]');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('event');
      }
    });

    it('should reject wrong field type', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": "five", "intensity": 5, "time": "12:00"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('count');
      }
    });

    it('should reject unknown event type', () => {
      const result = validateImport(
        '[{"id": "test", "event": "unknown_event", "location": "Test", "count": 1, "intensity": 5, "time": "12:00"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('missing_carrot');
      }
    });

    it('should reject invalid time format', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": 1, "intensity": 5, "time": "25:99"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('HH:MM');
      }
    });

    it('should handle duplicate ids with warning and rename', () => {
      const result = validateImport(
        '[{"id": "dup", "event": "missing_carrot", "location": "Test", "count": 1, "intensity": 5, "time": "12:00"}, {"id": "dup", "event": "footprints", "location": "Test", "count": 2, "intensity": 6, "time": "12:00"}]',
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('дублируется');
        expect(result.signals).toHaveLength(2);
        expect(result.signals[1].id).not.toBe('dup');
      }
    });

    it('should accept valid seed JSON', () => {
      const jsonStr = exportSignals(SEED_DATA);
      const result = validateImport(jsonStr);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.signals).toHaveLength(SEED_DATA.length);
        expect(result.warnings).toHaveLength(0);
      }
    });

    it('should reject negative count', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": -5, "intensity": 5, "time": "12:00"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('-5');
      }
    });

    it('should reject intensity < 1', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": 1, "intensity": 0, "time": "12:00"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('intensity');
      }
    });

    it('should reject intensity > 10', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": 1, "intensity": 11, "time": "12:00"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('intensity');
      }
    });

    it('should reject invalid time abc', () => {
      const result = validateImport(
        '[{"id": "test", "event": "missing_carrot", "location": "Test", "count": 1, "intensity": 5, "time": "abc"}]',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('HH:MM');
      }
    });
  });

  describe('exportSignals', () => {
    it('should export seed data as pretty JSON', () => {
      const json = exportSignals(SEED_DATA);
      expect(json).toContain('  ');
      expect(json).toContain('evt_001');
    });

    it('should include active field only when false', () => {
      const signals = [
        {
          id: 'test1',
          event: 'missing_carrot' as const,
          location: 'Test',
          count: 1,
          intensity: 5,
          time: '12:00',
        },
        {
          id: 'test2',
          event: 'footprints' as const,
          location: 'Test',
          count: 2,
          intensity: 6,
          time: '12:00',
          active: false,
        },
      ];

      const json = exportSignals(signals);
      expect(json).not.toContain('"active": true');
      expect(json).toContain('"active": false');
    });
  });

  describe('round-trip', () => {
    it('should round-trip seed data through validate and export', () => {
      const exported = exportSignals(SEED_DATA);
      const validated = validateImport(exported);

      expect(validated.ok).toBe(true);
      if (validated.ok) {
        expect(validated.signals).toHaveLength(SEED_DATA.length);

        for (let i = 0; i < SEED_DATA.length; i++) {
          const original = SEED_DATA[i];
          const roundTrip = validated.signals[i];

          expect(roundTrip.id).toBe(original.id);
          expect(roundTrip.event).toBe(original.event);
          expect(roundTrip.location).toBe(original.location);
          expect(roundTrip.count).toBe(original.count);
          expect(roundTrip.intensity).toBe(original.intensity);
          expect(roundTrip.time).toBe(original.time);
          expect(roundTrip.active).toBe(original.active);
        }
      }
    });
  });
});
