"use client";

import { useEffect, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm158Form = {
  agency: { parentName: string; name: string; issuePlace: string };
  document: { documentCode: string; issueDate: string };
  official: { issuerTitle: string };
  legalBasis: { procedureArticlesLine: string };
  content: { courtName: string; indictmentCode: string; caseName: string; offenseName: string; legalArticle: string; trialDate: string; trialTime: string; trialLocation: string };
  summons: { items: Array<{ stt: string; hoTen: string; cmnd: string; diaChi: string; vaiTro: string; ghiChu: string }> };
  recipients: { line1: string; archiveLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
};

type Bm158Props = { documentId: string | number; onSaved?: () => void };

const EMPTY_FORM: Bm158Form = {
  agency: { parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", issuePlace: "TP. Hồ Chí Minh" },
  document: { documentCode: "DS-TT-VKSKV7", issueDate: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  legalBasis: { procedureArticlesLine: "Căn cứ Điều 41 và Điều 252 của Bộ luật Tố tụng hình sự;" },
  content: { courtName: "", indictmentCode: "", caseName: "", offenseName: "", legalArticle: "", trialDate: "", trialTime: "08:00", trialLocation: "" },
  summons: { items: [{ stt: "1", hoTen: "", cmnd: "", diaChi: "", vaiTro: "Bị cáo", ghiChu: "" }] },
  recipients: { line1: "Tòa án có thẩm quyền xét xử", archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function cleanText(v: unknown): string { return v === null || v === undefined ? "" : String(v).trim(); }
function nested(payload: Record<string, unknown> | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = payload;
  for (const p of parts) { if (!cur || typeof cur !== "object") return ""; cur = (cur as Record<string, unknown>)[p]; }
  return cleanText(cur);
}
function normalizeForm(payload: Record<string, unknown> | null): Bm158Form {
  if (!payload) return EMPTY_FORM;
  const items = nested(payload, "summons.items");
  const parsedItems = typeof items === "string" ? JSON.parse(items) : (Array.isArray(items) ? items : EMPTY_FORM.summons.items);
  return {
    agency: { parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName, name: nested(payload, "agency.name") || EMPTY_FORM.agency.name, issuePlace: nested(payload, "agency.issuePlace") || EMPTY_FORM.agency.issuePlace },
    document: { documentCode: nested(payload, "document.documentCode") || EMPTY_FORM.document.documentCode, issueDate: nested(payload, "document.issueDate") || EMPTY_FORM.document.issueDate },
    official: { issuerTitle: nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle },
    legalBasis: { procedureArticlesLine: nested(payload, "legalBasis.procedureArticlesLine") || EMPTY_FORM.legalBasis.procedureArticlesLine },
    content: { courtName: nested(payload, "content.courtName") || "", indictmentCode: nested(payload, "content.indictmentCode") || "", caseName: nested(payload, "content.caseName") || "", offenseName: nested(payload, "content.offenseName") || "", legalArticle: nested(payload, "content.legalArticle") || "", trialDate: nested(payload, "content.trialDate") || "", trialTime: nested(payload, "content.trialTime") || "08:00", trialLocation: nested(payload, "content.trialLocation") || "" },
    summons: { items: parsedItems },
    recipients: { line1: nested(payload, "recipients.line1") || EMPTY_FORM.recipients.line1, archiveLine: nested(payload, "recipients.archiveLine") || EMPTY_FORM.recipients.archiveLine },
    signature: { signMode: nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode, positionTitle: nested(payload, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle, signerName: nested(payload, "signature.signerName") || "" },
  };
}
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800 mb-4">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></section>);
}
function Field({ label, value, onChange, required, multiline, type = "text", className = "" }: { label: string; value: string; onChange?: (v: string) => void; required?: boolean; multiline?: boolean; type?: "text" | "date" | "time"; className?: string }) {
  const cls = "rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white";
  return (<label className={`grid gap-1.5 ${className}`}><span className="text-sm font-semibold text-slate-700">{label}{required ? <span className="text-red-500"> *</span> : null}</span>{multiline ? <textarea className={`${cls} min-h-[88px]`} value={value} onChange={e => onChange?.(e.target.value)} /> : <input className={cls} value={value} type={type} onChange={e => onChange?.(e.target.value)} />}</label>);
}
export function Bm158FormInputsPanel({ documentId, onSaved }: Bm158Props) {
  const [form, setForm] = useState<Bm158Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const patch = (section: keyof Bm158Form, key: string, value: string) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: value } }));
  const patchSummons = (idx: number, key: string, value: string) => setForm(f => ({ ...f, summons: { items: f.summons.items.map((item, i) => i === idx ? { ...item, [key]: value } : item) } }));
  const addSummon = () => setForm(f => ({ ...f, summons: { items: [...f.summons.items, { stt: String(f.summons.items.length + 1), hoTen: "", cmnd: "", diaChi: "", vaiTro: "Bị cáo", ghiChu: "" }] } }));
  const removeSummon = (idx: number) => setForm(f => ({ ...f, summons: { items: f.summons.items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, stt: String(i + 1) })) } }));
  const reload = async () => { try { const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`); if (res.ok) setForm(normalizeForm(await res.json())); } catch { /* ignore */ } };
  const handleSave = async () => { setSaving(true); setError(null); setMsg(null); try { const res = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ ...form, summons: { items: form.summons.items } }) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); await reload(); setMsg("Đã lưu thành công."); onSaved?.(); } catch (e) { setError(e instanceof Error ? e.message : "Lỗi khi lưu."); } finally { setSaving(false); } };
  useEffect(() => { void reload(); }, [documentId]);
  return (<div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">BM-158</p><h2 className="mt-1 text-xl font-bold text-slate-950">Danh sách đề nghị triệu tập đến phiên tòa</h2></div><div className="flex gap-2"><button className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void reload()}>Tải lại</button><button className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-blue-700" onClick={() => void handleSave()} disabled={saving}>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</button></div></div>{msg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{msg}</div> : null}{error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}<SectionCard title="1. Header biểu mẫu"><Field label="Viện kiểm sát cấp trên" value={form.agency.parentName} onChange={v => patch("agency", "parentName", v)} /><Field label="Viện kiểm sát ban hành" value={form.agency.name} onChange={v => patch("agency", "name", v)} /><Field label="Số danh sách" value={form.document.documentCode} onChange={v => patch("document", "documentCode", v)} /><Field label="Địa danh" value={form.agency.issuePlace} onChange={v => patch("agency", "issuePlace", v)} /><Field label="Ngày lập" type="date" value={form.document.issueDate} onChange={v => patch("document", "issueDate", v)} /><Field label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={v => patch("official", "issuerTitle", v)} className="md:col-span-2" /></SectionCard><SectionCard title="2. Thông tin phiên tòa"><Field label="Tòa án xét xử" value={form.content.courtName} onChange={v => patch("content", "courtName", v)} className="md:col-span-2" /><Field label="Số cáo trạng" value={form.content.indictmentCode} onChange={v => patch("content", "indictmentCode", v)} /><Field label="Tên vụ án" value={form.content.caseName} onChange={v => patch("content", "caseName", v)} /><Field label="Tội danh" value={form.content.offenseName} onChange={v => patch("content", "offenseName", v)} /><Field label="Điều luật" value={form.content.legalArticle} onChange={v => patch("content", "legalArticle", v)} /><Field label="Ngày xét xử" type="date" value={form.content.trialDate} onChange={v => patch("content", "trialDate", v)} /><Field label="Giờ xét xử" type="time" value={form.content.trialTime} onChange={v => patch("content", "trialTime", v)} /><Field label="Địa điểm xét xử" value={form.content.trialLocation} onChange={v => patch("content", "trialLocation", v)} className="md:col-span-2" /></SectionCard><SectionCard title="3. Danh sách triệu tập"><div className="md:col-span-2"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-100"><th className="rounded-tl-lg px-2 py-1 text-left font-semibold text-slate-700">STT</th><th className="px-2 py-1 text-left font-semibold text-slate-700">Họ tên</th><th className="px-2 py-1 text-left font-semibold text-slate-700">CMND/CCCD</th><th className="px-2 py-1 text-left font-semibold text-slate-700">Địa chỉ</th><th className="px-2 py-1 text-left font-semibold text-slate-700">Vai trò</th><th className="px-2 py-1 text-left font-semibold text-slate-700">Ghi chú</th><th className="rounded-tr-lg px-2 py-1"></th></tr></thead><tbody>{form.summons.items.map((item, idx) => (<tr key={idx} className="border-b border-slate-200"><td className="px-2 py-1"><input className="w-12 rounded border border-slate-300 px-2 py-1 text-sm" value={item.stt} readOnly /></td><td className="px-2 py-1"><input className="w-40 rounded border border-slate-300 px-2 py-1 text-sm" value={item.hoTen} onChange={e => patchSummons(idx, "hoTen", e.target.value)} /></td><td className="px-2 py-1"><input className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" value={item.cmnd} onChange={e => patchSummons(idx, "cmnd", e.target.value)} /></td><td className="px-2 py-1"><input className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" value={item.diaChi} onChange={e => patchSummons(idx, "diaChi", e.target.value)} /></td><td className="px-2 py-1"><input className="w-28 rounded border border-slate-300 px-2 py-1 text-sm" value={item.vaiTro} onChange={e => patchSummons(idx, "vaiTro", e.target.value)} /></td><td className="px-2 py-1"><input className="w-28 rounded border border-slate-300 px-2 py-1 text-sm" value={item.ghiChu} onChange={e => patchSummons(idx, "ghiChu", e.target.value)} /></td><td className="px-2 py-1"><button className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200" onClick={() => removeSummon(idx)}>Xóa</button></td></tr>))}</tbody></table></div><button className="mt-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100" onClick={addSummon}>+ Thêm người</button></div></SectionCard><SectionCard title="4. Chữ ký"><Field label="Chế độ ký" value={form.signature.signMode} onChange={v => patch("signature", "signMode", v)} /><Field label="Chức vụ ký" value={form.signature.positionTitle} onChange={v => patch("signature", "positionTitle", v)} /><Field label="Người ký" value={form.signature.signerName} onChange={v => patch("signature", "signerName", v)} /></SectionCard></div>);
}
