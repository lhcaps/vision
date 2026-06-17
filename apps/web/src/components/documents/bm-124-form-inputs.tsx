"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type Bm124Form = {
  agency: { parentName: string; name: string };
  document: { documentCode: string; issuePlace: string; issueDateIso: string };
  experiment: {
    experimentDecisionCode: string;
    experimentDecisionDate: string;
    experimentDecisionAgency: string;
    experimentTime: string;
    experimentLocation: string;
    caseTitle: string;
    offenseName: string;
    participantList: string;
    experimentContent: string;
    observationNotes: string;
    conclusionLine: string;
  };
  participants: {
    investigatorName: string;
    investigatorPosition: string;
    investigatorSignature: string;
    recordKeeperName: string;
    recordKeeperPosition: string;
  };
};

const EMPTY: Bm124Form = {
  agency: { parentName: "", name: "" },
  document: { documentCode: "", issuePlace: "", issueDateIso: "" },
  experiment: {
    experimentDecisionCode: "",
    experimentDecisionDate: "",
    experimentDecisionAgency: "",
    experimentTime: "",
    experimentLocation: "",
    caseTitle: "",
    offenseName: "",
    participantList: "",
    experimentContent: "",
    observationNotes: "",
    conclusionLine: "",
  },
  participants: {
    investigatorName: "",
    investigatorPosition: "",
    investigatorSignature: "",
    recordKeeperName: "",
    recordKeeperPosition: "",
  },
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function parseDateToIso(val: string): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function normalizeFormInputs(form: Bm124Form): Bm124Form {
  return {
    ...form,
    document: { ...form.document, issueDateIso: parseDateToIso(form.document.issueDateIso as unknown as string) },
    experiment: { ...form.experiment, experimentDecisionDate: parseDateToIso(form.experiment.experimentDecisionDate as unknown as string) },
  };
}

function validateForm(form: Bm124Form): string[] {
  const errors: string[] = [];
  if (!form.agency.parentName) errors.push("Tên Viện kiểm sát (cấp trên) là bắt buộc.");
  if (!form.agency.name) errors.push("Tên Viện kiểm sát là bắt buộc.");
  if (!form.document.documentCode) errors.push("Số biên bản là bắt buộc.");
  if (!form.experiment.experimentDecisionCode) errors.push("Số quyết định thực nghiệm là bắt buộc.");
  if (!form.experiment.caseTitle) errors.push("Tên vụ án là bắt buộc.");
  if (!form.participants.investigatorName) errors.push("Tên điều tra viên là bắt buộc.");
  return errors;
}

function buildSaveBody(form: Bm124Form, documentId: string) {
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
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

type RenderPayload = Record<string, any>;

type Bm124Props = { documentId: string; onSaved?: () => void | Promise<void> };

export function Bm124FormInputsPanel({ documentId, onSaved }: Bm124Props) {
  const [form, setForm] = useState<Bm124Form>(EMPTY);
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
        if (d?.experiment) setForm((f) => ({ ...f, experiment: { ...f.experiment, ...d.experiment } }));
        if (d?.participants) setForm((f) => ({ ...f, participants: { ...f.participants, ...d.participants } }));
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
      document: { documentCode: "124/BB-VKSKV7", issuePlace: "Thành phố Hồ Chí Minh", issueDateIso: "2026-06-15" },
      experiment: {
        experimentDecisionCode: "123/QĐ-VKSKV7",
        experimentDecisionDate: "2026-06-01",
        experimentDecisionAgency: "Viện kiểm sát",
        experimentTime: "08 giờ 30 phút, ngày 15/6/2026",
        experimentLocation: "Tại hiện trường vụ cướp - 123 Đường ABC, Quận 1, TP.HCM",
        caseTitle: "Vụ án hình sự ",
        offenseName: "Tội Cướp tài sản",
        participantList: "1. Kiểm sát viên  (chủ trì)\n2. Điều tra viên Lê Văn B (ghi biên bản)\n3. Người bị tình nghi \n4. Đại diện chính quyền địa phương",
        experimentContent: "Tiến hành mô phỏng lại toàn bộ hành vi cướp tài sản tại hiện trường. Người bị tình nghi thực hiện lại hành vi theo đúng quy trình đã được ghi nhận trong hồ sơ vụ án.",
        observationNotes: "Quá trình thực nghiệm diễn ra đúng như mô tả trong lời khai của người bị tình nghi. Không có mâu thuẫn giữa lời khai và hiện trường thực tế. Tang vật được xác nhận đúng với mô tả.",
        conclusionLine: "Kết quả thực nghiệm điều tra phù hợp với các chứng cứ đã thu thập, xác nhận tính xác thực của lời khai người bị tình nghi.",
      },
      participants: {
        investigatorName: "",
        investigatorPosition: "Kiểm sát viên",
        investigatorSignature: "",
        recordKeeperName: "Lê Văn B",
        recordKeeperPosition: "Điều tra viên",
      },
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
          <h2 className="text-lg font-bold text-slate-800">BM-124: Biên bản thực nghiệm điều tra</h2>
          <p className="text-xs text-slate-500">Nhập dữ liệu cho biểu mẫu Biên bản thực nghiệm điều tra</p>
        </div>
        <button onClick={fillSample} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">Điền mẫu</button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

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
          <Field label="Số biên bản">
            <Input value={form.document.documentCode} onChange={(v) => handleChange("document.documentCode", v)} placeholder="124/BB-VKSKV7" />
          </Field>
          <Field label="Nơi lập">
            <Input value={form.document.issuePlace} onChange={(v) => handleChange("document.issuePlace", v)} placeholder="Thành phố Hồ Chí Minh" />
          </Field>
          <Field label="Ngày lập">
            <input type="date" value={form.document.issueDateIso?.slice(0, 10) ?? ""} onChange={(e) => handleChange("document.issueDateIso", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Nội dung thực nghiệm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Số quyết định thực nghiệm">
            <Input value={form.experiment.experimentDecisionCode} onChange={(v) => handleChange("experiment.experimentDecisionCode", v)} placeholder="123/QĐ-VKSKV7" />
          </Field>
          <Field label="Ngày quyết định">
            <input type="date" value={form.experiment.experimentDecisionDate?.slice(0, 10) ?? ""} onChange={(e) => handleChange("experiment.experimentDecisionDate", e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </Field>
          <Field label="Cơ quan ban hành">
            <Input value={form.experiment.experimentDecisionAgency} onChange={(v) => handleChange("experiment.experimentDecisionAgency", v)} placeholder="Viện kiểm sát" />
          </Field>
        </div>
        <Field label="Thời gian thực nghiệm">
          <Input value={form.experiment.experimentTime} onChange={(v) => handleChange("experiment.experimentTime", v)} placeholder="08 giờ 30 phút, ngày 15/6/2026" />
        </Field>
        <Field label="Địa điểm thực nghiệm">
          <Input value={form.experiment.experimentLocation} onChange={(v) => handleChange("experiment.experimentLocation", v)} placeholder="Tại hiện trường vụ cướp - 123 Đường ABC, Quận 1, TP.HCM" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên vụ án">
            <Input value={form.experiment.caseTitle} onChange={(v) => handleChange("experiment.caseTitle", v)} placeholder="Vụ án hình sự " />
          </Field>
          <Field label="Tội danh">
            <Input value={form.experiment.offenseName} onChange={(v) => handleChange("experiment.offenseName", v)} placeholder="Tội Cướp tài sản" />
          </Field>
        </div>
        <Field label="Danh sách người tham dự">
          <textarea value={form.experiment.participantList} onChange={(e) => handleChange("experiment.participantList", e.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="1. Kiểm sát viên...\n2. Điều tra viên..." />
        </Field>
        <Field label="Nội dung thực nghiệm">
          <textarea value={form.experiment.experimentContent} onChange={(e) => handleChange("experiment.experimentContent", e.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tiến hành mô phỏng lại hành vi..." />
        </Field>
        <Field label="Ghi chú quan sát">
          <textarea value={form.experiment.observationNotes} onChange={(e) => handleChange("experiment.observationNotes", e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Quá trình thực nghiệm diễn ra..." />
        </Field>
        <Field label="Kết luận">
          <Input value={form.experiment.conclusionLine} onChange={(v) => handleChange("experiment.conclusionLine", v)} placeholder="Kết quả thực nghiệm điều tra phù hợp với các chứng cứ..." />
        </Field>
      </SectionCard>

      <SectionCard title="Người lập biên bản">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên điều tra viên">
            <Input value={form.participants.investigatorName} onChange={(v) => handleChange("participants.investigatorName", v)} placeholder="" />
          </Field>
          <Field label="Chức vụ điều tra viên">
            <Input value={form.participants.investigatorPosition} onChange={(v) => handleChange("participants.investigatorPosition", v)} placeholder="Kiểm sát viên" />
          </Field>
          <Field label="Tên người ghi biên bản">
            <Input value={form.participants.recordKeeperName} onChange={(v) => handleChange("participants.recordKeeperName", v)} placeholder="Lê Văn B" />
          </Field>
          <Field label="Chức vụ người ghi">
            <Input value={form.participants.recordKeeperPosition} onChange={(v) => handleChange("participants.recordKeeperPosition", v)} placeholder="Điều tra viên" />
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
