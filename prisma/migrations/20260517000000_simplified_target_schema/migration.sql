-- CreateEnum
CREATE TYPE "RegionalAdminStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- Add roles directly to User and backfill from existing Role/UserRole records.
ALTER TABLE "User" ADD COLUMN "roles" "RoleCode"[] NOT NULL DEFAULT ARRAY[]::"RoleCode"[];

UPDATE "User"
SET "roles" = COALESCE(role_data.roles, ARRAY[]::"RoleCode"[])
FROM (
    SELECT
        "UserRole"."userId",
        ARRAY_AGG(DISTINCT "Role"."code")::"RoleCode"[] AS roles
    FROM "UserRole"
    INNER JOIN "Role" ON "Role"."id" = "UserRole"."roleId"
    WHERE "UserRole"."revokedAt" IS NULL
    GROUP BY "UserRole"."userId"
) AS role_data
WHERE "User"."id" = role_data."userId";

-- Region remains the same physical table. These additions are safe for existing rows.
ALTER TABLE "Region"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Volunteer soft-delete support.
ALTER TABLE "VolunteerProfile" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Regional admin profile replaces AdminRegion because a regional admin belongs to one region.
CREATE TABLE "RegionalAdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "RegionalAdminStatus" NOT NULL DEFAULT 'active',
    "assignedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RegionalAdminProfile_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RegionalAdminProfile" (
    "id",
    "userId",
    "regionId",
    "status",
    "assignedByUserId",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT ON ("AdminRegion"."userId")
    "AdminRegion"."id",
    "AdminRegion"."userId",
    "AdminRegion"."regionId",
    CASE WHEN "AdminRegion"."revokedAt" IS NULL THEN 'active'::"RegionalAdminStatus" ELSE 'inactive'::"RegionalAdminStatus" END,
    "AdminRegion"."assignedBy",
    "AdminRegion"."createdAt",
    CURRENT_TIMESTAMP
FROM "AdminRegion"
ORDER BY "AdminRegion"."userId", "AdminRegion"."createdAt" DESC;

-- Master/config data.
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "isLondon" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConfigOption" (
    "id" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConfigOption_pkey" PRIMARY KEY ("id")
);

-- Offer now belongs directly to the student User. Keep existing data by backfilling from StudentProfile.
ALTER TABLE "Offer" ADD COLUMN "studentUserId" TEXT;
ALTER TABLE "Offer" ADD COLUMN "universityId" TEXT;

UPDATE "Offer"
SET "studentUserId" = "StudentProfile"."userId"
FROM "StudentProfile"
WHERE "Offer"."studentProfileId" = "StudentProfile"."id";

ALTER TABLE "Offer" ALTER COLUMN "studentUserId" SET NOT NULL;

ALTER TABLE "Offer" DROP CONSTRAINT "Offer_studentProfileId_fkey";
DROP INDEX IF EXISTS "Offer_studentProfileId_idx";
ALTER TABLE "Offer" DROP COLUMN "studentProfileId";

-- Alerts and announcements.
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "offerId" TEXT,
    "regionId" TEXT,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'open',
    "assignedToUserId" TEXT,
    "assignedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertMessage" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AlertMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Indexes.
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

CREATE UNIQUE INDEX "RegionalAdminProfile_userId_key" ON "RegionalAdminProfile"("userId");
CREATE INDEX "RegionalAdminProfile_regionId_idx" ON "RegionalAdminProfile"("regionId");
CREATE INDEX "RegionalAdminProfile_status_idx" ON "RegionalAdminProfile"("status");

CREATE INDEX "Region_isActive_idx" ON "Region"("isActive");

CREATE UNIQUE INDEX "University_regionId_name_key" ON "University"("regionId", "name");
CREATE INDEX "University_regionId_idx" ON "University"("regionId");
CREATE INDEX "University_isActive_idx" ON "University"("isActive");

CREATE UNIQUE INDEX "ConfigOption_groupKey_value_key" ON "ConfigOption"("groupKey", "value");
CREATE INDEX "ConfigOption_groupKey_isActive_idx" ON "ConfigOption"("groupKey", "isActive");

CREATE INDEX "Offer_studentUserId_idx" ON "Offer"("studentUserId");
CREATE INDEX "Offer_universityId_idx" ON "Offer"("universityId");

CREATE INDEX "Alert_studentUserId_idx" ON "Alert"("studentUserId");
CREATE INDEX "Alert_offerId_idx" ON "Alert"("offerId");
CREATE INDEX "Alert_regionId_idx" ON "Alert"("regionId");
CREATE INDEX "Alert_assignedToUserId_idx" ON "Alert"("assignedToUserId");
CREATE INDEX "Alert_status_idx" ON "Alert"("status");
CREATE INDEX "Alert_alertType_idx" ON "Alert"("alertType");

CREATE INDEX "AlertMessage_alertId_idx" ON "AlertMessage"("alertId");
CREATE INDEX "AlertMessage_senderUserId_idx" ON "AlertMessage"("senderUserId");
CREATE INDEX "AlertMessage_createdAt_idx" ON "AlertMessage"("createdAt");

CREATE INDEX "Announcement_createdByUserId_idx" ON "Announcement"("createdByUserId");
CREATE INDEX "Announcement_isPublished_idx" ON "Announcement"("isPublished");
CREATE INDEX "Announcement_category_idx" ON "Announcement"("category");

-- Foreign keys.
ALTER TABLE "RegionalAdminProfile" ADD CONSTRAINT "RegionalAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegionalAdminProfile" ADD CONSTRAINT "RegionalAdminProfile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegionalAdminProfile" ADD CONSTRAINT "RegionalAdminProfile_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "University" ADD CONSTRAINT "University_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Offer" ADD CONSTRAINT "Offer_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AlertMessage" ADD CONSTRAINT "AlertMessage_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlertMessage" ADD CONSTRAINT "AlertMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old role and regional-assignment tables after data is copied.
DROP TABLE "AdminRegion";
DROP TABLE "UserRole";
DROP TABLE "Role";
