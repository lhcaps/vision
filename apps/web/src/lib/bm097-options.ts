/**
 * BM-097 options.
 *
 * @deprecated Lấy signers/agency từ `useSignerOptions()` và `useCurrentAgency()`
 * trong `@/lib/options-source`. Các constant dưới đây rỗng cố ý để tránh hiển thị
 * dữ liệu giả.
 */

export type Bm097OffenseOption = {
  id: string;
  label: string;
  offenseName: string;
  legalArticle?: string;
  criminalCodeText?: string;
  [key: string]: unknown;
};

export type Bm097AgencyOption = {
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

export type Bm097GenderOption = { value: string; label: string };

/** @deprecated Dùng useSignerOptions() */
export const BM097_SIGNER_OPTIONS: Array<{
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
export const BM097_AGENCY_OPTIONS: Bm097AgencyOption[] = [];

export const BM097_OFFENSE_OPTIONS: Bm097OffenseOption[] = [];
export const BM097_GENDER_OPTIONS: Bm097GenderOption[] = [];
export const BM097_IDENTITY_TYPE_OPTIONS: Bm097GenderOption[] = [];
export const BM097_NATIONALITY_OPTIONS: Bm097GenderOption[] = [];
export const BM097_ETHNICITY_OPTIONS: Bm097GenderOption[] = [];
export const BM097_RELIGION_OPTIONS: Bm097GenderOption[] = [];
export const BM097_POSITION_OPTIONS: { value: string; label: string }[] = [];
export const BM097_SIGN_MODE_OPTIONS: { value: string; label: string }[] = [];
export const BM097_RESIDENCE_OPTIONS: Bm097GenderOption[] = [];
