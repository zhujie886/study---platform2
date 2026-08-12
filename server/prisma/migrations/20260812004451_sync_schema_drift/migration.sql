/*
  Warnings:

  - Added the required column `skill` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultantId` to the `BookingReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BookingReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "replyToUserId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "grossAmount" REAL;
ALTER TABLE "Payment" ADD COLUMN "netAmount" REAL;
ALTER TABLE "Payment" ADD COLUMN "paidAt" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pricingRules" TEXT;
ALTER TABLE "User" ADD COLUMN "weeklySchedule" TEXT;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentFormat" TEXT NOT NULL DEFAULT 'markdown',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acceptedAnswerId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "bountyPoints" INTEGER,
    "bountyAmount" REAL,
    "resolvedAt" DATETIME,
    "editedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Question_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "Answer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionTag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentFormat" TEXT NOT NULL DEFAULT 'markdown',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "editedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploaderId" TEXT NOT NULL,
    "questionId" TEXT,
    "answerId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "type" TEXT NOT NULL DEFAULT 'file',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcceptedAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "acceptedById" TEXT NOT NULL,
    "acceptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "AcceptedAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AcceptedAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AcceptedAnswer_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsultantProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "skills" TEXT,
    "portfolioLinks" TEXT,
    "languages" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Shanghai',
    "primaryDomain" TEXT,
    "secondaryDomains" TEXT,
    "projects" TEXT,
    "certifications" TEXT,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsultantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "durationMinutes" INTEGER NOT NULL,
    "deliveryType" TEXT NOT NULL DEFAULT 'meeting',
    "scope" TEXT,
    "deliverables" TEXT,
    "notes" TEXT,
    "tagsJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consultantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AvailabilityRule_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Barrage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "emoji" TEXT,
    "mentionUserId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedUntil" DATETIME,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "colorHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "Barrage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VideoRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "MeetingInvitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VideoRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT,
    "serviceId" TEXT,
    "requesterId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cancelReason" TEXT,
    "refundAmount" REAL,
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "questionText" TEXT,
    "roomId" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startAt" DATETIME,
    "endAt" DATETIME,
    CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailableSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("amount", "completedAt", "consultantId", "createdAt", "duration", "id", "purpose", "requesterId", "roomId", "slotId", "startedAt", "status", "updatedAt") SELECT "amount", "completedAt", "consultantId", "createdAt", "duration", "id", "purpose", "requesterId", "roomId", "slotId", "startedAt", "status", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_requesterId_idx" ON "Booking"("requesterId");
CREATE INDEX "Booking_consultantId_idx" ON "Booking"("consultantId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE TABLE "new_BookingReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "images" TEXT,
    "reply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BookingReview_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BookingReview" ("bookingId", "content", "createdAt", "id", "rating", "userId") SELECT "bookingId", "content", "createdAt", "id", "rating", "userId" FROM "BookingReview";
DROP TABLE "BookingReview";
ALTER TABLE "new_BookingReview" RENAME TO "BookingReview";
CREATE UNIQUE INDEX "BookingReview_bookingId_key" ON "BookingReview"("bookingId");
CREATE INDEX "BookingReview_consultantId_idx" ON "BookingReview"("consultantId");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "videoUrl" TEXT,
    "topics" TEXT,
    "type" TEXT NOT NULL DEFAULT 'status',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("content", "createdAt", "id", "images", "shareCount", "topics", "updatedAt", "userId", "videoUrl", "viewCount", "visibility") SELECT "content", "createdAt", "id", "images", "shareCount", "topics", "updatedAt", "userId", "videoUrl", "viewCount", "visibility" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_userId_idx" ON "Post"("userId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_type_idx" ON "Post"("type");
CREATE TABLE "new_RoomParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isVideoOff" BOOLEAN NOT NULL DEFAULT false,
    "isHandRaised" BOOLEAN NOT NULL DEFAULT false,
    "isScreenSharing" BOOLEAN NOT NULL DEFAULT false,
    "canEditWhiteboard" BOOLEAN NOT NULL DEFAULT false,
    "isViewingWhiteboard" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "linkExpiry" DATETIME,
    "username" TEXT,
    CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VideoRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomParticipant" ("id", "isHandRaised", "isMuted", "isScreenSharing", "isVideoOff", "joinedAt", "leftAt", "role", "roomId", "userId") SELECT "id", "isHandRaised", "isMuted", "isScreenSharing", "isVideoOff", "joinedAt", "leftAt", "role", "roomId", "userId" FROM "RoomParticipant";
DROP TABLE "RoomParticipant";
ALTER TABLE "new_RoomParticipant" RENAME TO "RoomParticipant";
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");
CREATE UNIQUE INDEX "RoomParticipant_roomId_userId_key" ON "RoomParticipant"("roomId", "userId");
CREATE TABLE "new_VideoRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "password" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 100,
    "enableWaitingRoom" BOOLEAN NOT NULL DEFAULT false,
    "enableRecording" BOOLEAN NOT NULL DEFAULT false,
    "enableWhiteboard" BOOLEAN NOT NULL DEFAULT true,
    "enableScreenShare" BOOLEAN NOT NULL DEFAULT true,
    "enableBarrage" BOOLEAN NOT NULL DEFAULT true,
    "inviteLink" TEXT,
    "linkExpiry" DATETIME,
    "linkType" TEXT NOT NULL DEFAULT 'permanent',
    "joinPermission" TEXT NOT NULL DEFAULT 'invited',
    "customLinkName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "recordingUrl" TEXT,
    "recordingPassword" TEXT,
    "recordingVisibility" TEXT NOT NULL DEFAULT 'participants',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "scheduled" BOOLEAN,
    CONSTRAINT "VideoRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VideoRoom" ("createdAt", "description", "enableRecording", "enableScreenShare", "enableWaitingRoom", "enableWhiteboard", "endedAt", "hostId", "id", "maxParticipants", "password", "recordingUrl", "roomNumber", "scheduledAt", "startedAt", "status", "title", "updatedAt") SELECT "createdAt", "description", "enableRecording", "enableScreenShare", "enableWaitingRoom", "enableWhiteboard", "endedAt", "hostId", "id", "maxParticipants", "password", "recordingUrl", "roomNumber", "scheduledAt", "startedAt", "status", "title", "updatedAt" FROM "VideoRoom";
DROP TABLE "VideoRoom";
ALTER TABLE "new_VideoRoom" RENAME TO "VideoRoom";
CREATE UNIQUE INDEX "VideoRoom_roomNumber_key" ON "VideoRoom"("roomNumber");
CREATE UNIQUE INDEX "VideoRoom_inviteLink_key" ON "VideoRoom"("inviteLink");
CREATE INDEX "VideoRoom_hostId_idx" ON "VideoRoom"("hostId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_postId_userId_key" ON "Favorite"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_isApproved_idx" ON "Tag"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "Question_acceptedAnswerId_key" ON "Question"("acceptedAnswerId");

-- CreateIndex
CREATE INDEX "Question_userId_idx" ON "Question"("userId");

-- CreateIndex
CREATE INDEX "Question_categoryId_idx" ON "Question"("categoryId");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE INDEX "QuestionTag_tagId_idx" ON "QuestionTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTag_questionId_tagId_key" ON "QuestionTag"("questionId", "tagId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Answer_userId_idx" ON "Answer"("userId");

-- CreateIndex
CREATE INDEX "Answer_createdAt_idx" ON "Answer"("createdAt");

-- CreateIndex
CREATE INDEX "Attachment_uploaderId_idx" ON "Attachment"("uploaderId");

-- CreateIndex
CREATE INDEX "Attachment_questionId_idx" ON "Attachment"("questionId");

-- CreateIndex
CREATE INDEX "Attachment_answerId_idx" ON "Attachment"("answerId");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_questionId_idx" ON "AcceptedAnswer"("questionId");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_answerId_idx" ON "AcceptedAnswer"("answerId");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_acceptedById_idx" ON "AcceptedAnswer"("acceptedById");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantProfile_userId_key" ON "ConsultantProfile"("userId");

-- CreateIndex
CREATE INDEX "Service_consultantId_idx" ON "Service"("consultantId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "AvailabilityRule_consultantId_idx" ON "AvailabilityRule"("consultantId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_dayOfWeek_idx" ON "AvailabilityRule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Barrage_roomId_idx" ON "Barrage"("roomId");

-- CreateIndex
CREATE INDEX "MeetingInvitation_inviteeId_idx" ON "MeetingInvitation"("inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingInvitation_roomId_inviteeId_key" ON "MeetingInvitation"("roomId", "inviteeId");

-- CreateIndex
CREATE INDEX "AvailableSlot_userId_idx" ON "AvailableSlot"("userId");

-- CreateIndex
CREATE INDEX "AvailableSlot_date_idx" ON "AvailableSlot"("date");

-- CreateIndex
CREATE INDEX "BreakoutRoom_mainRoomId_idx" ON "BreakoutRoom"("mainRoomId");

-- CreateIndex
CREATE INDEX "Calendar_userId_idx" ON "Calendar"("userId");

-- CreateIndex
CREATE INDEX "Calendar_startTime_idx" ON "Calendar"("startTime");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "MeetingRecord_userId_idx" ON "MeetingRecord"("userId");

-- CreateIndex
CREATE INDEX "Memo_userId_idx" ON "Memo"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_payerId_idx" ON "Payment"("payerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Poll_roomId_idx" ON "Poll"("roomId");

-- CreateIndex
CREATE INDEX "ReminderTask_userId_idx" ON "ReminderTask"("userId");

-- CreateIndex
CREATE INDEX "ReminderTask_status_idx" ON "ReminderTask"("status");

-- CreateIndex
CREATE INDEX "ReminderTask_triggerTime_idx" ON "ReminderTask"("triggerTime");

-- CreateIndex
CREATE INDEX "SharedMemo_sharedWithId_idx" ON "SharedMemo"("sharedWithId");

-- CreateIndex
CREATE INDEX "Timeline_userId_idx" ON "Timeline"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "Whiteboard_roomId_idx" ON "Whiteboard"("roomId");

-- CreateIndex
CREATE INDEX "WhiteboardAction_whiteboardId_idx" ON "WhiteboardAction"("whiteboardId");
