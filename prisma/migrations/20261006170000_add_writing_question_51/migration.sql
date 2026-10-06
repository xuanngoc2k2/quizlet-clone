CREATE TABLE "WritingQuestion51" (
    "id" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL DEFAULT 51,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "passage" JSONB NOT NULL,
    "blanks" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 2,
    "difficulty" TEXT,
    "source" TEXT,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WritingQuestion51_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WritingAttempt51" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WritingAttempt51_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WritingQuestion51_deviceId_idx" ON "WritingQuestion51"("deviceId");
CREATE INDEX "WritingQuestion51_createdAt_idx" ON "WritingQuestion51"("createdAt");
CREATE INDEX "WritingAttempt51_questionId_idx" ON "WritingAttempt51"("questionId");
CREATE INDEX "WritingAttempt51_deviceId_idx" ON "WritingAttempt51"("deviceId");
CREATE INDEX "WritingAttempt51_userId_idx" ON "WritingAttempt51"("userId");

ALTER TABLE "WritingQuestion51"
    ADD CONSTRAINT "WritingQuestion51_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WritingAttempt51"
    ADD CONSTRAINT "WritingAttempt51_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "WritingQuestion51"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WritingAttempt51"
    ADD CONSTRAINT "WritingAttempt51_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;