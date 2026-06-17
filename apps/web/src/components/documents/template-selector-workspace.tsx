"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function clearTemplateSelectorTextInputs(target: EventTarget | null) {
  if (typeof window === 'undefined') {
    return;
  }

  const anchor = target instanceof HTMLElement ? target : null;
  const root =
    anchor?.closest('main') ??
    anchor?.closest('section') ??
    document.body;

  const setNativeValue = (
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
  ) => {
    const prototype =
      element instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const fields = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    [
      'input:not([type])',
      'input[type="text"]',
      'input[type="search"]',
      'textarea',
    ].join(','),
  );

  fields.forEach((field) => {
    if (field.disabled || field.readOnly) {
      return;
    }

    setNativeValue(field, '');
  });
}

import {
  templateCatalogMeta,
  vksTemplateCatalog,
  vksTemplateStages,
  type VksTemplateItem,
} from "@/lib/vks-template-catalog";
import {
  evaluateRecommendationRule,
  getTemplateRecommendationRule,
} from "@/lib/template-recommendation-rules";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE: Record<string, string> = {};

type AvailableTemplate = {
  id: string;
  templateCode: string;
  templateNo: string | null;
  templateName: string;
  renderScope: string;
  outputStrategy: string;
  stageCode: string | null;
  requiresReview: boolean;
  targetMode: string;
  group: {
    id: string;
    groupCode: string;
    groupName: string;
    groupOrder: number;
  } | null;
};

type AvailableTemplatesResponse = {
  case: {
    id: string;
    caseCode: string;
    caseTitle: string;
    currentStage: string;
    currentStatus: string;
  };
  targets: {
    people: Array<{
      casePersonId: string;
      personId: string;
      roleType: string;
      legalStatus: string;
      isPrimary: boolean;
      personOrder: number;
      fullName: string | null;
      birthYear: number | null;
      residenceAddress: string | null;
    }>;
  };
  templates: AvailableTemplate[];
};

type CaseListResponse = {
  items: Array<{
    id: string;
    caseCode: string;
    caseTitle: string;
  }>;
};

type GeneratedDocumentSummary = {
  id: string;
  templateCode: string | null;
  templateNo: string | null;
  templateName: string | null;
  documentCode: string | null;
  documentTitle: string;
  targetScope: string;
  targetPersonId: string | null;
  reviewStatus: string;
};

type SingleCreateResult = {
  id: string;
  batchCode: string;
  totalDocuments: number;
  successDocuments: number;
  failedDocuments: number;
  documents: GeneratedDocumentSummary[];
};

type SuggestInput = {
  quickText: string;
  offenseName: string;
  legalArticle: string;
  personName: string;
  processNeed: string;
  stageId: string;
  onlyCreatable: boolean;
};

type Candidate = VksTemplateItem & {
  dbTemplateId: string | null;
  backendTemplateName: string | null;
  renderScope: string | null;
  targetMode: string | null;
  canCreate: boolean;
  score: number;
  reasons: string[];
};

const NEED_OPTIONS = [
  {
    value: "",
    label: "Tất cả nhu cầu",
  },
  {
    value: "nguon tin tiep nhan to giac tin bao",
    label: "Tiếp nhận/giải quyết nguồn tin",
  },
  {
    value: "khoi to vu an khong khoi to huy bo thay doi bo sung",
    label: "Khởi tố vụ án",
  },
  {
    value: "cam di khoi noi cu tru tam hoan xuat canh tam giam ngan chan",
    label: "Biện pháp ngăn chặn/cưỡng chế",
  },
  {
    value: "phan cong vien truong pho vien truong kiem sat vien",
    label: "Phân công người tiến hành tố tụng",
  },
  {
    value: "khoi to bi can phe chuan dieu tra",
    label: "Khởi tố bị can / điều tra",
  },
  {
    value: "gia han dieu tra thoi han dieu tra",
    label: "Gia hạn thời hạn điều tra",
  },
  {
    value: "truy to cao trang",
    label: "Truy tố / cáo trạng",
  },
];

