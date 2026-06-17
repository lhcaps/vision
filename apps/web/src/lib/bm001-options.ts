/**
 * BM-001 options.
 *
 * @deprecated Lấy signers/agency từ `useSignerOptions()` và `useCurrentAgency()`
 * trong `@/lib/options-source`. Các constant dưới đây rỗng cố ý để tránh hiển thị
 * dữ liệu giả. Component nên dùng hook từ options-source.
 */

// Re-export types để các component cũ không bị break type.
export type Bm001ReceiverOption = {
  id: string;
  label: string;
  fullName: string;
  positionTitle: string;
  signerName: string;
  agencyName?: string | null;
  agencyId?: string | null;
  officialFullName?: string;
  officialPositionTitle?: string;
  prosecutorName?: string;
  [key: string]: unknown;
};

export type Bm001AgencyOption = {
  id: string;
  label: string;
  name: string;
  shortName?: string | null;
  parentName?: string | null;
  parentAgencyName?: string | null;
  address?: string | null;
  phone?: string | null;
  monitoringUnitName?: string | null;
  issuePlace?: string | null;
  email?: string | null;
  fax?: string | null;
  short_name?: string | null;
  parent_name?: string | null;
  parent_agency_name?: string | null;
  monitoring_unit_name?: string | null;
  issue_place?: string | null;
};

export type Bm001GenderOption = { value: string; label: string };

/** @deprecated Dùng useSignerOptions() */
export const BM001_RECEIVER_OPTIONS: Bm001ReceiverOption[] = [];

/** @deprecated Dùng useSignerOptions() */
export const BM001_SIGNER_OPTIONS: Bm001ReceiverOption[] = [];

/** @deprecated Dùng useCurrentAgency() */
export const BM001_AGENCY_OPTIONS: Bm001AgencyOption[] = [];

export const BM001_GENDER_OPTIONS: Bm001GenderOption[] = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
];

export const BM001_IDENTITY_TYPE_OPTIONS: Bm001GenderOption[] = [
  { value: "CMND", label: "CMND" },
  { value: "CCCD", label: "Căn cước công dân" },
  { value: "Hộ chiếu", label: "Hộ chiếu" },
];

export const BM001_NATIONALITY_OPTIONS: Bm001GenderOption[] = [
  { value: "Việt Nam", label: "Việt Nam" },
];

export const BM001_ETHNICITY_OPTIONS: Bm001GenderOption[] = [
  { value: "Kinh", label: "Kinh" },
];

export const BM001_RELIGION_OPTIONS: Bm001GenderOption[] = [
  { value: "Không", label: "Không" },
  { value: "Phật giáo", label: "Phật giáo" },
  { value: "Công giáo", label: "Công giáo" },
  { value: "Tin Lành", label: "Tin Lành" },
  { value: "Hòa Hảo", label: "Hòa Hảo" },
  { value: "Cao Đài", label: "Cao Đài" },
  { value: "Khác", label: "Khác" },
];

export const BM001_WARD_OPTIONS: Bm001GenderOption[] = [];
export const BM001_DOCUMENT_TYPE_OPTIONS: Bm001GenderOption[] = [];
