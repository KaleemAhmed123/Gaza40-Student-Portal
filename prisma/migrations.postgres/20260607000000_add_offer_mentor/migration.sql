ALTER TABLE "Offer" ADD COLUMN "mentorId" TEXT;

CREATE INDEX "Offer_mentorId_idx" ON "Offer"("mentorId");

ALTER TABLE "Offer" ADD CONSTRAINT "Offer_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
