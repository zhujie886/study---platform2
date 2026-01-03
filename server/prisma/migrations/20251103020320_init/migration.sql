-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "encryptedContent" TEXT,
    "encryptionSalt" TEXT,
    "labels" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" DATETIME,
    "locationReminder" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Memo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedMemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedMemo_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SharedMemo_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "color" TEXT,
    "reminders" TEXT,
    "attendees" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Shanghai',
    "source" TEXT DEFAULT 'manual',
    "memoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Calendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "timeBlocks" TEXT,
    "tasks" TEXT,
    "utilizationRate" REAL DEFAULT 0,
    "totalWorkTime" INTEGER DEFAULT 0,
    "statistics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "participants" TEXT,
    "actionItems" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeetingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "triggerTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReminderTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SharedMemo_memoId_sharedWithId_key" ON "SharedMemo"("memoId", "sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_userId_date_key" ON "Timeline"("userId", "date");
