import { prisma } from "../../db/prisma";
import { toCsv } from "../../shared/csv";
import { generateCsvDocToken } from "../documents/csv-doc-token";
import { calculateOfferFinancialSummary, parseFinancialRules } from "../offers/offer-financial";
import { STUDENT_COLUMNS, DATASET_COLUMNS } from "./csv-column-definitions";
import type { CsvJob } from "@prisma/client";
import type { CsvScope } from "./csv-query-builder";
import { buildStudentWhere } from "./csv-query-builder";
import type { StudentCsvBody } from "./csv-generator.validation";
import { env } from "../../config/env";

const BATCH_SIZE = 1000;

function pickColumns(row: Record<string, unknown>, columns: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    out[STUDENT_COLUMNS[col]?.label ?? col] = row[col] ?? "";
  }
  return out;
}

export async function runStudentExport(
  job: CsvJob,
  body: StudentCsvBody,
  scope: CsvScope,
  onProgress: (processed: number) => Promise<void>
): Promise<{ buffer: Buffer; rowCount: number; fileSizeBytes: number }> {

  // Fetch AppConfig financial rules once — reused for every offer row
  const appConfig = await prisma.appConfig.findUnique({ where: { key: "offer_financial_rules" } });
  const financialRules = appConfig ? parseFinancialRules(appConfig.value) : null;

  const apiBase = env.FRONTEND_URL.replace(/\/$/, "");
  const where = buildStudentWhere(body, scope);
  const rows: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  let processed = 0;

  while (true) {
    // Re-fetch cancelRequested on each batch to cooperatively support cancellation
    const jobCheck = await prisma.csvJob.findUnique({ where: { id: job.id }, select: { cancelRequested: true } });
    if (jobCheck?.cancelRequested) break;

    const students = await prisma.user.findMany({
      where,
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        accountStatus: true,
        studentProfile: {
          select: {
            fullNameEnglish: true,
            sex: true,
            dateOfBirth: true,
            locationInGaza: true,
            passportStatus: true,
            passportLocation: true,
            profileStatus: true,
            consentSigned: true,
            hasOfferSelfReported: true,
            hasVerifiedOffer: true,
            emergencyContactFirstName: true,
            emergencyContactRelation: true,
            emergencyContactPhone: true,
          },
        },
        studentOffers: {
          where: {
            deletedAt: null,
            ...(scope.role === "regional_admin" ? { regionId: scope.regionId } : {}),
          },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            regionId: true,
            universityId: true,
            universityName: true,
            courseName: true,
            courseField: true,
            courseLevel: true,
            offerType: true,
            durationYears: true,
            programmeStartDate: true,
            tuitionFeePerYear: true,
            hasScholarship: true,
            scholarshipName: true,
            scholarshipAmountPerYear: true,
            scholarshipCoversLivingCost: true,
            privateFundingAmount: true,
            privateFundingSource: true,
            livingCostLocationKey: true,
            livingCostForVisa: true,
            boardingFees: true,
            reviewStatus: true,
            createdAt: true,
            deletedAt: true,
            region: { select: { name: true } },
            documents: {
              where: { status: "active", deletedAt: null, documentType: { in: ["offer_letter", "scholarship_letter"] } },
              select: { id: true, documentType: true, originalFilename: true },
            },
          },
        },
      },
    });

    if (students.length === 0) break;
    cursor = students[students.length - 1].id;

    for (const student of students) {
      const sp = student.studentProfile;

      const studentBase: Record<string, unknown> = {
        studentId:                  student.id,
        fullName:                   student.fullName,
        fullNameEnglish:            sp?.fullNameEnglish ?? "",
        email:                      student.email,
        phone:                      student.phone ?? "",
        sex:                        sp?.sex ?? "",
        dateOfBirth:                sp?.dateOfBirth ?? "",
        locationInGaza:             sp?.locationInGaza ?? "",
        passportStatus:             sp?.passportStatus ?? "",
        passportLocation:           sp?.passportLocation ?? "",
        profileStatus:              sp?.profileStatus ?? "",
        consentSigned:              sp?.consentSigned ?? false,
        hasOfferSelfReported:       sp?.hasOfferSelfReported ?? false,
        hasVerifiedOffer:           sp?.hasVerifiedOffer ?? false,
        emergencyContactFirstName:  sp?.emergencyContactFirstName ?? "",
        emergencyContactRelation:   sp?.emergencyContactRelation ?? "",
        emergencyContactPhone:      sp?.emergencyContactPhone ?? "",
        accountStatus:              student.accountStatus,
        studentSignupDate:          student.createdAt,
      };

      const offers = student.studentOffers;

      if (offers.length === 0) {
        rows.push(pickColumns({ ...studentBase, country: "", university: "", offerId: "", courseName: "", courseField: "", courseLevel: "", offerType: "", durationYears: "", programmeStartDate: "", tuitionFeePerYear: "", hasScholarship: "", scholarshipName: "", scholarshipAmountPerYear: "", scholarshipCoversLivingCost: "", privateFundingAmount: "", privateFundingSource: "", financialGap: "", financialGapExists: "", offerStatus: "", approvedOffer: "", activeOffer: "", scholarshipExists: "", offerLetterUrl: "", scholarshipLetterUrl: "", offerCreatedAt: "" }, job.columns));
        continue;
      }

      for (const offer of offers) {
        let financialGap = 0;
        let financialGapExists = false;

        if (financialRules) {
          try {
            const summary = calculateOfferFinancialSummary(financialRules, {
              countryName:                offer.region.name,
              courseLevel:                offer.courseLevel,
              durationYears:              offer.durationYears,
              tuitionFeePerYear:          offer.tuitionFeePerYear,
              scholarshipAmountPerYear:   offer.scholarshipAmountPerYear ?? undefined,
              scholarshipCoversLivingCost:offer.scholarshipCoversLivingCost,
              privateFundingAmount:       offer.privateFundingAmount,
              livingCostLocationKey:      offer.livingCostLocationKey,
              livingCostForVisa:          offer.livingCostForVisa ?? undefined,
              boardingFees:               offer.boardingFees ?? undefined,
            });
            financialGap = summary.tuitionFeePerYearGap + summary.livingCostGap;
            financialGapExists = financialGap > 0;
          } catch {
            // Financial rules may not apply — leave as 0
          }
        }

        const activeOffer = !offer.deletedAt && offer.reviewStatus !== "rejected";
        const approvedOffer = offer.reviewStatus === "approved";

        const offerLetterDoc       = offer.documents.find((d) => d.documentType === "offer_letter");
        const scholarshipLetterDoc = offer.documents.find((d) => d.documentType === "scholarship_letter");

        const offerLetterUrl       = offerLetterDoc       ? `${apiBase}/api/documents/${offerLetterDoc.id}/signed-download?token=${generateCsvDocToken(offerLetterDoc.id)}`             : "";
        const scholarshipLetterUrl = scholarshipLetterDoc ? `${apiBase}/api/documents/${scholarshipLetterDoc.id}/signed-download?token=${generateCsvDocToken(scholarshipLetterDoc.id)}` : "";

        rows.push(pickColumns({
          ...studentBase,
          country:                    offer.region.name,
          university:                 offer.universityName,
          offerId:                    offer.id,
          courseName:                 offer.courseName,
          courseField:                offer.courseField,
          courseLevel:                offer.courseLevel,
          offerType:                  offer.offerType,
          durationYears:              offer.durationYears,
          programmeStartDate:         offer.programmeStartDate,
          tuitionFeePerYear:          offer.tuitionFeePerYear,
          hasScholarship:             offer.hasScholarship,
          scholarshipName:            offer.scholarshipName ?? "",
          scholarshipAmountPerYear:   offer.scholarshipAmountPerYear ?? "",
          scholarshipCoversLivingCost:offer.scholarshipCoversLivingCost,
          privateFundingAmount:       offer.privateFundingAmount,
          privateFundingSource:       offer.privateFundingSource ?? "",
          financialGap,
          financialGapExists,
          offerStatus:                offer.reviewStatus,
          approvedOffer,
          activeOffer,
          scholarshipExists:          offer.hasScholarship,
          offerLetterUrl,
          scholarshipLetterUrl,
          offerCreatedAt:             offer.createdAt,
        }, job.columns));
      }
    }

    processed += students.length;
    await onProgress(processed);

    if (students.length < BATCH_SIZE) break;
  }

  const csvString = toCsv(rows);
  const buffer = Buffer.from(csvString, "utf-8");
  return { buffer, rowCount: rows.length, fileSizeBytes: buffer.length };
}
