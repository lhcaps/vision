/**
 * Helpers dùng bởi Bm031DirectService.
 * Tách ra file riêng để dễ unit test và tránh phình to controller/service.
 */
import { BadRequestException } from '@nestjs/common';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function bm031ParseSnapshot(value: unknown): Record<string, JsonValue> {
  if (!value) return {};

  if (Buffer.isBuffer(value)) {
    value = value.toString('utf8');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, JsonValue>;
      }
    } catch {
      // fallthrough
    }
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }

  return {};
}

export function bm031ReadPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

export function bm031FirstText(
  sources: unknown[],
  path: string,
  fallback = '',
): string {
  for (const source of sources) {
    const value = bm031ReadPath(source, path);
    if (value === null || value === undefined) continue;

    const text = String(value);
    if (text.length > 0) return text;
  }

  return fallback;
}

export function bm031IsFinal(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export function bm031SerializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function parsePositiveIntId(value: unknown, entityName = 'ID'): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`${entityName} không hợp lệ.`);
  }
  return parsed;
}

/**
 * Apply các giá trị "saved" từ form-inputs vào snapshot BM-031.
 * Đảm bảo agency / legalBasis / measure được merge đầy đủ.
 */
export function bm031CleanApplySavedBody(
  root: Record<string, JsonValue>,
): Record<string, JsonValue> {
  const legalBasisSources: unknown[] = [
    root?.payloadOverrides,
    root?.formInputs,
  ];
  const measureSources: unknown[] = [
    root?.payloadOverrides,
    root?.renderPayloadOverrides,
    root?.formInputs,
  ];

  const agency = {
    ...((root?.formInputs as Record<string, JsonValue> | undefined)?.agency as
      | Record<string, JsonValue>
      | undefined),
  };

  const legalBasis = {
    ...((root?.formInputs as Record<string, JsonValue> | undefined)
      ?.legalBasis as Record<string, JsonValue> | undefined),
  };

  const measure = {
    ...((root?.formInputs as Record<string, JsonValue> | undefined)?.measure as
      | Record<string, JsonValue>
      | undefined),
  };

  // legalBasis lines
  legalBasis.accusedLegalBasisLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.accusedLegalBasisLine',
    String(legalBasis.accusedLegalBasisLine ?? ''),
  );
  legalBasis.caseLegalBasisLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.caseLegalBasisLine',
    String(legalBasis.caseLegalBasisLine ?? ''),
  );
  legalBasis.caseDecisionLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.caseDecisionLine',
    String(legalBasis.caseDecisionLine ?? ''),
  );
  legalBasis.accusedDecisionLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.accusedDecisionLine',
    String(legalBasis.accusedDecisionLine ?? ''),
  );
  legalBasis.accusedCrimeLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.accusedCrimeLine',
    String(legalBasis.accusedCrimeLine ?? ''),
  );
  legalBasis.juvenileLegalBasisLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.juvenileLegalBasisLine',
    String(legalBasis.juvenileLegalBasisLine ?? ''),
  );
  legalBasis.requestApprovalLine = bm031FirstText(
    legalBasisSources,
    'legalBasis.requestApprovalLine',
    String(legalBasis.requestApprovalLine ?? ''),
  );

  // measure lines
  measure.reasonLine = bm031FirstText(
    measureSources,
    'measure.reasonLine',
    String(measure.reasonLine ?? ''),
  );
  measure.article1Line = bm031FirstText(
    measureSources,
    'measure.article1Line',
    String(measure.article1Line ?? ''),
  );
  measure.article2Line = bm031FirstText(
    measureSources,
    'measure.article2Line',
    String(measure.article2Line ?? ''),
  );

  const formInputsBase = (root.formInputs ?? {}) as Record<string, JsonValue>;
  const payloadOverridesBase = (root.payloadOverrides ?? {}) as Record<
    string,
    JsonValue
  >;
  const renderPayloadOverridesBase = (root.renderPayloadOverrides ??
    {}) as Record<string, JsonValue>;

  return {
    ...root,
    agency,
    legalBasis,
    measure,

    formInputs: {
      ...formInputsBase,
      agency,
      legalBasis,
      measure,
    },

    payloadOverrides: {
      ...payloadOverridesBase,
      agency,
      legalBasis,
      measure,
    },

    renderPayloadOverrides: {
      ...renderPayloadOverridesBase,
      agency,
      legalBasis,
      measure,
    },
  };
}
