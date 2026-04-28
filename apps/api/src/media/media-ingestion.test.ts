import { describe, expect, it } from "vitest";
import { buildMediaIngestionPlan, buildProcessingTargetKey } from "./media-ingestion";

describe("media ingestion planning", () => {
  it("computes checksum, deterministic object key, and image thumbnail job", () => {
    const plan = buildMediaIngestionPlan({
      projectId: "proj_1",
      originalName: "north-gate.png",
      mimeType: "image/png",
      sizeBytes: 4,
      buffer: Buffer.from("test"),
    });

    expect(plan.checksum).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
    expect(plan.storageKey).toBe(
      "projects/proj_1/originals/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08.png",
    );
    expect(plan.processingJobType).toBe("THUMBNAIL");
  });

  it("plans frame extraction for videos", () => {
    const plan = buildMediaIngestionPlan({
      projectId: "proj_1",
      originalName: "clip.mp4",
      mimeType: "video/mp4",
      sizeBytes: 4,
      buffer: Buffer.from("clip"),
    });

    expect(plan.mediaType).toBe("VIDEO");
    expect(plan.processingJobType).toBe("EXTRACT_FRAMES");
    expect(buildProcessingTargetKey("proj_1", "asset_1", plan.processingJobType)).toBe(
      "projects/proj_1/derivatives/asset_1/frames.json",
    );
  });
});
