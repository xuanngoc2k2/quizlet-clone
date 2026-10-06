ALTER TABLE "WritingQuestion51" ALTER COLUMN "score" SET DEFAULT 10;

UPDATE "WritingQuestion51"
SET "score" = 10
WHERE "questionNumber" = 51;