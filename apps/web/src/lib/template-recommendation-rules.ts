export type RecommendationInput = {
  quickText: string;
  offenseName: string;
  legalArticle: string;
  personName: string;
  processNeed: string;
  stageId: string;
  onlyCreatable: boolean;
};

export type TemplateRecommendationRule = {
  templateCode: string;
  canonicalName: string;
  keywords: string[];
  requiredInputKeys: Array<keyof Pick<
    RecommendationInput,
    "quickText" | "offenseName" | "legalArticle" | "personName" | "processNeed"
  >>;
  verifiedCoveragePercent: number | null;
  readinessNote: string;
  relatedTemplates: string[];
};

export const TEMPLATE_RECOMMENDATION_RULES: TemplateRecommendationRule[] = [
  {
    templateCode: "BM-001",
    canonicalName: "Biên bản tiếp nhận nguồn tin về tội phạm",
    keywords: ["tiếp nhận nguồn tin", "tin báo", "tố giác", "nguồn tin về tội phạm", "biên bản tiếp nhận"],
    requiredInputKeys: ["quickText", "personName"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ dữ liệu nền cho tiếp nhận nguồn tin.",
    relatedTemplates: [],
  },
  {
    templateCode: "BM-023",
    canonicalName: "Quyết định khởi tố vụ án hình sự",
    keywords: ["khởi tố vụ án", "vụ án hình sự", "ra quyết định khởi tố", "quyết định khởi tố vụ án"],
    requiredInputKeys: ["quickText", "offenseName", "legalArticle"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ case, crimeReport, offense, legalBasis và investigation.",
    relatedTemplates: ["BM-090", "BM-097"],
  },
  {
    templateCode: "BM-053",
    canonicalName: "Lệnh cấm đi khỏi nơi cư trú",
    keywords: ["cấm đi khỏi nơi cư trú", "không được đi khỏi", "biện pháp ngăn chặn", "nơi cư trú"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ person, offense, measure, monitoring và signature.",
    relatedTemplates: ["BM-054", "BM-055"],
  },
  {
    templateCode: "BM-054",
    canonicalName: "Thông báo về việc áp dụng biện pháp cấm đi khỏi nơi cư trú",
    keywords: ["thông báo cấm đi khỏi nơi cư trú", "áp dụng biện pháp cấm đi khỏi nơi cư trú"],
    requiredInputKeys: ["personName", "quickText"],
    verifiedCoveragePercent: null,
    readinessNote: "Có liên quan trực tiếp BM-053 nhưng chưa chạy coverage riêng trong lượt kiểm này.",
    relatedTemplates: ["BM-053", "BM-055"],
  },
  {
    templateCode: "BM-055",
    canonicalName: "Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú",
    keywords: ["hủy bỏ cấm đi khỏi nơi cư trú", "hủy bỏ biện pháp cấm đi khỏi nơi cư trú"],
    requiredInputKeys: ["personName", "quickText"],
    verifiedCoveragePercent: null,
    readinessNote: "Có liên quan trực tiếp BM-053 nhưng chưa chạy coverage riêng trong lượt kiểm này.",
    relatedTemplates: ["BM-053", "BM-054"],
  },
  {
    templateCode: "BM-056",
    canonicalName: "Quyết định tạm hoãn xuất cảnh",
    keywords: ["tạm hoãn xuất cảnh", "xuất cảnh", "ngăn chặn xuất cảnh"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ person, offense và nhóm measure.exitPostponement.",
    relatedTemplates: ["BM-057"],
  },
  {
    templateCode: "BM-057",
    canonicalName: "Quyết định hủy bỏ biện pháp tạm hoãn xuất cảnh",
    keywords: ["hủy bỏ tạm hoãn xuất cảnh", "hủy bỏ biện pháp tạm hoãn xuất cảnh"],
    requiredInputKeys: ["personName", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ dữ liệu quyết định tạm hoãn xuất cảnh trước đó và lý do hủy bỏ.",
    relatedTemplates: ["BM-056"],
  },
  {
    templateCode: "BM-058",
    canonicalName: "Lệnh tạm giam",
    keywords: ["tạm giam", "lệnh tạm giam", "bị can bị tạm giam"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ person, offense và nhóm measure.detention.",
    relatedTemplates: ["BM-059"],
  },
  {
    templateCode: "BM-059",
    canonicalName: "Quyết định gia hạn thời hạn tạm giam để truy tố",
    keywords: ["gia hạn tạm giam", "gia hạn thời hạn tạm giam", "tạm giam để truy tố"],
    requiredInputKeys: ["personName", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ dữ liệu quyết định gia hạn truy tố và detentionExtension.",
    relatedTemplates: ["BM-058"],
  },
  {
    templateCode: "BM-070",
    canonicalName: "Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự",
    keywords: [
      "phân công phó viện trưởng",
      "quyết định phân công phó viện trưởng",
      "thực hành quyền công tố",
      "kiểm sát việc giải quyết vụ án",
      "phân công người tiến hành tố tụng",
      "phó viện trưởng thực hành quyền công tố",
      "phó viện trưởng kiểm sát vụ án",
      "vụ án hình sự",
    ],
    requiredInputKeys: ["quickText", "processNeed"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã hoàn thiện BM-070: DB/template/render-payload/form riêng/render DOCX/PDF và document_id 14.",
    relatedTemplates: ["BM-071"],
  },
  {
    templateCode: "BM-071",
    canonicalName: "Quyết định phân công Kiểm sát viên/Kiểm tra viên thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự",
    keywords: ["phân công kiểm sát viên", "phân công kiểm tra viên", "thực hành quyền công tố"],
    requiredInputKeys: ["quickText"],
    verifiedCoveragePercent: null,
    readinessNote: "Đã có template trong DB nhưng chưa chạy coverage/render riêng.",
    relatedTemplates: ["BM-070"],
  },
  {
    templateCode: "BM-090",
    canonicalName: "Quyết định phê chuẩn Quyết định khởi tố bị can",
    keywords: ["phê chuẩn khởi tố bị can", "quyết định khởi tố bị can", "phê chuẩn quyết định khởi tố bị can"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle"],
    verifiedCoveragePercent: null,
    readinessNote: "Có trong luồng đã làm nhưng chưa nằm trong coverage vừa chạy.",
    relatedTemplates: ["BM-097"],
  },
  {
    templateCode: "BM-097",
    canonicalName: "Quyết định khởi tố bị can",
    keywords: ["khởi tố bị can", "bị can", "ra quyết định khởi tố bị can"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle"],
    verifiedCoveragePercent: null,
    readinessNote: "Có trong luồng đã làm nhưng chưa nằm trong coverage vừa chạy.",
    relatedTemplates: ["BM-090"],
  },
  {
    templateCode: "BM-103",
    canonicalName: "Đề nghị gia hạn thời hạn điều tra vụ án hình sự",
    keywords: ["đề nghị gia hạn điều tra", "gia hạn thời hạn điều tra", "thời hạn điều tra"],
    requiredInputKeys: ["quickText"],
    verifiedCoveragePercent: null,
    readinessNote: "Đã có template trong DB nhưng chưa map/render hoàn chỉnh.",
    relatedTemplates: ["BM-104"],
  },
  {
    templateCode: "BM-104",
    canonicalName: "Quyết định gia hạn thời hạn điều tra vụ án hình sự",
    keywords: ["quyết định gia hạn điều tra", "gia hạn thời hạn điều tra", "thời hạn điều tra"],
    requiredInputKeys: ["quickText"],
    verifiedCoveragePercent: null,
    readinessNote: "Đã có template trong DB nhưng chưa map/render hoàn chỉnh.",
    relatedTemplates: ["BM-103"],
  },
  {
    templateCode: "BM-141",
    canonicalName: "Quyết định chuyển vụ án để truy tố",
    keywords: [
      "chuyển vụ án để truy tố",
      "chuyển vụ án hình sự",
      "truy tố theo thẩm quyền",
      "không thuộc thẩm quyền truy tố",
      "giai đoạn truy tố",
    ],
    requiredInputKeys: ["quickText", "offenseName", "legalArticle"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã hoàn thiện BM-141: DB/template/render-payload/prosecutionTransfer/form riêng/render DOCX/PDF.",
    relatedTemplates: ["BM-156", "BM-145"],
  },
  {
    templateCode: "BM-144",
    canonicalName: "Quyết định gia hạn thời hạn quyết định việc truy tố",
    keywords: [
      "gia hạn thời hạn quyết định việc truy tố",
      "gia hạn truy tố",
      "quyết định việc truy tố",
      "thời hạn truy tố",
      "giai đoạn truy tố",
    ],
    requiredInputKeys: ["quickText", "offenseName", "legalArticle"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã hoàn thiện BM-144: DB/template/render-payload/prosecutionExtension/form riêng/render DOCX/PDF.",
    relatedTemplates: ["BM-141", "BM-156", "BM-145"],
  },
  {
    templateCode: "BM-156",
    canonicalName: "Cáo trạng",
    keywords: ["cáo trạng", "truy tố", "quyết định truy tố", "kết luận điều tra"],
    requiredInputKeys: ["personName", "offenseName", "legalArticle", "quickText"],
    verifiedCoveragePercent: 100,
    readinessNote: "Đã kiểm đủ indictment sections, person, offense và signature.",
    relatedTemplates: [],
  },
];

export function normalizeRecommendationText(value: string) {
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

export function getTemplateRecommendationRule(templateCode: string) {
  return TEMPLATE_RECOMMENDATION_RULES.find(
    (rule) => rule.templateCode === templateCode,
  );
}

export function evaluateRecommendationRule(
  rule: TemplateRecommendationRule | undefined,
  input: RecommendationInput,
  hasBackendTemplate: boolean,
) {
  if (!rule) {
    return {
      score: 0,
      reasons: [] as string[],
    };
  }

  const query = normalizeRecommendationText(
    [
      input.quickText,
      input.offenseName,
      input.legalArticle,
      input.personName,
      input.processNeed,
    ].join(" "),
  );

  const reasons: string[] = [
];
  let score = 0;

  const matchedKeywords = rule.keywords.filter((keyword) => {
    const normalizedKeyword = normalizeRecommendationText(keyword);
    return normalizedKeyword.length > 0 && query.includes(normalizedKeyword);
  });

  if (matchedKeywords.length > 0) {
    score += 40 + Math.min(matchedKeywords.length * 8, 24);
    reasons.push(`Khớp rule nghiệp vụ: ${matchedKeywords.slice(0, 2).join(", ")}`);
  }

  const filledInputKeys = rule.requiredInputKeys.filter((key) => {
    return String(input[key] ?? "").trim().length > 0;
  });

  if (filledInputKeys.length > 0) {
    score += Math.min(filledInputKeys.length * 6, 24);
    reasons.push(`Có ${filledInputKeys.length}/${rule.requiredInputKeys.length} dữ liệu đầu vào quan trọng`);
  }

  if (
    rule.requiredInputKeys.length > 0 &&
    filledInputKeys.length === rule.requiredInputKeys.length
  ) {
    score += 14;
    reasons.push("Đủ dữ liệu đầu vào tối thiểu theo rule");
  }

  if (rule.verifiedCoveragePercent === 100) {
    score += 18;
    reasons.push("Đã kiểm coverage 100% với payload thật");
  } else if (rule.verifiedCoveragePercent === null) {
    score += 2;
    reasons.push("Chưa kiểm coverage payload riêng");
  }

  if (hasBackendTemplate) {
    score += 14;
    reasons.push("Có template trong DB, có thể tạo generated document");
  }

  if (rule.relatedTemplates.length > 0) {
    reasons.push(`Liên quan: ${rule.relatedTemplates.join(", ")}`);
  }

  if (rule.readinessNote) {
    reasons.push(rule.readinessNote);
  }

  return {
    score,
    reasons,
  };
}

