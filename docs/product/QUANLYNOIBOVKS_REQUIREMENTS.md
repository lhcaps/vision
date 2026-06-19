# QUANLYNOIBOVKS — Product Requirements

> Canonical requirements derived from user-provided file `QUANLYNOIBOVKS_REQUIREMENTS.docx`.
> Version: 2026-06-19. All requirements are authoritative unless superseded by a later user revision.

---

## 1. DOCX Format Requirements

### 1.1 Typography

- **Font family**: Times New Roman throughout the entire document.
- **Base font size**: 13 pt for all body text.

### 1.2 Header

- Line 1 (top): `VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH`
- Line 2: `VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7` — **bold**
- Underline applied to the agency short name `KHU VỰC 7` only (not the full line).

### 1.3 Document Numbering

- Each form has a unique document number suffix, e.g. `QĐ-VKSKV7`, `LBTG-VKSKV7`.
- The form number (`Mẫu số`) differs only in the BM number.

### 1.4 Legal Basis Line

- Auto-inserted at the bottom of the header area:
  `(Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026)`
- Font size: **8 pt**.

### 1.5 National Motto / Title Area

- National motto: **Quốc hiệu** — font size 13 pt.
- Motto: `Độc lập - Tự do - Hạnh phúc` — font size **14 pt**.
- The underline under "Độc lập - Tự do - Hạnh phúc" must match the exact width of that line.
- Issue date line: `..., ngày … tháng … năm 20…` — **italic**, font size **14 pt**.
- The `Số...` line and the `ngày/tháng/năm` line must be on the same horizontal level.

### 1.6 Body Titles

- Main title / subtitle: **bold**, font size **14 pt**.
- `Điều 1`, `Điều 2`, or section headings `1.`, `2.`: **bold**.

### 1.7 Footer

- `Nơi nhận:` — **bold italic**, font size **12 pt**.
- Recipient lines below: font size **11 pt**.
- Signature title (chức vụ ký): **bold**, font size **14 pt**.
- Chức vụ placement: 2–3 blank lines between the signature line and the signature name.

### 1.8 Page Numbering

- Forms that are longer than **2 pages** must include page numbers.
- Word section property `Different First Page` must be enabled.

---

## 2. API Requirements

### 2.1 Sample Data

- Every form template must have a set of sample data for development preview.
- Sample data **must not** be hardcoded in a way that bleeds into production save/render paths.
- After a user edits form data, save/render operations **must not** revert to old sample data.

### 2.2 Render Behavior

- Save and render operations use persisted user data, never old sample values.

---

## 3. WEB Requirements

### 3.1 Form Fields

- Every form has fields that follow correct business logic.
- Field validation and defaults must match the form's semantic purpose.

### 3.2 Date Input

- Forms must include date dropdown / date picker controls.
- Dates must be selectable in Vietnamese date format where applicable.

### 3.3 Live Preview

- Form input fields must synchronize with the document preview in real time.

### 3.4 Search and Suggestions

- The form creation page includes search for input data and suggestions for related forms.

### 3.5 Stage Filter

- There is a filter/selector for the **9 investigation stages**:
  1. TIẾP NHẬN, GIẢI QUYẾT NGUỒN TIN VỀ TỘI PHẠM
  2. KHỞI TỐ, ĐIỀU TRA
  3. PHƯƠNG ÁN GIẢI QUYẾT VỤ ÁN
  4. TRUY TỐ
  5. SƠ THẨM
  6. PHÚC THẨM
  7. THI HÀNH ÁN
  8. TIẾP CÔNG DÂN
  9. CÁC GIAI ĐOẠN ĐẶC BIỆT

---

## 4. Reporting Requirements

### 4.1 Frequency

- Reports are available **weekly** and **monthly**.

### 4.2 Primary Dimensions

- Reports are structured along **3 primary dimensions**:
  - `time` — by week or month
  - `ward` — by administrative ward
  - `offense` — by offense type/legal classification

### 4.3 Data Completeness

- Data entered through forms must be stored with enough structure to support aggregation by all three dimensions above.

---

## 5. Scope Boundaries

These requirements are fulfilled across multiple phases:

| Area | Implementation Phase |
|------|---------------------|
| DOCX format (structural audit) | D.2.2 |
| DOCX render (contract pipeline) | D.2.2–D.3 |
| API sample data behavior | D.3 |
| WEB form fields / date picker | D.4 |
| WEB live preview / search / stage filter | D.4 |
| Reporting infrastructure | D.5 |

**D.2.2 scope**: Save requirements, traceability, BM-001 shadow renderer, semantic DOCX comparison, DOCX format audit.
