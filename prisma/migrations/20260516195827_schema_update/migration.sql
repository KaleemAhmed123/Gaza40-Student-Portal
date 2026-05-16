-- AlterTable
ALTER TABLE "Alert" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ConfigOption" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RegionalAdminProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "University" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "StudentProfile_profileStatus_idx" ON "StudentProfile"("profileStatus");

-- CreateIndex
CREATE INDEX "VolunteerProfile_volunteerStatus_idx" ON "VolunteerProfile"("volunteerStatus");
