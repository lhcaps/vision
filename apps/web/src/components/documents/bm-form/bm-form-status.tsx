"use client";

import type { ReactNode } from "react";
import { BM_FORM_CLASSES } from "./classes";

type StatusKind = "idle" | "loading" | "success" | "error" | "warning";

type BmFormStatusProps = {
  kind: StatusKind;
  children?: ReactNode;
  title?: string;
};

export function BmFormStatus({ kind, children, title }: BmFormStatusProps) {
  if (kind === "idle") return null;

  const className =
    kind === "loading"
      ? BM_FORM_CLASSES.statusLoading
      : kind === "success"
        ? BM_FORM_CLASSES.statusSuccess
        : kind === "error"
          ? BM_FORM_CLASSES.statusError
          : BM_FORM_CLASSES.statusWarning;

  return (
    <div role={kind === "error" ? "alert" : "status"} className={className}>
      {kind === "loading" ? (
        <span className={BM_FORM_CLASSES.spinner} aria-hidden />
      ) : null}
      <span className="flex flex-col">
        {title ? <strong className="font-semibold">{title}</strong> : null}
        {children ? <span>{children}</span> : null}
      </span>
    </div>
  );
}

type BmFormActionsProps = {
  primaryLabel: string;
  primaryIcon?: ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
  meta?: ReactNode;
};

export function BmFormActions({
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
  meta,
}: BmFormActionsProps) {
  return (
    <div className={BM_FORM_CLASSES.actionsRow}>
      <div className={BM_FORM_CLASSES.actionsLeft}>{meta}</div>
      <div className={BM_FORM_CLASSES.actionsRight}>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            className={BM_FORM_CLASSES.buttonSecondary}
            onClick={onSecondary}
            disabled={secondaryDisabled}
          >
            {secondaryLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={BM_FORM_CLASSES.buttonPrimary}
          onClick={onPrimary}
          disabled={primaryDisabled}
        >
          {primaryIcon}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
