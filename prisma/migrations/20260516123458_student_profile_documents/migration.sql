-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "GazaLocation" AS ENUM ('deir_al_balah', 'bureij', 'north_gaza', 'gaza_city', 'nuseirat', 'zawaidah', 'maghazi', 'khan_yunis', 'other');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('valid', 'valid_expires_within_year', 'invalid_lost_never_had_one');

-- CreateEnum
CREATE TYPE "PassportLocation" AS ENUM ('in_gaza_with_me', 'egypt', 'ramallah', 'jordan', 'other');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('national_id', 'passport', 'moi_letter', 'consent_form');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('active', 'superseded', 'deleted', 'failed_scan');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "bachelorUniGaza" TEXT,
ADD COLUMN     "consentSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContactFirstName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "englishMoi" BOOLEAN,
ADD COLUMN     "englishOtherCerts" TEXT,
ADD COLUMN     "englishWorkplaceCertificatePossible" BOOLEAN,
ADD COLUMN     "fullNameEnglish" TEXT,
ADD COLUMN     "locationInGaza" "GazaLocation",
ADD COLUMN     "locationOther" TEXT,
ADD COLUMN     "passportLocation" "PassportLocation",
ADD COLUMN     "passportLocationOther" TEXT,
ADD COLUMN     "passportStatus" "PassportStatus",
ADD COLUMN     "sex" "Sex";

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "studentProfileId" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'active',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_ownerUserId_idx" ON "Document"("ownerUserId");

-- CreateIndex
CREATE INDEX "Document_studentProfileId_idx" ON "Document"("studentProfileId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
