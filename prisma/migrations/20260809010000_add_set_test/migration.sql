-- AlterTable
ALTER TABLE "TestHistory" ADD COLUMN     "contextHashes" JSONB,
ADD COLUMN     "questionItemMap" JSONB,
ADD COLUMN     "setId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'prompt';

-- CreateIndex
CREATE INDEX "TestHistory_setId_idx" ON "TestHistory"("setId");