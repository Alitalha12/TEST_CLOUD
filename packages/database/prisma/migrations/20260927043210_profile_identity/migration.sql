-- CreateEnum
CREATE TYPE "dm_policy" AS ENUM ('EVERYONE', 'NOBODY');

-- CreateTable
CREATE TABLE "anonymous_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "animal" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_color" TEXT NOT NULL,
    "department_id" TEXT,
    "semester" INTEGER,
    "show_department" BOOLEAN NOT NULL DEFAULT true,
    "show_semester" BOOLEAN NOT NULL DEFAULT true,
    "show_interests" BOOLEAN NOT NULL DEFAULT true,
    "dm_policy" "dm_policy" NOT NULL DEFAULT 'EVERYONE',
    "name_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_name_history" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_name_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interests" (
    "profile_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("profile_id","interest_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_profiles_user_id_key" ON "anonymous_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_profiles_public_id_key" ON "anonymous_profiles"("public_id");

-- CreateIndex
CREATE INDEX "anonymous_profiles_university_id_idx" ON "anonymous_profiles"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_profiles_university_id_display_name_key" ON "anonymous_profiles"("university_id", "display_name");

-- CreateIndex
CREATE INDEX "profile_name_history_profile_id_idx" ON "profile_name_history"("profile_id");

-- CreateIndex
CREATE INDEX "profile_interests_interest_id_idx" ON "profile_interests"("interest_id");

-- AddForeignKey
ALTER TABLE "anonymous_profiles" ADD CONSTRAINT "anonymous_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_profiles" ADD CONSTRAINT "anonymous_profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_profiles" ADD CONSTRAINT "anonymous_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_name_history" ADD CONSTRAINT "profile_name_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "anonymous_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "anonymous_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
