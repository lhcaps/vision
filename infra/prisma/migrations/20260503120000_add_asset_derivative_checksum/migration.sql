-- Add checksum field to AssetDerivative for artifact integrity tracking
-- Required by Phase 17: CV worker returns real artifact checksum after MinIO write

ALTER TABLE "AssetDerivative" ADD COLUMN IF NOT EXISTS "checksum" TEXT;
