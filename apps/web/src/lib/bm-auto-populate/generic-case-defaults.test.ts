import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyCasePayloadToGenericForm,
  type GenericCaseFormInputs,
} from "./generic-case-defaults";
import type { CasePayload } from "../case-payload-normalizer";

function emptyForm(): GenericCaseFormInputs {
  return {
    agency: {
      parentName: "",
      name: "",
      issuePlace: "",
    },
    document: {
      documentCode: "",
      issueDate: "",
    },
    caseInfo: {
      caseCode: "",
      caseTitle: "",
      accusedName: "",
      offenseName: "",
      legalArticle: "",
    },
    content: {
      legalBasisLine: "",
      summaryLine: "",
      decisionLine: "",
      noteLine: "",
    },
    recipients: {
      recipientLine: "",
      archiveLine: "- Lưu: HSVA, HSKS, VP.",
    },
    signature: {
      signMode: "KT. VIỆN TRƯỞNG",
      positionTitle: "PHÓ VIỆN TRƯỞNG",
      signerName: "",
    },
  };
}

function payload(): CasePayload {
  return {
    case: {
      id: "case-1",
      caseCode: "VKS-2026-0001",
      nationalCaseCode: null,
      caseTitle: "Vụ án Nguyễn Văn A",
      caseSummary: "Nội dung vụ án đã được nhập trong hồ sơ.",
      caseType: null,
      sourceType: null,
      currentStage: null,
      currentStatus: null,
      priority: null,
      receivedDate: null,
      acceptedDate: null,
      prosecutedDate: null,
      closedDate: null,
      note: null,
      agency: {
        id: "agency-1",
        agencyCode: "VKSKV7",
        agencyName: "Viện kiểm sát nhân dân khu vực 7",
        agencyType: null,
        parentAgencyId: "agency-parent",
        parentAgencyName: "Viện kiểm sát nhân dân TP. Hồ Chí Minh",
        address: null,
        phone: null,
      },
    },
    people: [
      {
        casePersonId: "cp-2",
        id: "p-2",
        fullName: "Người phụ",
        roleType: "WITNESS",
        legalStatus: null,
        isPrimary: false,
        personOrder: 2,
        birthYear: null,
        currentAddress: null,
        residenceAddress: null,
      },
      {
        casePersonId: "cp-1",
        id: "p-1",
        fullName: "Nguyễn Văn A",
        roleType: "ACCUSED",
        legalStatus: null,
        isPrimary: true,
        personOrder: 1,
        birthYear: 1990,
        currentAddress: null,
        residenceAddress: null,
      },
    ],
    offenses: [
      {
        id: "co-1",
        personId: "p-1",
        offenseId: "o-1",
        offenseName: "Trộm cắp tài sản",
        offenseCode: null,
        offenseGroup: null,
        legalArticle: "Điều 173 Bộ luật Hình sự",
        isPrimary: true,
      },
    ],
    assignments: [
      {
        id: "a-1",
        roleType: "PROSECUTOR",
        legalStatus: null,
        isPrimary: true,
        personOrder: 1,
        assignedDate: null,
        endedDate: null,
        decisionNo: null,
        decisionDate: null,
        note: null,
        official: {
          id: "official-1",
          fullName: "Trần Thị B",
          positionTitle: "Kiểm sát viên",
          rankTitle: null,
          phone: null,
        },
      },
    ],
  };
}

describe("applyCasePayloadToGenericForm", () => {
  it("fills empty generic fields from the case payload", () => {
    const result = applyCasePayloadToGenericForm({
      form: emptyForm(),
      casePayload: payload(),
    });

    assert.equal(result.form.agency.parentName, "Viện kiểm sát nhân dân TP. Hồ Chí Minh");
    assert.equal(result.form.agency.name, "Viện kiểm sát nhân dân khu vực 7");
    assert.equal(result.form.caseInfo.caseCode, "VKS-2026-0001");
    assert.equal(result.form.caseInfo.caseTitle, "Vụ án Nguyễn Văn A");
    assert.equal(result.form.caseInfo.accusedName, "Nguyễn Văn A");
    assert.equal(result.form.caseInfo.offenseName, "Trộm cắp tài sản");
    assert.equal(result.form.caseInfo.legalArticle, "Điều 173 Bộ luật Hình sự");
    assert.equal(result.form.content.summaryLine, "Nội dung vụ án đã được nhập trong hồ sơ.");
    assert.equal(result.form.signature.signerName, "Trần Thị B");
    assert.ok(result.appliedFields.includes("caseInfo.accusedName"));
  });

  it("preserves existing user-entered values unless overwrite is requested", () => {
    const form = emptyForm();
    form.caseInfo.accusedName = "Tên người dùng đã sửa";

    const fillEmpty = applyCasePayloadToGenericForm({
      form,
      casePayload: payload(),
    });
    const overwrite = applyCasePayloadToGenericForm({
      form,
      casePayload: payload(),
      overwrite: true,
    });

    assert.equal(fillEmpty.form.caseInfo.accusedName, "Tên người dùng đã sửa");
    assert.equal(overwrite.form.caseInfo.accusedName, "Nguyễn Văn A");
  });
});
