"use client";

import type { ReactNode } from "react";
import { BM_FORM_CLASSES } from "./classes";

type BmFormSectionProps = {
  title: string;
  description?: string;
  badge?: string;
  requiredCount?: number;
  fullWidth?: boolean;
  children: ReactNode;
};

/**
 * Section gom nhóm field theo nghiệp vụ.
 * Tất cả biểu mẫu PHẢI dùng BmFormSection thay vì <section> + h1 rời rạc.
 */
export function BmFormSection({
  title,
  description,
  badge,
  requiredCount,
  fullWidth = true,
  children,
}: BmFormSectionProps) {
  return (
    <section className={BM_FORM_CLASSES.section}>
      <header className={BM_FORM_CLASSES.sectionHeader}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={BM_FORM_CLASSES.sectionTitle}>{title}</h2>
          {badge ? (
            <span className={BM_FORM_CLASSES.sectionBadge}>{badge}</span>
          ) : null}
          {typeof requiredCount === "number" && requiredCount > 0 ? (
            <span className={BM_FORM_CLASSES.sectionRequiredCount}>
              {requiredCount} trường bắt buộc
            </span>
          ) : null}
        </div>
        {description ? (
          <p className={BM_FORM_CLASSES.sectionDescription}>{description}</p>
        ) : null}
      </header>
      <div
        className={
          fullWidth
            ? "mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
            : "mt-5 flex flex-col gap-4"
        }
      >
        {children}
      </div>
    </section>
  );
}
