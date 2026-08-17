-- DropIndex
DROP INDEX "FlashcardSet_deviceId_idx";

-- AlterTable
ALTER TABLE "FlashcardSet" DROP COLUMN "deviceId";
