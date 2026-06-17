"use client";
import { useEffect, useMemo, useState } from "react";
import { Bm053FormInputsPanel } from "@/components/documents/bm-053-form-inputs";
import { Bm054FormInputsPanel } from "@/components/documents/bm-054-form-inputs";
import { Bm055FormInputsPanel } from "@/components/documents/bm-055-form-inputs";
import { Bm056FormInputsPanel } from "@/components/documents/bm-056-form-inputs";
import { Bm057FormInputsPanel } from "@/components/documents/bm-057-form-inputs";
import { Bm058FormInputsPanel } from "@/components/documents/bm-058-form-inputs";
import { Bm059FormInputsPanel } from "@/components/documents/bm-059-form-inputs";
import { Bm070FormInputsPanel } from "@/components/documents/bm-070-form-inputs";
import { Bm071FormInputsPanel } from "@/components/documents/bm-071-form-inputs";
import { Bm103FormInputsPanel } from "@/components/documents/bm-103-form-inputs";
import { Bm104FormInputsPanel } from "@/components/documents/bm-104-form-inputs";
import { Bm001FormInputsPanel } from "@/components/documents/bm-001-form-inputs";
import { Bm023FormInputsPanel } from "@/components/documents/bm-023-form-inputs";
import { Bm090FormInputsPanel } from "@/components/documents/bm-090-form-inputs";
import { Bm097FormInputsPanel } from "@/components/documents/bm-097-form-inputs";
import { Bm141FormInputsPanel } from "@/components/documents/bm-141-form-inputs";
import { Bm144FormInputsPanel } from "@/components/documents/bm-144-form-inputs";
import { Bm145FormInputsPanel } from "@/components/documents/bm-145-form-inputs";
import { Bm146FormInputsPanel } from "@/components/documents/bm-146-form-inputs";
import { Bm156FormInputsPanel } from "@/components/documents/bm-156-form-inputs";
import { GeneratedDocumentActionPanel } from "@/components/documents/generated-document-action-panel";
import { Bm150FormInputsPanel } from './bm-150-form-inputs';

type GeneratedDocumentWorkspaceProps = {
  documentId: string;
};

type TabKey = "form" | "files" | "history";

