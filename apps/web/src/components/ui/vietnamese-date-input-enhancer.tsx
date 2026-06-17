"use client";

import { useEffect } from "react";

function pad2(value: string) {
  return value ? value.padStart(2, "0") : "";
}

function splitIsoDate(value: string) {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return { year: "", month: "", day: "" };
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const prototype = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function styleSelect(select: HTMLSelectElement) {
  select.style.height = "48px";
  select.style.minWidth = "0";
  select.style.width = "100%";
  select.style.border = "1px solid #d8dee8";
  select.style.borderRadius = "12px";
  select.style.background = "#ffffff";
  select.style.padding = "0 12px";
  select.style.fontSize = "16px";
  select.style.fontWeight = "600";
  select.style.color = "#0f172a";
  select.style.boxShadow = "0 1px 2px rgba(15, 23, 42, 0.08)";
  select.style.outline = "none";
}

function createOption(value: string, label: string) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function enhanceDateInput(input: HTMLInputElement) {
  if (input.dataset.vksDateEnhanced === "1") {
    return;
  }

  input.dataset.vksDateEnhanced = "1";

  const wrapper = document.createElement("div");
  wrapper.dataset.vksDateWrapper = "1";
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateColumns = "1fr 1fr 1.3fr";
  wrapper.style.gap = "8px";
  wrapper.style.width = "100%";

  const daySelect = document.createElement("select");
  const monthSelect = document.createElement("select");
  const yearSelect = document.createElement("select");

  styleSelect(daySelect);
  styleSelect(monthSelect);
  styleSelect(yearSelect);

  daySelect.appendChild(createOption("", "Ngày"));
  monthSelect.appendChild(createOption("", "Tháng"));
  yearSelect.appendChild(createOption("", "Năm"));

  for (let i = 1; i <= 31; i += 1) {
    const value = pad2(String(i));
    daySelect.appendChild(createOption(value, value));
  }

  for (let i = 1; i <= 12; i += 1) {
    const value = pad2(String(i));
    monthSelect.appendChild(createOption(value, value));
  }

  const currentYear = new Date().getFullYear();
  for (let year = currentYear + 2; year >= 1900; year -= 1) {
    yearSelect.appendChild(createOption(String(year), String(year)));
  }

  const syncSelectsFromInput = () => {
    const parsed = splitIsoDate(input.value);

    if (daySelect.value !== parsed.day) {
      daySelect.value = parsed.day;
    }

    if (monthSelect.value !== parsed.month) {
      monthSelect.value = parsed.month;
    }

    if (yearSelect.value !== parsed.year) {
      yearSelect.value = parsed.year;
    }
  };

  const syncInputFromSelects = () => {
    const day = daySelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    if (!day || !month || !year) {
      setNativeInputValue(input, "");
      return;
    }

    setNativeInputValue(input, `${year}-${month}-${day}`);
  };

  daySelect.addEventListener("change", syncInputFromSelects);
  monthSelect.addEventListener("change", syncInputFromSelects);
  yearSelect.addEventListener("change", syncInputFromSelects);

  input.addEventListener("input", syncSelectsFromInput);
  input.addEventListener("change", syncSelectsFromInput);

  syncSelectsFromInput();

  input.style.display = "none";
  input.insertAdjacentElement("afterend", wrapper);

  wrapper.appendChild(daySelect);
  wrapper.appendChild(monthSelect);
  wrapper.appendChild(yearSelect);

  const intervalId = window.setInterval(() => {
    if (!document.body.contains(input)) {
      window.clearInterval(intervalId);
      return;
    }

    syncSelectsFromInput();
  }, 400);
}

export function VietnameseDateInputEnhancer() {
  useEffect(() => {
    const scan = () => {
      document.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach((input) => {
        enhanceDateInput(input);
      });
    };

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const intervalId = window.setInterval(scan, 700);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}

export default VietnameseDateInputEnhancer;
