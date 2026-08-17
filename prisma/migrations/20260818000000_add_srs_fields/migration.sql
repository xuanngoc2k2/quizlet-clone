-- AlterTable: Add SRS fields to CardProgress
ALTER TABLE "CardProgress" ADD COLUMN "srsInterval" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CardProgress" ADD COLUMN "srsDue" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CardProgress" ADD COLUMN "srsEase" DOUBLE PRECISION NOT NULL DEFAULT 2.5;
ALTER TABLE "CardProgress" ADD COLUMN "srsLapses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CardProgress" ADD COLUMN "srsState" TEXT NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "CardProgress_deviceId_srsDue_idx" ON "CardProgress"("deviceId", "srsDue");
