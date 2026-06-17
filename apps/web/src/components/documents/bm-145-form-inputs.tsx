'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

type Bm145FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

type Bm145FormState = {
  returnRoundLine: string;
  procedureArticlesLine: string;
  investigationConclusionLegalBasisLine: string;

  hasCourtReturnDecision: boolean;
  courtReturnDecisionNo: string;
  courtReturnDecisionDate: string;
  courtReturnDecisionCourtName: string;
  courtReturnDecisionLegalBasisLine: string;

  reasonLine: string;
  article1IntroLine: string;
  supplementIssue1Line: string;
  supplementIssue2Line: string;
  supplementIssue3Line: string;
  article2Line: string;
  article3Line: string;
  investigationAuthorityRecipientLine: string;
  archiveLine: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
};

const DEFAULT_COURT_NAME = 'Tòa án nhân dân có thẩm quyền';

const EMPTY_FORM: Bm145FormState = {
  returnRoundLine: '(Lần thứ nhất)',
  procedureArticlesLine:
    'Căn cứ các điều 41, 174, 240 và 245 của Bộ luật Tố tụng hình sự;',
  investigationConclusionLegalBasisLine:
    'Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 01/KLĐT-CSĐT ngày 17 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;',

  hasCourtReturnDecision: false,
  courtReturnDecisionNo: '',
  courtReturnDecisionDate: '',
  courtReturnDecisionCourtName: DEFAULT_COURT_NAME,
  courtReturnDecisionLegalBasisLine: '',

  reasonLine:
    'Xét thấy cần điều tra bổ sung để làm rõ một số tình tiết của vụ án,',
  article1IntroLine:
    'Trả hồ sơ vụ án hình sự Vụ án đánh bạc tại phường Trung Mỹ Tây về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để điều tra bổ sung những vấn đề sau:',
  supplementIssue1Line:
    'Làm rõ hành vi, vai trò của từng người tham gia trong vụ án.',
  supplementIssue2Line:
    'Thu thập, bổ sung tài liệu, chứng cứ liên quan đến số tiền, phương tiện dùng vào việc phạm tội.',
  supplementIssue3Line:
    'Làm rõ các tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự và các nội dung khác có liên quan.',
  article2Line:
    'Thời hạn điều tra bổ sung không quá 02 tháng, kể từ ngày Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh nhận hồ sơ vụ án và Quyết định này.',
  article3Line:
    'Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.',
  investigationAuthorityRecipientLine:
    '- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;',
  archiveLine: '- Lưu: HSVA, HSKS, VP.',
  signMode: 'KT. VIỆN TRƯỞNG',
  positionTitle: 'PHÓ VIỆN TRƯỞNG',
  signerName: "",
};

const REQUIRED_FIELDS: Array<keyof Bm145FormState> = [
  'returnRoundLine',
  'procedureArticlesLine',
  'investigationConclusionLegalBasisLine',
  'reasonLine',
  'article1IntroLine',
  'supplementIssue1Line',
  'article2Line',
  'article3Line',
  'investigationAuthorityRecipientLine',
  'archiveLine',
  'signMode',
  'positionTitle',
  'signerName',
];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatVietnameseDate(value: string): string {
  if (!value) return '';

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return '';
  }

  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function buildCourtReturnDecisionLegalBasisLine(form: Pick<
  Bm145FormState,
  | 'hasCourtReturnDecision'
  | 'courtReturnDecisionNo'
  | 'courtReturnDecisionDate'
  | 'courtReturnDecisionCourtName'
>): string {
  if (!form.hasCourtReturnDecision) {
    return '';
  }

  const decisionNo = normalizeText(form.courtReturnDecisionNo);
  const dateText = formatVietnameseDate(form.courtReturnDecisionDate);
  const courtName =
    normalizeText(form.courtReturnDecisionCourtName) || DEFAULT_COURT_NAME;

  const decisionNoPart = decisionNo ? `số ${decisionNo}` : 'số ...';
  const datePart = dateText ? ` ${dateText}` : '';
  const courtPart = ` của ${courtName}`;

  return `Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung ${decisionNoPart}${datePart}${courtPart};`;
}

