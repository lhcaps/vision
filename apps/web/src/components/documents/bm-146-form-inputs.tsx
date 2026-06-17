'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

type Bm146FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

type Bm146FormState = {
  procedureArticlesLine: string;
  caseDecisionLegalBasisLine: string;
  reasonLine: string;
  article1Line: string;
  article2Line: string;
  article3Line: string;
  article4Line: string;
  investigationAuthorityRecipientLine: string;
  otherRecipientsLine: string;
  archiveLine: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
};

const EMPTY_FORM: Bm146FormState = {
  procedureArticlesLine:
    'Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;',
  caseDecisionLegalBasisLine:
    'Căn cứ Quyết định khởi tố vụ án hình sự số  ngày 06 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;',
  reasonLine:
    'Xét thấy có căn cứ tạm đình chỉ vụ án hình sự theo quy định của Bộ luật Tố tụng hình sự,',
  article1Line:
    'Tạm đình chỉ vụ án hình sự Vụ án đánh bạc tại phường Trung Mỹ Tây về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự.',
  article2Line:
    'Việc giám định, định giá tài sản, yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật, tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả.',
  article3Line:
    'Xử lý vật chứng, tài liệu, đồ vật và các vấn đề khác có liên quan theo quy định của pháp luật.',
  article4Line:
    'Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của pháp luật./.',
  investigationAuthorityRecipientLine:
    '- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;',
  otherRecipientsLine: '- Cơ quan, tổ chức, cá nhân có liên quan;',
  archiveLine: '- Lưu: HSVA, HSKS, VP.',
  signMode: 'KT. VIỆN TRƯỞNG',
  positionTitle: 'PHÓ VIỆN TRƯỞNG',
  signerName: "",
};

const REQUIRED_FIELDS: Array<keyof Bm146FormState> = [
  'procedureArticlesLine',
  'caseDecisionLegalBasisLine',
  'reasonLine',
  'article1Line',
  'article2Line',
  'article3Line',
  'article4Line',
  'investigationAuthorityRecipientLine',
  'otherRecipientsLine',
  'archiveLine',
  'signMode',
  'positionTitle',
  'signerName',
];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function mergePayloadToForm(payload: any): Bm146FormState {
  const group = payload?.prosecutionCaseSuspension ?? {};
  const recipients = payload?.recipients ?? {};
  const signature = payload?.signature ?? {};

  return {
    ...EMPTY_FORM,
    procedureArticlesLine:
      normalizeText(group.procedureArticlesLine) || EMPTY_FORM.procedureArticlesLine,
    caseDecisionLegalBasisLine:
      normalizeText(group.caseDecisionLegalBasisLine) ||
      EMPTY_FORM.caseDecisionLegalBasisLine,
    reasonLine: normalizeText(group.reasonLine) || EMPTY_FORM.reasonLine,
    article1Line: normalizeText(group.article1Line) || EMPTY_FORM.article1Line,
    article2Line: normalizeText(group.article2Line) || EMPTY_FORM.article2Line,
    article3Line: normalizeText(group.article3Line) || EMPTY_FORM.article3Line,
    article4Line: normalizeText(group.article4Line) || EMPTY_FORM.article4Line,
    investigationAuthorityRecipientLine:
      normalizeText(group.investigationAuthorityRecipientLine) ||
      EMPTY_FORM.investigationAuthorityRecipientLine,
    otherRecipientsLine:
      normalizeText(recipients.otherRecipientsLine) || EMPTY_FORM.otherRecipientsLine,
    archiveLine: normalizeText(recipients.archiveLine) || EMPTY_FORM.archiveLine,
    signMode: normalizeText(signature.signMode) || EMPTY_FORM.signMode,
    positionTitle: normalizeText(signature.positionTitle) || EMPTY_FORM.positionTitle,
    signerName: normalizeText(signature.signerName) || EMPTY_FORM.signerName,
  };
}

export function Bm146FormInputsPanel({
  documentId,
  onSaved,
}: Bm146FormInputsPanelProps) {
  const [form, setForm] = useState<Bm146FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

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
        error instanceof Error ? error.message : 'Không tải được dữ liệu BM-146.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayload();
     
  }, [documentId]);

  function updateField(field: keyof Bm146FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function fillSampleData() {
    setForm(EMPTY_FORM);
    setMessage('Đã điền dữ liệu mẫu BM-146.');
  }

  async function saveFormInputs() {
    if (missingFields.length > 0) {
      setMessage(`Thiếu dữ liệu bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    setIsSaving(true);
    setMessage('');

    const body = {
      updatedByName: form.signerName,
      prosecutionCaseSuspension: {
        procedureArticlesLine: form.procedureArticlesLine,
        caseDecisionLegalBasisLine: form.caseDecisionLegalBasisLine,
        reasonLine: form.reasonLine,
        article1Line: form.article1Line,
        article2Line: form.article2Line,
        article3Line: form.article3Line,
        article4Line: form.article4Line,
        investigationAuthorityRecipientLine:
          form.investigationAuthorityRecipientLine,
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

      setMessage('Đã lưu dữ liệu BM-146 thành công.');
      await onSaved?.();
      await loadPayload();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Lưu dữ liệu BM-146 thất bại.',
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
            Dữ liệu biểu mẫu BM-146
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quyết định tạm đình chỉ vụ án hình sự.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSampleData}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Điền dữ liệu mẫu BM-146
          </button>

          <button
            type="button"
            onClick={saveFormInputs}
            disabled={isSaving || isLoading}
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu dữ liệu BM-146'}
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
          Đang tải render-payload BM-146...
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Ký thay">
              <input
                className={inputClass}
                value={form.signMode}
                onChange={(event) => updateField('signMode', event.target.value)}
              />
            </Field>

            <Field label="Chức vụ ký">
              <input
                className={inputClass}
                value={form.positionTitle}
                onChange={(event) => updateField('positionTitle', event.target.value)}
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

          <TextareaField
            label="Căn cứ điều luật"
            value={form.procedureArticlesLine}
            onChange={(value) => updateField('procedureArticlesLine', value)}
            className={textAreaClass}
          />

          <TextareaField
            label="Căn cứ quyết định khởi tố vụ án"
            value={form.caseDecisionLegalBasisLine}
            onChange={(value) => updateField('caseDecisionLegalBasisLine', value)}
            className={textAreaClass}
          />

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

          <TextareaField
            label="Điều 4"
            value={form.article4Line}
            onChange={(value) => updateField('article4Line', value)}
            className={textAreaClass}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <TextareaField
              label="Nơi nhận - Cơ quan điều tra"
              value={form.investigationAuthorityRecipientLine}
              onChange={(value) =>
                updateField('investigationAuthorityRecipientLine', value)
              }
              className={textAreaClass}
            />

            <TextareaField
              label="Nơi nhận - Cơ quan/cá nhân liên quan"
              value={form.otherRecipientsLine}
              onChange={(value) => updateField('otherRecipientsLine', value)}
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
  children: ReactNode;
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
