#!/usr/bin/env node
/**
 * VisionFlow Studio — Demo Data Validator
 *
 * Validates the demo snapshot so reviewers can walk through the workbench
 * without running Docker/PostgreSQL.
 *
 * Usage: pnpm seed
 */

import { demoSnapshot, pipelineValidation } from '../apps/web/src/data/demo'

const log = (msg, ok) => console.log(`${ok ? '✓' : '✗'} ${msg}`)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' VisionFlow Studio — Demo Data Validation')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log(`Project:    ${demoSnapshot.project.name}`)
console.log(`Assets:     ${demoSnapshot.media.length}`)
console.log(`Annotations:${demoSnapshot.annotations.length}`)
console.log('')
console.log('Pipeline:')
console.log(`  Version:  ${demoSnapshot.pipeline.version}`)
console.log(`  Nodes:    ${demoSnapshot.pipeline.nodes.length}`)
console.log(`  Edges:    ${demoSnapshot.pipeline.edges.length}`)
console.log(`  Valid:    ${pipelineValidation.valid ? 'YES' : 'NO ✗'}`)
console.log('')
console.log('Latest Job:')
console.log(`  ID:       ${demoSnapshot.job.id}`)
console.log(`  Status:   ${demoSnapshot.job.status}`)
console.log(`  Progress: ${demoSnapshot.job.progress}%`)
console.log('')

// Validate all annotations are within media bounds
const badAnnotations = demoSnapshot.annotations.filter((a) => {
  const { x, y, width, height } = a.geometry
  const media = demoSnapshot.media.find((m) => m.id === a.assetId)
  if (!media) return true
  return x < 0 || y < 0 || x + width > media.width || y + height > media.height
})

if (badAnnotations.length > 0) {
  console.error(`✗ Found ${badAnnotations.length} annotations with invalid geometry`)
  process.exit(1)
}
log('All annotations are within media bounds', true)

console.log('')
console.log('Demo state is valid and ready.')
console.log('Start with: pnpm dev:web')
console.log('')
