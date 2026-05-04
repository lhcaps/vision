-- Phase 20F — Baseline Migration: Full Schema from Empty Database
--
-- Purpose:
--   Initialize the complete VisionFlow database schema from a fresh PostgreSQL instance.
--   This migration creates all tables, enums, indexes, constraints, and foreign keys.
--   It includes the EvaluationReport integrity columns added in Phase 20D.
--
-- Safety:
--   - This is the baseline migration — it must be run first before any patch migrations.
--   - For fresh databases: run this migration first, then the Phase 20E patch.
--   - For existing databases: this migration should NOT be re-applied.
--
-- Migration chain ordering:
--   1. 00000000000000_init  ← baseline (this file)
--   2. 20260503120000_add_asset_derivative_checksum  ← Phase 17 patch
--   3. 20260504_evaluation_report_integrity_columns  ← Phase 20E patch
--
-- After running migrate deploy, verify with:
--   pnpm db:migrate:status
--   pnpm seed:db -- --reset

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum types
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO', 'FRAME');
CREATE TYPE "AssetDerivativeType" AS ENUM ('THUMBNAIL', 'PREVIEW', 'FRAME');
CREATE TYPE "MediaProcessingJobType" AS ENUM ('THUMBNAIL', 'EXTRACT_FRAMES');
CREATE TYPE "MediaProcessingJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "DatasetVersionStatus" AS ENUM ('DRAFT', 'LOCKED', 'ARCHIVED');
CREATE TYPE "DatasetSplit" AS ENUM ('TRAIN', 'VALID', 'TEST', 'UNASSIGNED');
CREATE TYPE "LabelType" AS ENUM ('BBOX', 'MASK', 'KEYPOINT');
CREATE TYPE "AnnotationSetStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED');
CREATE TYPE "AnnotationSource" AS ENUM ('MANUAL', 'MODEL', 'IMPORT');
CREATE TYPE "ModelType" AS ENUM ('DETECTION', 'CLASSIFICATION', 'SEGMENTATION');
CREATE TYPE "ModelRuntime" AS ENUM ('MOCK', 'ONNX', 'ULTRALYTICS');
CREATE TYPE "InferenceJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable: Project
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MediaAsset
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "frameCount" INTEGER,
    "checksum" TEXT NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AssetDerivative
CREATE TABLE "AssetDerivative" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "AssetDerivativeType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetDerivative_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MediaProcessingJob
CREATE TABLE "MediaProcessingJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "MediaProcessingJobType" NOT NULL,
    "status" "MediaProcessingJobStatus" NOT NULL DEFAULT 'QUEUED',
    "targetKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Dataset
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DatasetVersion
CREATE TABLE "DatasetVersion" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DatasetVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "parentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DatasetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DatasetVersionAsset
CREATE TABLE "DatasetVersionAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "split" "DatasetSplit" NOT NULL DEFAULT 'UNASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DatasetVersionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LabelClass
CREATE TABLE "LabelClass" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" "LabelType" NOT NULL DEFAULT 'BBOX',
    CONSTRAINT "LabelClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnnotationSet
CREATE TABLE "AnnotationSet" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AnnotationSetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnotationSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Annotation
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "annotationSetId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "labelClassId" TEXT NOT NULL,
    "type" "LabelType" NOT NULL,
    "geometryJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" "AnnotationSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ModelArtifact
CREATE TABLE "ModelArtifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "runtime" "ModelRuntime" NOT NULL,
    "artifactKey" TEXT NOT NULL,
    "configJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Pipeline
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InferenceJob
CREATE TABLE "InferenceJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "modelId" TEXT,
    "status" "InferenceJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InferenceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Prediction
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "inferenceJobId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "labelClassId" TEXT,
    "geometryJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EvaluationReport
