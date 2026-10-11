-- CreateTable
CREATE TABLE "EventMedia" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT,
    "mediaType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventMedia_eventId_createdAt_idx" ON "EventMedia"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "EventMedia_guestId_idx" ON "EventMedia"("guestId");

-- AddForeignKey
ALTER TABLE "EventMedia" ADD CONSTRAINT "EventMedia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMedia" ADD CONSTRAINT "EventMedia_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
