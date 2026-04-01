-- DropIndex
DROP INDEX "idx_users_email";

-- DropIndex
DROP INDEX "idx_users_username";

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("createdAt");
