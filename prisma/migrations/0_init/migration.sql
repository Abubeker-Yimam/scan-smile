-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WEDDING',
    "hostNames" TEXT NOT NULL,
    "eventDate" DATETIME,
    "venue" TEXT,
    "defaultMessage" TEXT,
    "defaultVideoUrl" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "honorific" TEXT,
    "tableName" TEXT,
    "seat" TEXT,
    "message" TEXT,
    "photoUrl" TEXT,
    "videoUrl" TEXT,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "firstScannedAt" DATETIME,
    "lastScannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code" ASC);

