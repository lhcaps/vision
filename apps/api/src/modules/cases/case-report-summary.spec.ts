import { buildCaseReportSummary } from './case-report-summary';

describe('buildCaseReportSummary', () => {
  it('groups cases by day, ward and offense inside the selected week', () => {
    const summary = buildCaseReportSummary(
      [
        {
          id: '1',
          receivedDate: '2026-06-15',
          createdAt: '2026-06-15T08:00:00.000Z',
          wardName: 'Phường A',
          offenseNames: ['Trộm cắp tài sản'],
        },
        {
          id: '2',
          receivedDate: '2026-06-15',
          createdAt: '2026-06-15T09:00:00.000Z',
          wardName: 'Phường A',
          offenseNames: ['Trộm cắp tài sản'],
        },
        {
          id: '3',
          receivedDate: '2026-06-16',
          createdAt: '2026-06-16T09:00:00.000Z',
          wardName: null,
          offenseNames: [],
        },
        {
          id: '4',
          receivedDate: '2026-06-22',
          createdAt: '2026-06-22T09:00:00.000Z',
          wardName: 'Ngoài tuần',
          offenseNames: ['Không tính'],
        },
      ],
      {
        period: 'WEEK',
        anchorDate: '2026-06-16',
      },
    );

    expect(summary.range).toEqual({
      from: '2026-06-15',
      to: '2026-06-21',
    });
    expect(summary.totalCases).toBe(3);
    expect(summary.rows).toEqual([
      {
        time: '2026-06-15',
        wardName: 'Phường A',
        offenseName: 'Trộm cắp tài sản',
        caseCount: 2,
      },
      {
        time: '2026-06-16',
        wardName: 'Chưa có phường',
        offenseName: 'Chưa có tội danh',
        caseCount: 1,
      },
    ]);
  });
});