const IMPLEMENTED_PRIORITY = new Set([
  "BM-001",
  "BM-023",
  "BM-053",
  "BM-054",
  "BM-055",
  "BM-056",
  "BM-057",
  "BM-058",
  "BM-059",
  "BM-090",
  "BM-097",
  "BM-156",
  "BM-070",
  "BM-071",
  "BM-103",
  "BM-104",
]);

function normalizeSearchText(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueWords(value: string) {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(" ")
        .map((item) => item.trim())
        .filter((item) => item.length >= 2),
    ),
  );
}

function containsAny(corpus: string, words: string[]) {
  return words.some((word) => corpus.includes(word));
}

function TemplateStatusBadge({ item }: { item: Candidate }) {
  if (item.canCreate || GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[item.code]) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
        Có thể mở
      </span>
    );
  }

  if (item.isImplemented) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
        Có FE nhưng chưa có DB
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
      Chưa triển khai
    </span>
  );
}

function scoreTemplate(
  item: VksTemplateItem,
  input: SuggestInput,
  availableTemplate: AvailableTemplate | undefined,
): Candidate {
  const corpus = normalizeSearchText(
    [
      item.code,
      item.number,
      item.title,
      item.stageLabel,
      item.stageDescription,
      item.fileName,
      item.sourcePath,
      availableTemplate?.templateName,
      availableTemplate?.targetMode,
    ].join(" "),
  );

  const quickWords = uniqueWords(input.quickText);
  const offenseWords = uniqueWords(input.offenseName);
  const articleWords = uniqueWords(input.legalArticle);
  const personWords = uniqueWords(input.personName);
  const needWords = uniqueWords(input.processNeed);

  const reasons: string[] = [];
  let score = 0;

  const recommendationRule = getTemplateRecommendationRule(item.code);
  const ruleEvaluation = evaluateRecommendationRule(
    recommendationRule,
    input,
    Boolean(availableTemplate),
  );

  score += ruleEvaluation.score;
  reasons.push(...ruleEvaluation.reasons);

  if (input.stageId && item.stageId === input.stageId) {
    score += 28;
    reasons.push(`Đúng giai đoạn ${item.stageNo}`);
  }

  const quickHits = quickWords.filter((word) => corpus.includes(word));
  if (quickHits.length > 0) {
    score += Math.min(quickHits.length * 5, 35);
    reasons.push(`Khớp nội dung nhập: ${quickHits.slice(0, 5).join(", ")}`);
  }

  if (offenseWords.length > 0) {
    if (containsAny(corpus, ["khoi", "to", "bi", "can", "cao", "trang", "truy", "to", "vu", "an"])) {
      score += 8;
      reasons.push("Có liên quan tội danh/vụ án");
    }
  }

  if (articleWords.length > 0) {
    if (containsAny(corpus, ["khoi", "to", "phe", "chuan", "cao", "trang", "truy", "to"])) {
      score += 6;
      reasons.push("Có thể dùng điều luật/tội danh");
    }
  }

  if (personWords.length > 0) {
    if (availableTemplate?.renderScope === "PERSON_LEVEL" || availableTemplate?.renderScope === "SELECTED_PERSONS") {
      score += 10;
      reasons.push("Biểu mẫu cấp người liên quan/bị can");
    }
  }

  const needHits = needWords.filter((word) => corpus.includes(word));
  if (needHits.length > 0) {
    score += Math.min(needHits.length * 6, 42);
    reasons.push(`Khớp nhu cầu nghiệp vụ: ${needHits.slice(0, 5).join(", ")}`);
  }

  if (item.isImplemented || IMPLEMENTED_PRIORITY.has(item.code)) {
    score += 6;
  }

  if (availableTemplate) {
    score += 12;
    reasons.push("Đã có trong DB, có thể mở hoặc tạo document đơn");
  }

  const exactNeedBoosts: Array<[RegExp, string[], string]> = [
    [/cam di khoi noi cu tru|cu tru|cam di/i, ["BM-053", "BM-054", "BM-055"], "Nhóm cấm đi khỏi nơi cư trú"],
    [/tam hoan xuat canh|xuat canh/i, ["BM-056", "BM-057"], "Nhóm tạm hoãn xuất cảnh"],
    [/tam giam|gia han tam giam/i, ["BM-058", "BM-059"], "Nhóm tạm giam"],
    [/khoi to vu an/i, ["BM-023"], "Khởi tố vụ án hình sự"],
    [/khoi to bi can/i, ["BM-090", "BM-097"], "Khởi tố bị can"],
    [/gia han dieu tra/i, ["BM-103", "BM-104"], "Gia hạn thời hạn điều tra"],
    [/cao trang|truy to/i, ["BM-156"], "Truy tố/Cáo trạng"],
    [/phan cong|pho vien truong|kiem sat vien/i, ["BM-070", "BM-071"], "Phân công người tiến hành tố tụng"],
    [/nguon tin|tiep nhan|to giac|tin bao/i, ["BM-001"], "Tiếp nhận nguồn tin về tội phạm"],
  ];

  const rawQuery = normalizeSearchText(
    `${input.quickText} ${input.offenseName} ${input.legalArticle} ${input.processNeed}`,
  );

  for (const [pattern, codes, reason] of exactNeedBoosts) {
    if (pattern.test(rawQuery) && codes.includes(item.code)) {
      score += 45;
      reasons.unshift(reason);
    }
  }

  if (!input.quickText.trim() && !input.offenseName.trim() && !input.legalArticle.trim() && !input.processNeed.trim() && !input.stageId) {
    score = availableTemplate ? 10 : item.isImplemented ? 6 : 1;
  }

  return {
    ...item,
    dbTemplateId: availableTemplate?.id ?? null,
    backendTemplateName: availableTemplate?.templateName ?? null,
    renderScope: availableTemplate?.renderScope ?? null,
    targetMode: availableTemplate?.targetMode ?? null,
    canCreate: Boolean(availableTemplate),
    score,
    reasons: reasons.length ? reasons : ["Hiển thị theo danh mục biểu mẫu"],
  };
}

