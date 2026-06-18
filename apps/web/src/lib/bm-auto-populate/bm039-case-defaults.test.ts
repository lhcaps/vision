import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyCasePayloadToBm039Form,
  type Bm039CaseFormInputs,
} from "./bm039-case-defaults";
import type { CasePayload } from "../case-payload-normalizer";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function form(overrides: DeepPartial<Bm039CaseFormInputs> = {}): Bm039CaseFormInputs {
  return {
    agency: {
      parentNameUpper: "VIEN KIEM SAT MAC DINH",
      nameUpper: "VKS MAC DINH",
      issuePlace: "TP. Ho Chi Minh",
      ...overrides.agency,
    },
    document: {
      issueDate: "17/06/2026",
      issuePlaceAndDateLine: "TP. Ho Chi Minh, ngay 17 thang 6 nam 2026",
      ...overrides.document,
    },
    detentionArrest: {
      accusedName: "",
      birthYear: "1980",
      permanentAddress: "dia chi mau",
      currentAddress: "noi o mau",
      offenseName: "",
      legalArticle: "dieu luat mau",
      investigationAgency: "co quan dieu tra mau",
      ...overrides.detentionArrest,
    },
    recipients: {
      personLine: "- nguoi mau;",
      ...overrides.recipients,
    },
    signature: {
      signerName: "",
      positionTitle: "PHO VIEN TRUONG",
      ...overrides.signature,
    },
  };
}

function payload(): CasePayload {
  return {
    case: {
      id: "case-1",
      caseCode: "CASE-1",
      nationalCaseCode: null,
      caseTitle: "Vu an A",
      caseSummary: null,
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
        agencyCode: null,
        agencyName: "Vien kiem sat nhan dan khu vuc 7",
        agencyType: null,
        parentAgencyId: "agency-parent",
        parentAgencyName: "Vien kiem sat nhan dan TP. Ho Chi Minh",
        address: null,
        phone: null,
      },
    },
    people: [
      {
        casePersonId: "cp-2",
        id: "p-2",
        fullName: "Nguoi phu",
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
        fullName: "Nguyen Van A",
        roleType: "ACCUSED",
        legalStatus: null,
        isPrimary: true,
        personOrder: 1,
        birthYear: 1990,
        currentAddress: "noi o hien tai",
        residenceAddress: "thuong tru",
      },
    ],
    offenses: [
      {
        id: "co-1",
        personId: "p-1",
        offenseId: "o-1",
        offenseName: "Trom cap tai san",
        offenseCode: null,
        offenseGroup: null,
        legalArticle: "Dieu 173 Bo luat Hinh su",
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
          fullName: "Tran Thi B",
          positionTitle: "Kiem sat vien",
          rankTitle: null,
          phone: null,
        },
      },
    ],
  };
}

describe("applyCasePayloadToBm039Form", () => {
  it("fills empty or default BM-039 fields from case payload", () => {
    const defaults = form();

    const result = applyCasePayloadToBm039Form({
      form: form(),
      defaultForm: defaults,
      casePayload: payload(),
    });

    assert.equal(result.form.agency.parentNameUpper, "VIEN KIEM SAT NHAN DAN TP. HO CHI MINH");
    assert.equal(result.form.agency.nameUpper, "VIEN KIEM SAT NHAN DAN KHU VUC 7");
    assert.equal(result.form.detentionArrest.accusedName, "Nguyen Van A");
    assert.equal(result.form.detentionArrest.birthYear, "1990");
    assert.equal(result.form.detentionArrest.permanentAddress, "thuong tru");
    assert.equal(result.form.detentionArrest.currentAddress, "noi o hien tai");
    assert.equal(result.form.detentionArrest.offenseName, "Trom cap tai san");
    assert.equal(result.form.detentionArrest.legalArticle, "Dieu 173 Bo luat Hinh su");
    assert.equal(result.form.signature.signerName, "Tran Thi B");
    assert.ok(result.appliedFields.includes("detentionArrest.accusedName"));
  });

  it("does not overwrite user-entered BM-039 values by default", () => {
    const defaults = form();

    const result = applyCasePayloadToBm039Form({
      form: form({
        detentionArrest: {
          accusedName: "Ten da sua",
          legalArticle: "Dieu da sua",
        },
      }),
      defaultForm: defaults,
      casePayload: payload(),
    });

    assert.equal(result.form.detentionArrest.accusedName, "Ten da sua");
    assert.equal(result.form.detentionArrest.legalArticle, "Dieu da sua");
  });
});