type RenderPayloadResponse = {
  document?: {
    id?: string | null;
    documentTitle?: string | null;
    documentCode?: string | null;
    targetScope?: string | null;
    reviewStatus?: string | null;
  } | null;
  template?: {
    id?: string | null;
    templateCode?: string | null;
    templateNo?: string | null;
    templateName?: string | null;
    renderScope?: string | null;
    outputStrategy?: string | null;
  } | null;
  case?: {
    caseCode?: string | null;
    caseTitle?: string | null;
  } | null;
  person?: {
    fullName?: string | null;
  } | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const TABS: Array<{
  key: TabKey;
  label: string;
  description: string;
}> = [
    {
      key: "form",
      label: "Dữ liệu biểu mẫu",
      description: "Nhập dữ liệu riêng theo từng loại biểu mẫu",
    },
    {
      key: "files",
      label: "File đã xuất",
      description: "Render DOCX, xuất PDF và tải file",
    },
    {
      key: "history",
      label: "Lịch sử xử lý",
      description: "Theo dõi các lần lưu/render/convert",
    },
  ];

function getTemplateDescription(templateCode: string | null | undefined) {
  switch (templateCode) {
    case "BM-001":
      return "Form nhập dữ liệu riêng cho Biên bản tiếp nhận nguồn tin về tội phạm. Dữ liệu gồm cơ quan lập biên bản, thời gian tiếp nhận, người tiếp nhận, người cung cấp nguồn tin, nội dung nguồn tin, tài liệu giao nộp và chữ ký.";
    case "BM-023":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố vụ án hình sự. Dữ liệu gồm số quyết định, căn cứ pháp lý, nội dung vụ việc, tội danh, yêu cầu điều tra, nơi nhận và chữ ký.";
    case "BM-053":
      return "Form nhập dữ liệu riêng cho Lệnh cấm đi khỏi nơi cư trú. Dữ liệu được lưu trước, sau đó mới render DOCX/PDF để đảm bảo biểu mẫu xuất ra đúng nghiệp vụ.";
    case "BM-055":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú. Dữ liệu gồm số quyết định, căn cứ lệnh cấm, lý do hủy bỏ, thông tin bị can, nơi nhận và chữ ký.";
    case "BM-056":
      return "Form nhập dữ liệu riêng cho Quyết định tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, thông tin người bị tạm hoãn xuất cảnh, thời hạn tạm hoãn, cơ quan quản lý xuất nhập cảnh, nơi nhận và chữ ký.";
    case "BM-057":
      return "Form nhập dữ liệu riêng cho Quyết định hủy bỏ biện pháp tạm hoãn xuất cảnh. Dữ liệu gồm số quyết định, căn cứ quyết định tạm hoãn xuất cảnh, lý do hủy bỏ, thông tin người liên quan, nơi nhận và chữ ký.";
    case "BM-058":
      return "Form nhập dữ liệu riêng cho Lệnh tạm giam. Dữ liệu gồm số lệnh, căn cứ khởi tố vụ án/bị can, thời hạn tạm giam, đơn vị thi hành, thông tin bị can, nơi nhận, giao nhận lệnh và chữ ký.";
    case "BM-059":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn tạm giam để truy tố. Dữ liệu gồm số quyết định, căn cứ lệnh tạm giam, căn cứ gia hạn truy tố, thời hạn gia hạn, cơ sở giam giữ, thông tin bị can, nơi nhận, giao nhận quyết định và chữ ký.";
    case "BM-071":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Kiểm sát viên/Kiểm tra viên thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự.";
    case "BM-103":
      return "Form nhập dữ liệu riêng cho Đề nghị gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-104":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn điều tra vụ án hình sự.";
    case "BM-141":
      return "Form nhập dữ liệu riêng cho Quyết định chuyển vụ án hình sự để truy tố theo thẩm quyền. Dữ liệu gồm căn cứ khởi tố, bản kết luận điều tra, Viện kiểm sát nhận hồ sơ, nơi nhận và chữ ký.";
    case "BM-144":
      return "Form nhập dữ liệu riêng cho Quyết định gia hạn thời hạn quyết định việc truy tố. Dữ liệu gồm căn cứ khởi tố, kết luận điều tra, lý do gia hạn, thời hạn gia hạn, nơi nhận và chữ ký.";
    case "BM-145":
      return "Form nhập dữ liệu riêng cho Quyết định trả hồ sơ vụ án để điều tra bổ sung. Dữ liệu gồm căn cứ pháp lý, bản kết luận điều tra, quyết định trả hồ sơ của Tòa án nếu có, lý do điều tra bổ sung, nội dung Điều 1/2/3, nơi nhận và chữ ký.";
    case "BM-070":
      return "Form nhập dữ liệu riêng cho Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự. Dữ liệu gồm người được phân công, căn cứ khởi tố vụ án, căn cứ pháp lý, nơi nhận và chữ ký.";
    case "BM-097":
      return "Form nhập dữ liệu riêng cho Quyết định khởi tố bị can. Dữ liệu gồm thông tin bị can, căn cứ khởi tố vụ án, tội danh, hành vi, cơ quan điều tra, nơi nhận và chữ ký.";
    case "BM-090":
      return "Form nhập dữ liệu riêng cho Quyết định phê chuẩn Quyết định khởi tố bị can.";
    case "BM-146":
      return "Form nhập dữ liệu riêng cho Quyết định tạm đình chỉ vụ án hình sự. Dữ liệu gồm căn cứ tố tụng, căn cứ khởi tố vụ án, lý do tạm đình chỉ, nội dung Điều 1-4, nơi nhận và chữ ký.";
    default:
      return "Workspace xử lý dữ liệu biểu mẫu, render DOCX/PDF và quản lý file đã xuất.";
  }
}

function UnsupportedTemplateFormPanel({
  templateCode,
  templateName,
}: {
  templateCode: string;
  templateName: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
        Chưa có form nhập liệu riêng
      </p>

      <h2 className="mt-2 text-xl font-bold text-amber-950">
        {templateCode} — {templateName}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-900">
        Biểu mẫu này đã có thể dùng payload/backend để render nếu template DOCX
        đã được cấy placeholder, nhưng frontend chưa có form nhập liệu riêng.
        Không được hiển thị nhầm form BM-053 ở đây.
      </p>
    </section>
  );
}

export function GeneratedDocumentWorkspace({
  documentId,
}: GeneratedDocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("form");
  const [refreshKey, setRefreshKey] = useState(0);
  const [payload, setPayload] = useState<RenderPayloadResponse | null>(null);
  const [isLoadingPayload, setIsLoadingPayload] = useState(true);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPayload() {
      try {
        setIsLoadingPayload(true);
        setPayloadError(null);

        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || `Không tải được payload biểu mẫu. HTTP ${response.status}`,
          );
        }

        const data = (await response.json()) as RenderPayloadResponse;

        if (isMounted) {
          setPayload(data);
        }
      } catch (error) {
        if (isMounted) {
          setPayloadError(
            error instanceof Error
              ? error.message
              : "Không tải được payload biểu mẫu.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingPayload(false);
        }
      }
    }

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, [documentId, refreshKey]);

  const templateCode = payload?.template?.templateCode ?? "UNKNOWN";
  const templateNo = payload?.template?.templateNo?.trim() ?? "";
  const templateName = payload?.template?.templateName ?? "Chưa xác định";
  const documentCode = payload?.document?.documentCode?.trim() ?? "";
  const caseCode = payload?.case?.caseCode?.trim() ?? "";
  const caseTitle = payload?.case?.caseTitle?.trim() ?? "";
  const personName = payload?.person?.fullName?.trim() ?? "";

  const canonicalPageTitle = templateNo
    ? `Mẫu số ${templateNo} - ${templateName}`
    : `${templateCode} - ${templateName}`.trim();

  const headerContextItems = [
    caseCode ? `Hồ sơ: ${caseCode}` : "",
    caseTitle ? `Tên vụ án: ${caseTitle}` : "",
    personName ? `Người liên quan: ${personName}` : "Cấp hồ sơ",
    documentCode ? `Số văn bản: ${documentCode}` : "",
  ].filter((value) => value.length > 0);

  const headerDescription = useMemo(
    () => getTemplateDescription(templateCode),
    [templateCode],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            QUANLYVKS / Generated Document
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                  {templateCode}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {payload?.template?.renderScope ?? "UNKNOWN_SCOPE"}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                {isLoadingPayload ? "Đang tải biểu mẫu..." : canonicalPageTitle}
              </h1>

              {!isLoadingPayload && headerContextItems.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {headerContextItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {headerDescription}
              </p>

              {payloadError ? (
                <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {payloadError}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Document ID</span>
              <div className="mt-1 font-mono text-base font-bold text-slate-950">
                #{documentId}
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    isActive
                      ? "rounded-2xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm"
                      : "rounded-2xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span
                    className={
                      isActive
                        ? "mt-1 block text-xs text-slate-300"
                        : "mt-1 block text-xs text-slate-500"
                    }
                  >
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "form" ? (
          <>
            {isLoadingPayload ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">
                  Đang tải dữ liệu biểu mẫu...
                </p>
              </section>
            ) : null}

            {!isLoadingPayload && templateCode === "BM-001" ? (
              <Bm001FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-023" ? (
              <Bm023FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-053" ? (
              <Bm053FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-054" ? (
              <Bm054FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-055" ? (
              <Bm055FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-056" ? (
              <Bm056FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-057" ? (
              <Bm057FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-058" ? (
              <Bm058FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-059" ? (
              <Bm059FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-071" ? (
              <Bm071FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-103" ? (
              <Bm103FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-104" ? (
              <Bm104FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-070" ? (
              <Bm070FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-144" ? (
              <Bm144FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}
            {!isLoadingPayload && templateCode === "BM-145" ? (
              <Bm145FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-146" ? (
              <Bm146FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-150" ? (
              <Bm150FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}



            {!isLoadingPayload && templateCode === "BM-141" ? (
              <Bm141FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-156" ? (
              <Bm156FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-090" ? (
              <Bm090FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload && templateCode === "BM-097" ? (
              <Bm097FormInputsPanel
                documentId={documentId}
                onSaved={() => setRefreshKey((current) => current + 1)}
              />
            ) : null}

            {!isLoadingPayload &&
              templateCode !== "BM-001" &&
              templateCode !== "BM-023" &&
              templateCode !== "BM-053" &&
              templateCode !== "BM-054" &&
              templateCode !== "BM-055" &&
              templateCode !== "BM-056" &&
              templateCode !== "BM-057" &&
              templateCode !== "BM-058" &&
              templateCode !== "BM-059" &&
              templateCode !== "BM-070" &&
              templateCode !== "BM-071" &&
              templateCode !== "BM-090" &&
              templateCode !== "BM-097" &&
              templateCode !== "BM-103" &&
              templateCode !== "BM-104" &&
              templateCode !== "BM-141" &&
              templateCode !== "BM-144" &&
              templateCode !== "BM-145" &&
              templateCode !== "BM-146" &&
              templateCode !== "BM-150" &&
              templateCode !== "BM-156" ? (
              <UnsupportedTemplateFormPanel
                templateCode={templateCode}
                templateName={templateName}
              />
            ) : null}
          </>
        ) : null}

        {activeTab === "files" ? (
          <GeneratedDocumentActionPanel
            key={`document-files-${refreshKey}`}
            documentId={documentId}
          />
        ) : null}

        {activeTab === "history" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              Lịch sử xử lý
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tab này để phase sau nối dữ liệu từ audit log / document generation
              batch. Hiện tại luồng chính cần test là: nhập dữ liệu → lưu
              formInputs → render DOCX → convert PDF → tải file.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}