--   Includes all integrity columns from Phase 20D (datasetVersionId, pipelineId, modelId,
--   algorithmVersion, iouThreshold, inputHash, metricsHash) so the baseline creates the full
--   schema. The Phase 20E patch migration can be applied after this baseline safely because
--   ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS are idempotent.
CREATE TABLE "EvaluationReport" (
    "id" TEXT NOT NULL,
    "inferenceJobId" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "modelId" TEXT,
    "algorithmVersion" TEXT NOT NULL,
    "iouThreshold" DOUBLE PRECISION NOT NULL,
    "inputHash" TEXT NOT NULL,
    "metricsHash" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "confusionMatrixJson" JSONB,
    "artifactKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Project
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex: MediaAsset
CREATE UNIQUE INDEX "MediaAsset_projectId_checksum_key" ON "MediaAsset"("projectId", "checksum");
CREATE INDEX "MediaAsset_projectId_createdAt_idx" ON "MediaAsset"("projectId", "createdAt");

-- CreateIndex: AssetDerivative
CREATE INDEX "AssetDerivative_assetId_type_idx" ON "AssetDerivative"("assetId", "type");

-- CreateIndex: MediaProcessingJob
CREATE INDEX "MediaProcessingJob_projectId_status_createdAt_idx" ON "MediaProcessingJob"("projectId", "status", "createdAt");
CREATE INDEX "MediaProcessingJob_assetId_type_idx" ON "MediaProcessingJob"("assetId", "type");

-- CreateIndex: Dataset
CREATE INDEX "Dataset_projectId_idx" ON "Dataset"("projectId");

-- CreateIndex: DatasetVersion
CREATE UNIQUE INDEX "DatasetVersion_datasetId_version_key" ON "DatasetVersion"("datasetId", "version");

-- CreateIndex: DatasetVersionAsset
CREATE UNIQUE INDEX "DatasetVersionAsset_datasetVersionId_assetId_key" ON "DatasetVersionAsset"("datasetVersionId", "assetId");

-- CreateIndex: LabelClass
CREATE UNIQUE INDEX "LabelClass_projectId_name_key" ON "LabelClass"("projectId", "name");

-- CreateIndex: Annotation
CREATE INDEX "Annotation_annotationSetId_assetId_idx" ON "Annotation"("annotationSetId", "assetId");

-- CreateIndex: Pipeline
CREATE INDEX "Pipeline_projectId_idx" ON "Pipeline"("projectId");

-- CreateIndex: InferenceJob
CREATE INDEX "InferenceJob_projectId_status_createdAt_idx" ON "InferenceJob"("projectId", "status", "createdAt");

-- CreateIndex: Prediction
CREATE INDEX "Prediction_inferenceJobId_assetId_idx" ON "Prediction"("inferenceJobId", "assetId");

-- CreateIndex: EvaluationReport
CREATE INDEX "EvaluationReport_inferenceJobId_createdAt_idx" ON "EvaluationReport"("inferenceJobId", "createdAt");
CREATE INDEX "EvaluationReport_datasetVersionId_createdAt_idx" ON "EvaluationReport"("datasetVersionId", "createdAt");
CREATE INDEX "EvaluationReport_inputHash_idx" ON "EvaluationReport"("inputHash");
CREATE INDEX "EvaluationReport_metricsHash_idx" ON "EvaluationReport"("metricsHash");
CREATE INDEX "EvaluationReport_algorithmVersion_idx" ON "EvaluationReport"("algorithmVersion");
CREATE UNIQUE INDEX "EvaluationReport_inferenceJobId_inputHash_key" ON "EvaluationReport"("inferenceJobId", "inputHash");

-- CreateIndex: AuditLog
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId", "createdAt");

-- AddForeignKey: MediaAsset -> Project
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AssetDerivative -> MediaAsset
ALTER TABLE "AssetDerivative" ADD CONSTRAINT "AssetDerivative_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: MediaProcessingJob -> Project
ALTER TABLE "MediaProcessingJob" ADD CONSTRAINT "MediaProcessingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: MediaProcessingJob -> MediaAsset
ALTER TABLE "MediaProcessingJob" ADD CONSTRAINT "MediaProcessingJob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Dataset -> Project
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DatasetVersion -> Dataset
ALTER TABLE "DatasetVersion" ADD CONSTRAINT "DatasetVersion_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DatasetVersionAsset -> DatasetVersion
ALTER TABLE "DatasetVersionAsset" ADD CONSTRAINT "DatasetVersionAsset_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DatasetVersionAsset -> MediaAsset
ALTER TABLE "DatasetVersionAsset" ADD CONSTRAINT "DatasetVersionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: LabelClass -> Project
ALTER TABLE "LabelClass" ADD CONSTRAINT "LabelClass_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AnnotationSet -> DatasetVersion
ALTER TABLE "AnnotationSet" ADD CONSTRAINT "AnnotationSet_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Annotation -> AnnotationSet
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_annotationSetId_fkey" FOREIGN KEY ("annotationSetId") REFERENCES "AnnotationSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Annotation -> MediaAsset
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Annotation -> LabelClass
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_labelClassId_fkey" FOREIGN KEY ("labelClassId") REFERENCES "LabelClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ModelArtifact -> Project
ALTER TABLE "ModelArtifact" ADD CONSTRAINT "ModelArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Pipeline -> Project
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: InferenceJob -> Project
ALTER TABLE "InferenceJob" ADD CONSTRAINT "InferenceJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: InferenceJob -> DatasetVersion
ALTER TABLE "InferenceJob" ADD CONSTRAINT "InferenceJob_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: InferenceJob -> Pipeline
ALTER TABLE "InferenceJob" ADD CONSTRAINT "InferenceJob_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: InferenceJob -> ModelArtifact
ALTER TABLE "InferenceJob" ADD CONSTRAINT "InferenceJob_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Prediction -> InferenceJob
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_inferenceJobId_fkey" FOREIGN KEY ("inferenceJobId") REFERENCES "InferenceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Prediction -> MediaAsset
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Prediction -> LabelClass
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_labelClassId_fkey" FOREIGN KEY ("labelClassId") REFERENCES "LabelClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: EvaluationReport -> InferenceJob
ALTER TABLE "EvaluationReport" ADD CONSTRAINT "EvaluationReport_inferenceJobId_fkey" FOREIGN KEY ("inferenceJobId") REFERENCES "InferenceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AuditLog -> Project
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
