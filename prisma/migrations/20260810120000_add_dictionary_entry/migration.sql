-- CreateTable
CREATE TABLE "DictionaryEntry" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictionaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryEntry_cacheKey_key" ON "DictionaryEntry"("cacheKey");

-- CreateIndex
CREATE INDEX "DictionaryEntry_text_idx" ON "DictionaryEntry"("text");
