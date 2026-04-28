import { describe, expect, it } from "vitest";
import { clampBBox, imageToScreen, intersectionOverUnion, screenToImage } from "../geometry";

describe("geometry helpers", () => {
  it("round-trips between image and screen coordinates", () => {
    const imageBox = { x: 32, y: 48, width: 120, height: 80 };
    const viewport = { scale: 1.5, offsetX: 18, offsetY: -7 };
    const screenBox = imageToScreen(imageBox, viewport);

    expect(screenToImage(screenBox, viewport)).toEqual(imageBox);
  });

  it("clamps a bbox to image bounds", () => {
    expect(clampBBox({ x: 90, y: 40, width: 50, height: 90 }, 120, 100)).toEqual({
      x: 90,
      y: 40,
      width: 30,
      height: 60,
    });
  });

  it("computes IoU for overlapping boxes", () => {
    const iou = intersectionOverUnion(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
    );

    expect(iou).toBeCloseTo(0.1428, 3);
  });
});
