import {
  GazaLocation,
  PassportLocation,
  PassportStatus,
  Sex
} from "@prisma/client";
import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  fullNameEnglish: z.string().min(1).optional(),
  sex: z.nativeEnum(Sex).optional(),
  dateOfBirth: z.coerce.date().optional(),
  locationInGaza: z.nativeEnum(GazaLocation).optional(),
  locationOther: z.string().min(1).optional(),
  hasOfferSelfReported: z.boolean().optional(),
  passportStatus: z.nativeEnum(PassportStatus).optional(),
  passportLocation: z.nativeEnum(PassportLocation).optional(),
  passportLocationOther: z.string().min(1).optional(),
  emergencyContactFirstName: z.string().min(1).optional(),
  emergencyContactRelation: z.string().min(1).optional(),
  emergencyContactPhone: z.string().min(1).optional(),
  englishMoi: z.boolean().optional(),
  bachelorUniGaza: z.string().min(1).optional(),
  englishWorkplaceCertificatePossible: z.boolean().optional(),
  englishOtherCerts: z.string().min(1).optional()
});
