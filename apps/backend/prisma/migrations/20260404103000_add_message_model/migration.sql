-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'POST');

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "type" "MessageType" NOT NULL,
    "text" VARCHAR(2000),
    "postId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_messages_conversation_created_at" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_messages_sender_id" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "idx_messages_post_id" ON "messages"("postId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "messages" ADD CONSTRAINT "messages_type_payload_check"
CHECK (
  ("type" = 'TEXT' AND "text" IS NOT NULL AND btrim("text") <> '' AND "postId" IS NULL)
  OR
  ("type" = 'POST' AND "postId" IS NOT NULL AND "text" IS NULL)
);
