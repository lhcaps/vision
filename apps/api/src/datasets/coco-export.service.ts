import { createHash } from 'node:crypto';
import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import {
  CocoExportResponse,
  CocoImage,
  CocoCategory,
  CocoAnnotation,
  buildCocoInfo,
} from '@visionflow/contracts';
import { DatasetRepository } from '../repositories/dataset.repository';
import { DATASET_REPOSITORY } from '../config/provider-tokens';

const SPLIT_ORDER: Record<string, number> = { TRAIN: 0, VALID: 1, TEST: 2, UNASSIGNED: 3 };

@Injectable()
export class CocoExportService {
  constructor(@Inject(DATASET_REPOSITORY) private readonly datasetRepo: DatasetRepository) {}

  async exportCoco(projectId: string, versionId: string): Promise<CocoExportResponse> {
    const snapshot = await this.datasetRepo.getVersionSnapshot(projectId, versionId);
    if (!snapshot) {
      throw new NotFoundException('Dataset version not found for this project.');
    }

    if (snapshot.status !== 'LOCKED') {
      throw new ConflictException(
        'COCO export requires a locked dataset version. Lock the dataset version before exporting.'
      );
    }

    const exportableAssets = snapshot.assets.filter(
      (link) => link.asset.type === 'IMAGE' && link.asset.width != null && link.asset.height != null
    );

    if (exportableAssets.length === 0) {
      throw new ConflictException(
        'Dataset version contains no exportable image assets with valid dimensions. COCO export requires at least one image asset with width and height.'
      );
    }

    const validAssetIds = new Set(exportableAssets.map((a) => a.assetId));
    const allAnnotations = snapshot.annotationSets.flatMap((set) => set.annotations);
    const exportableAnnotations = allAnnotations.filter(
      (ann) => validAssetIds.has(ann.assetId) && ann.type === 'BBOX'
    );

    // Sort assets for deterministic COCO ID assignment
    const sortedImages = this.sortImages(exportableAssets);

    // Build categories from annotations using labelName
    const categories = this.buildCategories(exportableAnnotations);
    const sortedCategories = this.sortCategories(categories);

    // Assign COCO IDs sequentially after sorting
    const imageIdMap = new Map<string, number>();
    for (let i = 0; i < sortedImages.length; i++) {
      imageIdMap.set(sortedImages[i].assetId, i + 1);
    }

    const categoryIdMap = new Map<string, number>();
    for (let i = 0; i < sortedCategories.length; i++) {
      categoryIdMap.set(sortedCategories[i].labelClassId, i + 1);
    }

    // Sort annotations by mapped COCO IDs for deterministic output
    const sortedAnnotations = this.sortAnnotationsByCocoIds(
      exportableAnnotations,
      imageIdMap,
      categoryIdMap
    );

    const info = buildCocoInfo();

    const cocoImages: CocoImage[] = sortedImages.map((link) => ({
      id: imageIdMap.get(link.assetId)!,
      file_name: link.asset.storageKey,
      width: link.asset.width!,
      height: link.asset.height!,
    }));

    const cocoAnnotations: CocoAnnotation[] = sortedAnnotations.map((ann, index) => {
      const geo = ann.geometryJson as { x: number; y: number; width: number; height: number };
      return {
        id: index + 1,
        image_id: imageIdMap.get(ann.assetId)!,
        category_id: categoryIdMap.get(ann.labelClassId)!,
        bbox: [geo.x, geo.y, geo.width, geo.height],
        area: geo.width * geo.height,
        iscrowd: 0,
      };
    });

    const cocoCategories: CocoCategory[] = sortedCategories.map((cat) => ({
      id: categoryIdMap.get(cat.labelClassId)!,
      name: cat.name,
      supercategory: cat.supercategory,
    }));

    const splitSummary = {
      TRAIN: exportableAssets.filter((a) => a.split === 'TRAIN').length,
      VALID: exportableAssets.filter((a) => a.split === 'VALID').length,
      TEST: exportableAssets.filter((a) => a.split === 'TEST').length,
      UNASSIGNED: 0,
    };

    const deterministicHash = this.computeDeterministicHash(
      cocoImages,
      cocoAnnotations,
      cocoCategories
    );

    return {
      info,
      images: cocoImages,
      annotations: cocoAnnotations,
      categories: cocoCategories,
      metadata: {
        projectId,
        datasetId: snapshot.datasetId,
        datasetVersionId: snapshot.id,
        datasetVersion: snapshot.version,
        status: 'LOCKED',
        assetCount: exportableAssets.length,
        annotationCount: cocoAnnotations.length,
        categoryCount: cocoCategories.length,
        splits: splitSummary,
        deterministicHash,
      },
    };
  }

  private sortImages(
    assets: Array<{
      assetId: string;
      split: string;
      asset: { id: string; storageKey: string; width: number | null; height: number | null };
    }>
  ): typeof assets {
    return [...assets].sort((a, b) => {
      const splitDiff = (SPLIT_ORDER[a.split] ?? 99) - (SPLIT_ORDER[b.split] ?? 99);
      if (splitDiff !== 0) return splitDiff;
      const keyDiff = (a.asset.storageKey ?? a.assetId).localeCompare(
        b.asset.storageKey ?? b.assetId
      );
      if (keyDiff !== 0) return keyDiff;
      return a.assetId.localeCompare(b.assetId);
    });
  }

  private buildCategories(
    annotations: Array<{ labelClassId: string; labelName: string }>
  ): Array<{ labelClassId: string; name: string; supercategory: string }> {
    const seen = new Set<string>();
    const result: Array<{ labelClassId: string; name: string; supercategory: string }> = [];

    for (const ann of annotations) {
      if (!seen.has(ann.labelClassId)) {
        seen.add(ann.labelClassId);
        result.push({
          labelClassId: ann.labelClassId,
          name: ann.labelName,
          supercategory: 'object',
        });
      }
    }

    return result;
  }

  private sortCategories(
    categories: Array<{ labelClassId: string; name: string; supercategory: string }>
  ): typeof categories {
    return [...categories].sort((a, b) => {
      const nameDiff = a.name.localeCompare(b.name);
      if (nameDiff !== 0) return nameDiff;
      return a.labelClassId.localeCompare(b.labelClassId);
    });
  }

  private sortAnnotationsByCocoIds(
    annotations: Array<{
      id: string;
      assetId: string;
      labelClassId: string;
      geometryJson: unknown;
    }>,
    imageIdMap: Map<string, number>,
    categoryIdMap: Map<string, number>
  ): typeof annotations {
    return [...annotations].sort((a, b) => {
      const imageDiff = imageIdMap.get(a.assetId)! - imageIdMap.get(b.assetId)!;
      if (imageDiff !== 0) return imageDiff;
      const categoryDiff = categoryIdMap.get(a.labelClassId)! - categoryIdMap.get(b.labelClassId)!;
      if (categoryDiff !== 0) return categoryDiff;
      return a.id.localeCompare(b.id);
    });
  }

  private computeDeterministicHash(
    images: CocoImage[],
    annotations: CocoAnnotation[],
    categories: CocoCategory[]
  ): string {
    const stable = { images, annotations, categories };
    const keys = Object.keys(stable).sort();
    const canonicalParts: string[] = [];
    for (const key of keys) {
      canonicalParts.push(JSON.stringify(stable[key as keyof typeof stable]));
    }
    const canonical = canonicalParts.join('');
    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }
}
