/**
 * BM-053 options.
 *
 * @deprecated Lấy signers/agency từ `useSignerOptions()` và `useCurrentAgency()`
 * trong `@/lib/options-source`. Các constant dưới đây rỗng cố ý để tránh hiển thị
 * dữ liệu giả. Component nên dùng hook từ options-source.
 */

export type Bm053ResidenceOption = {
  id: string;
  ward_name: string;
  district_name?: string;
  city_name?: string;
  label?: string;
  address?: string;
};

export type Bm053OffenseOption = {
  id: string;
  label: string;
  offenseName: string;
  legalArticle?: string;
  criminalCodeText?: string;
  [key: string]: unknown;
};

export type Bm053AgencyOption = {
  id: string;
  label: string;
  name: string;
  shortName?: string | null;
  parentName?: string | null;
  parentAgencyName?: string | null;
  address?: string | null;
  phone?: string | null;
  monitoringUnitName?: string | null;
  short_name?: string | null;
  parent_name?: string | null;
  parent_agency_name?: string | null;
  monitoring_unit_name?: string | null;
  issuePlace?: string | null;
  issue_place?: string | null;
  email?: string | null;
  fax?: string | null;
};

export type Bm053GenderOption = { value: string; label: string };

/** @deprecated Dùng useSignerOptions() */
export const BM053_SIGNER_OPTIONS: Array<{
  id: string;
  label: string;
  fullName: string;
  positionTitle: string;
  signerName: string;
  officialFullName?: string;
  officialPositionTitle?: string;
  prosecutorName?: string;
  [key: string]: unknown;
}> = [];

/** @deprecated Dùng useCurrentAgency() */
export const BM053_AGENCY_OPTIONS: Bm053AgencyOption[] = [];

export const BM053_OFFENSE_OPTIONS: Bm053OffenseOption[] = [];

export const BM053_GENDER_OPTIONS: Bm053GenderOption[] = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
];

export const BM053_NATIONALITY_OPTIONS: Bm053GenderOption[] = [
  { value: "Việt Nam", label: "Việt Nam" },
];

export const BM053_ETHNICITY_OPTIONS: Bm053GenderOption[] = [
  { value: "Kinh", label: "Kinh" },
];

export const BM053_IDENTITY_TYPE_OPTIONS: Bm053GenderOption[] = [
  { value: "CMND", label: "CMND" },
  { value: "CCCD", label: "Căn cước công dân" },
  { value: "Hộ chiếu", label: "Hộ chiếu" },
];

export const BM053_POSITION_OPTIONS: { value: string; label: string }[] = [];
export const BM053_SIGN_MODE_OPTIONS: { value: string; label: string }[] = [];
export const BM053_RESIDENCE_OPTIONS: Bm053ResidenceOption[] = [];