function inferCourtDecisionState(line: string): Pick<
  Bm145FormState,
  | 'hasCourtReturnDecision'
  | 'courtReturnDecisionNo'
  | 'courtReturnDecisionDate'
  | 'courtReturnDecisionCourtName'
> {
  const normalizedLine = normalizeText(line);

  if (!normalizedLine) {
    return {
      hasCourtReturnDecision: false,
      courtReturnDecisionNo: '',
      courtReturnDecisionDate: '',
      courtReturnDecisionCourtName: DEFAULT_COURT_NAME,
    };
  }

  const noMatch = normalizedLine.match(/số\s+(.+?)(?:\s+ngày|\s+của|;|$)/i);
  const dateMatch = normalizedLine.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  const courtMatch = normalizedLine.match(/của\s+(.+?);?$/i);

  let dateValue = '';

  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    dateValue = `${year}-${month}-${day}`;
  }

  return {
    hasCourtReturnDecision: true,
    courtReturnDecisionNo:
      noMatch && noMatch[1] && noMatch[1] !== '...' ? noMatch[1].trim() : '',
    courtReturnDecisionDate: dateValue,
    courtReturnDecisionCourtName:
      courtMatch && courtMatch[1] ? courtMatch[1].trim() : DEFAULT_COURT_NAME,
  };
}

function mergePayloadToForm(payload: any): Bm145FormState {
  const group = payload?.prosecutionSupplementReturn ?? {};
  const recipients = payload?.recipients ?? {};
  const signature = payload?.signature ?? {};

  const courtLine = normalizeText(group.courtReturnDecisionLegalBasisLine);
  const courtState = inferCourtDecisionState(courtLine);

  return {
    ...EMPTY_FORM,
    returnRoundLine: normalizeText(group.returnRoundLine) || EMPTY_FORM.returnRoundLine,
    procedureArticlesLine:
      normalizeText(group.procedureArticlesLine) || EMPTY_FORM.procedureArticlesLine,
    investigationConclusionLegalBasisLine:
      normalizeText(group.investigationConclusionLegalBasisLine) ||
      EMPTY_FORM.investigationConclusionLegalBasisLine,

    hasCourtReturnDecision: courtState.hasCourtReturnDecision,
    courtReturnDecisionNo: courtState.courtReturnDecisionNo,
    courtReturnDecisionDate: courtState.courtReturnDecisionDate,
    courtReturnDecisionCourtName: courtState.courtReturnDecisionCourtName,
    courtReturnDecisionLegalBasisLine: courtLine,

    reasonLine: normalizeText(group.reasonLine) || EMPTY_FORM.reasonLine,
    article1IntroLine:
      normalizeText(group.article1IntroLine) || EMPTY_FORM.article1IntroLine,
    supplementIssue1Line:
      normalizeText(group.supplementIssue1Line) || EMPTY_FORM.supplementIssue1Line,
    supplementIssue2Line:
      normalizeText(group.supplementIssue2Line) || EMPTY_FORM.supplementIssue2Line,
    supplementIssue3Line:
      normalizeText(group.supplementIssue3Line) || EMPTY_FORM.supplementIssue3Line,
    article2Line: normalizeText(group.article2Line) || EMPTY_FORM.article2Line,
    article3Line: normalizeText(group.article3Line) || EMPTY_FORM.article3Line,
    investigationAuthorityRecipientLine:
      normalizeText(group.investigationAuthorityRecipientLine) ||
      EMPTY_FORM.investigationAuthorityRecipientLine,
    archiveLine: normalizeText(recipients.archiveLine) || EMPTY_FORM.archiveLine,
    signMode: normalizeText(signature.signMode) || EMPTY_FORM.signMode,
    positionTitle: normalizeText(signature.positionTitle) || EMPTY_FORM.positionTitle,
    signerName: normalizeText(signature.signerName) || EMPTY_FORM.signerName,
  };
}

