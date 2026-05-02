import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateAnnotationGeometry } from './annotation-geometry.validator';

describe('Annotation Geometry Validation', () => {
  describe('validateAnnotationGeometry', () => {
    it('throws BadRequestException for malformed geometry (missing fields)', () => {
      expect(() => validateAnnotationGeometry({})).toThrow(BadRequestException);
      expect(() => validateAnnotationGeometry({})).toThrow(/Invalid annotation geometry/);
    });

    it('throws BadRequestException for malformed geometry (wrong types)', () => {
      expect(() => validateAnnotationGeometry({ x: 'a', y: 1, width: 10, height: 10 })).toThrow(
        BadRequestException
      );
    });

    it('throws BadRequestException for negative coordinates', () => {
      expect(() => validateAnnotationGeometry({ x: -1, y: 0, width: 100, height: 100 })).toThrow(
        BadRequestException
      );
      expect(() => validateAnnotationGeometry({ x: 0, y: -1, width: 100, height: 100 })).toThrow(
        BadRequestException
      );
    });

    it('throws BadRequestException for zero or negative dimensions', () => {
      expect(() => validateAnnotationGeometry({ x: 0, y: 0, width: 0, height: 100 })).toThrow(
        BadRequestException
      );
      expect(() => validateAnnotationGeometry({ x: 0, y: 0, width: 100, height: -1 })).toThrow(
        BadRequestException
      );
    });

    it('throws BadRequestException for non-finite numbers', () => {
      expect(() => validateAnnotationGeometry({ x: Infinity, y: 0, width: 100, height: 100 })).toThrow(
        BadRequestException
      );
      expect(() => validateAnnotationGeometry({ x: NaN, y: 0, width: 100, height: 100 })).toThrow(
        BadRequestException
      );
    });

    it('accepts valid geometry', () => {
      expect(() =>
        validateAnnotationGeometry({ x: 0, y: 0, width: 100, height: 100 })
      ).not.toThrow();
      expect(() =>
        validateAnnotationGeometry({ x: 50.5, y: 75.25, width: 200.0, height: 150.0 })
      ).not.toThrow();
    });

    it('provides structured error issues', () => {
      try {
        validateAnnotationGeometry({ x: 'invalid' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: string;
          issues: Array<{ path: string; message: string }>;
        };
        expect(response.message).toBe('Invalid annotation geometry');
        expect(Array.isArray(response.issues)).toBe(true);
        expect(response.issues.length).toBeGreaterThan(0);
      }
    });
  });
});
