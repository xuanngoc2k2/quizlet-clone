-- CreateTable
CREATE TABLE "WritingQuestion54" (
    "id" TEXT NOT NULL,
    "examRef" TEXT,
    "instruction" TEXT NOT NULL,
    "imageData" TEXT,
    "imageMimeType" TEXT,
    "imageAlt" TEXT,
    "rangeMin" INTEGER NOT NULL DEFAULT 600,
    "rangeMax" INTEGER NOT NULL DEFAULT 700,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WritingQuestion54_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingAttempt54" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "answer" TEXT NOT NULL,
    "cellsJson" JSONB,
    "submissionType" TEXT NOT NULL DEFAULT 'typed',
    "imageData" TEXT,
    "imageMimeType" TEXT,
    "ocrText" TEXT,
    "ocrCellsJson" JSONB,
    "gradeJson" JSONB,
    "totalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WritingAttempt54_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WritingQuestion54_deviceId_idx" ON "WritingQuestion54"("deviceId");
CREATE INDEX "WritingQuestion54_createdAt_idx" ON "WritingQuestion54"("createdAt");
CREATE INDEX "WritingAttempt54_questionId_idx" ON "WritingAttempt54"("questionId");
CREATE INDEX "WritingAttempt54_deviceId_idx" ON "WritingAttempt54"("deviceId");
CREATE INDEX "WritingAttempt54_userId_idx" ON "WritingAttempt54"("userId");

-- AddForeignKey
ALTER TABLE "WritingQuestion54" ADD CONSTRAINT "WritingQuestion54_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WritingAttempt54" ADD CONSTRAINT "WritingAttempt54_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "WritingQuestion54"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WritingAttempt54" ADD CONSTRAINT "WritingAttempt54_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
