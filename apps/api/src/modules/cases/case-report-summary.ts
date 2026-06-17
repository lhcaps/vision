export type CaseReportPeriod = 'WEEK' | 'MONTH';

export type CaseReportSource = {
  id: string;
  receivedDate: Date | string | null;
  createdAt: Date | string;
  wardName: string | null;
  offenseNames: string[];
};

export type CaseReportSummaryOptions = {
  period?: CaseReportPeriod;
  anchorDate?: Date | string | null;
};

export type CaseReportSummaryRow = {
  time: string;
  wardName: string;
  offenseName: string;
  caseCount: number;
};

export type CaseReportSummary = {
  period: CaseReportPeriod;
  range: {
    from: string;
    to: string;
  };
  totalCases: number;
  byWard: Array<{ wardName: string; caseCount: number }>;
  byOffense: Array<{ offenseName: string; caseCount: number }>;
  rows: CaseReportSummaryRow[];
};

export function buildCaseReportSummary(
  cases: CaseReportSource[],
  options: CaseReportSummaryOptions = {},
): CaseReportSummary {
  const period = options.period === 'WEEK' ? 'WEEK' : 'MONTH';
  const anchor = parseDateOnly(options.anchorDate) ?? new Date();
  const range = period === 'WEEK' ? weekRange(anchor) : monthRange(anchor);

  const rowCounts = new Map<string, CaseReportSummaryRow>();
  const wardCounts = new Map<string, Set<string>>();
  const offenseCounts = new Map<string, Set<string>>();
  const includedCaseIds = new Set<string>();

  for (const item of cases) {
    const caseDate =
      parseDateOnly(item.receivedDate) ?? parseDateOnly(item.createdAt);
    if (!caseDate) continue;

    const day = toDateKey(caseDate);
    if (day < range.from || day > range.to) continue;

    includedCaseIds.add(item.id);

    const wardName = item.wardName?.trim() || 'Chưa có phường';
    const offenseNames = item.offenseNames.length
      ? item.offenseNames.map((name) => name.trim()).filter(Boolean)
      : ['Chưa có tội danh'];

    addToSet(wardCounts, wardName, item.id);

    for (const offenseNameRaw of offenseNames) {
      const offenseName = offenseNameRaw || 'Chưa có tội danh';
      addToSet(offenseCounts, offenseName, item.id);

      const key = [day, wardName, offenseName].join('\u001f');
      const existing = rowCounts.get(key);
      if (existing) {
        existing.caseCount += 1;
      } else {
        rowCounts.set(key, {
          time: day,
          wardName,
          offenseName,
          caseCount: 1,
        });
      }
    }
  }

  return {
    period,
    range,
    totalCases: includedCaseIds.size,
    byWard: mapSetCounts(wardCounts, 'wardName'),
    byOffense: mapSetCounts(offenseCounts, 'offenseName'),
    rows: [...rowCounts.values()].sort((a, b) =>
      [a.time, a.wardName, a.offenseName]
        .join('\u001f')
        .localeCompare(
          [b.time, b.wardName, b.offenseName].join('\u001f'),
          'vi',
        ),
    ),
  };
}

function weekRange(anchor: Date) {
  const date = startOfUtcDay(anchor);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, mondayOffset);
  const sunday = addDays(monday, 6);
  return {
    from: toDateKey(monday),
    to: toDateKey(sunday),
  };
}

function monthRange(anchor: Date) {
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  return {
    from: toDateKey(new Date(Date.UTC(year, month, 1))),
    to: toDateKey(new Date(Date.UTC(year, month + 1, 0))),
  };
}

function parseDateOnly(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return startOfUtcDay(value);

  const datePart = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(datePart)) return null;

  const parsed = new Date(`${datePart}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addToSet(map: Map<string, Set<string>>, key: string, value: string) {
  const values = map.get(key) ?? new Set<string>();
  values.add(value);
  map.set(key, values);
}

function mapSetCounts<Key extends 'wardName' | 'offenseName'>(
  map: Map<string, Set<string>>,
  key: Key,
): Array<Record<Key, string> & { caseCount: number }> {
  return [...map.entries()]
    .map(
      ([name, ids]) =>
        ({
          [key]: name,
          caseCount: ids.size,
        }) as Record<Key, string> & { caseCount: number },
    )
    .sort(
      (a, b) => b.caseCount - a.caseCount || a[key].localeCompare(b[key], 'vi'),
    );
}
