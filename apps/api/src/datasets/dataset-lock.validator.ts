import { ConflictException } from '@nestjs/common';
import { BBoxGeometrySchema, bboxArea } from '@visionflow/contracts';

export type VersionSnapshot = {
  id: string;
  datasetId: string;
  version: number;
  status: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  assets: Array<{
    assetId: string;
    split: 'TRAIN' | 'VALID' | 'TEST' | 'UNASSIGNED';
    asset: {
      id: string;
      type: 'IMAGE' | 'VIDEO' | 'FRAME';
      width: number | null;
      height: number | null;
    };
  }>;
  annotationSets: Array<{
    id: string;
    annotations: Array<{
      id: string;
      assetId: string;
      type: 'BBOX' | 'MASK' | 'KEYPOINT';
      geometryJson: unknown;
    }>;
  }>;
};

export type LockRejectionReason =
  | 'version_not_found'
  | 'version_not_draft'
  | 'no_assets'
  | 'unassigned_assets'
  | 'asset_missing_dimensions'
  | 'no_annotation_set'
  | 'no_bbox_annotations'
  | 'annotation_asset_outside_version'
  | 'bbox_invalid_geometry';

const REJECTION_MESSAGES: Record<LockRejectionReason, string> = {
  version_not_found: 'Dataset version not found for this project.',
  version_not_draft: 'Dataset version is not in DRAFT status.',
  no_assets: 'Dataset version requires at least one asset before locking.',
  unassigned_assets:
    'Dataset version contains UNASSIGNED assets. Assign all assets to TRAIN, VALID, or TEST before locking.',
  asset_missing_dimensions:
    'Dataset version contains assets without image dimensions. All images must have valid width and height for COCO export.',
  no_annotation_set:
    'Dataset version requires an annotation set with at least one annotation before locking.',
  no_bbox_annotations: 'Dataset version requires at least one BBox annotation before COCO export.',
  annotation_asset_outside_version:
    'Some annotations reference assets outside this dataset version. All annotations must belong to assets within this version.',
  bbox_invalid_geometry:
    'Some BBox annotations have invalid geometry. Width and height must be positive finite numbers.',
};

export class DatasetLockValidator {
  validate(snapshot: VersionSnapshot): void {
    if (snapshot.status !== 'DRAFT') {
      throw new ConflictException(REJECTION_MESSAGES['version_not_draft']);
    }

    if (snapshot.assets.length === 0) {
      throw new ConflictException(REJECTION_MESSAGES['no_assets']);
    }

    const unassigned = snapshot.assets.filter((a) => a.split === 'UNASSIGNED');
    if (unassigned.length > 0) {
      throw new ConflictException(REJECTION_MESSAGES['unassigned_assets']);
    }

    for (const link of snapshot.assets) {
      if (link.asset.type === 'IMAGE') {
        if (link.asset.width == null || link.asset.height == null) {
          throw new ConflictException(
            `Asset "${link.asset.id}" is missing image dimensions. All images must have valid width and height for COCO export.`
          );
        }
        if (link.asset.width <= 0 || link.asset.height <= 0) {
          throw new ConflictException(
            `Asset "${link.asset.id}" has invalid dimensions (${link.asset.width}x${link.asset.height}).`
          );
        }
      }
    }

    if (snapshot.annotationSets.length === 0) {
      throw new ConflictException(REJECTION_MESSAGES['no_annotation_set']);
    }

    const versionAssetIds = new Set(snapshot.assets.map((a) => a.assetId));

    const allAnnotations = snapshot.annotationSets.flatMap((set) => set.annotations);

    for (const ann of allAnnotations) {
      if (!versionAssetIds.has(ann.assetId)) {
        throw new ConflictException(REJECTION_MESSAGES['annotation_asset_outside_version']);
      }
    }

    const bboxAnnotations = allAnnotations.filter((ann) => ann.type === 'BBOX');
    if (bboxAnnotations.length === 0) {
      throw new ConflictException(REJECTION_MESSAGES['no_bbox_annotations']);
    }

    for (const ann of bboxAnnotations) {
      const parsed = BBoxGeometrySchema.safeParse(ann.geometryJson);
      if (!parsed.success) {
        throw new ConflictException(`BBox annotation "${ann.id}" has invalid geometry.`);
      }
      if (bboxArea(parsed.data) <= 0) {
        throw new ConflictException(
          `BBox annotation "${ann.id}" has invalid geometry. Width and height must be positive.`
        );
      }
    }

    const validAssetIds = new Set(
      snapshot.assets.filter((a) => a.asset.type === 'IMAGE').map((a) => a.assetId)
    );
    const exportableAssets = snapshot.assets.filter((a) => validAssetIds.has(a.assetId));

    if (exportableAssets.length === 0) {
      throw new ConflictException(
        'Dataset version contains no exportable image assets with valid dimensions. COCO export requires at least one image asset with width and height.'
      );
    }
  }
}

export function assertVersionNotLocked(status: 'DRAFT' | 'LOCKED' | 'ARCHIVED'): void {
  if (status !== 'DRAFT') {
    throw new ConflictException(`Dataset version is immutable once ${status.toLowerCase()}.`);
  }
}

export function assertAnnotationsImmutable(status: 'DRAFT' | 'LOCKED' | 'ARCHIVED'): void {
  if (status !== 'DRAFT') {
    throw new ConflictException('Annotations are immutable once the dataset version is locked.');
  }
}
