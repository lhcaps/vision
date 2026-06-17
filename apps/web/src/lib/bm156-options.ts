/**
 * BM-156 options.
 *
 * @deprecated Lấy signers/agency từ `useSignerOptions()` và `useCurrentAgency()`
 * trong `@/lib/options-source`. Các constant dưới đây rỗng cố ý để tránh hiển thị
 * dữ liệu giả.
 */

export type Bm156AgencyOption = {
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

export type Bm156GenderOption = { value: string; label: string };

/** @deprecated Dùng useSignerOptions() */
export const BM156_SIGNER_OPTIONS: Array<{
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
export const BM156_AGENCY_OPTIONS: Bm156AgencyOption[] = [];

export const BM156_GENDER_OPTIONS: Bm156GenderOption[] = [];
export const BM156_OFFENSE_OPTIONS: { value: string; label: string }[] = [];
export const BM156_NATIONALITY_OPTIONS: Bm156GenderOption[] = [];
export const BM156_ETHNICITY_OPTIONS: Bm156GenderOption[] = [];
export const BM156_RELIGION_OPTIONS: Bm156GenderOption[] = [];
export const BM156_IDENTITY_TYPE_OPTIONS: Bm156GenderOption[] = [];
export const BM156_POSITION_OPTIONS: { value: string; label: string }[] = [];
export const BM156_SIGN_MODE_OPTIONS: { value: string; label: string }[] = [];
export const BM156_RESIDENCE_OPTIONS: Bm156GenderOption[] = [];
export const BM156_INCIDENT_TYPE_OPTIONS: Bm156GenderOption[] = [];
