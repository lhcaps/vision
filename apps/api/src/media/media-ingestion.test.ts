import { describe, expect, it } from 'vitest';
import { buildMediaIngestionPlan, buildProcessingTargetKey } from './media-ingestion';

// Valid PNG header bytes for magic byte validation
const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

// Valid MP4 header bytes for magic byte validation
const validMp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);

describe('media ingestion planning', () => {
  it('computes checksum, deterministic object key, and image thumbnail job', async () => {
    const plan = await buildMediaIngestionPlan({
      projectId: 'proj_1',
      originalName: 'north-gate.png',
      mimeType: 'image/png',
      sizeBytes: validPngBuffer.length,
      buffer: validPngBuffer,
    });

    expect(plan.checksum).toBeDefined();
    expect(plan.storageKey).toContain('projects/proj_1/originals/');
    expect(plan.storageKey).toContain('.png');
    expect(plan.processingJobType).toBe('THUMBNAIL');
    expect(plan.mediaType).toBe('IMAGE');
  });

  it('plans frame extraction for videos', async () => {
    const plan = await buildMediaIngestionPlan({
      projectId: 'proj_1',
      originalName: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeBytes: validMp4Buffer.length,
      buffer: validMp4Buffer,
    });

    expect(plan.mediaType).toBe('VIDEO');
    expect(plan.processingJobType).toBe('EXTRACT_FRAMES');
    expect(buildProcessingTargetKey('proj_1', 'asset_1', plan.processingJobType)).toBe(
      'projects/proj_1/derivatives/asset_1/frames.json'
    );
  });
});
