'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

type Bm150FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

type Bm150FormState = {
  procedureArticlesLine: string;

  caseDecisionNo: string;
  caseDecisionDate: string;
  caseDecisionIssuedBy: string;
  offenseName: string;
  legalArticle: string;

  hasCaseDecisionChange: boolean;
  caseDecisionChangeNo: string;
  caseDecisionChangeDate: string;
  caseDecisionChangeIssuedBy: string;
  caseDecisionChangeContent: string;

  hasAccusedDecision: boolean;
  accusedDecisionNo: string;
  accusedDecisionDate: string;
  accusedDecisionIssuedBy: string;
  accusedName: string;

  hasAccusedDecisionChange: boolean;
  accusedDecisionChangeNo: string;
  accusedDecisionChangeDate: string;
  accusedDecisionChangeIssuedBy: string;
  accusedDecisionChangeContent: string;

  reasonLine: string;
  article1Line: string;

  hasMeasureCancellation: boolean;
  article2Line: string;

  article3Line: string;
  article4Line: string;

  superiorProcuracyRecipientLine: string;
  otherRecipientsLine: string;
  accusedOrRepresentativeRecipientLine: string;
  investigationAuthorityRecipientLine: string;
  defenseCounselRecipientLine: string;
  archiveLine: string;

  signMode: string;
  positionTitle: string;
  signerName: string;
};

