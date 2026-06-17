"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm123Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  official: { issuerTitle: string };
  decision: {
    procedureArticlesLine: string;
    investigationDecisionCode: string;
    investigationDecisionDate: string;
    investigationDecisionAgency: string;
    caseTitle: string;
    offenseName: string;
    experimentPurpose: string;
    experimentTime: string;
    experimentLocation: string;
    experimentMethod: string;
    expectedResult: string;
    reasonLine: string;
  };
  recipients: { archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

type RenderPayload = Record<string, any>;

const EMPTY: Bm123Form = {
  agency: { parentName: "", name: "" },
  document: { documentCode: "", issuePlace: "", issueDateIso: "" },
  official: { issuerTitle: "" },
  decision: {
    procedureArticlesLine: "",
    investigationDecisionCode: "",
    investigationDecisionDate: "",
    investigationDecisionAgency: "",
    caseTitle: "",
    offenseName: "",
    experimentPurpose: "",
    experimentTime: "",
    experimentLocation: "",
    experimentMethod: "",
    expectedResult: "",
    reasonLine: "",
  },
  recipients: { archiveLine: "" },
  signature: { signMode: "handwritten", positionTitle: "Kiểm sát viên", signerName: "" },
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function nested(obj: Record<string, any>, path: string): Record<string, any> {
  const parts = path.split(".");
  return parts.reduce((acc: Record<string, any>, p, i) => {
    if (i === parts.length - 1) return acc;
    return (acc[p] = acc[p] ?? {});
  }, obj), obj;
}

function parseDateToIso(val: string): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function toVietnameseDateText(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

function toSlashDateText(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function buildReasonLine(form: Bm123Form): string {
  const parts: string[] = [];
  if (form.decision.experimentPurpose) parts.push(cleanText(form.decision.experimentPurpose));
  if (form.decision.experimentMethod) parts.push(cleanText(form.decision.experimentMethod));
  if (form.decision.expectedResult) parts.push(cleanText(form.decision.expectedResult));
  return parts.join(". ");
}

function normalizeFormInputs(form: Bm123Form): Bm123Form {
  return {
    ...form,
    document: {
      ...form.document,
      issueDateIso: parseDateToIso(form.document.issueDateIso as unknown as string),
    },
    decision: {
      ...form.decision,
      investigationDecisionDate: parseDateToIso(form.decision.investigationDecisionDate as unknown as string),
    },
  };
}

function validateForm(form: Bm123Form): string[] {
  const errors: string[] = [];
  if (!form.agency.parentName) errors.push("Tên Viện kiểm sát (cấp trên) là bắt buộc.");
  if (!form.agency.name) errors.push("Tên Viện kiểm sát là bắt buộc.");
  if (!form.document.documentCode) errors.push("Số quyết định là bắt buộc.");
  if (!form.document.issueDateIso) errors.push("Ngày ban hành là bắt buộc.");
  if (!form.decision.investigationDecisionCode) errors.push("Số quyết định điều tra là bắt buộc.");
  if (!form.decision.caseTitle) errors.push("Tên vụ án là bắt buộc.");
  if (!form.signature.signerName) errors.push("Tên người ký là bắt buộc.");
  return errors;
}

function buildSaveBody(form: Bm123Form, documentId: string) {
  const f = normalizeFormInputs(form);
  const n = nested;
  return {
    documentId,
    formData: {
      agency: f.agency,
      document: f.document,
      official: f.official,
      decision: {
        ...f.decision,
        reasonLine: buildReasonLine(f),
      },
      recipients: f.recipients,
      signature: f.signature,
    },
  };
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  );
}

type Bm123Props = {
  documentId: string;
  onSaved?: () => void | Promise<void>;
};

export function Bm123FormInputsPanel({ documentId, onSaved }: Bm123Props) {
  const [form, setForm] = useState<Bm123Form>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!documentId || isLoaded) return;
    setIsLoading(true);
    fetch(`${API_BASE_URL}/documents/${documentId}/render-payload`)
      .then((r) => r.json())
      .then((payload: RenderPayload) => {
        const d = payload?.data;
        if (d?.agency) setForm((f) => ({ ...f, agency: d.agency }));
        if (d?.document) setForm((f) => ({ ...f, document: d.document }));
        if (d?.official) setForm((f) => ({ ...f, official: d.official }));
        if (d?.decision) setForm((f) => ({ ...f, decision: { ...f.decision, ...d.decision } }));
        if (d?.recipients) setForm((f) => ({ ...f, recipients: d.recipients }));
        if (d?.signature) setForm((f) => ({ ...f, signature: d.signature }));
        setIsLoaded(true);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [documentId, isLoaded]);

  const handleChange = useMemo(
    () => (path: string, value: string) => {
      setForm((f) => {
        const next = { ...f };
        const parts = path.split(".");
        let cur: Record<string, any> = next;
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = { ...cur[parts[i]] };
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        return next;
      });
    },
    []
  );

  const fillSample = () => {
    setForm({
      agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
      document: { documentCode: "123/QĐ-VKSKV7", issuePlace: "Thành phố Hồ Chí Minh", issueDateIso: "2026-06-01" },
      official: { issuerTitle: "Viện trưởng" },
      decision: {
        procedureArticlesLine: "Điều 147, Điều 148 Bộ luật Tố tụng hình sự",
        investigationDecisionCode: "02/QĐĐT-VKS",
        investigationDecisionDate: "2026-05-15",
        investigationDecisionAgency: "Cơ quan điều tra",
        caseTitle: "Vụ án hình sự ",
        offenseName: "Tội Cướp tài sản",
        experimentPurpose: "Mô phỏng lại hành vi phạm tội tại hiện trường",
        experimentTime: "08 giờ 00 phút, ngày 15/6/2026",
        experimentLocation: "Tại hiện trường vụ cướp - 123 Đường ABC, Quận 1, TP.HCM",
        experimentMethod: "Sử dụng thiết bị ghi hình và đo đạc hiện trường",
        expectedResult: "Xác minh, làm rõ hành vi phạm tội theo tài liệu, chứng cứ thu thập được",
        reasonLine: "",
      },
      recipients: { archiveLine: "Lưu hồ sơ vụ án" },
      signature: { signMode: "handwritten", positionTitle: "Kiểm sát viên", signerName: "" },
    });
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setIsSaving(true);
    try {
      const body = buildSaveBody(form, documentId);
      await fetch(`${API_BASE_URL}/documents/${documentId}/form-inputs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved?.();
    } catch {
      setErrors(["Lưu thất bại. Vui lòng thử lại."]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">BM-123: Quyết định thực nghiệm điều tra</h2>
          <p className="text-xs text-slate-500">Nhập dữ liệu cho biểu mẫu Quyết định thực nghiệm điều tra</p>
        </div>
        <button onClick={fillSample} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Điền mẫu</button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      <SectionCard title="Cơ quan ban hành">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên Viện kiểm sát (cấp trên)">
            <Input value={form.agency.parentName} onChange={(v) => handleChange("agency.parentName", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN..." />
          </Field>
          <Field label="Tên Viện kiểm sát">
            <Input value={form.agency.name} onChange={(v) => handleChange("agency.name", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC..." />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Thông tin quyết định">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Số quyết định">
            <Input value={form.document.documentCode} onChange={(v) => handleChange("document.documentCode", v)} placeholder="123/QĐ-VKSKV7" />
          </Field>
          <Field label="Nơi ban hành">
            <Input value={form.document.issuePlace} onChange={(v) => handleChange("document.issuePlace", v)} placeholder="Thành phố Hồ Chí Minh" />
          </Field>
          <Field label="Ngày ban hành">
            <input type="date" value={form.document.issueDateIso?.slice(0, 10) ?? ""} onChange={(e) => handleChange("document.issueDateIso", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
          <Field label="Chức vụ người ký">
            <Input value={form.official.issuerTitle} onChange={(v) => handleChange("official.issuerTitle", v)} placeholder="Viện trưởng" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Nội dung quyết định thực nghiệm điều tra">
        <Field label="Điều khoản căn cứ pháp luật">
          <Input value={form.decision.procedureArticlesLine} onChange={(v) => handleChange("decision.procedureArticlesLine", v)} placeholder="Điều 147, Điều 148 Bộ luật Tố tụng hình sự" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Số quyết định điều tra">
            <Input value={form.decision.investigationDecisionCode} onChange={(v) => handleChange("decision.investigationDecisionCode", v)} placeholder="02/QĐĐT-VKS" />
          </Field>
          <Field label="Ngày quyết định điều tra">
            <input type="date" value={form.decision.investigationDecisionDate?.slice(0, 10) ?? ""} onChange={(e) => handleChange("decision.investigationDecisionDate", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
          <Field label="Cơ quan điều tra">
            <Input value={form.decision.investigationDecisionAgency} onChange={(v) => handleChange("decision.investigationDecisionAgency", v)} placeholder="Cơ quan điều tra" />
          </Field>
        </div>
        <Field label="Tên vụ án">
          <Input value={form.decision.caseTitle} onChange={(v) => handleChange("decision.caseTitle", v)} placeholder="Vụ án hình sự " />
        </Field>
        <Field label="Tội danh">
          <Input value={form.decision.offenseName} onChange={(v) => handleChange("decision.offenseName", v)} placeholder="Tội Cướp tài sản" />
        </Field>
        <Field label="Mục đích thực nghiệm">
          <Input value={form.decision.experimentPurpose} onChange={(v) => handleChange("decision.experimentPurpose", v)} placeholder="Mô phỏng lại hành vi phạm tội" />
        </Field>
        <Field label="Thời gian thực nghiệm">
          <Input value={form.decision.experimentTime} onChange={(v) => handleChange("decision.experimentTime", v)} placeholder="08 giờ 00 phút, ngày 15/6/2026" />
        </Field>
        <Field label="Địa điểm thực nghiệm">
          <Input value={form.decision.experimentLocation} onChange={(v) => handleChange("decision.experimentLocation", v)} placeholder="Tại hiện trường vụ cướp - 123 Đường ABC, Quận 1, TP.HCM" />
        </Field>
        <Field label="Phương pháp thực nghiệm">
          <Input value={form.decision.experimentMethod} onChange={(v) => handleChange("decision.experimentMethod", v)} placeholder="Sử dụng thiết bị ghi hình và đo đạc hiện trường" />
        </Field>
        <Field label="Kết quả dự kiến">
          <Input value={form.decision.expectedResult} onChange={(v) => handleChange("decision.expectedResult", v)} placeholder="Xác minh, làm rõ hành vi phạm tội" />
        </Field>
      </SectionCard>

      <SectionCard title="Nơi nhận">
        <Field label="Dòng lưu">
          <Input value={form.recipients.archiveLine} onChange={(v) => handleChange("recipients.archiveLine", v)} placeholder="Lưu hồ sơ vụ án" />
        </Field>
      </SectionCard>

      <SectionCard title="Chữ ký">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Hình thức ký">
            <select value={form.signature.signMode} onChange={(e) => handleChange("signature.signMode", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="handwritten">Chữ ký tay</option>
              <option value="digital">Chữ ký số</option>
            </select>
          </Field>
          <Field label="Chức danh">
            <Input value={form.signature.positionTitle} onChange={(v) => handleChange("signature.positionTitle", v)} placeholder="Kiểm sát viên" />
          </Field>
          <Field label="Tên người ký">
            <Input value={form.signature.signerName} onChange={(v) => handleChange("signature.signerName", v)} placeholder="" />
          </Field>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button onClick={handleSave} disabled={isSaving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50">
          {isSaving ? "Đang lưu..." : "Lưu biểu mẫu"}
        </button>
      </div>
    </div>
  );
}
