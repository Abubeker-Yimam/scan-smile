-- The language an enquiry was written in, so the reply can start in the same one.
ALTER TABLE "Inquiry" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