function formatStageLabel(stageId: string) {
  const stage = vksTemplateStages.find((item) => item.id === stageId);

  if (!stage) {
    return "Tất cả giai đoạn";
  }

  return `${stage.order}. ${stage.label}`;
}

function shouldAttachTargetPerson(item: Candidate) {
  return item.renderScope === "PERSON_LEVEL" || item.renderScope === "SELECTED_PERSONS";
}

export function TemplateSelectorWorkspace() {
  const router = useRouter();
  const [availableData, setAvailableData] = useState<AvailableTemplatesResponse | null>(null);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [input, setInput] = useState<SuggestInput>({
    quickText: "",
    offenseName: "",
    legalArticle: "",
    personName: "",
    processNeed: "",
    stageId: "",
    onlyCreatable: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [openingTemplateCode, setOpeningTemplateCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showFullCatalog, setShowFullCatalog] = useState(true);

  async function loadAvailableTemplates() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      let selectedCaseId = currentCaseId;

      if (!selectedCaseId) {
        const casesResponse = await fetch(`${API_BASE_URL}/cases?pageSize=1`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!casesResponse.ok) {
          const body = await casesResponse.text();
          throw new Error(body || `Không tải được danh sách hồ sơ. HTTP ${casesResponse.status}`);
        }

        const casesData = (await casesResponse.json()) as CaseListResponse;
        selectedCaseId = casesData.items[0]?.id ?? null;
        setCurrentCaseId(selectedCaseId);
      }

      if (!selectedCaseId) {
        setAvailableData(null);
        throw new Error("Chưa có hồ sơ nào. Hãy tạo hồ sơ trước khi chọn biểu mẫu.");
      }

      const response = await fetch(
        `${API_BASE_URL}/documents/cases/${selectedCaseId}/available-templates`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Không tải được danh sách biểu mẫu. HTTP ${response.status}`);
      }

      const data = (await response.json()) as AvailableTemplatesResponse;
      setAvailableData(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách biểu mẫu có thể mở.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAvailableTemplates();
  }, []);

  const availableByCode = useMemo(() => {
    const map = new Map<string, AvailableTemplate>();

    for (const item of availableData?.templates ?? []) {
      map.set(item.templateCode, item);
    }

    return map;
  }, [availableData]);

  const candidates = useMemo(() => {
    return vksTemplateCatalog
      .map((item) => scoreTemplate(item, input, availableByCode.get(item.code)))
      .filter((item) => {
        const hasDirectDocument = Boolean(GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[item.code]);

        if (input.onlyCreatable && !item.canCreate && !hasDirectDocument) {
          return false;
        }

        if (input.stageId && item.stageId !== input.stageId) {
          return false;
        }

        return item.score > 0;
      })
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        const aOpenable = a.canCreate || Boolean(GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[a.code]);
        const bOpenable = b.canCreate || Boolean(GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[b.code]);

        if (aOpenable !== bOpenable) {
          return aOpenable ? -1 : 1;
        }

        return a.number - b.number;
      });
  }, [availableByCode, input]);

  const topCandidates = candidates.slice(0, 40);

  const openableCount = useMemo(() => {
    return topCandidates.filter((item) => item.canCreate || GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[item.code]).length;
  }, [topCandidates]);

  const groupedCatalog = useMemo(() => {
    return vksTemplateStages
      .map((stage) => {
        const items = vksTemplateCatalog
          .filter((template) => template.stageId === stage.id)
          .sort((a, b) => a.number - b.number);

        return {
          ...stage,
          items,
        };
      })
      .filter((stage) => stage.items.length > 0);
  }, []);

  const hasActiveSuggestionFilter = Boolean(
    input.quickText.trim() ||
      input.offenseName.trim() ||
      input.legalArticle.trim() ||
      input.personName.trim() ||
      input.processNeed.trim() ||
      input.stageId,
  );

  const visibleCatalogGroups = useMemo(() => {
    const candidateById = new Map(candidates.map((item) => [item.id, item]));

    return groupedCatalog
      .map((stage) => {
        const items = hasActiveSuggestionFilter
          ? stage.items
              .map((template) => candidateById.get(template.id))
              .filter((item): item is Candidate => Boolean(item))
          : stage.items.map((template) =>
              scoreTemplate(template, input, availableByCode.get(template.code)),
            );

        return {
          ...stage,
          items,
        };
      })
      .filter((stage) => stage.items.length > 0);
  }, [availableByCode, candidates, groupedCatalog, hasActiveSuggestionFilter, input]);

  function updateInput<Key extends keyof SuggestInput>(key: Key, value: SuggestInput[Key]) {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function openTemplate(item: Candidate) {
    setErrorMessage("");

    const directDocumentId = GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[item.code];

    if (directDocumentId) {
      router.push(`/documents/${directDocumentId}`);
      return;
    }

    if (!item.canCreate || !item.dbTemplateId) {
      setErrorMessage(
        `${item.code} chưa có documentId cố định hoặc DB template để mở trực tiếp. Cần tạo/mapping document cho biểu mẫu này trước.`,
      );
      return;
    }

    setOpeningTemplateCode(item.code);

    try {
      if (!currentCaseId) {
        throw new Error("Chưa có hồ sơ đang chọn để tạo biểu mẫu.");
      }

      const firstPersonId = availableData?.targets.people?.[0]?.personId ?? null;
      const targetPersonIds = shouldAttachTargetPerson(item) && firstPersonId ? [firstPersonId] : [];

      const response = await fetch(
        `${API_BASE_URL}/documents/cases/${currentCaseId}/batches`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            templateIds: [item.dbTemplateId],
            targetPersonIds,
            formats: ["DOCX", "PDF"],
            note: `Tạo document đơn từ màn hình chọn biểu mẫu. Template: ${item.code}. Dữ liệu đầu vào: ${[
              input.offenseName,
              input.legalArticle,
              input.personName,
              input.processNeed,
              input.quickText,
            ]
              .filter(Boolean)
              .join(" | ")}`,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Không tạo được document cho ${item.code}. HTTP ${response.status}`);
      }

      const data = (await response.json()) as SingleCreateResult;
      const generatedDocument =
        data.documents.find((document) => document.templateCode === item.code) ??
        data.documents[0];

      if (!generatedDocument?.id) {
        throw new Error(`Backend không trả về document id cho ${item.code}.`);
      }

      router.push(`/documents/${generatedDocument.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Không mở được biểu mẫu ${item.code}.`,
      );
    } finally {
      setOpeningTemplateCode(null);
    }
  }

  const caseInfo = availableData?.case;
  const firstPerson = availableData?.targets.people?.[0];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                QUANLYVKS / TEMPLATE SELECTOR
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Tìm kiếm và mở biểu mẫu
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Nhập dữ liệu đầu vào cơ bản như tội danh, điều luật, người liên quan,
                nhu cầu nghiệp vụ hoặc mô tả vụ việc. Hệ thống sẽ gợi ý biểu mẫu phù hợp.
                Khi bấm mở, người dùng được chuyển thẳng sang giao diện nhập dữ liệu của biểu mẫu đó.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAvailableTemplates}
              disabled={isLoading}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Đang tải..." : "Tải lại dữ liệu"}
            </button>

              <button
                type="button"
                onClick={(event) => clearTemplateSelectorTextInputs(event.currentTarget)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Xóa nội dung nhập
              </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Hồ sơ hiện tại</p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {caseInfo ? `${caseInfo.caseCode}` : "Chưa tải"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {caseInfo?.caseTitle ?? "Đang tải dữ liệu hồ sơ"}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase text-blue-700">Biểu mẫu trong DB</p>
              <p className="mt-2 text-2xl font-black text-blue-800">
                {availableData?.templates.length ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">Gợi ý phù hợp</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">
                {topCandidates.length}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase text-indigo-700">Có thể mở</p>
              <p className="mt-2 text-2xl font-black text-indigo-800">
                {openableCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Tội danh</span>
              <input
                value={input.offenseName}
                onChange={(event) => updateInput("offenseName", event.target.value)}
                placeholder="Ví dụ: Đánh bạc, Ma túy..."
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Điều luật</span>
              <input
                value={input.legalArticle}
                onChange={(event) => updateInput("legalArticle", event.target.value)}
                placeholder="Ví dụ: khoản 1 Điều 321"
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Người liên quan/bị can</span>
              <input
                value={input.personName}
                onChange={(event) => updateInput("personName", event.target.value)}
                placeholder={firstPerson?.fullName ?? "Nhập tên người liên quan"}
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Nhu cầu nghiệp vụ</span>
              <select
                value={input.processNeed}
                onChange={(event) => updateInput("processNeed", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {NEED_OPTIONS.map((item) => (
                  <option key={item.label} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-700">Giai đoạn biểu mẫu</span>
              <select
                value={input.stageId}
                onChange={(event) => updateInput("stageId", event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Tất cả giai đoạn</option>
                {vksTemplateStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.order}. {stage.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={input.onlyCreatable}
                onChange={(event) => updateInput("onlyCreatable", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm font-semibold text-slate-700">
                Chỉ hiện biểu mẫu đã có trong DB hoặc có document mapping để mở
              </span>
            </label>

            <label className="block space-y-1.5 lg:col-span-2">
              <span className="text-sm font-bold text-slate-700">Mô tả dữ liệu đầu vào / yêu cầu của khách</span>
              <textarea
                value={input.quickText}
                onChange={(event) => updateInput("quickText", event.target.value)}
                rows={4}
                placeholder="Ví dụ: Vụ án đánh bạc, cần khởi tố vụ án, khởi tố bị can, áp dụng cấm đi khỏi nơi cư trú, tạm giam hoặc cáo trạng..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Đang lọc: {formatStageLabel(input.stageId)}
            </span>

            <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
              Nguồn danh mục: {templateCatalogMeta.sourceZip}
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Danh sách tổng hợp biểu mẫu theo từng giai đoạn
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Khi chưa nhập dữ liệu lọc, danh mục sẽ hiện đầy đủ theo Thông tư 03/2026/TT-VKSTC.
                Khi đã nhập dữ liệu/gợi ý, khu vực này chỉ hiện các biểu mẫu phù hợp để dễ mở.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600">
                {hasActiveSuggestionFilter
                  ? `Đang hiện ${visibleCatalogGroups.reduce((sum, stage) => sum + stage.items.length, 0)} mẫu phù hợp`
                  : "Đang hiện toàn bộ danh mục"}
              </span>

              <button
                type="button"
                onClick={() => setShowFullCatalog((current) => !current)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {showFullCatalog ? "Ẩn danh mục tổng hợp" : "Hiện danh mục tổng hợp"}
              </button>
            </div>
          </div>

          {showFullCatalog ? (
            <div className="mt-6 space-y-6">
              {visibleCatalogGroups.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Giai đoạn {stage.order}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        {stage.label}
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                      {stage.items.length} biểu mẫu
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {stage.items.map((candidate) => {
                      const isOpening = openingTemplateCode === candidate.code;
                      const canOpen =
                        candidate.canCreate ||
                        Boolean(GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[candidate.code]);

                      return (
                        <article
                          key={candidate.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
                                  {candidate.code}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                  Mẫu số {candidate.number}
                                </span>
                              </div>

                              <h4 className="mt-3 text-sm font-black leading-5 text-slate-950">
                                {candidate.title}
                              </h4>

                              <div className="mt-3">
                                <TemplateStatusBadge item={candidate} />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => void openTemplate(candidate)}
                            disabled={!canOpen || isOpening}
                            className="mt-4 w-full rounded-2xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isOpening ? "Đang mở..." : "Mở biểu mẫu"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">
              Gợi ý biểu mẫu phù hợp
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              {topCandidates.length} kết quả
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
              Đang tải danh sách biểu mẫu...
            </div>
          ) : null}

          {!isLoading && topCandidates.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-lg font-black text-slate-950">
                Không tìm thấy biểu mẫu phù hợp
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Thử nhập từ khóa nghiệp vụ khác, hoặc tắt bộ lọc “Chỉ hiện biểu mẫu có thể mở”.
              </p>
            </div>
          ) : null}

          {topCandidates.map((item) => {
            const isOpening = openingTemplateCode === item.code;
            const canOpen =
              item.canCreate ||
              Boolean(GENERATED_DOCUMENT_ID_BY_TEMPLATE_CODE[item.code]);

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
                        {item.code}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        Mẫu số {item.number}
                      </span>
                      <TemplateStatusBadge item={item} />
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                        Điểm phù hợp {item.score}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.stageNo} - {item.stageLabel}
                    </p>

                    {item.targetMode ? (
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {item.targetMode}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.reasons.slice(0, 4).map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:w-44">
                    <button
                      type="button"
                      onClick={() => void openTemplate(item)}
                      disabled={!canOpen || isOpening}
                      className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isOpening ? "Đang mở..." : "Mở biểu mẫu"}
                    </button>

                    {!canOpen ? (
                      <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-500">
                        Chưa thể mở tự động
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
