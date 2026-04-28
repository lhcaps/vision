import { describe, expect, it } from "vitest";
import { assertJobTransition, canTransitionJob } from "../jobs";

describe("inference job state machine", () => {
  it("allows queued jobs to start", () => {
    expect(canTransitionJob("QUEUED", "RUNNING")).toBe(true);
  });

  it("rejects terminal state rewind", () => {
    expect(canTransitionJob("SUCCEEDED", "RUNNING")).toBe(false);
    expect(() => assertJobTransition("FAILED", "SUCCEEDED")).toThrow(
      "Invalid inference job transition",
    );
  });
});
