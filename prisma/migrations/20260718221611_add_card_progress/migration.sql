-- CreateTable
CREATE TABLE "CardProgress" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "rememberedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardProgress_setId_deviceId_idx" ON "CardProgress"("setId", "deviceId");

-- CreateIndex
CREATE INDEX "CardProgress_deviceId_idx" ON "CardProgress"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "CardProgress_deviceId_cardId_key" ON "CardProgress"("deviceId", "cardId");
