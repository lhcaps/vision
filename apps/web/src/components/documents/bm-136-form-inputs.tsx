"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm136Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  confrontation: {
    caseTitle: string;
    offenseName: string;
    confrontationTime: string;
    confrontationLocation: string;
    participantA: { role: string; name: string; birthDate: string; address: string };
    participantB: { role: string; name: string; birthDate: string; address: string };
    subjectMatter: string;
    statementA: string;
    statementB: string;
    discrepancyNote: string;
    conclusionLine: string;
  };
  participants: {
    investigatorName: string;
    investigatorPosition: string;
    recordKeeperName: string;
    recordKeeperPosition: string;
  };
};

const EMPTY: Bm136Form = {
  agency: { parentName: "", name: "" },
  document: { documentCode: "", issuePlace: "", issueDateIso: "" },
  confrontation: {
    caseTitle: "",
    offenseName: "",
    confrontationTime: "",
    confrontationLocation: "",
    participantA: { role: "", name: "", birthDate: "", address: "" },
    participantB: { role: "", name: "", birthDate: "", address: "" },
    subjectMatter: "",
    statementA: "",
    statementB: "",
    discrepancyNote: "",
    conclusionLine: "",
  },
  participants: { investigatorName: "", investigatorPosition: "", recordKeeperName: "", recordKeeperPosition: "" },
};

function parseDateToIso(val: string): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function normalizeFormInputs(form: Bm136Form): Bm136Form {
  return {
    ...form,
    document: { ...form.document, issueDateIso: parseDateToIso(form.document.issueDateIso as unknown as string) },
  };
}

function validateForm(form: Bm136Form): string[] {
  const errors: string[] = [];
  if (!form.agency.parentName) errors.push("Tên Viện kiểm sát (cấp trên) là bắt buộc.");
  if (!form.agency.name) errors.push("Tên Viện kiểm sát là bắt buộc.");
  if (!form.document.documentCode) errors.push("Số biên bản là bắt buộc.");
  if (!form.confrontation.caseTitle) errors.push("Tên vụ án là bắt buộc.");
  if (!form.confrontation.participantA.name) errors.push("Tên người tham gia A là bắt buộc.");
  if (!form.confrontation.participantB.name) errors.push("Tên người tham gia B là bắt buộc.");
  if (!form.participants.investigatorName) errors.push("Tên điều tra viên là bắt buộc.");
  return errors;
}

function buildSaveBody(form: Bm136Form, documentId: string) {
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
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
  );
}

type RenderPayload = Record<string, any>;
type Bm136Props = { documentId: string; onSaved?: () => void | Promise<void> };

