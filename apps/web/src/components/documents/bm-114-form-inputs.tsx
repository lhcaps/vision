"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type RequestForm = {
  procedureArticlesLine: string;
  caseTitle: string;
  offenseName: string;
  accusedFullName: string;
  suspendedDecisionCode: string;
  suspendedDecisionDate: string;
  suspendedDecisionAgency: string;
  reasonLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm114Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  request: RequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm114Form = {
  agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  document: { documentCode: "114/YCT-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  request: { procedureArticlesLine: "Căn cứ các điều 36, 37 và 172 của Bộ luật Tố tụng hình sự;", caseTitle: "", offenseName: "", accusedFullName: "", suspendedDecisionCode: "", suspendedDecisionDate: "", suspendedDecisionAgency: "", reasonLine: "" },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function cleanText(v: unknown): string { return v == null ? "" : String(v).trim(); }

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: any = payload;
  for (const p of parts) { if (!cur || typeof cur !== "object") return ""; cur = cur[p]; }
  return cleanText(cur);
}

function parseDateToIso(v: string): string {
  const raw = cleanText(v); if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (iso) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2,"0")}-${slash[1].padStart(2,"0")}`;
  return "";
}

function toVietnameseDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || ""; return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

function toSlashDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || ""; return `${m[3]}/${m[2]}/${m[1]}`;
}

function buildIssuePlaceAndDateLine(form: Bm114Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);
  return place ? `${place}, ${dateText}` : dateText;
}

function buildReasonLine(form: Bm114Form): string {
  const r = form.request;
  if (!r.accusedFullName || !r.caseTitle) return "";
  return `Qua xét nội dung vụ án ${r.caseTitle.trim()} về tội "${r.offenseName.trim()}", có căn cứ cho rằng QĐ số ${r.suspendedDecisionCode.trim()}${r.suspendedDecisionDate ? ` ngày ${cleanText(r.suspendedDecisionDate)}` : ""} của ${r.suspendedDecisionAgency.trim()} về việc tạm đình chỉ điều tra bị can ${r.accusedFullName.trim()} không có căn cứ, cần phục hồi điều tra đối với bị can.`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm114Form {
  const f = EMPTY_FORM;
  return {
    agency: { parentName: nested(payload, "agency.parentName") || f.agency.parentName, name: nested(payload, "agency.name") || f.agency.name },
    document: { documentCode: nested(payload, "document.documentCode") || f.document.documentCode, issuePlace: nested(payload, "document.issuePlace") || nested(payload, "agency.issuePlace") || f.document.issuePlace, issueDateIso: parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso },
    official: { issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle },
    request: {
      procedureArticlesLine: nested(payload, "request.procedureArticlesLine") || f.request.procedureArticlesLine,
      caseTitle: nested(payload, "request.caseTitle") || nested(payload, "case.caseTitle") || "",
      offenseName: nested(payload, "request.offenseName") || nested(payload, "offense.offenseName") || "",
      accusedFullName: nested(payload, "request.accusedFullName") || nested(payload, "accused.fullName") || "",
      suspendedDecisionCode: nested(payload, "request.suspendedDecisionCode") || "",
      suspendedDecisionDate: nested(payload, "request.suspendedDecisionDate") || "",
      suspendedDecisionAgency: nested(payload, "request.suspendedDecisionAgency") || "",
      reasonLine: nested(payload, "request.reasonLine") || "",
    },
    recipients: { archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine },
    signature: { signMode: nested(payload, "signature.signMode") || f.signature.signMode, positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle, signerName: nested(payload, "signature.signerName") || "" },
  };
}

function validateForm(form: Bm114Form): string[] {
  const reqs: [string, string][] = [
    ["Viện kiểm sát cấp trên", form.agency.parentName], ["Viện kiểm sát ban hành", form.agency.name],
    ["Số yêu cầu", form.document.documentCode], ["Địa danh", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso], ["Chủ thể ban hành", form.official.issuerTitle],
    ["Căn cứ pháp luật", form.request.procedureArticlesLine], ["Tên vụ án", form.request.caseTitle],
    ["Tội danh", form.request.offenseName], ["Họ tên bị can", form.request.accusedFullName],
    ["Số QĐ tạm đình chỉ", form.request.suspendedDecisionCode], ["Cơ quan ban hành QĐ", form.request.suspendedDecisionAgency],
    ["Chế độ ký", form.signature.signMode], ["Chức vụ ký", form.signature.positionTitle], ["Người ký", form.signature.signerName],
  ];
  return reqs.filter(([, v]) => !String(v ?? "").trim()).map(([l]) => l);
}

function buildSaveBody(form: Bm114Form) {
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);
  return {
    agency: { parentName: form.agency.parentName, name: form.agency.name, issuePlace: form.document.issuePlace },
    document: { documentCode: form.document.documentCode, issueDate: toSlashDateText(form.document.issueDateIso), issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\s+/iu, ""), issuePlaceAndDateLine },
    official: { issuerTitle: form.official.issuerTitle },
    request: { procedureArticlesLine: form.request.procedureArticlesLine, caseTitle: form.request.caseTitle, offenseName: form.request.offenseName, accusedFullName: form.request.accusedFullName, suspendedDecisionCode: form.request.suspendedDecisionCode, suspendedDecisionDate: form.request.suspendedDecisionDate, suspendedDecisionAgency: form.request.suspendedDecisionAgency, reasonLine: buildReasonLine(form) },
    recipients: { archiveLine: form.recipients.archiveLine },
    signature: { signMode: form.signature.signMode, positionTitle: form.signature.positionTitle, signerName: form.signature.signerName || "" },
    formInputs: {}, payloadOverrides: {}, renderPayloadOverrides: {},
  };
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">{title}</h3>{description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}</div><div className="grid gap-4">{children}</div></section>);
}

function Field({ label, value, onChange, required, multiline, type = "text", readOnly }: { label: string; value: string; onChange?: (v: string) => void; required?: boolean; multiline?: boolean; type?: "text" | "date"; readOnly?: boolean; }) {
  const cls = "rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  return (<label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-700">{label}{required ? <span className="text-red-500"> *</span> : null}</span>{multiline ? (<textarea className={`${cls} min-h-[88px] ${readOnly ? "bg-slate-100 text-slate-700" : "bg-white"}`} value={value} readOnly={readOnly} onChange={e => onChange?.(e.target.value)} />) : (<input className={`${cls} ${readOnly ? "bg-slate-100 text-slate-700" : "bg-white"}`} value={value} type={type} readOnly={readOnly} onChange={e => onChange?.(e.target.value)} />)}</label>);
}

export function Bm114FormInputsPanel({ documentId, onSaved }: { documentId: string | number; onSaved?: () => void | Promise<void> }) {
  const [form, setForm] = useState<Bm114Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm114Form>(section: T, key: keyof Bm114Form[T], value: string) => {
    setForm(f => ({ ...f, [section]: { ...(f[section] as Record<string, string>), [key]: value } }));
  };

  const reloadFromBackend = async () => {
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json() as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải dữ liệu BM-114 từ backend.");
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi tải."); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const errors = validateForm(form);
    if (errors.length > 0) { setError(`Thiếu: ${errors.join(", ")}`); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(buildSaveBody(form)) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reloadFromBackend();
      setMessage("Đã lưu BM-114 thành công.");
      await onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); }
    finally { setSaving(false); }
  };

  useEffect(() => { void reloadFromBackend(); }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">BM-114</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Yêu cầu phục hồi điều tra bị can</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Form nhập liệu placeholder cho BM-114.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60" onClick={() => void reloadFromBackend()} disabled={loading || saving}>{loading ? "Đang tải..." : "Tải lại"}</button>
          <button type="button" className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" onClick={() => void handleSave()} disabled={loading || saving}>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</button>
        </div>
      </div>
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
      {validationErrors.length > 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Còn thiếu: {validationErrors.join(", ")}</div> : null}

      <SectionCard title="1. Header biểu mẫu">
        <Field label="Viện kiểm sát cấp trên" required value={form.agency.parentName} onChange={v => patch("agency", "parentName", v)} />
        <Field label="Viện kiểm sát ban hành" required value={form.agency.name} onChange={v => patch("agency", "name", v)} />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Số yêu cầu" required value={form.document.documentCode} onChange={v => patch("document", "documentCode", v)} />
          <Field label="Địa danh" required value={form.document.issuePlace} onChange={v => patch("document", "issuePlace", v)} />
          <Field label="Ngày ban hành" required type="date" value={form.document.issueDateIso} onChange={v => patch("document", "issueDateIso", v)} />
        </div>
        <Field label="Dòng địa danh/ngày tự sinh" value={buildIssuePlaceAndDateLine(form)} readOnly />
        <Field label="Chủ thể ban hành" required value={form.official.issuerTitle} onChange={v => patch("official", "issuerTitle", v)} />
      </SectionCard>

      <SectionCard title="2. Thông tin phục hồi điều tra" description="Nhập thông tin bị can và QĐ tạm đình chỉ cần phục hồi.">
        <Field label="Căn cứ pháp luật" required multiline value={form.request.procedureArticlesLine} onChange={v => patch("request", "procedureArticlesLine", v)} />
        <Field label="Tên vụ án" required value={form.request.caseTitle} onChange={v => patch("request", "caseTitle", v)} />
        <Field label="Tội danh" value={form.request.offenseName} onChange={v => patch("request", "offenseName", v)} />
        <Field label="Họ tên bị can" required value={form.request.accusedFullName} onChange={v => patch("request", "accusedFullName", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Số QĐ tạm đình chỉ" required value={form.request.suspendedDecisionCode} onChange={v => patch("request", "suspendedDecisionCode", v)} />
          <Field label="Ngày QĐ tạm đình chỉ" value={form.request.suspendedDecisionDate} onChange={v => patch("request", "suspendedDecisionDate", v)} />
        </div>
        <Field label="Cơ quan ban hành QĐ" required value={form.request.suspendedDecisionAgency} onChange={v => patch("request", "suspendedDecisionAgency", v)} />
        <Field label="Lý do phục hồi tự sinh" multiline readOnly value={buildReasonLine(form)} />
      </SectionCard>

      <SectionCard title="3. Nơi nhận và chữ ký">
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={v => patch("recipients", "archiveLine", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Chế độ ký" required value={form.signature.signMode} onChange={v => patch("signature", "signMode", v)} />
          <Field label="Chức vụ ký" required value={form.signature.positionTitle} onChange={v => patch("signature", "positionTitle", v)} />
        </div>
        <Field label="Người ký" required value={form.signature.signerName} onChange={v => patch("signature", "signerName", v)} />
      </SectionCard>
    </div>
  );
}
