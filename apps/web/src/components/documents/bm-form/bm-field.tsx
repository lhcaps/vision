"use client";

import type { ReactNode } from "react";
import { BM_FORM_CLASSES } from "./classes";

type BaseFieldProps = {
  label: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  fullWidth?: boolean;
};

type BmFieldTextProps = BaseFieldProps & {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: "text" | "email" | "tel" | "number";
  autoComplete?: string;
  maxLength?: number;
  trailing?: ReactNode;
};

export function BmFieldText({
  label,
  required,
  helperText,
  errorText,
  fullWidth,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  type = "text",
  autoComplete,
  maxLength,
  trailing,
}: BmFieldTextProps) {
  return (
    <div
      className={
        fullWidth
          ? `${BM_FORM_CLASSES.fieldGroup} ${BM_FORM_CLASSES.fieldFullWidth}`
          : BM_FORM_CLASSES.fieldGroup
      }
    >
      <label className={BM_FORM_CLASSES.label}>
        {label}
        {required ? (
          <span className={BM_FORM_CLASSES.requiredMark} aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={errorText ? "true" : undefined}
          className={
            errorText
              ? `${BM_FORM_CLASSES.input} ${BM_FORM_CLASSES.inputError}`
              : BM_FORM_CLASSES.input
          }
        />
        {trailing}
      </div>
      {errorText ? (
        <p className={BM_FORM_CLASSES.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={BM_FORM_CLASSES.helperText}>{helperText}</p>
      ) : null}
    </div>
  );
}

type BmFieldTextareaProps = BaseFieldProps & {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  maxLength?: number;
};

export function BmFieldTextarea({
  label,
  required,
  helperText,
  errorText,
  fullWidth,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  rows = 4,
  maxLength,
}: BmFieldTextareaProps) {
  return (
    <div
      className={
        fullWidth
          ? `${BM_FORM_CLASSES.fieldGroup} ${BM_FORM_CLASSES.fieldFullWidth}`
          : BM_FORM_CLASSES.fieldGroup
      }
    >
      <label className={BM_FORM_CLASSES.label}>
        {label}
        {required ? (
          <span className={BM_FORM_CLASSES.requiredMark} aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={errorText ? "true" : undefined}
        className={
          errorText
            ? `${BM_FORM_CLASSES.textarea} ${BM_FORM_CLASSES.inputError}`
            : BM_FORM_CLASSES.textarea
        }
      />
      {errorText ? (
        <p className={BM_FORM_CLASSES.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={BM_FORM_CLASSES.helperText}>{helperText}</p>
      ) : null}
    </div>
  );
}

type Option = { value: string; label: string };

type BmFieldSelectProps = BaseFieldProps & {
  value: string;
  onChange: (next: string) => void;
  options: readonly Option[];
  disabled?: boolean;
  placeholder?: string;
};

export function BmFieldSelect({
  label,
  required,
  helperText,
  errorText,
  fullWidth,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: BmFieldSelectProps) {
  return (
    <div
      className={
        fullWidth
          ? `${BM_FORM_CLASSES.fieldGroup} ${BM_FORM_CLASSES.fieldFullWidth}`
          : BM_FORM_CLASSES.fieldGroup
      }
    >
      <label className={BM_FORM_CLASSES.label}>
        {label}
        {required ? (
          <span className={BM_FORM_CLASSES.requiredMark} aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={errorText ? "true" : undefined}
        className={
          errorText
            ? `${BM_FORM_CLASSES.select} ${BM_FORM_CLASSES.inputError}`
            : BM_FORM_CLASSES.select
        }
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorText ? (
        <p className={BM_FORM_CLASSES.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={BM_FORM_CLASSES.helperText}>{helperText}</p>
      ) : null}
    </div>
  );
}

type BmFieldDateProps = BaseFieldProps & {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
};

export function BmFieldDate({
  label,
  required,
  helperText,
  errorText,
  fullWidth,
  value,
  onChange,
  disabled,
  min,
  max,
}: BmFieldDateProps) {
  return (
    <div
      className={
        fullWidth
          ? `${BM_FORM_CLASSES.fieldGroup} ${BM_FORM_CLASSES.fieldFullWidth}`
          : BM_FORM_CLASSES.fieldGroup
      }
    >
      <label className={BM_FORM_CLASSES.label}>
        {label}
        {required ? (
          <span className={BM_FORM_CLASSES.requiredMark} aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        aria-invalid={errorText ? "true" : undefined}
        className={
          errorText
            ? `${BM_FORM_CLASSES.input} ${BM_FORM_CLASSES.inputError}`
            : BM_FORM_CLASSES.input
        }
      />
      {errorText ? (
        <p className={BM_FORM_CLASSES.errorText}>{errorText}</p>
      ) : helperText ? (
        <p className={BM_FORM_CLASSES.helperText}>{helperText}</p>
      ) : null}
    </div>
  );
}

type BmFieldCheckboxProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export function BmFieldCheckbox({
  label,
  description,
  checked,
  onChange,
  disabled,
}: BmFieldCheckboxProps) {
  return (
    <label
      className={
        checked
          ? `${BM_FORM_CLASSES.checkboxRow} ${BM_FORM_CLASSES.checkboxRowChecked}`
          : BM_FORM_CLASSES.checkboxRow
      }
    >
      <input
        type="checkbox"
        className={BM_FORM_CLASSES.checkbox}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col gap-0.5">
        <span className={BM_FORM_CLASSES.checkboxLabel}>{label}</span>
        {description ? (
          <span className={BM_FORM_CLASSES.checkboxDescription}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
