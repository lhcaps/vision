"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type CancelledDecisionForm = {
  cancelledDocumentCode: string;
  cancelledDocumentDate: string;
  cancelledDocumentAgency: string;
  accusedFullName: string;
  caseTitle: string;
  offenseName: string;
  reasonLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm111Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  cancelledDecision: CancelledDecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm111Form = {
  agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  document: { documentCode: "111/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  cancelledDecision: { cancelledDocumentCode: "", cancelledDocumentDate: "", cancelledDocumentAgency: "", accusedFullName: "", caseTitle: "", offenseName: "", reasonLine: "" },
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

function buildIssuePlaceAndDateLine(form: Bm111Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);
  return place ? `${place}, ${dateText}` : dateText;
}

function buildReasonLine(form: Bm111Form): string {
  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.accusedFullName) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc đình chỉ điều tra bị can ${d.accusedFullName.trim()} trong vụ án ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ và trái pháp luật;`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm111Form {
  const f = EMPTY_FORM;
  return {
    agency: { parentName: nested(payload, "agency.parentName") || f.agency.parentName, name: nested(payload, "agency.name") || f.agency.name },
    document: { documentCode: nested(payload, "document.documentCode") || f.document.documentCode, issuePlace: nested(payload, "document.issuePlace") || nested(payload, "agency.issuePlace") || f.document.issuePlace, issueDateIso: parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso },
    official: { issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle },
    cancelledDecision: {
      cancelledDocumentCode: nested(payload, "cancelledDecision.cancelledDocumentCode") || "",
      cancelledDocumentDate: nested(payload, "cancelledDecision.cancelledDocumentDate") || "",
      cancelledDocumentAgency: nested(payload, "cancelledDecision.cancelledDocumentAgency") || "",
      accusedFullName: nested(payload, "cancelledDecision.accusedFullName") || nested(payload, "accused.fullName") || "",
      caseTitle: nested(payload, "cancelledDecision.caseTitle") || nested(payload, "case.caseTitle") || "",
      offenseName: nested(payload, "cancelledDecision.offenseName") || nested(payload, "offense.offenseName") || "",
      reasonLine: nested(payload, "cancelledDecision.reasonLine") || "",
    },
    recipients: { archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine },
    signature: { signMode: nested(payload, "signature.signMode") || f.signature.signMode, positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle, signerName: nested(payload, "signature.signerName") || "" },
  };
}

function validateForm(form: Bm111Form): string[] {
  const reqs: [string, string][] = [
    ["Viện kiểm sát cấp trên", form.agency.parentName], ["Viện kiểm sát ban hành", form.agency.name],
    ["Số quyết định", form.document.documentCode], ["Địa danh", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso], ["Chủ thể ban hành", form.official.issuerTitle],
    ["Số QĐ bị huỷ", form.cancelledDecision.cancelledDocumentCode], ["Họ tên bị can", form.cancelledDecision.accusedFullName],
    ["Tên vụ án", form.cancelledDecision.caseTitle], ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle], ["Người ký", form.signature.signerName],
  ];
  return reqs.filter(([, v]) => !String(v ?? "").trim()).map(([l]) => l);
}

function buildSaveBody(form: Bm111Form) {
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);
  const cancelledDateIso = parseDateToIso(form.cancelledDecision.cancelledDocumentDate);
  return {
    agency: { parentName: form.agency.parentName, name: form.agency.name, issuePlace: form.document.issuePlace },
    document: { documentCode: form.document.documentCode, issueDate: toSlashDateText(form.document.issueDateIso), issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\s+/iu, ""), issuePlaceAndDateLine },
    official: { issuerTitle: form.official.issuerTitle },
    cancelledDecision: { cancelledDocumentCode: form.cancelledDecision.cancelledDocumentCode, cancelledDocumentDate: toSlashDateText(cancelledDateIso), cancelledDocumentAgency: form.cancelledDecision.cancelledDocumentAgency, accusedFullName: form.cancelledDecision.accusedFullName, caseTitle: form.cancelledDecision.caseTitle, offenseName: form.cancelledDecision.offenseName, reasonLine: buildReasonLine(form) },
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

export function Bm111FormInputsPanel({ documentId, onSaved }: { documentId: string | number; onSaved?: () => void | Promise<void> }) {
  const [form, setForm] = useState<Bm111Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm111Form>(section: T, key: keyof Bm111Form[T], value: string) => {
    setForm(f => ({ ...f, [section]: { ...(f[section] as Record<string, string>), [key]: value } }));
  };

  const reloadFromBackend = async () => {
    setLoading(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json() as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải dữ liệu BM-111 từ backend.");
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
      setMessage("Đã lưu BM-111 thành công.");
      await onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); }
    finally { setSaving(false); }
  };

  useEffect(() => { void reloadFromBackend(); }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">BM-111</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">QĐ huỷ bỏ QĐ đình chỉ điều tra bị can</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Form nhập liệu placeholder cho BM-111.</p>
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
          <Field label="Số quyết định" required value={form.document.documentCode} onChange={v => patch("document", "documentCode", v)} />
          <Field label="Địa danh" required value={form.document.issuePlace} onChange={v => patch("document", "issuePlace", v)} />
          <Field label="Ngày ban hành" required type="date" value={form.document.issueDateIso} onChange={v => patch("document", "issueDateIso", v)} />
        </div>
        <Field label="Dòng địa danh/ngày tự sinh" value={buildIssuePlaceAndDateLine(form)} readOnly />
        <Field label="Chủ thể ban hành" required value={form.official.issuerTitle} onChange={v => patch("official", "issuerTitle", v)} />
      </SectionCard>

      <SectionCard title="2. Quyết định bị huỷ bỏ" description="Nhập thông tin QĐ đình chỉ điều tra bị can cần huỷ bỏ.">
        <Field label="Số QĐ bị huỷ" required value={form.cancelledDecision.cancelledDocumentCode} onChange={v => patch("cancelledDecision", "cancelledDocumentCode", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ngày QĐ bị huỷ" type="date" value={parseDateToIso(form.cancelledDecision.cancelledDocumentDate)} onChange={v => patch("cancelledDecision", "cancelledDocumentDate", v)} />
          <Field label="Cơ quan ban hành QĐ bị huỷ" value={form.cancelledDecision.cancelledDocumentAgency} onChange={v => patch("cancelledDecision", "cancelledDocumentAgency", v)} />
        </div>
        <Field label="Họ tên bị can" required value={form.cancelledDecision.accusedFullName} onChange={v => patch("cancelledDecision", "accusedFullName", v)} />
        <Field label="Tên vụ án" required value={form.cancelledDecision.caseTitle} onChange={v => patch("cancelledDecision", "caseTitle", v)} />
        <Field label="Tội danh" value={form.cancelledDecision.offenseName} onChange={v => patch("cancelledDecision", "offenseName", v)} />
        <Field label="Lý do huỷ bỏ tự sinh" multiline readOnly value={buildReasonLine(form)} />
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
