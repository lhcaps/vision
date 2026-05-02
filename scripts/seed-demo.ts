#!/usr/bin/env node
/**
 * VisionFlow Studio — Demo Data Validator & Creator
 *
 * Validates the demo snapshot so reviewers can walk through the workbench
 * without running Docker/PostgreSQL.
 *
 * Usage:
 *   pnpm seed              # Validate in-memory demo data
 *   pnpm seed --api        # Create demo data via API (requires Docker/Postgres)
 */

import { demoSnapshot, pipelineValidation } from '../apps/web/src/data/demo';

const API_MODE = process.argv.includes('--api');
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

const log = (msg, ok) => console.log(`${ok ? '✓' : '✗'} ${msg}`);
const warn = (msg) => console.warn(`⚠  ${msg}`);

interface CreatedEntities {
  projectId: string;
  mediaIds: string[];
  versionId: string;
  labelIds: string[];
  annotationIds: string[];
  pipelineId: string;
  jobId: string;
}

async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/health/live`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function createDemoDataViaAPI(): Promise<CreatedEntities> {
  console.log('');
  console.log('━━━ Creating Demo Data via API ━━━');
  console.log(`API: ${API_BASE}`);
  console.log('');

  const healthy = await checkApiHealth();
  if (!healthy) {
    warn('API is not reachable. Falling back to validation mode.');
    warn('Start the API with: pnpm dev:api');
    console.log('');
    return {
      projectId: '',
      mediaIds: [],
      versionId: '',
      labelIds: [],
      annotationIds: [],
      pipelineId: '',
      jobId: '',
    };
  }

  console.log('API is healthy. Creating demo data...');
  console.log('');

  // 1. Create project
  console.log('  Creating project...');
  const project = await apiPost<{ id: string }>('/api/projects', {
    name: demoSnapshot.project.name,
    description: 'Demo project created by seed script',
  });
  console.log(`    Project: ${project.id}`);
  const projectId = project.id;

  // 2. Create media assets
  console.log('  Creating media assets...');
  const mediaIds: string[] = [];
  for (const media of demoSnapshot.media) {
    const asset = await apiPost<{ id: string }>('/api/media', {
      name: media.name,
      type: media.type,
      url: `https://picsum.photos/seed/${media.id}/1920/1080`,
      width: media.width,
      height: media.height,
      checksum: media.checksum,
      split: media.split,
      projectId,
    });
    mediaIds.push(asset.id);
    console.log(`    Asset: ${asset.id} (${media.name})`);
  }

  // 3. Create dataset version
  console.log('  Creating dataset version...');
  const version = await apiPost<{ id: string }>('/api/datasets/versions', {
    projectId,
    name: 'v1.3 locked',
    description: 'Demo dataset version',
  });
  console.log(`    Version: ${version.id}`);
  const versionId = version.id;

  // 4. Add assets to version
  console.log('  Adding assets to version...');
  for (const assetId of mediaIds) {
    await apiPost(`/api/datasets/versions/${versionId}/assets`, {
      assetId,
      projectId,
    });
  }
  console.log(`    Added ${mediaIds.length} assets`);

  // 5. Create annotation labels
  console.log('  Creating annotation labels...');
  const labels = [
    { name: 'car', color: '#6ad9a1' },
    { name: 'van', color: '#5cc8ff' },
    { name: 'truck', color: '#f5b85d' },
  ];
  const labelIds: string[] = [];
  for (const label of labels) {
    const result = await apiPost<{ id: string }>('/api/labels', {
      name: label.name,
      color: label.color,
      projectId,
    });
    labelIds.push(result.id);
    console.log(`    Label: ${result.id} (${label.name})`);
  }

  // 6. Create annotations
  console.log('  Creating annotations...');
  const annotationIds: string[] = [];
  for (const ann of demoSnapshot.annotations) {
    const assetIndex = demoSnapshot.media.findIndex((m) => m.id === ann.assetId);
    const labelIndex = labels.findIndex((l) => l.name === ann.label);
    if (assetIndex === -1 || labelIndex === -1) continue;

    const result = await apiPost<{ id: string }>('/api/annotations', {
      assetId: mediaIds[assetIndex],
      labelId: labelIds[labelIndex],
      geometry: ann.geometry,
      source: ann.source,
      confidence: ann.confidence,
      projectId,
    });
    annotationIds.push(result.id);
    console.log(`    Annotation: ${result.id}`);
  }

  // 7. Create pipeline
  console.log('  Creating pipeline...');
  const pipeline = await apiPost<{ id: string }>('/api/pipelines', {
    projectId,
    name: 'Demo Pipeline',
    version: demoSnapshot.pipeline.version,
    nodes: demoSnapshot.pipeline.nodes,
    edges: demoSnapshot.pipeline.edges,
  });
  console.log(`    Pipeline: ${pipeline.id}`);
  const pipelineId = pipeline.id;

  // 8. Create demo job
  console.log('  Creating demo job...');
  const job = await apiPost<{ id: string }>('/api/jobs', {
    projectId,
    pipelineId,
    datasetVersionId: versionId,
    status: 'QUEUED',
    progress: 0,
  });
  console.log(`    Job: ${job.id}`);
  const jobId = job.id;

  console.log('');
  console.log('━━━ Demo Data Created Successfully ━━━');
  console.log(`  Project:     ${projectId}`);
  console.log(`  Media:       ${mediaIds.length} assets`);
  console.log(`  Annotations: ${annotationIds.length}`);
  console.log(`  Pipeline:    ${pipelineId}`);
  console.log(`  Job:         ${jobId}`);
  console.log('');

  return {
    projectId,
    mediaIds,
    versionId,
    labelIds,
    annotationIds,
    pipelineId,
    jobId,
  };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' VisionFlow Studio — Demo Data Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Project:    ${demoSnapshot.project.name}`);
  console.log(`Assets:     ${demoSnapshot.media.length}`);
  console.log(`Annotations:${demoSnapshot.annotations.length}`);
  console.log('');
  console.log('Pipeline:');
  console.log(`  Version:  ${demoSnapshot.pipeline.version}`);
  console.log(`  Nodes:    ${demoSnapshot.pipeline.nodes.length}`);
  console.log(`  Edges:    ${demoSnapshot.pipeline.edges.length}`);
  console.log(`  Valid:    ${pipelineValidation.valid ? 'YES' : 'NO ✗'}`);
  console.log('');
  console.log('Latest Job:');
  console.log(`  ID:       ${demoSnapshot.job.id}`);
  console.log(`  Status:   ${demoSnapshot.job.status}`);
  console.log(`  Progress: ${demoSnapshot.job.progress}%`);
  console.log('');

  // Validate all annotations are within media bounds
  const badAnnotations = demoSnapshot.annotations.filter((a) => {
    const { x, y, width, height } = a.geometry;
    const media = demoSnapshot.media.find((m) => m.id === a.assetId);
    if (!media) return true;
    return x < 0 || y < 0 || x + width > media.width || y + height > media.height;
  });

  if (badAnnotations.length > 0) {
    console.error(`✗ Found ${badAnnotations.length} annotations with invalid geometry`);
    process.exit(1);
  }
  log('All annotations are within media bounds', true);

  console.log('');

  // If --api flag, create data via API
  if (API_MODE) {
    await createDemoDataViaAPI();
  }

  console.log('Demo state is valid and ready.');
  console.log('Start with: pnpm dev:web');
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