export function Bm136FormInputsPanel({ documentId, onSaved }: Bm136Props) {
  const [form, setForm] = useState<Bm136Form>(EMPTY);
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
        if (d?.confrontation) setForm((f) => ({ ...f, confrontation: { ...f.confrontation, ...d.confrontation } }));
        if (d?.participants) setForm((f) => ({ ...f, participants: { ...f.participants, ...d.participants } }));
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
      document: { documentCode: "136/BBĐC-VKSKV7", issuePlace: "Thành phố Hồ Chí Minh", issueDateIso: "2026-06-15" },
      confrontation: {
        caseTitle: "Vụ án hình sự ",
        offenseName: "Tội Cướp tài sản",
        confrontationTime: "14 giờ 00 phút, ngày 15/6/2026",
        confrontationLocation: "Tại trụ sở Cơ quan điều tra",
        participantA: { role: "Người làm chứng", name: "Trần Thị B", birthDate: "1990-01-01", address: "123 Đường ABC, Quận 1, TP.HCM" },
        participantB: { role: "Người bị tình nghi", name: "", birthDate: "1985-05-10", address: "456 Đường XYZ, Quận 3, TP.HCM" },
        subjectMatter: "Xác định thời gian và địa điểm xảy ra vụ cướp tài sản",
        statementA: "Tôi có mặt tại hiện trường vào khoảng 22 giờ ngày 01/6/2026 và nhìn thấy một người đàn ông cầm dao đe dọa nạn nhân.",
        statementB: "Tôi không có mặt tại hiện trường vào thời gian đó. Tôi đang ở nhà với gia đình.",
        discrepancyNote: "Người làm chứng Trần Thị B và người bị tình nghi  có mâu thuẫn về thời gian có mặt tại hiện trường. Người làm chứng khẳng định nhìn thấy rõ người bị tình nghi tại hiện trường, trong khi người bị tình nghi phủ nhận.",
        conclusionLine: "Kết quả đối chất cho thấy sự mâu thuẫn trong lời khai. Cần tiếp tục xác minh, thu thập thêm chứng cứ để xác định sự thật khách quan.",
      },
      participants: { investigatorName: "", investigatorPosition: "Kiểm sát viên", recordKeeperName: "Lê Văn B", recordKeeperPosition: "Điều tra viên" },
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
          <h2 className="text-lg font-bold text-slate-800">BM-136: Biên bản đối chất</h2>
          <p className="text-xs text-slate-500">Nhập dữ liệu cho biểu mẫu Biên bản đối chất</p>
        </div>
        <button onClick={fillSample} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Điền mẫu</button>
      </div>
      {errors.length > 0 && <div className="rounded-lg border border-red-200 bg-red-50 p-3">{errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}</div>}

      <SectionCard title="Cơ quan lập biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên Viện kiểm sát (cấp trên)">
            <Input value={form.agency.parentName} onChange={(v) => handleChange("agency.parentName", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN..." />
          </Field>
          <Field label="Tên Viện kiểm sát">
            <Input value={form.agency.name} onChange={(v) => handleChange("agency.name", v)} placeholder="VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC..." />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Thông tin biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Số biên bản"><Input value={form.document.documentCode} onChange={(v) => handleChange("document.documentCode", v)} placeholder="136/BBĐC-VKSKV7" /></Field>
          <Field label="Nơi lập"><Input value={form.document.issuePlace} onChange={(v) => handleChange("document.issuePlace", v)} placeholder="Thành phố Hồ Chí Minh" /></Field>
          <Field label="Ngày lập">
            <input type="date" value={form.document.issueDateIso?.slice(0, 10) ?? ""} onChange={(e) => handleChange("document.issueDateIso", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Thông tin đối chất">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên vụ án"><Input value={form.confrontation.caseTitle} onChange={(v) => handleChange("confrontation.caseTitle", v)} placeholder="Vụ án hình sự " /></Field>
          <Field label="Tội danh"><Input value={form.confrontation.offenseName} onChange={(v) => handleChange("confrontation.offenseName", v)} placeholder="Tội Cướp tài sản" /></Field>
          <Field label="Thời gian đối chất"><Input value={form.confrontation.confrontationTime} onChange={(v) => handleChange("confrontation.confrontationTime", v)} placeholder="14 giờ 00 phút, ngày 15/6/2026" /></Field>
          <Field label="Địa điểm đối chất"><Input value={form.confrontation.confrontationLocation} onChange={(v) => handleChange("confrontation.confrontationLocation", v)} placeholder="Tại trụ sở Cơ quan điều tra" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Người tham gia A">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Vai trò"><Input value={form.confrontation.participantA.role} onChange={(v) => handleChange("confrontation.participantA.role", v)} placeholder="Người làm chứng" /></Field>
          <Field label="Họ và tên"><Input value={form.confrontation.participantA.name} onChange={(v) => handleChange("confrontation.participantA.name", v)} placeholder="Trần Thị B" /></Field>
          <Field label="Ngày sinh"><input type="date" value={form.confrontation.participantA.birthDate?.slice(0, 10) ?? ""} onChange={(e) => handleChange("confrontation.participantA.birthDate", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></Field>
          <Field label="Địa chỉ"><Input value={form.confrontation.participantA.address} onChange={(v) => handleChange("confrontation.participantA.address", v)} placeholder="123 Đường ABC, Quận 1, TP.HCM" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Người tham gia B">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Vai trò"><Input value={form.confrontation.participantB.role} onChange={(v) => handleChange("confrontation.participantB.role", v)} placeholder="Người bị tình nghi" /></Field>
          <Field label="Họ và tên"><Input value={form.confrontation.participantB.name} onChange={(v) => handleChange("confrontation.participantB.name", v)} placeholder="" /></Field>
          <Field label="Ngày sinh"><input type="date" value={form.confrontation.participantB.birthDate?.slice(0, 10) ?? ""} onChange={(e) => handleChange("confrontation.participantB.birthDate", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></Field>
          <Field label="Địa chỉ"><Input value={form.confrontation.participantB.address} onChange={(v) => handleChange("confrontation.participantB.address", v)} placeholder="456 Đường XYZ, Quận 3, TP.HCM" /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Nội dung đối chất">
        <Field label="Vấn đề đối chất"><Input value={form.confrontation.subjectMatter} onChange={(v) => handleChange("confrontation.subjectMatter", v)} placeholder="Xác định thời gian và địa điểm xảy ra vụ cướp" /></Field>
        <Field label="Lời khai người A">
          <textarea value={form.confrontation.statementA} onChange={(e) => handleChange("confrontation.statementA", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tôi có mặt tại hiện trường..." />
        </Field>
        <Field label="Lời khai người B">
          <textarea value={form.confrontation.statementB} onChange={(e) => handleChange("confrontation.statementB", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tôi không có mặt tại hiện trường..." />
        </Field>
        <Field label="Ghi nhận mâu thuẫn">
          <textarea value={form.confrontation.discrepancyNote} onChange={(e) => handleChange("confrontation.discrepancyNote", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Người làm chứng và người bị tình nghi có mâu thuẫn..." />
        </Field>
        <Field label="Kết luận"><Input value={form.confrontation.conclusionLine} onChange={(v) => handleChange("confrontation.conclusionLine", v)} placeholder="Kết quả đối chất cho thấy sự mâu thuẫn..." /></Field>
      </SectionCard>

      <SectionCard title="Người lập biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên điều tra viên"><Input value={form.participants.investigatorName} onChange={(v) => handleChange("participants.investigatorName", v)} placeholder="" /></Field>
          <Field label="Chức vụ"><Input value={form.participants.investigatorPosition} onChange={(v) => handleChange("participants.investigatorPosition", v)} placeholder="Kiểm sát viên" /></Field>
          <Field label="Tên người ghi biên bản"><Input value={form.participants.recordKeeperName} onChange={(v) => handleChange("participants.recordKeeperName", v)} placeholder="Lê Văn B" /></Field>
          <Field label="Chức vụ người ghi"><Input value={form.participants.recordKeeperPosition} onChange={(v) => handleChange("participants.recordKeeperPosition", v)} placeholder="Điều tra viên" /></Field>
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
