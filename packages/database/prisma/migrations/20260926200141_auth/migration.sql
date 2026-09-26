-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "platform" AS ENUM ('ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "push_preview" AS ENUM ('NONE', 'SENDER_ONLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "status" "account_status" NOT NULL DEFAULT 'ACTIVE',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "restricted_until" TIMESTAMP(3),
    "suspended_until" TIMESTAMP(3),
    "onboarded_at" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "user_id" TEXT NOT NULL,
    "email_encrypted" TEXT NOT NULL,
    "email_key_version" INTEGER NOT NULL,
    "email_domain" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "verification_challenges" (
    "id" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "platform" "platform" NOT NULL,
    "device_label" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "replaced_by_id" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_email_hashes" (
    "email_hash" TEXT NOT NULL,
    "reason" TEXT,
    "sanction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banned_email_hashes_pkey" PRIMARY KEY ("email_hash")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" TEXT NOT NULL,
    "notification_prefs" JSONB NOT NULL DEFAULT '{}',
    "push_preview" "push_preview" NOT NULL DEFAULT 'SENDER_ONLY',
    "theme" TEXT,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_hash_key" ON "users"("email_hash");

-- CreateIndex
CREATE INDEX "users_university_id_status_idx" ON "users"("university_id", "status");

-- CreateIndex
CREATE INDEX "verification_challenges_email_hash_created_at_idx" ON "verification_challenges"("email_hash", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "sessions_family_id_idx" ON "sessions"("family_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
