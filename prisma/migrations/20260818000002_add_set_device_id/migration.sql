-- AlterTable
ALTER TABLE "FlashcardSet" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE INDEX "FlashcardSet_deviceId_idx" ON "FlashcardSet"("deviceId");
