-- CreateEnum
CREATE TYPE "OfferReviewStatus" AS ENUM ('draft', 'under_review', 'approved', 'changes_requested', 'rejected', 'removed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'offer_letter';
ALTER TYPE "DocumentType" ADD VALUE 'scholarship_letter';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "offerId" TEXT;

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseField" TEXT NOT NULL,
    "courseLevel" TEXT NOT NULL,
    "durationYears" DECIMAL(5,2) NOT NULL,
    "programmeStartDate" TIMESTAMP(3) NOT NULL,
    "offerType" TEXT NOT NULL,
    "conditions" TEXT,
    "tuitionFeePerYear" DECIMAL(12,2) NOT NULL,
    "courseFeeSourceUrl" TEXT,
    "hasScholarship" BOOLEAN NOT NULL DEFAULT false,
    "scholarshipName" TEXT,
    "scholarshipAmountPerYear" DECIMAL(12,2),
    "scholarshipCoversLivingCost" BOOLEAN NOT NULL DEFAULT false,
    "privateFundingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "privateFundingSource" TEXT,
    "livingCostLocationKey" TEXT,
    "livingCostForVisa" DECIMAL(12,2),
    "boardingFees" DECIMAL(12,2),
    "reviewStatus" "OfferReviewStatus" NOT NULL DEFAULT 'draft',
    "lockedForReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRevision" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "beforeData" JSONB NOT NULL,
    "afterData" JSONB NOT NULL,
    "changedFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_studentProfileId_idx" ON "Offer"("studentProfileId");

-- CreateIndex
CREATE INDEX "Offer_regionId_idx" ON "Offer"("regionId");

-- CreateIndex
CREATE INDEX "Offer_reviewStatus_idx" ON "Offer"("reviewStatus");

-- CreateIndex
CREATE INDEX "Offer_offerType_idx" ON "Offer"("offerType");

-- CreateIndex
CREATE INDEX "Offer_universityName_idx" ON "Offer"("universityName");

-- CreateIndex
CREATE INDEX "Offer_courseField_idx" ON "Offer"("courseField");

-- CreateIndex
CREATE INDEX "Offer_courseLevel_idx" ON "Offer"("courseLevel");

-- CreateIndex
CREATE INDEX "Offer_createdAt_idx" ON "Offer"("createdAt");

-- CreateIndex
CREATE INDEX "OfferRevision_offerId_idx" ON "OfferRevision"("offerId");

-- CreateIndex
CREATE INDEX "OfferRevision_editedBy_idx" ON "OfferRevision"("editedBy");

-- CreateIndex
CREATE INDEX "OfferRevision_createdAt_idx" ON "OfferRevision"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");

-- CreateIndex
CREATE INDEX "Document_offerId_idx" ON "Document"("offerId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRevision" ADD CONSTRAINT "OfferRevision_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRevision" ADD CONSTRAINT "OfferRevision_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
