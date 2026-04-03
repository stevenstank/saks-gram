-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "participants" UUID[] NOT NULL,
    "participantsKey" VARCHAR(255) NOT NULL,
    "lastMessageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participantsKey_key" ON "conversations"("participantsKey");

-- CreateIndex
CREATE INDEX "idx_conversations_updated_at" ON "conversations"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_conversations_participants_gin" ON "conversations" USING GIN ("participants");