const EMPTY_FORM: Bm150FormState = {
  procedureArticlesLine:
    'Căn cứ các điều 41, 236, 240 và 248 của Bộ luật Tố tụng hình sự;',

  caseDecisionNo: '',
  caseDecisionDate: '2026-05-06',
  caseDecisionIssuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
  offenseName: "",
  legalArticle: 'khoản 1 Điều 321 Bộ luật Hình sự',

  hasCaseDecisionChange: false,
  caseDecisionChangeNo: '',
  caseDecisionChangeDate: '',
  caseDecisionChangeIssuedBy: '',
  caseDecisionChangeContent: '',

  hasAccusedDecision: false,
  accusedDecisionNo: '',
  accusedDecisionDate: '2026-05-06',
  accusedDecisionIssuedBy: 'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
  accusedName: "",

  hasAccusedDecisionChange: false,
  accusedDecisionChangeNo: '',
  accusedDecisionChangeDate: '',
  accusedDecisionChangeIssuedBy: '',
  accusedDecisionChangeContent: '',

  reasonLine:
    'Xét thấy có căn cứ đình chỉ vụ án hình sự theo quy định của Bộ luật Tố tụng hình sự,',
  article1Line:
    'Đình chỉ vụ án hình sự Vụ án đánh bạc tại phường Trung Mỹ Tây về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự kể từ ngày ban hành Quyết định này.',

  hasMeasureCancellation: false,
  article2Line:
    'Hủy bỏ biện pháp ngăn chặn, biện pháp cưỡng chế đối với bị can  nếu có.',

  article3Line:
    'Xử lý vật chứng, tài liệu, đồ vật và các vấn đề khác có liên quan theo quy định của pháp luật.',
  article4Line:
    'Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của pháp luật./.',

  superiorProcuracyRecipientLine:
    '- VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH;',
  otherRecipientsLine: '- Cơ quan, tổ chức, cá nhân có liên quan;',
  accusedOrRepresentativeRecipientLine:
    '- Bị can hoặc người đại diện của bị can;',
  investigationAuthorityRecipientLine:
    '- Cơ quan, người có thẩm quyền điều tra;',
  defenseCounselRecipientLine: '- Người bào chữa;',
  archiveLine: '- Lưu: HSVA, HSKS, VP.',

  signMode: 'KT. VIỆN TRƯỞNG',
  positionTitle: 'PHÓ VIỆN TRƯỞNG',
  signerName: "",
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toVietnameseDate(dateValue: string): string {
  if (!dateValue) return '';

  const parts = dateValue.split('-');

  if (parts.length !== 3) {
    return dateValue;
  }

  const [year, month, day] = parts;
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function buildCaseDecisionLegalBasisLine(form: Bm150FormState): string {
  const main =
    `Căn cứ Quyết định khởi tố vụ án hình sự số ${form.caseDecisionNo} ${toVietnameseDate(
      form.caseDecisionDate,
    )} của ${form.caseDecisionIssuedBy} về tội “${form.offenseName}” quy định tại ${form.legalArticle}`;

  if (!form.hasCaseDecisionChange) {
    return `${main};`;
  }

  const change =
    `; Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự số ${form.caseDecisionChangeNo} ${toVietnameseDate(
      form.caseDecisionChangeDate,
    )} của ${form.caseDecisionChangeIssuedBy}${
      form.caseDecisionChangeContent ? `, ${form.caseDecisionChangeContent}` : ''
    }`;

  return `${main}${change};`;
}

function buildAccusedDecisionLegalBasisLine(form: Bm150FormState): string {
  if (!form.hasAccusedDecision) {
    return '';
  }

  const main =
    `Căn cứ Quyết định khởi tố bị can số ${form.accusedDecisionNo} ${toVietnameseDate(
      form.accusedDecisionDate,
    )} của ${form.accusedDecisionIssuedBy} đối với ${form.accusedName} về tội “${form.offenseName}” quy định tại ${form.legalArticle}`;

  if (!form.hasAccusedDecisionChange) {
    return `${main};`;
  }

  const change =
    `; Quyết định thay đổi/bổ sung Quyết định khởi tố bị can số ${form.accusedDecisionChangeNo} ${toVietnameseDate(
      form.accusedDecisionChangeDate,
    )} của ${form.accusedDecisionChangeIssuedBy}${
      form.accusedDecisionChangeContent
        ? `, ${form.accusedDecisionChangeContent}`
        : ''
    }`;

  return `${main}${change};`;
}

function buildArticle2Line(form: Bm150FormState): string {
  return form.hasMeasureCancellation ? form.article2Line : 'Không có.';
}

function mergePayloadToForm(payload: any): Bm150FormState {
  const group = payload?.prosecutionCaseTermination ?? {};
  const recipients = payload?.recipients ?? {};
  const signature = payload?.signature ?? {};
  const offense = payload?.offense ?? {};
  const person = payload?.person ?? {};
  const caseDecision = payload?.caseDecision ?? {};
  const accusedDecision = payload?.accusedDecision ?? {};
  const agency = payload?.agency ?? {};

  return {
    ...EMPTY_FORM,
    caseDecisionNo:
      normalizeText(caseDecision.decisionNo) || EMPTY_FORM.caseDecisionNo,
    caseDecisionIssuedBy:
      normalizeText(caseDecision.issuedBy) ||
      EMPTY_FORM.caseDecisionIssuedBy,
    offenseName: normalizeText(offense.offenseName) || EMPTY_FORM.offenseName,
    legalArticle: normalizeText(offense.legalArticle) || EMPTY_FORM.legalArticle,
    accusedName: normalizeText(person.fullName) || EMPTY_FORM.accusedName,
    accusedDecisionNo:
      normalizeText(accusedDecision.decisionNo) || EMPTY_FORM.accusedDecisionNo,
    accusedDecisionIssuedBy:
      normalizeText(accusedDecision.issuedBy) ||
      EMPTY_FORM.accusedDecisionIssuedBy,

    procedureArticlesLine:
      normalizeText(group.procedureArticlesLine) ||
      EMPTY_FORM.procedureArticlesLine,
    reasonLine: normalizeText(group.reasonLine) || EMPTY_FORM.reasonLine,
    article1Line: normalizeText(group.article1Line) || EMPTY_FORM.article1Line,
    article2Line: normalizeText(group.article2Line) || EMPTY_FORM.article2Line,
    article3Line: normalizeText(group.article3Line) || EMPTY_FORM.article3Line,
    article4Line: normalizeText(group.article4Line) || EMPTY_FORM.article4Line,

    superiorProcuracyRecipientLine:
      normalizeText(group.superiorProcuracyRecipientLine) ||
      `- ${normalizeText(agency.parentName) || 'VIỆN KIỂM SÁT CẤP TRÊN'};`,
    otherRecipientsLine:
      normalizeText(recipients.otherRecipientsLine) ||
      EMPTY_FORM.otherRecipientsLine,
    accusedOrRepresentativeRecipientLine:
      normalizeText(group.accusedOrRepresentativeRecipientLine) ||
      EMPTY_FORM.accusedOrRepresentativeRecipientLine,
    investigationAuthorityRecipientLine:
      normalizeText(group.investigationAuthorityRecipientLine) ||
      EMPTY_FORM.investigationAuthorityRecipientLine,
    defenseCounselRecipientLine:
      normalizeText(group.defenseCounselRecipientLine) ||
      EMPTY_FORM.defenseCounselRecipientLine,
    archiveLine: normalizeText(recipients.archiveLine) || EMPTY_FORM.archiveLine,

    signMode: normalizeText(signature.signMode) || EMPTY_FORM.signMode,
    positionTitle:
      normalizeText(signature.positionTitle) || EMPTY_FORM.positionTitle,
    signerName: "",
  };
}

export function Bm150FormInputsPanel({
  documentId,
  onSaved,
}: Bm150FormInputsPanelProps) {
  const [form, setForm] = useState<Bm150FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const missingRequired = useMemo(() => {
    const required: Array<keyof Bm150FormState> = [
      'procedureArticlesLine',
      'caseDecisionNo',
      'caseDecisionDate',
      'caseDecisionIssuedBy',
      'offenseName',
      'legalArticle',
      'reasonLine',
      'article1Line',
      'article3Line',
      'article4Line',
      'signMode',
      'positionTitle',
      'signerName',
    ];

    return required.filter((field) => !normalizeText(form[field]));
  }, [form]);

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
      setMessage(error instanceof Error ? error.message : 'Không tải được BM-150.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayload();
     
  }, [documentId]);

  function updateField<K extends keyof Bm150FormState>(
    field: K,
    value: Bm150FormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function fillSampleData() {
    setForm(EMPTY_FORM);
    setMessage('Đã điền dữ liệu mẫu BM-150.');
  }

  async function saveFormInputs() {
    if (missingRequired.length > 0) {
      setMessage(`Thiếu dữ liệu bắt buộc: ${missingRequired.join(', ')}`);
      return;
    }

    setIsSaving(true);
    setMessage('');

    const body = {
      updatedByName: form.signerName,
      prosecutionCaseTermination: {
        procedureArticlesLine: form.procedureArticlesLine,
        caseDecisionLegalBasisLine: buildCaseDecisionLegalBasisLine(form),
        accusedDecisionLegalBasisLine: buildAccusedDecisionLegalBasisLine(form),
        reasonLine: form.reasonLine,
        article1Line: form.article1Line,
        article2Line: buildArticle2Line(form),
        article3Line: form.article3Line,
        article4Line: form.article4Line,
        superiorProcuracyRecipientLine: form.superiorProcuracyRecipientLine,
        accusedOrRepresentativeRecipientLine:
          form.accusedOrRepresentativeRecipientLine,
        investigationAuthorityRecipientLine:
          form.investigationAuthorityRecipientLine,
        defenseCounselRecipientLine: form.defenseCounselRecipientLine,
      },
      recipients: {
        otherRecipientsLine: form.otherRecipientsLine,
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
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Lưu thất bại: HTTP ${response.status}`);
      }

      setMessage('Đã lưu dữ liệu BM-150 thành công.');
      await onSaved?.();
      await loadPayload();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Lưu dữ liệu BM-150 thất bại.',
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
            Dữ liệu biểu mẫu BM-150
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quyết định đình chỉ vụ án hình sự. Các mục “nếu có” chỉ hiện khi
            được tick.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSampleData}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Điền dữ liệu mẫu BM-150
          </button>

          <button
            type="button"
            onClick={saveFormInputs}
            disabled={isSaving || isLoading}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu dữ liệu BM-150'}
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
          Đang tải render-payload BM-150...
        </div>
      ) : (
        <div className="grid gap-6">
          <Section title="Thông tin bắt buộc">
            <TextareaField
              label="Căn cứ điều luật"
              value={form.procedureArticlesLine}
              onChange={(value) => updateField('procedureArticlesLine', value)}
              className={textAreaClass}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Số quyết định khởi tố vụ án">
                <input
                  className={inputClass}
                  value={form.caseDecisionNo}
                  onChange={(event) =>
                    updateField('caseDecisionNo', event.target.value)
                  }
                />
              </Field>

              <Field label="Ngày quyết định khởi tố vụ án">
                <input
                  type="date"
                  className={inputClass}
                  value={form.caseDecisionDate}
                  onChange={(event) =>
                    updateField('caseDecisionDate', event.target.value)
                  }
                />
              </Field>

              <Field label="Cơ quan ban hành">
                <input
                  className={inputClass}
                  value={form.caseDecisionIssuedBy}
                  onChange={(event) =>
                    updateField('caseDecisionIssuedBy', event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tội danh">
                <input
                  className={inputClass}
                  value={form.offenseName}
                  onChange={(event) =>
                    updateField('offenseName', event.target.value)
                  }
                />
              </Field>

              <Field label="Điều luật">
                <input
                  className={inputClass}
                  value={form.legalArticle}
                  onChange={(event) =>
                    updateField('legalArticle', event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Thông tin tùy chọn nếu có">
            <CheckboxField
              checked={form.hasCaseDecisionChange}
              label="Có Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án"
              onChange={(checked) =>
                updateField('hasCaseDecisionChange', checked)
              }
            />

            {form.hasCaseDecisionChange ? (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <Field label="Số quyết định thay đổi/bổ sung vụ án">
                  <input
                    className={inputClass}
                    value={form.caseDecisionChangeNo}
                    onChange={(event) =>
                      updateField('caseDecisionChangeNo', event.target.value)
                    }
                  />
                </Field>

                <Field label="Ngày quyết định">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.caseDecisionChangeDate}
                    onChange={(event) =>
                      updateField('caseDecisionChangeDate', event.target.value)
                    }
                  />
                </Field>

                <Field label="Cơ quan ban hành">
                  <input
                    className={inputClass}
                    value={form.caseDecisionChangeIssuedBy}
                    onChange={(event) =>
                      updateField(
                        'caseDecisionChangeIssuedBy',
                        event.target.value,
                      )
                    }
                  />
                </Field>

                <Field label="Nội dung thay đổi/bổ sung">
                  <input
                    className={inputClass}
                    value={form.caseDecisionChangeContent}
                    onChange={(event) =>
                      updateField(
                        'caseDecisionChangeContent',
                        event.target.value,
                      )
                    }
                  />
                </Field>
              </div>
            ) : null}

            <CheckboxField
              checked={form.hasAccusedDecision}
              label="Có Quyết định khởi tố bị can"
              onChange={(checked) => updateField('hasAccusedDecision', checked)}
            />

            {form.hasAccusedDecision ? (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <Field label="Số quyết định khởi tố bị can">
                  <input
                    className={inputClass}
                    value={form.accusedDecisionNo}
                    onChange={(event) =>
                      updateField('accusedDecisionNo', event.target.value)
                    }
                  />
                </Field>

                <Field label="Ngày quyết định">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.accusedDecisionDate}
                    onChange={(event) =>
                      updateField('accusedDecisionDate', event.target.value)
                    }
                  />
                </Field>

                <Field label="Cơ quan ban hành">
                  <input
                    className={inputClass}
                    value={form.accusedDecisionIssuedBy}
                    onChange={(event) =>
                      updateField('accusedDecisionIssuedBy', event.target.value)
                    }
                  />
                </Field>

                <Field label="Tên bị can">
                  <input
                    className={inputClass}
                    value={form.accusedName}
                    onChange={(event) =>
                      updateField('accusedName', event.target.value)
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <CheckboxField
                    checked={form.hasAccusedDecisionChange}
                    label="Có Quyết định thay đổi/bổ sung Quyết định khởi tố bị can"
                    onChange={(checked) =>
                      updateField('hasAccusedDecisionChange', checked)
                    }
                  />
                </div>

                {form.hasAccusedDecisionChange ? (
                  <>
                    <Field label="Số quyết định thay đổi/bổ sung bị can">
                      <input
                        className={inputClass}
                        value={form.accusedDecisionChangeNo}
                        onChange={(event) =>
                          updateField(
                            'accusedDecisionChangeNo',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Ngày quyết định">
                      <input
                        type="date"
                        className={inputClass}
                        value={form.accusedDecisionChangeDate}
                        onChange={(event) =>
                          updateField(
                            'accusedDecisionChangeDate',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Cơ quan ban hành">
                      <input
                        className={inputClass}
                        value={form.accusedDecisionChangeIssuedBy}
                        onChange={(event) =>
                          updateField(
                            'accusedDecisionChangeIssuedBy',
                            event.target.value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Nội dung thay đổi/bổ sung">
                      <input
                        className={inputClass}
                        value={form.accusedDecisionChangeContent}
                        onChange={(event) =>
                          updateField(
                            'accusedDecisionChangeContent',
                            event.target.value,
                          )
                        }
                      />
                    </Field>
                  </>
                ) : null}
              </div>
            ) : null}

            <CheckboxField
              checked={form.hasMeasureCancellation}
              label="Có hủy bỏ biện pháp ngăn chặn/biện pháp cưỡng chế"
              onChange={(checked) =>
                updateField('hasMeasureCancellation', checked)
              }
            />

            {form.hasMeasureCancellation ? (
              <TextareaField
                label="Nội dung Điều 2"
                value={form.article2Line}
                onChange={(value) => updateField('article2Line', value)}
                className={textAreaClass}
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Không tick: Điều 2 sẽ xuất “Không có.”
              </div>
            )}
          </Section>

          <Section title="Nội dung quyết định">
            <TextareaField
              label="Xét thấy"
              value={form.reasonLine}
              onChange={(value) => updateField('reasonLine', value)}
              className={textAreaClass}
            />

            <TextareaField
              label="Điều 1"
              value={form.article1Line}
              onChange={(value) => updateField('article1Line', value)}
              className={textAreaClass}
            />

            <TextareaField
              label="Điều 3"
              value={form.article3Line}
              onChange={(value) => updateField('article3Line', value)}
              className={textAreaClass}
            />

            <TextareaField
              label="Điều 4"
              value={form.article4Line}
              onChange={(value) => updateField('article4Line', value)}
              className={textAreaClass}
            />
          </Section>

          <Section title="Nơi nhận">
            <div className="grid gap-4 md:grid-cols-2">
              <TextareaField
                label="VKS cấp trên"
                value={form.superiorProcuracyRecipientLine}
                onChange={(value) =>
                  updateField('superiorProcuracyRecipientLine', value)
                }
                className={textAreaClass}
              />

              <TextareaField
                label="Cơ quan/tổ chức/cá nhân liên quan"
                value={form.otherRecipientsLine}
                onChange={(value) => updateField('otherRecipientsLine', value)}
                className={textAreaClass}
              />

              <TextareaField
                label="Bị can/người đại diện"
                value={form.accusedOrRepresentativeRecipientLine}
                onChange={(value) =>
                  updateField('accusedOrRepresentativeRecipientLine', value)
                }
                className={textAreaClass}
              />

              <TextareaField
                label="Cơ quan điều tra"
                value={form.investigationAuthorityRecipientLine}
                onChange={(value) =>
                  updateField('investigationAuthorityRecipientLine', value)
                }
                className={textAreaClass}
              />

              <TextareaField
                label="Người bào chữa"
                value={form.defenseCounselRecipientLine}
                onChange={(value) =>
                  updateField('defenseCounselRecipientLine', value)
                }
                className={textAreaClass}
              />

              <TextareaField
                label="Lưu"
                value={form.archiveLine}
                onChange={(value) => updateField('archiveLine', value)}
                className={textAreaClass}
              />
            </div>
          </Section>

          <Section title="Chữ ký">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Ký thay">
                <input
                  className={inputClass}
                  value={form.signMode}
                  onChange={(event) =>
                    updateField('signMode', event.target.value)
                  }
                />
              </Field>

              <Field label="Chức vụ">
                <input
                  className={inputClass}
                  value={form.positionTitle}
                  onChange={(event) =>
                    updateField('positionTitle', event.target.value)
                  }
                />
              </Field>

              <Field label="Người ký">
                <input
                  className={inputClass}
                  value={form.signerName}
                  onChange={(event) =>
                    updateField('signerName', event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>
        </div>
      )}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-xl border border-slate-100 bg-white">
      <h3 className="border-b border-slate-100 px-1 pb-2 text-base font-semibold text-slate-900">
        {title}
      </h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span>{label}</span>
    </label>
  );
}
