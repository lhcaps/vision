"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm139Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  official: { issuerTitle: string };
  suggestion: {
    procedureArticlesLine: string;
    caseTitle: string;
    offenseName: string;
    recipientAgency: string;
    violationDescription: string;
    legalBasis: string;
    suggestedMeasure: string;
    deadlineLine: string;
    reasonLine: string;
  };
  recipients: { archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

const EMPTY: Bm139Form = {
  agency: { parentName: "", name: "" },
  document: { documentCode: "", issuePlace: "", issueDateIso: "" },
  official: { issuerTitle: "" },
  suggestion: {
    procedureArticlesLine: "", caseTitle: "", offenseName: "", recipientAgency: "",
    violationDescription: "", legalBasis: "", suggestedMeasure: "", deadlineLine: "", reasonLine: "",
  },
  recipients: { archiveLine: "" },
  signature: { signMode: "handwritten", positionTitle: "Kiểm sát viên", signerName: "" },
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
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

function normalizeFormInputs(form: Bm139Form): Bm139Form {
  return {
    ...form,
    document: { ...form.document, issueDateIso: parseDateToIso(form.document.issueDateIso as unknown as string) },
  };
}

function validateForm(form: Bm139Form): string[] {
  const errors: string[] = [];
  if (!form.agency.parentName) errors.push("Tên Viện kiểm sát (cấp trên) là bắt buộc.");
  if (!form.agency.name) errors.push("Tên Viện kiểm sát là bắt buộc.");
  if (!form.document.documentCode) errors.push("Số kiến nghị là bắt buộc.");
  if (!form.document.issueDateIso) errors.push("Ngày ban hành là bắt buộc.");
  if (!form.suggestion.caseTitle) errors.push("Tên vụ án là bắt buộc.");
  if (!form.suggestion.recipientAgency) errors.push("Cơ quan nhận kiến nghị là bắt buộc.");
  if (!form.signature.signerName) errors.push("Tên người ký là bắt buộc.");
  return errors;
}

function buildSaveBody(form: Bm139Form, documentId: string) {
  return { documentId, formData: normalizeFormInputs(form) };
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-slate-600">{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
  );
}

type RenderPayload = Record<string, any>;
type Bm139Props = { documentId: string; onSaved?: () => void | Promise<void> };

export function Bm139FormInputsPanel({ documentId, onSaved }: Bm139Props) {
  const [form, setForm] = useState<Bm139Form>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!documentId || isLoaded) return;
    fetch(`${API_BASE_URL}/documents/${documentId}/render-payload`)
      .then((r) => r.json())
      .then((payload: RenderPayload) => {
        const d = payload?.data;
        if (d?.agency) setForm((f) => ({ ...f, agency: d.agency }));
        if (d?.document) setForm((f) => ({ ...f, document: d.document }));
        if (d?.official) setForm((f) => ({ ...f, official: d.official }));
        if (d?.suggestion) setForm((f) => ({ ...f, suggestion: { ...f.suggestion, ...d.suggestion } }));
        if (d?.recipients) setForm((f) => ({ ...f, recipients: d.recipients }));
        if (d?.signature) setForm((f) => ({ ...f, signature: d.signature }));
        setIsLoaded(true);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(false));
  }, [documentId, isLoaded]);

  const handleChange = useMemo(
    () => (path: string, value: string) => {
      setForm((f) => {
        const next = { ...f };
        const parts = path.split(".");
        let cur: Record<string, any> = next;
        for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = { ...cur[parts[i]] }; cur = cur[parts[i]]; }
        cur[parts[parts.length - 1]] = value;
        return next;
      });
    }, []);

  const fillSample = () => {
    setForm({
      agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
      document: { documentCode: "139/KN-VKSKV7", issuePlace: "Thành phố Hồ Chí Minh", issueDateIso: "2026-06-15" },
      official: { issuerTitle: "Viện trưởng" },
      suggestion: {
        procedureArticlesLine: "Điều 36, Điều 37 Luật Tổ chức Viện kiểm sát nhân dân; Điều 147 Bộ luật Tố tụng hình sự",
        caseTitle: "Vụ án hình sự ",
        offenseName: "Tội Cướp tài sản",
        recipientAgency: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        violationDescription: "Trong quá trình điều tra vụ án, Cơ quan Cảnh sát điều tra đã không thực hiện đúng quy định về thời hạn điều tra. Thời hạn điều tra theo Điều 173 Bộ luật Tố tụng hình sự đã hết nhưng vụ án chưa được kết thúc điều tra và chuyển hồ sơ sang Viện kiểm sát.",
        legalBasis: "Điều 147 Bộ luật Tố tụng hình sự quy định về thẩm quyền và trách nhiệm của Viện kiểm sát trong việc kiểm sát hoạt động điều tra. Điều 36 Luật Tổ chức Viện kiểm sát nhân dân quy định về quyền hạn của Viện kiểm sát trong việc kiến nghị cơ quan điều tra khắc phục vi phạm.",
        suggestedMeasure: "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh khẩn trương hoàn thành điều tra, đảm bảo tuân thủ đúng quy định về thời hạn theo Bộ luật Tố tụng hình sự. Nếu chưa thể kết thúc điều tra, yêu cầu gia hạn điều tra đúng thủ tục.",
        deadlineLine: "Yêu cầu báo cáo kết quả thực hiện kiến nghị trong thời hạn 15 ngày kể từ ngày nhận được kiến nghị này.",
        reasonLine: "Nhằm đảm bảo việc điều tra được tiến hành đúng quy định pháp luật, bảo vệ quyền và lợi ích hợp pháp của các đương sự, và đẩy nhanh tiến độ giải quyết vụ án.",
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
      await fetch(`${API_BASE_URL}/documents/${documentId}/form-inputs`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildSaveBody(form, documentId)) });
      onSaved?.();
    } catch { setErrors(["Lưu thất bại. Vui lòng thử lại."]); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">BM-139: Kiến nghị khắc phục, xử lý vi phạm</h2>
          <p className="text-xs text-slate-500">Nhập dữ liệu cho biểu mẫu Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra</p>
        </div>
        <button onClick={fillSample} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Điền mẫu</button>
      </div>
      {errors.length > 0 && <div className="rounded-lg border border-red-200 bg-red-50 p-3">{errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}</div>}

      <SectionCard title="Cơ quan ban hành">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên Viện kiểm sát (cấp trên)"><Input value={form.agency.parentName} onChange={(v) => handleChange("agency.parentName", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN..." /></Field>
          <Field label="Tên Viện kiểm sát"><Input value={form.agency.name} onChange={(v) => handleChange("agency.name", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC..." /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Thông tin kiến nghị">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Số kiến nghị"><Input value={form.document.documentCode} onChange={(v) => handleChange("document.documentCode", v)} placeholder="139/KN-VKSKV7" /></Field>
          <Field label="Nơi ban hành"><Input value={form.document.issuePlace} onChange={(v) => handleChange("document.issuePlace", v)} placeholder="Thành phố Hồ Chí Minh" /></Field>
          <Field label="Ngày ban hành">
            <input type="date" value={form.document.issueDateIso?.slice(0, 10) ?? ""} onChange={(e) => handleChange("document.issueDateIso", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
          <Field label="Chức vụ người ký"><Input value={form.official.issuerTitle} onChange={(v) => handleChange("official.issuerTitle", v)} placeholder="Viện trưởng" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Nội dung kiến nghị">
        <Field label="Điều khoản căn cứ pháp luật"><Input value={form.suggestion.procedureArticlesLine} onChange={(v) => handleChange("suggestion.procedureArticlesLine", v)} placeholder="Điều 36, Điều 37 Luật Tổ chức Viện kiểm sát..." /></Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên vụ án"><Input value={form.suggestion.caseTitle} onChange={(v) => handleChange("suggestion.caseTitle", v)} placeholder="Vụ án hình sự " /></Field>
          <Field label="Tội danh"><Input value={form.suggestion.offenseName} onChange={(v) => handleChange("suggestion.offenseName", v)} placeholder="Tội Cướp tài sản" /></Field>
        </div>
        <Field label="Cơ quan nhận kiến nghị"><Input value={form.suggestion.recipientAgency} onChange={(v) => handleChange("suggestion.recipientAgency", v)} placeholder="Cơ quan Cảnh sát điều tra Công an TP.HCM" /></Field>
        <Field label="Mô tả vi phạm">
          <textarea value={form.suggestion.violationDescription} onChange={(e) => handleChange("suggestion.violationDescription", e.target.value)} rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Trong quá trình điều tra vụ án, Cơ quan Cảnh sát điều tra đã không thực hiện đúng quy định..." />
        </Field>
        <Field label="Căn cứ pháp lý">
          <textarea value={form.suggestion.legalBasis} onChange={(e) => handleChange("suggestion.legalBasis", e.target.value)} rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Điều 147 Bộ luật Tố tụng hình sự..." />
        </Field>
        <Field label="Biện pháp kiến nghị">
          <textarea value={form.suggestion.suggestedMeasure} onChange={(e) => handleChange("suggestion.suggestedMeasure", e.target.value)} rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Yêu cầu Cơ quan Cảnh sát điều tra khẩn trương hoàn thành điều tra..." />
        </Field>
        <Field label="Thời hạn thực hiện"><Input value={form.suggestion.deadlineLine} onChange={(v) => handleChange("suggestion.deadlineLine", v)} placeholder="Yêu cầu báo cáo kết quả trong thời hạn 15 ngày..." /></Field>
        <Field label="Lý do kiến nghị"><Input value={form.suggestion.reasonLine} onChange={(v) => handleChange("suggestion.reasonLine", v)} placeholder="Nhằm đảm bảo việc điều tra được tiến hành đúng quy định pháp luật..." /></Field>
      </SectionCard>

      <SectionCard title="Nơi nhận">
        <Field label="Dòng lưu"><Input value={form.recipients.archiveLine} onChange={(v) => handleChange("recipients.archiveLine", v)} placeholder="Lưu hồ sơ vụ án" /></Field>
      </SectionCard>

      <SectionCard title="Chữ ký">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Hình thức ký">
            <select value={form.signature.signMode} onChange={(e) => handleChange("signature.signMode", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="handwritten">Chữ ký tay</option>
              <option value="digital">Chữ ký số</option>
            </select>
          </Field>
          <Field label="Chức danh"><Input value={form.signature.positionTitle} onChange={(v) => handleChange("signature.positionTitle", v)} placeholder="Kiểm sát viên" /></Field>
          <Field label="Tên người ký"><Input value={form.signature.signerName} onChange={(v) => handleChange("signature.signerName", v)} placeholder="" /></Field>
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