export function Bm145FormInputsPanel({
  documentId,
  onSaved,
}: Bm145FormInputsPanelProps) {
  const [form, setForm] = useState<Bm145FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  const courtReturnDecisionLegalBasisLine = useMemo(
    () => buildCourtReturnDecisionLegalBasisLine(form),
    [form],
  );

  const missingFields = useMemo(
    () => REQUIRED_FIELDS.filter((field) => !normalizeText(form[field])),
    [form],
  );

  async function loadPayload() {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { cache: 'no-store' },
      );

      if (!response.ok) {
        throw new Error(`Không tải được render-payload: HTTP ${response.status}`);
      }

      const payload = await response.json();
      setForm(mergePayloadToForm(payload));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Không tải được dữ liệu BM-145.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayload();
     
  }, [documentId]);

  function updateField(field: keyof Bm145FormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function fillSampleData() {
    setForm({
      ...EMPTY_FORM,
      hasCourtReturnDecision: true,
      courtReturnDecisionNo: '05/QĐ-TA',
      courtReturnDecisionDate: '2026-05-17',
      courtReturnDecisionCourtName: 'Tòa án nhân dân có thẩm quyền',
      courtReturnDecisionLegalBasisLine:
        'Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung số 05/QĐ-TA ngày 17 tháng 5 năm 2026 của Tòa án nhân dân có thẩm quyền;',
    });
    setMessage('Đã điền dữ liệu mẫu BM-145.');
  }

  async function saveFormInputs() {
    if (missingFields.length > 0) {
      setMessage(`Thiếu dữ liệu bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    const finalCourtReturnDecisionLegalBasisLine =
      buildCourtReturnDecisionLegalBasisLine(form);

    setIsSaving(true);
    setMessage('');

    const body = {
      updatedByName: form.signerName,
      prosecutionSupplementReturn: {
        returnRoundLine: form.returnRoundLine,
        procedureArticlesLine: form.procedureArticlesLine,
        investigationConclusionLegalBasisLine:
          form.investigationConclusionLegalBasisLine,
        courtReturnDecisionLegalBasisLine:
          finalCourtReturnDecisionLegalBasisLine,
        reasonLine: form.reasonLine,
        article1IntroLine: form.article1IntroLine,
        supplementIssue1Line: form.supplementIssue1Line,
        supplementIssue2Line: form.supplementIssue2Line,
        supplementIssue3Line: form.supplementIssue3Line,
        article2Line: form.article2Line,
        article3Line: form.article3Line,
        investigationAuthorityRecipientLine:
          form.investigationAuthorityRecipientLine,
      },
      recipients: {
        archiveLine: form.archiveLine,
      },
      signature: {
        signMode: form.signMode,
        positionTitle: form.positionTitle,
        signerName: form.signerName,
      },
      official: {
        fullName: form.signerName,
        prosecutorName: form.signerName,
      },
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Lưu thất bại: HTTP ${response.status}`);
      }

      setMessage('Đã lưu dữ liệu BM-145 thành công.');
      await onSaved?.();
      await loadPayload();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Lưu dữ liệu BM-145 thất bại.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200';

  const textAreaClass =
    'min-h-[88px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Dữ liệu biểu mẫu BM-145
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quyết định trả hồ sơ vụ án để điều tra bổ sung.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSampleData}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Điền dữ liệu mẫu BM-145
          </button>

          <button
            type="button"
            onClick={saveFormInputs}
            disabled={isSaving || isLoading}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu dữ liệu BM-145'}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Đang tải render-payload BM-145...
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Lần trả hồ sơ">
              <input
                className={inputClass}
                value={form.returnRoundLine}
                onChange={(event) => updateField('returnRoundLine', event.target.value)}
              />
            </Field>

            <Field label="Ký thay">
              <input
                className={inputClass}
                value={form.signMode}
                onChange={(event) => updateField('signMode', event.target.value)}
              />
            </Field>

            <Field label="Người ký">
              <input
                className={inputClass}
                value={form.signerName}
                onChange={(event) => updateField('signerName', event.target.value)}
              />
            </Field>
          </div>

          <Field label="Chức vụ ký">
            <input
              className={inputClass}
              value={form.positionTitle}
              onChange={(event) => updateField('positionTitle', event.target.value)}
            />
          </Field>

          <TextareaField
            label="Căn cứ điều luật"
            value={form.procedureArticlesLine}
            onChange={(value) => updateField('procedureArticlesLine', value)}
            className={textAreaClass}
          />

          <TextareaField
            label="Căn cứ bản kết luận điều tra"
            value={form.investigationConclusionLegalBasisLine}
            onChange={(value) =>
              updateField('investigationConclusionLegalBasisLine', value)
            }
            className={textAreaClass}
          />

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.hasCourtReturnDecision}
                onChange={(event) =>
                  updateField('hasCourtReturnDecision', event.target.checked)
                }
              />
              Có căn cứ Quyết định trả hồ sơ của Tòa án
            </label>

            {form.hasCourtReturnDecision ? (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Số quyết định của Tòa án">
                    <input
                      className={inputClass}
                      value={form.courtReturnDecisionNo}
                      onChange={(event) =>
                        updateField('courtReturnDecisionNo', event.target.value)
                      }
                      placeholder="VD: 05/QĐ-TA"
                    />
                  </Field>

                  <Field label="Ngày quyết định">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.courtReturnDecisionDate}
                      onChange={(event) =>
                        updateField('courtReturnDecisionDate', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Tòa án ban hành">
                    <input
                      className={inputClass}
                      value={form.courtReturnDecisionCourtName}
                      onChange={(event) =>
                        updateField(
                          'courtReturnDecisionCourtName',
                          event.target.value,
                        )
                      }
                      placeholder={DEFAULT_COURT_NAME}
                    />
                  </Field>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <div className="mb-1 font-medium text-slate-900">
                    Dòng sẽ render vào biểu mẫu:
                  </div>
                  <div>
                    {courtReturnDecisionLegalBasisLine ||
                      'Chưa đủ dữ liệu để tạo dòng căn cứ.'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Không chọn mục này thì dòng căn cứ Quyết định trả hồ sơ của Tòa án
                sẽ để trống khi render BM-145.
              </p>
            )}
          </section>

          <TextareaField
            label="Xét thấy"
            value={form.reasonLine}
            onChange={(value) => updateField('reasonLine', value)}
            className={textAreaClass}
          />

          <TextareaField
            label="Điều 1"
            value={form.article1IntroLine}
            onChange={(value) => updateField('article1IntroLine', value)}
            className={textAreaClass}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <TextareaField
              label="Vấn đề bổ sung 1"
              value={form.supplementIssue1Line}
              onChange={(value) => updateField('supplementIssue1Line', value)}
              className={textAreaClass}
            />

            <TextareaField
              label="Vấn đề bổ sung 2"
              value={form.supplementIssue2Line}
              onChange={(value) => updateField('supplementIssue2Line', value)}
              className={textAreaClass}
            />

            <TextareaField
              label="Vấn đề bổ sung 3"
              value={form.supplementIssue3Line}
              onChange={(value) => updateField('supplementIssue3Line', value)}
              className={textAreaClass}
            />
          </div>

          <TextareaField
            label="Điều 2"
            value={form.article2Line}
            onChange={(value) => updateField('article2Line', value)}
            className={textAreaClass}
          />

          <TextareaField
            label="Điều 3"
            value={form.article3Line}
            onChange={(value) => updateField('article3Line', value)}
            className={textAreaClass}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextareaField
              label="Nơi nhận - Cơ quan điều tra"
              value={form.investigationAuthorityRecipientLine}
              onChange={(value) =>
                updateField('investigationAuthorityRecipientLine', value)
              }
              className={textAreaClass}
            />

            <TextareaField
              label="Nơi nhận - Lưu"
              value={form.archiveLine}
              onChange={(value) => updateField('archiveLine', value)}
              className={textAreaClass}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
