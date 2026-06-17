"use client";

import { useEffect } from "react";

const PINNED_BM097_DOCUMENT_ID = "144";
const PINNED_BM097_PATH = `/documents/${PINNED_BM097_DOCUMENT_ID}`;

function isDocumentsIndexPage(): boolean {
  return (
    window.location.pathname === "/documents" ||
    window.location.pathname === "/documents/"
  );
}

function textOf(element: Element | null): string {
  return element?.textContent ?? "";
}

function isBM097CardText(text: string): boolean {
  return (
    text.includes("BM-097") ||
    text.includes("Mẫu số 90") ||
    text.includes("Quyết định phê chuẩn Quyết định khởi tố bị can")
  );
}

function findBM097Card(start: Element | null): Element | null {
  let current = start;

  for (let depth = 0; current && depth < 14; depth += 1) {
    const text = textOf(current);

    if (isBM097CardText(text) && text.includes("Mở biểu mẫu")) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function rewriteBM097Anchors(): void {
  if (!isDocumentsIndexPage()) {
    return;
  }

  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"));

  for (const anchor of anchors) {
    const card = findBM097Card(anchor);

    if (!card) {
      continue;
    }

    const anchorText = textOf(anchor);
    const cardText = textOf(card);

    if (
      anchorText.includes("Mở biểu mẫu") ||
      cardText.includes("Mở biểu mẫu")
    ) {
      anchor.setAttribute("href", PINNED_BM097_PATH);
      anchor.setAttribute("data-BM097-pinned", PINNED_BM097_DOCUMENT_ID);
    }
  }
}

export function BM097OpenOverride() {
  useEffect(() => {
    if (!isDocumentsIndexPage()) {
      return;
    }

    rewriteBM097Anchors();

    const observer = new MutationObserver(() => {
      rewriteBM097Anchors();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const handleClick = (event: MouseEvent) => {
      if (!isDocumentsIndexPage()) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const clickable = target.closest("a,button");

      if (!clickable) {
        return;
      }

      const card = findBM097Card(clickable);

      if (!card) {
        return;
      }

      const clickableText = textOf(clickable);
      const cardText = textOf(card);

      if (
        !clickableText.includes("Mở biểu mẫu") &&
        !cardText.includes("Mở biểu mẫu")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }

      window.location.assign(PINNED_BM097_PATH);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}