import { describe, it, expect } from 'vitest';

// Replicate the metricTone logic from EvaluationMetricsPanel for isolated testing
type MetricTone = 'signal' | 'amber' | 'red';

function metricTone(value: number): MetricTone {
  if (value >= 0.8) return 'signal';
  if (value >= 0.5) return 'amber';
  return 'red';
}

describe('metricTone', () => {
  describe('signal (>= 0.8)', () => {
    it('returns signal for 0.80', () => {
      expect(metricTone(0.8)).toBe('signal');
    });
    it('returns signal for 0.95', () => {
      expect(metricTone(0.95)).toBe('signal');
    });
    it('returns signal for 1.0', () => {
      expect(metricTone(1.0)).toBe('signal');
    });
    it('returns signal for boundary 0.8 exactly', () => {
      expect(metricTone(0.8)).toBe('signal');
    });
  });

  describe('amber (>= 0.5 and < 0.8)', () => {
    it('returns amber for 0.79', () => {
      expect(metricTone(0.79)).toBe('amber');
    });
    it('returns amber for 0.5', () => {
      expect(metricTone(0.5)).toBe('amber');
    });
    it('returns amber for 0.65', () => {
      expect(metricTone(0.65)).toBe('amber');
    });
    it('returns amber for boundary just below signal', () => {
      expect(metricTone(0.799)).toBe('amber');
    });
  });

  describe('red (< 0.5)', () => {
    it('returns red for 0.49', () => {
      expect(metricTone(0.49)).toBe('red');
    });
    it('returns red for 0.0', () => {
      expect(metricTone(0)).toBe('red');
    });
    it('returns red for very low values', () => {
      expect(metricTone(0.1)).toBe('red');
    });
  });
});
