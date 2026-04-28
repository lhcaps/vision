import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { AnnotationsService } from "./annotations.service";

describe("AnnotationsService memory fallback", () => {
  let service: AnnotationsService;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    service = new AnnotationsService({} as PrismaService);
  });

  it("loads a seeded annotation workspace with default labels and image coordinates", async () => {
    const workspace = await service.loadWorkspace(
      "proj_parking_lot",
      "dataset_proj_parking_lot_parking_v3",
      "asset_frame_1482",
    );

    expect(workspace.annotationSet.name).toBe("Manual QA Set");
    expect(workspace.asset).toMatchObject({
      id: "asset_frame_1482",
      width: 1920,
      height: 1080,
    });
    expect(workspace.labels.map((label) => label.name)).toContain("car");
    expect(workspace.annotations[0].geometry.x).toBeGreaterThanOrEqual(0);
  });

  it("creates annotations and clamps boxes to the selected asset bounds", async () => {
    const workspace = await service.loadWorkspace(
      "proj_parking_lot",
      "dataset_proj_parking_lot_parking_v3",
      "asset_frame_1482",
    );
    const annotation = await service.createAnnotation(
      "proj_parking_lot",
      workspace.annotationSet.id,
      {
        assetId: "asset_frame_1482",
        labelClassId: workspace.labels[0].id,
        geometry: {
          x: 1900,
          y: 1060,
          width: 200,
          height: 80,
        },
      },
    );

    expect(annotation.geometry).toEqual({
      x: 1900,
      y: 1060,
      width: 20,
      height: 20,
    });
  });

  it("updates labels and geometry for existing annotations", async () => {
    const workspace = await service.loadWorkspace(
      "proj_parking_lot",
      "dataset_proj_parking_lot_parking_v3",
      "asset_frame_1482",
    );
    const targetLabel = workspace.labels.find((label) => label.name === "truck")!;
    const updated = await service.updateAnnotation("proj_parking_lot", "ann_01", {
      labelClassId: targetLabel.id,
      geometry: {
        x: 400,
        y: 300,
        width: 120,
        height: 90,
      },
    });

    expect(updated).toMatchObject({
      id: "ann_01",
      label: "truck",
      geometry: {
        x: 400,
        y: 300,
        width: 120,
        height: 90,
      },
    });
  });

  it("deletes annotations by project-scoped id", async () => {
    await service.loadWorkspace(
      "proj_parking_lot",
      "dataset_proj_parking_lot_parking_v3",
      "asset_frame_1482",
    );

    await expect(service.deleteAnnotation("proj_parking_lot", "ann_01")).resolves.toEqual({
      deletedId: "ann_01",
    });
    await expect(service.deleteAnnotation("proj_parking_lot", "ann_01")).rejects.toThrow(
      "Annotation not found",
    );
  });

  it("rejects boxes that do not overlap the image", async () => {
    const workspace = await service.loadWorkspace(
      "proj_parking_lot",
      "dataset_proj_parking_lot_parking_v3",
      "asset_frame_1482",
    );

    await expect(
      service.createAnnotation("proj_parking_lot", workspace.annotationSet.id, {
        assetId: "asset_frame_1482",
        labelClassId: workspace.labels[0].id,
        geometry: {
          x: 3000,
          y: 2000,
          width: 10,
          height: 10,
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
