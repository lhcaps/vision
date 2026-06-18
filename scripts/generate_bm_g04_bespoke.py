"""Generate BESPOKE versions of G04 simple QĐ forms.

Pattern: All have a similar simple structure (agency, document, official, content section, recipients, signature).
Used to convert LEGACY forms in batch.
"""
import re
from pathlib import Path

ROOT = Path(r"D:\Study\Project\QLLaw-main\apps\web\src\components\documents")

# Each form is a list of fields.
# tuple: (key, label, kind, required, full_width, [rows])
# kind: text | textarea | date

FORMS = {
    110: {
        "title": "QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 110/HS · Căn cứ Điều 41, 173 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 173 BLTTHS",
        "section1_title": "Quyết định bị huỷ bỏ",
        "section1_desc": "Thông tin QĐ đình chỉ điều tra VAHS cần huỷ bỏ.",
        "section2_title": "Lý do huỷ bỏ tự sinh",
        "fields": [
            ("cancelledDocumentCode", "Số QĐ bị huỷ", "text", True, False),
            ("cancelledDocumentDate", "Ngày QĐ bị huỷ", "date", False, False),
            ("cancelledDocumentAgency", "Cơ quan ban hành QĐ bị huỷ", "text", False, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.caseTitle) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc đình chỉ điều tra vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ và trái pháp luật;`;""",
        "sectionName": "cancelledDecision",
        "sectionTypeName": "CancelledDecisionForm",
    },
    108: {
        "title": "QĐ huỷ bỏ QĐ tạm đình chỉ VAHS",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 108/HS · Căn cứ Điều 41, 247 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 247 BLTTHS",
        "section1_title": "Quyết định bị huỷ bỏ",
        "section1_desc": "Thông tin QĐ tạm đình chỉ VAHS cần huỷ bỏ.",
        "section2_title": "Lý do huỷ bỏ tự sinh",
        "fields": [
            ("cancelledDocumentCode", "Số QĐ bị huỷ", "text", True, False),
            ("cancelledDocumentDate", "Ngày QĐ bị huỷ", "date", False, False),
            ("cancelledDocumentAgency", "Cơ quan ban hành QĐ bị huỷ", "text", False, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.caseTitle) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc tạm đình chỉ vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ và trái pháp luật;`;""",
        "sectionName": "cancelledDecision",
        "sectionTypeName": "CancelledDecisionForm",
    },
    109: {
        "title": "QĐ huỷ bỏ QĐ phục hồi điều tra VAHS",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 109/HS · Căn cứ Điều 41, 251 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 251 BLTTHS",
        "section1_title": "Quyết định bị huỷ bỏ",
        "section1_desc": "Thông tin QĐ phục hồi điều tra VAHS cần huỷ bỏ.",
        "section2_title": "Lý do huỷ bỏ tự sinh",
        "fields": [
            ("cancelledDocumentCode", "Số QĐ bị huỷ", "text", True, False),
            ("cancelledDocumentDate", "Ngày QĐ bị huỷ", "date", False, False),
            ("cancelledDocumentAgency", "Cơ quan ban hành QĐ bị huỷ", "text", False, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.caseTitle) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc phục hồi điều tra vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ và trái pháp luật;`;""",
        "sectionName": "cancelledDecision",
        "sectionTypeName": "CancelledDecisionForm",
    },
    106: {
        "title": "QĐ gia hạn thời hạn điều tra VAHS",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 106/HS · Căn cứ Điều 36, 172 BLTTHS 2015.",
        "legalBasisArticles": "Điều 36, 172 BLTTHS",
        "section1_title": "Nội dung gia hạn",
        "section1_desc": "Thông tin vụ án, tội danh và thời hạn gia hạn.",
        "section2_title": "Lý do gia hạn tự sinh",
        "fields": [
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("investigationDeadline", "Thời hạn gia hạn", "text", False, False),
            ("reasonLine", "Lý do gia hạn", "textarea", False, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.caseTitle) return "";
  return `Xét thấy cần gia hạn thời hạn điều tra vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}". ${d.investigationDeadline ? `Thời hạn gia hạn: ${d.investigationDeadline.trim()}.` : ""} ${d.reasonLine || ""}`.trim();""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    107: {
        "title": "QĐ không chấp nhận yêu cầu gia hạn điều tra VAHS",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 107/HS · Căn cứ Điều 36, 172 BLTTHS 2015.",
        "legalBasisArticles": "Điều 36, 172 BLTTHS",
        "section1_title": "Yêu cầu gia hạn bị từ chối",
        "section1_desc": "Thông tin yêu cầu gia hạn bị từ chối.",
        "section2_title": "Lý do từ chối tự sinh",
        "fields": [
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("investigationDeadline", "Thời hạn yêu cầu", "text", False, False),
            ("reasonLine", "Lý do từ chối", "textarea", False, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.caseTitle) return "";
  return `Xét thấy yêu cầu gia hạn thời hạn điều tra vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ. ${d.investigationDeadline ? `Thời hạn yêu cầu: ${d.investigationDeadline.trim()}.` : ""} ${d.reasonLine || ""}`.trim();""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    103: {
        "title": "QĐ hủy bỏ QĐ khởi tố bị can",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 103/HS · Căn cứ Điều 41, 155 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 155 BLTTHS",
        "section1_title": "QĐ khởi tố bị can bị huỷ",
        "section1_desc": "Thông tin QĐ khởi tố bị can cần huỷ bỏ.",
        "section2_title": "Lý do huỷ bỏ tự sinh",
        "fields": [
            ("cancelledDocumentCode", "Số QĐ khởi tố bị can", "text", True, False),
            ("cancelledDocumentDate", "Ngày QĐ khởi tố bị can", "date", False, False),
            ("cancelledDocumentAgency", "Cơ quan ban hành QĐ", "text", False, False),
            ("accusedName", "Tên bị can", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", False, False),
            ("offenseName", "Tội danh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.accusedName) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc khởi tố bị can đối với ${d.accusedName.trim()}${d.caseTitle ? ` vụ án ${d.caseTitle.trim()}` : ""} về tội "${d.offenseName.trim()}" không có căn cứ;`;""",
        "sectionName": "cancelledDecision",
        "sectionTypeName": "CancelledDecisionForm",
    },
    104: {
        "title": "QĐ phục hồi điều tra vụ án hình sự",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 104/HS · Căn cứ Điều 41, 251 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 251 BLTTHS",
        "section1_title": "QĐ đình chỉ bị huỷ",
        "section1_desc": "Thông tin QĐ đình chỉ bị huỷ bỏ.",
        "section2_title": "Lý do phục hồi tự sinh",
        "fields": [
            ("cancelledDocumentCode", "Số QĐ đình chỉ bị huỷ", "text", True, False),
            ("cancelledDocumentDate", "Ngày QĐ đình chỉ bị huỷ", "date", False, False),
            ("cancelledDocumentAgency", "Cơ quan ban hành QĐ", "text", False, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.caseTitle) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy có căn cứ phục hồi điều tra vụ án hình sự theo QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc đình chỉ điều tra vụ án ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}";`;""",
        "sectionName": "cancelledDecision",
        "sectionTypeName": "CancelledDecisionForm",
    },
    125: {
        "title": "Thông báo không chấp nhận đề nghị trưng cầu giám định, định giá tài sản",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 125/HS · Căn cứ Điều 41, 211 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 211 BLTTHS",
        "section1_title": "Thông tin không chấp nhận",
        "section1_desc": "Nhập thông tin đề nghị không được chấp nhận.",
        "section2_title": None,
        "fields": [
            ("requestedAgency", "Cơ quan đề nghị", "text", True, False),
            ("requestCode", "Số đề nghị", "text", False, False),
            ("requestDate", "Ngày đề nghị", "text", False, False),
            ("requestContent", "Nội dung đề nghị", "textarea", True, True),
            ("refusalReason", "Lý do không chấp nhận", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "notification",
        "sectionTypeName": "NotificationForm",
    },
    127: {
        "title": "Yêu cầu cung cấp hồ sơ, tài liệu",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 127/HS · Căn cứ Điều 41, 89 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 89 BLTTHS",
        "section1_title": "Yêu cầu cung cấp",
        "section1_desc": "Thông tin yêu cầu cung cấp hồ sơ tài liệu.",
        "section2_title": None,
        "fields": [
            ("requestedAgency", "Cơ quan được yêu cầu", "text", True, False),
            ("requestCode", "Số yêu cầu", "text", False, False),
            ("requestDate", "Ngày yêu cầu", "date", False, False),
            ("requestContent", "Nội dung yêu cầu", "textarea", True, True),
            ("deadlineDays", "Thời hạn (ngày)", "text", False, False),
        ],
        "buildReasonLine": None,
        "sectionName": "request",
        "sectionTypeName": "RequestForm",
    },
    121: {
        "title": "QĐ thay đổi biện pháp ngăn chặn",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 121/HS · Căn cứ Điều 41, 119 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 119 BLTTHS",
        "section1_title": "Thay đổi biện pháp ngăn chặn",
        "section1_desc": "Thông tin biện pháp ngăn chặn được thay đổi.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("oldMeasure", "Biện pháp cũ", "text", False, False),
            ("newMeasure", "Biện pháp mới", "text", True, False),
            ("reasonLine", "Lý do thay đổi", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "measureChange",
        "sectionTypeName": "MeasureChangeForm",
    },
    128: {
        "title": "QĐ hủy bỏ biện pháp ngăn chặn",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 128/HS · Căn cứ Điều 41, 119 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 119 BLTTHS",
        "section1_title": "Huỷ bỏ biện pháp ngăn chặn",
        "section1_desc": "Thông tin biện pháp ngăn chặn bị huỷ bỏ.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("cancelledMeasure", "Biện pháp bị huỷ", "text", True, False),
            ("reasonLine", "Lý do huỷ bỏ", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "measureCancellation",
        "sectionTypeName": "MeasureCancellationForm",
    },
    139: {
        "title": "QĐ áp dụng biện pháp bảo lĩnh",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 139/HS · Căn cứ Điều 41, 120 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 120 BLTTHS",
        "section1_title": "Áp dụng biện pháp bảo lĩnh",
        "section1_desc": "Thông tin biện pháp bảo lĩnh được áp dụng.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("guarantorName", "Người bảo lĩnh", "text", True, False),
            ("bondAmount", "Số tiền bảo lĩnh", "text", False, False),
            ("reasonLine", "Lý do áp dụng", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "surety",
        "sectionTypeName": "SuretyForm",
    },
    113: {
        "title": "QĐ kéo dài thời hạn tạm giam",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 113/HS · Căn cứ Điều 41, 173 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 173 BLTTHS",
        "section1_title": "Kéo dài thời hạn tạm giam",
        "section1_desc": "Thông tin kéo dài thời hạn tạm giam.",
        "section2_title": None,
        "fields": [
            ("detaineeName", "Tên bị can bị tạm giam", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("originalDetentionDecision", "Số QĐ tạm giam ban đầu", "text", False, False),
            ("extendedPeriod", "Thời hạn kéo dài", "text", True, False),
            ("reasonLine", "Lý do kéo dài", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "detentionExtension",
        "sectionTypeName": "DetentionExtensionForm",
    },
    122: {
        "title": "QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 122/HS · Căn cứ Điều 41, 116 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 116 BLTTHS",
        "section1_title": "Thông tin không phê chuẩn Lệnh",
        "section1_desc": "Nhập thông tin Lệnh không được phê chuẩn.",
        "section2_title": "Lý do không phê chuẩn tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("orderCode", "Số Lệnh", "text", True, False),
            ("orderDate", "Ngày Lệnh", "text", False, False),
            ("orderAgency", "Cơ quan ban hành Lệnh", "text", True, False),
            ("propertyDescription", "Mô tả đối tượng thu giữ", "text", False, False),
            ("refusalReason", "Lý do không phê chuẩn", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.caseTitle) return "";
  return `Qua xét nội dung vụ án ${d.caseTitle.trim()}, căn cứ Lệnh số ${d.orderCode.trim()}${d.orderDate ? ` ngày ${cleanText(d.orderDate)}` : ""} của ${d.orderAgency.trim()}${d.propertyDescription ? ` về việc thu giữ ${d.propertyDescription.trim()}` : ""}. Không phê chuẩn Lệnh vì ${d.refusalReason.trim()}.`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    111: {
        "title": "QĐ hủy bỏ biện pháp tạm giữ",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 111/HS · Căn cứ Điều 41, 115 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 115 BLTTHS",
        "section1_title": "Thông tin huỷ bỏ tạm giữ",
        "section1_desc": "Nhập thông tin QĐ tạm giữ bị huỷ bỏ.",
        "section2_title": "Lý do huỷ bỏ tự sinh",
        "fields": [
            ("detaineeName", "Tên người bị tạm giữ", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("oldDecisionCode", "Số QĐ tạm giữ", "text", True, False),
            ("oldDecisionDate", "Ngày QĐ tạm giữ", "date", False, False),
            ("cancellationReason", "Lý do huỷ bỏ", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.detaineeName) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.oldDecisionDate));
  return `Xét thấy QĐ tạm giữ số ${d.oldDecisionCode.trim()}${dateText ? ` ${dateText}` : ""} đối với ${d.detaineeName.trim()} không có căn cứ, ${d.cancellationReason.trim()};`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    112: {
        "title": "QĐ thay đổi biện pháp tạm giữ",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 112/HS · Căn cứ Điều 41, 115 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 115 BLTTHS",
        "section1_title": "Thông tin thay đổi tạm giữ",
        "section1_desc": "Nhập thông tin thay đổi biện pháp tạm giữ.",
        "section2_title": "Lý do thay đổi tự sinh",
        "fields": [
            ("detaineeName", "Tên người bị tạm giữ", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("oldDecisionCode", "Số QĐ tạm giữ cũ", "text", True, False),
            ("newMeasure", "Biện pháp mới", "text", True, False),
            ("reasonLine", "Lý do thay đổi", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.detaineeName) return "";
  return `Xét thấy cần thay đổi biện pháp tạm giữ đối với ${d.detaineeName.trim()} từ QĐ số ${d.oldDecisionCode.trim()} sang ${d.newMeasure.trim()}. ${d.reasonLine || ""}`.trim();""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    129: {
        "title": "QĐ trưng cầu giám định bổ sung",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 129/HS · Căn cứ Điều 41, 51 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 51 BLTTHS",
        "section1_title": "Thông tin trưng cầu giám định bổ sung",
        "section1_desc": "Nhập thông tin giám định bổ sung.",
        "section2_title": "Lý do giám định bổ sung tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("originalAppraisalCode", "Số giám định gốc", "text", True, False),
            ("originalAppraisalDate", "Ngày giám định gốc", "text", False, False),
            ("originalAppraisalAgency", "Đơn vị giám định gốc", "text", False, False),
            ("supplementReason", "Lý do giám định bổ sung", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.caseTitle) return "";
  return `Qua xét nội dung vụ án ${d.caseTitle.trim()}${d.offenseName ? ` về tội "${d.offenseName.trim()}"` : ""}, căn cứ kết luận giám định số ${d.originalAppraisalCode.trim()}${d.originalAppraisalDate ? ` ngày ${cleanText(d.originalAppraisalDate)}` : ""} của ${d.originalAppraisalAgency.trim()}. Cần giám định bổ sung vì ${d.supplementReason.trim()}.`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    117: {
        "title": "QĐ tạm đình chỉ việc giám định",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 117/HS · Căn cứ Điều 41, 213 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 213 BLTTHS",
        "section1_title": "Thông tin tạm đình chỉ giám định",
        "section1_desc": "Nhập thông tin QĐ tạm đình chỉ giám định.",
        "section2_title": None,
        "fields": [
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("appraisalCode", "Số QĐ trưng cầu giám định", "text", True, False),
            ("appraisalDate", "Ngày QĐ trưng cầu", "date", False, False),
            ("appraisalAgency", "Đơn vị giám định", "text", False, False),
            ("suspensionReason", "Lý do tạm đình chỉ", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    118: {
        "title": "QĐ phục hồi việc giám định",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 118/HS · Căn cứ Điều 41, 213 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 213 BLTTHS",
        "section1_title": "Thông tin phục hồi giám định",
        "section1_desc": "Nhập thông tin QĐ phục hồi giám định.",
        "section2_title": None,
        "fields": [
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("appraisalCode", "Số QĐ trưng cầu giám định", "text", True, False),
            ("appraisalAgency", "Đơn vị giám định", "text", False, False),
            ("resumptionReason", "Lý do phục hồi", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    114: {
        "title": "QĐ thay đổi người bảo vệ",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 114/HS · Căn cứ Điều 41, 76 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 76 BLTTHS",
        "section1_title": "Thông tin thay đổi người bảo vệ",
        "section1_desc": "Nhập thông tin thay đổi người bảo vệ.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("oldDefenderName", "Tên người bảo vệ cũ", "text", True, False),
            ("newDefenderName", "Tên người bảo vệ mới", "text", True, False),
            ("reasonLine", "Lý do thay đổi", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "defender",
        "sectionTypeName": "DefenderForm",
    },
    115: {
        "title": "QĐ thay đổi người phiên dịch",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 115/HS · Căn cứ Điều 41, 70 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 70 BLTTHS",
        "section1_title": "Thông tin thay đổi người phiên dịch",
        "section1_desc": "Nhập thông tin thay đổi người phiên dịch.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("oldInterpreterName", "Tên người phiên dịch cũ", "text", True, False),
            ("newInterpreterName", "Tên người phiên dịch mới", "text", True, False),
            ("language", "Ngôn ngữ phiên dịch", "text", False, False),
            ("reasonLine", "Lý do thay đổi", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "interpreter",
        "sectionTypeName": "InterpreterForm",
    },
    138: {
        "title": "QĐ áp dụng biện pháp cấm đi khỏi nơi cư trú",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 138/HS · Căn cứ Điều 41, 123 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 123 BLTTHS",
        "section1_title": "Áp dụng biện pháp cấm đi khỏi nơi cư trú",
        "section1_desc": "Thông tin biện pháp cấm đi khỏi nơi cư trú.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("residenceAddress", "Nơi cư trú", "text", True, False),
            ("restrictionPeriod", "Thời hạn cấm", "text", True, False),
            ("reasonLine", "Lý do áp dụng", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "residenceBan",
        "sectionTypeName": "ResidenceBanForm",
    },
    136: {
        "title": "QĐ áp dụng biện pháp đặt tiền để bảo đảm",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 136/HS · Căn cứ Điều 41, 121 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 121 BLTTHS",
        "section1_title": "Áp dụng biện pháp đặt tiền",
        "section1_desc": "Thông tin biện pháp đặt tiền bảo đảm.",
        "section2_title": None,
        "fields": [
            ("accusedName", "Tên bị can/bị cáo", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("bondAmount", "Số tiền đặt bảo đảm", "text", True, False),
            ("reasonLine", "Lý do áp dụng", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "moneyDeposit",
        "sectionTypeName": "MoneyDepositForm",
    },
    123: {
        "title": "QĐ thu hồi tài sản đã tạm giữ",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 123/HS · Căn cứ Điều 41, 129 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 129 BLTTHS",
        "section1_title": "Thông tin thu hồi tài sản",
        "section1_desc": "Nhập thông tin thu hồi tài sản tạm giữ.",
        "section2_title": None,
        "fields": [
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("propertyDescription", "Mô tả tài sản thu hồi", "textarea", True, True),
            ("originalSeizureDecision", "Số QĐ tạm giữ gốc", "text", True, False),
            ("returnToPersonName", "Tên người nhận lại", "text", True, False),
            ("reasonLine", "Lý do thu hồi", "textarea", True, True),
        ],
        "buildReasonLine": None,
        "sectionName": "propertyReturn",
        "sectionTypeName": "PropertyReturnForm",
    },
    124: {
        "title": "Biên bản thực nghiệm điều tra",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 124/HS · Căn cứ Điều 41, 200 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 200 BLTTHS",
        "section1_title": "Thông tin thực nghiệm điều tra",
        "section1_desc": "Nhập thông tin thực nghiệm điều tra.",
        "section2_title": None,
        "fields": [
            ("experimentDecisionCode", "Số QĐ thực nghiệm", "text", True, False),
            ("experimentDecisionDate", "Ngày QĐ thực nghiệm", "date", False, False),
            ("experimentDecisionAgency", "Cơ quan ban hành", "text", False, False),
            ("experimentTime", "Thời gian thực nghiệm", "text", False, False),
            ("experimentLocation", "Địa điểm thực nghiệm", "text", False, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("participantList", "Danh sách người tham dự", "textarea", False, True),
            ("experimentContent", "Nội dung thực nghiệm", "textarea", False, True),
            ("observationNotes", "Ghi chú quan sát", "textarea", False, True),
            ("conclusionLine", "Kết luận", "text", False, False),
        ],
        "buildReasonLine": None,
        "sectionName": "experiment",
        "sectionTypeName": "ExperimentForm",
    },
    131: {
        "title": "Yêu cầu định giá lại tài sản",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 131/HS · Căn cứ Điều 41, 50 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 50 BLTTHS",
        "section1_title": "Thông tin định giá lại",
        "section1_desc": "Nhập thông tin định giá lại tài sản.",
        "section2_title": "Lý do định giá lại tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("propertyDescription", "Mô tả tài sản cần định giá lại", "text", True, False),
            ("originalAppraisalValue", "Giá trị định giá trước", "text", False, False),
            ("originalAppraisalDate", "Ngày định giá trước", "text", False, False),
            ("originalAppraisalAgency", "Đơn vị định giá trước", "text", False, False),
            ("reasonForReappraisal", "Lý do định giá lại", "text", True, False),
        ],
        "buildReasonLine": """  const r = form.request;
  if (!r.propertyDescription || !r.caseTitle) return "";
  return `Qua xét nội dung vụ án ${r.caseTitle.trim()}, tài sản ${r.propertyDescription.trim()} đã được định giá${r.originalAppraisalValue ? ` với giá trị ${r.originalAppraisalValue.trim()}` : ""}${r.originalAppraisalDate ? ` theo kết luận ngày ${cleanText(r.originalAppraisalDate)}` : ""}${r.originalAppraisalAgency ? ` của ${r.originalAppraisalAgency.trim()}` : ""}. Có căn cứ cho rằng cần định giá lại vì ${r.reasonForReappraisal.trim()}.`;""",
        "sectionName": "request",
        "sectionTypeName": "RequestForm",
    },
    120: {
        "title": "QĐ phê chuẩn lệnh bắt bị can để tạm giam",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 120/HS · Căn cứ Điều 41, 173 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 173 BLTTHS",
        "section1_title": "Thông tin lệnh bắt",
        "section1_desc": "Nhập thông tin lệnh bắt bị can.",
        "section2_title": "Lý do phê chuẩn tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("accusedName", "Tên bị can", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("warrantCode", "Số lệnh bắt", "text", True, False),
            ("warrantDate", "Ngày lệnh bắt", "date", False, False),
            ("warrantAgency", "Cơ quan ban hành lệnh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.accusedName) return "";
  return `Xét thấy lệnh bắt số ${d.warrantCode.trim()} ngày ${cleanText(d.warrantDate)} của ${d.warrantAgency.trim()} đối với ${d.accusedName.trim()} vụ án ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" có căn cứ pháp luật;`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    126: {
        "title": "QĐ không phê chuẩn lệnh bắt người",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 126/HS · Căn cứ Điều 41, 173 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 173 BLTTHS",
        "section1_title": "Thông tin lệnh bắt bị từ chối",
        "section1_desc": "Nhập thông tin lệnh bắt không được phê chuẩn.",
        "section2_title": "Lý do không phê chuẩn tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("accusedName", "Tên người bị bắt", "text", True, False),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("warrantCode", "Số lệnh bắt", "text", True, False),
            ("warrantDate", "Ngày lệnh bắt", "date", False, False),
            ("warrantAgency", "Cơ quan ban hành lệnh", "text", False, False),
            ("refusalReason", "Lý do không phê chuẩn", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.accusedName) return "";
  return `Xét thấy lệnh bắt số ${d.warrantCode.trim()} ngày ${cleanText(d.warrantDate)} của ${d.warrantAgency.trim()} đối với ${d.accusedName.trim()} không có căn cứ. Lý do: ${d.refusalReason.trim()};`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    119: {
        "title": "QĐ phê chuẩn lệnh khám xét",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 119/HS · Căn cứ Điều 41, 192 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 192 BLTTHS",
        "section1_title": "Thông tin lệnh khám xét",
        "section1_desc": "Nhập thông tin lệnh khám xét được phê chuẩn.",
        "section2_title": "Lý do phê chuẩn tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("searchLocation", "Địa điểm khám xét", "text", True, False),
            ("warrantCode", "Số lệnh khám xét", "text", True, False),
            ("warrantDate", "Ngày lệnh khám xét", "date", False, False),
            ("warrantAgency", "Cơ quan ban hành lệnh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.searchLocation) return "";
  return `Xét thấy lệnh khám xét số ${d.warrantCode.trim()} ngày ${cleanText(d.warrantDate)} của ${d.warrantAgency.trim()} tại ${d.searchLocation.trim()} có căn cứ;`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    116: {
        "title": "QĐ phê chuẩn lệnh thu giữ tài sản",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 116/HS · Căn cứ Điều 41, 129 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 129 BLTTHS",
        "section1_title": "Thông tin lệnh thu giữ",
        "section1_desc": "Nhập thông tin lệnh thu giữ tài sản được phê chuẩn.",
        "section2_title": "Lý do phê chuẩn tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("offenseName", "Tội danh", "text", False, False),
            ("propertyDescription", "Mô tả tài sản thu giữ", "textarea", True, True),
            ("warrantCode", "Số lệnh thu giữ", "text", True, False),
            ("warrantDate", "Ngày lệnh thu giữ", "date", False, False),
            ("warrantAgency", "Cơ quan ban hành lệnh", "text", False, False),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.propertyDescription) return "";
  return `Xét thấy lệnh thu giữ số ${d.warrantCode.trim()} ngày ${cleanText(d.warrantDate)} của ${d.warrantAgency.trim()} đối với tài sản ${d.propertyDescription.trim()} có căn cứ;`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    134: {
        "title": "QĐ thu hồi tài sản đã kê biên",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 134/HS · Căn cứ Điều 41, 129 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 129 BLTTHS",
        "section1_title": "Thông tin thu hồi tài sản",
        "section1_desc": "Nhập thông tin tài sản đã kê biên.",
        "section2_title": "Lý do thu hồi tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("propertyDescription", "Mô tả tài sản đã kê biên", "textarea", True, True),
            ("seizureDecisionCode", "Số QĐ kê biên", "text", True, False),
            ("seizureDate", "Ngày kê biên", "date", False, False),
            ("seizureAgency", "Cơ quan kê biên", "text", False, False),
            ("returnToPersonName", "Người nhận lại", "text", True, False),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.propertyDescription) return "";
  return `Xét thấy tài sản ${d.propertyDescription.trim()} đã được kê biên theo QĐ số ${d.seizureDecisionCode.trim()} ngày ${cleanText(d.seizureDate)} của ${d.seizureAgency.trim()} cần thu hồi trả lại cho ${d.returnToPersonName.trim()};`;""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
    135: {
        "title": "QĐ thanh toán tiền bán tài sản kê biên",
        "subtitle": "Biểu mẫu TT 03/2026-VKSTC · Mẫu số 135/HS · Căn cứ Điều 41, 132 BLTTHS 2015.",
        "legalBasisArticles": "Điều 41, 132 BLTTHS",
        "section1_title": "Thông tin thanh toán",
        "section1_desc": "Nhập thông tin thanh toán tiền bán tài sản.",
        "section2_title": "Lý do thanh toán tự sinh",
        "fields": [
            ("procedureArticlesLine", "Căn cứ pháp luật", "textarea", True, True),
            ("caseTitle", "Tên vụ án", "text", True, False),
            ("propertyDescription", "Mô tả tài sản đã bán", "textarea", True, True),
            ("soldAmount", "Số tiền thu được", "text", True, False),
            ("recipientName", "Người nhận tiền", "text", True, False),
            ("reasonLine", "Lý do thanh toán", "textarea", True, True),
        ],
        "buildReasonLine": """  const d = form.decision;
  if (!d.propertyDescription) return "";
  return `Xét thấy tài sản ${d.propertyDescription.trim()} đã được bán với số tiền ${d.soldAmount.trim()}. Thanh toán cho ${d.recipientName.trim()}. ${d.reasonLine || ""}`.trim();""",
        "sectionName": "decision",
        "sectionTypeName": "DecisionForm",
    },
}


def field_tsx(name: str, key: str, label: str, kind: str, required: bool, full_width: bool) -> str:
    req_line = "          required\n" if required else ""
    fw_line = "          fullWidth\n" if full_width else ""
    if kind == "textarea":
        return f"""        <BmFieldTextarea
          label="{label}"
{req_line}{fw_line}          value={{form.{name}.{key}}}
          onChange={{(v) => patch("{name}", "{key}", v)}}
          rows={{3}}
        />"""
    if kind == "date":
        return f"""        <BmFieldDate
          label="{label}"
{req_line}          value={{form.{name}.{key}}}
          onChange={{(v) => patch("{name}", "{key}", v)}}
        />"""
    return f"""        <BmFieldText
          label="{label}"
{req_line}{fw_line}          value={{form.{name}.{key}}}
          onChange={{(v) => patch("{name}", "{key}", v)}}
        />"""


def render_form(code: int, cfg: dict) -> str:
    fields = cfg["fields"]
    name = cfg["sectionName"]
    type_name = cfg["sectionTypeName"]
    field_lines = ",\n    ".join(f'{k}: ""' for k, _, _, _, _ in fields)

    field_blocks = "\n".join(field_tsx(name, k, l, kd, r, fw) for k, l, kd, r, fw in fields)

    if cfg["buildReasonLine"]:
        reason_block = '''        <BmFieldTextarea
          label="Lý do tự sinh"
          fullWidth
          value={buildReasonLine(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />'''
    else:
        reason_block = ''

    return f'''"use client";

/**
 * BM-{code} — {cfg["title"]}
 * Stage: DIEU_TRA, Group: G04. TT 03/2026-VKSTC, Mẫu số {code}/HS.
 *
 * Căn cứ: {cfg["legalBasisArticles"]} 2015.
 */

import {{ useEffect, useMemo, useState }} from "react";

import {{
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  issuePlaceDateLine,
}} from "@/components/documents/bm-form";

type AgencyForm = {{ parentName: string; name: string }};
type DocumentForm = {{ documentCode: string; issuePlace: string; issueDateIso: string }};
type OfficialForm = {{ issuerTitle: string }};
type {type_name} = {{
{chr(10).join(f"  {k}: string;" for k, _, _, _, _ in fields)}
}};
type RecipientsForm = {{ archiveLine: string }};
type SignatureForm = {{ signMode: string; positionTitle: string; signerName: string }};

type Bm{code}Form = {{
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  {name}: {type_name};
  recipients: RecipientsForm;
  signature: SignatureForm;
}};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm{code}Form = {{
  agency: {{
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  }},
  document: {{ documentCode: "{code}/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" }},
  official: {{ issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" }},
  {name}: {{
{field_lines}
  }},
  recipients: {{ archiveLine: "- Lưu: HSVA, HSKS, VP." }},
  signature: {{ signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" }},
}};

function cleanText(v: unknown): string {{
  return v == null ? "" : String(v).trim();
}}

function nested(payload: RenderPayload | null, path: string): string {{
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: any = payload;
  for (const p of parts) {{
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }}
  return cleanText(cur);
}}

function parseDateToIso(v: string): string {{
  const raw = cleanText(v);
  if (!raw) return "";
  const iso = raw.match(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/);
  if (iso) return raw;
  const slash = raw.match(/^(\\d{{1,2}})\\/(\\d{{1,2}})\\/(\\d{{4}})$/);
  if (slash) return `${{slash[3]}}-${{slash[2].padStart(2, "0")}}-${{slash[1].padStart(2, "0")}}`;
  return "";
}}

function toVietnameseDateText(isoDate: string): string {{
  const m = isoDate.match(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/);
  if (!m) return isoDate || "";
  return `ngày ${{Number(m[3])}} tháng ${{Number(m[2])}} năm ${{m[1]}}`;
}}

function toSlashDateText(isoDate: string): string {{
  const m = isoDate.match(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/);
  if (!m) return isoDate || "";
  return `${{m[3]}}/${{m[2]}}/${{m[1]}}`;
}}

function buildIssuePlaceAndDateLine(form: Bm{code}Form): string {{
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}}

{('function buildReasonLine(form: Bm' + str(code) + 'Form): string {' + chr(10) + cfg['buildReasonLine'] + chr(10) + '}') if cfg["buildReasonLine"] else ""}

function normalizeFormInputs(payload: RenderPayload | null): Bm{code}Form {{
  const f = EMPTY_FORM;
  return {{
    agency: {{
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
    }},
    document: {{
      documentCode: nested(payload, "document.documentCode") || f.document.documentCode,
      issuePlace:
        nested(payload, "document.issuePlace") ||
        nested(payload, "agency.issuePlace") ||
        f.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    }},
    official: {{
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    }},
    {name}: {{
{chr(10).join(f"      {k}: nested(payload, \"{name}.{k}\") || \"\"," for k, _, _, _, _ in fields)}
    }},
    recipients: {{
      archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    }},
    signature: {{
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    }},
  }};
}}

function lookupValue(form: Bm{code}Form, path: string): string {{
  const parts = path.split(".").filter(Boolean);
  let cur: any = form;
  for (const p of parts) {{
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }}
  return cleanText(cur);
}}

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số quyết định", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày ban hành", "document.issueDateIso"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Chế độ ký", "signature.signMode"],
  ["Chức vụ ký", "signature.positionTitle"],
  ["Người ký", "signature.signerName"],
];

function validateForm(form: Bm{code}Form): string[] {{
  return REQUIRED_FIELDS.filter(([, p]) => !lookupValue(form, p)).map(([l]) => l);
}}

function buildSaveBody(form: Bm{code}Form) {{
  return {{
    agency: {{
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.document.issuePlace,
    }},
    document: {{
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\\s+/iu, ""),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    }},
    official: {{ issuerTitle: form.official.issuerTitle }},
    {name}: {{
{chr(10).join(f"      {k}: form.{name}.{k}," for k, _, _, _, _ in fields if k != "reasonLine")}
{('      reasonLine: buildReasonLine(form),' if not any(k == "reasonLine" for k, _, _, _, _ in fields) and cfg["buildReasonLine"] else "")}
    }},
    recipients: {{ archiveLine: form.recipients.archiveLine }},
    signature: {{
      signMode: form.signature.signMode,
      positionTitle: form.signature.positionTitle,
      signerName: form.signature.signerName || "",
    }},
    formInputs: {{}},
    payloadOverrides: {{}},
    renderPayloadOverrides: {{}},
  }};
}}

export function Bm{code}FormInputsPanel({{
  documentId,
  onSaved,
}}: {{
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}}) {{
  const [form, setForm] = useState<Bm{code}Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm{code}Form, K extends keyof Bm{code}Form[S]>(
    section: S,
    key: K,
    value: Bm{code}Form[S][K],
  ) => {{
    setForm((prev) => ({{
      ...prev,
      [section]: {{ ...(prev[section] as Record<string, unknown>), [key]: value }},
    }}));
  }};

  const reloadFromBackend = async () => {{
    setLoading(true);
    setError(null);
    setMessage(null);
    try {{
      const res = await fetch(
        `${{API_BASE_URL}}/documents/generated/${{documentId}}/render-payload`,
        {{ cache: "no-store" }},
      );
      if (!res.ok) throw new Error(`HTTP ${{res.status}}`);
      setForm(normalizeFormInputs((await res.json()) as RenderPayload));
      setMessage("Đã tải dữ liệu BM-{code} từ backend.");
    }} catch (e) {{
      setError(e instanceof Error ? e.message : "Lỗi khi tải.");
    }} finally {{
      setLoading(false);
    }}
  }};

  const handleSave = async () => {{
    const errs = validateForm(form);
    if (errs.length > 0) {{
      setValidationErrors(errs);
      setError(`Thiếu: ${{errs.join(", ")}}`);
      return;
    }}
    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {{
      const res = await fetch(
        `${{API_BASE_URL}}/documents/generated/${{documentId}}/form-inputs`,
        {{
          method: "POST",
          headers: {{ "Content-Type": "application/json; charset=utf-8" }},
          body: JSON.stringify(buildSaveBody(form)),
        }},
      );
      if (!res.ok) throw new Error(`HTTP ${{res.status}}`);
      await reloadFromBackend();
      setMessage("Đã lưu BM-{code} thành công.");
      await onSaved?.();
    }} catch (e) {{
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    }} finally {{
      setSaving(false);
    }}
  }};

  useEffect(() => {{
    void reloadFromBackend();
  }}, [documentId]);

  const status = (() => {{
    if (loading) return {{ kind: "loading" as const, text: "Đang tải..." }};
    if (saving) return {{ kind: "loading" as const, text: "Đang lưu..." }};
    if (validationErrors.length > 0)
      return {{
        kind: "warning" as const,
        text: `Còn thiếu: ${{validationErrors.join(", ")}}`,
      }};
    if (error) return {{ kind: "error" as const, text: error }};
    if (message) return {{ kind: "success" as const, text: message }};
    return {{ kind: "idle" as const, text: "" }};
  }})();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-{code}"
        title="Dữ liệu biểu mẫu {cfg["title"]}"
        subtitle="{cfg["subtitle"]}"
        isDirty={{false}}
        isLoading={{loading}}
        isSaving={{saving}}
        savedAt={{null}}
        errorMessage={{error ?? undefined}}
        warningMessage={{validationErrors.length > 0 ? `Còn thiếu: ${{validationErrors.join(", ")}}` : undefined}}
        successMessage={{status.kind === "success" ? status.text : undefined}}
        primaryLabel={{saving ? "Đang lưu..." : "Lưu dữ liệu BM-{code}"}}
        onPrimary={{handleSave}}
        primaryDisabled={{saving || loading}}
        secondaryLabel={{loading ? "Đang tải..." : "Tải lại từ backend"}}
        onSecondary={{reloadFromBackend}}
      />

      {{status.kind === "idle" ? null : (
        <BmFormStatus kind={{status.kind}}>{{status.text}}</BmFormStatus>
      )}}

      <BmFormSection title="1. Header biểu mẫu" requiredCount={{6}}>
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          required
          value={{form.agency.parentName}}
          onChange={{(v) => patch("agency", "parentName", v)}}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={{form.agency.name}}
          onChange={{(v) => patch("agency", "name", v)}}
        />
        <BmFieldText
          label="Số quyết định"
          required
          value={{form.document.documentCode}}
          onChange={{(v) => patch("document", "documentCode", v)}}
        />
        <BmFieldText
          label="Địa danh"
          required
          value={{form.document.issuePlace}}
          onChange={{(v) => patch("document", "issuePlace", v)}}
        />
        <BmFieldDate
          label="Ngày ban hành"
          required
          value={{form.document.issueDateIso}}
          onChange={{(v) => patch("document", "issueDateIso", v)}}
        />
        <BmFieldText
          label="Dòng địa danh/ngày tự sinh"
          value={{buildIssuePlaceAndDateLine(form)}}
          readOnly
          onChange={{() => undefined}}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          required
          fullWidth
          value={{form.official.issuerTitle}}
          onChange={{(v) => patch("official", "issuerTitle", v)}}
        />
      </BmFormSection>

      <BmFormSection title="2. {cfg["section1_title"]}" description="{cfg["section1_desc"]}" requiredCount={{2}}>
{field_blocks}
{reason_block}
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận và chữ ký" requiredCount={{3}}>
        <BmFieldText
          label="Lưu hồ sơ"
          fullWidth
          value={{form.recipients.archiveLine}}
          onChange={{(v) => patch("recipients", "archiveLine", v)}}
        />
        <BmFieldText
          label="Chế độ ký"
          required
          value={{form.signature.signMode}}
          onChange={{(v) => patch("signature", "signMode", v)}}
        />
        <BmFieldText
          label="Chức vụ ký"
          required
          value={{form.signature.positionTitle}}
          onChange={{(v) => patch("signature", "positionTitle", v)}}
        />
        <BmFieldText
          label="Người ký"
          required
          value={{form.signature.signerName}}
          onChange={{(v) => patch("signature", "signerName", v)}}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={{handleSave}}
        primaryLabel={{saving ? "Đang lưu..." : "Lưu dữ liệu BM-{code}"}}
        primaryDisabled={{saving || loading}}
        onSecondary={{reloadFromBackend}}
        secondaryLabel={{loading ? "Đang tải..." : "Tải lại từ backend"}}
      />
    </div>
  );
}}
'''


def main():
    for code, cfg in FORMS.items():
        out = render_form(code, cfg)
        path = ROOT / f"bm-{code}-form-inputs.tsx"
        path.write_text(out, encoding="utf-8")
        print(f"WROTE bm-{code}-form-inputs.tsx ({len(out)} bytes)")


if __name__ == "__main__":
    main()
