import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import { uuidToObjectId } from "../src/db/id-map";

// Import Mongoose models
import { UserModel } from "../src/db/models/user.model";
import { StudentProfileModel } from "../src/db/models/student-profile.model";
import { VolunteerProfileModel } from "../src/db/models/volunteer-profile.model";
import { RegionalAdminProfileModel } from "../src/db/models/regional-admin-profile.model";
import { RegionModel } from "../src/db/models/region.model";
import { UniversityModel } from "../src/db/models/university.model";
import { ConfigOptionModel } from "../src/db/models/config-option.model";
import { OfferModel } from "../src/db/models/offer.model";
import { OfferRevisionModel } from "../src/db/models/offer-revision.model";
import { DocumentModel } from "../src/db/models/document.model";
import { QueryModel } from "../src/db/models/query.model";
import { QueryMessageModel } from "../src/db/models/query-message.model";
import { AnnouncementModel } from "../src/db/models/announcement.model";
import { AppConfigModel } from "../src/db/models/app-config.model";
import { AuthTokenModel } from "../src/db/models/auth-token.model";
import { AuditLogModel } from "../src/db/models/audit-log.model";

const BATCH_SIZE = 100;

async function main() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gaza40";
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully!");

  const prisma = new PrismaClient();
  console.log("Connected to PostgreSQL via Prisma!");

  const report: Record<string, { read: number; migrated: number }> = {};

  try {
    // 1. Region
    console.log("\n--- Migrating Regions ---");
    const regions = await prisma.region.findMany();
    console.log(`Found ${regions.length} SQL region records.`);
    
    if (regions.length > 0) {
      const ops = regions.map((r) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(r.id) },
          update: {
            $set: {
              code: r.code,
              name: r.name,
              isActive: r.isActive,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              deletedAt: r.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await RegionModel.bulkWrite(ops);
      report["Region"] = { read: regions.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Regions Migration Complete: ${report["Region"].migrated} records processed.`);
    }

    // 2. User
    console.log("\n--- Migrating Users ---");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} SQL user records.`);
    
    if (users.length > 0) {
      const ops = users.map((u) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(u.id) },
          update: {
            $set: {
              email: u.email,
              passwordHash: u.passwordHash,
              fullName: u.fullName,
              phone: u.phone,
              dateOfBirth: u.dateOfBirth,
              roles: u.roles,
              accountStatus: u.accountStatus,
              emailVerifiedAt: u.emailVerifiedAt,
              lastLoginAt: u.lastLoginAt,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt,
              deletedAt: u.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await UserModel.bulkWrite(ops);
      report["User"] = { read: users.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Users Migration Complete: ${report["User"].migrated} records processed.`);
    }

    // 3. StudentProfile
    console.log("\n--- Migrating Student Profiles ---");
    const studentProfiles = await prisma.studentProfile.findMany();
    console.log(`Found ${studentProfiles.length} SQL student profile records.`);
    
    if (studentProfiles.length > 0) {
      const ops = studentProfiles.map((sp) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(sp.id) },
          update: {
            $set: {
              userId: uuidToObjectId(sp.userId),
              fullNameEnglish: sp.fullNameEnglish,
              sex: sp.sex,
              dateOfBirth: sp.dateOfBirth,
              locationInGaza: sp.locationInGaza,
              locationOther: sp.locationOther,
              hasOfferSelfReported: sp.hasOfferSelfReported,
              hasVerifiedOffer: sp.hasVerifiedOffer,
              passportStatus: sp.passportStatus,
              passportLocation: sp.passportLocation,
              passportLocationOther: sp.passportLocationOther,
              emergencyContactFirstName: sp.emergencyContactFirstName,
              emergencyContactRelation: sp.emergencyContactRelation,
              emergencyContactPhone: sp.emergencyContactPhone,
              englishMoi: sp.englishMoi,
              bachelorUniGaza: sp.bachelorUniGaza,
              englishWorkplaceCertificatePossible: sp.englishWorkplaceCertificatePossible,
              englishOtherCerts: sp.englishOtherCerts,
              consentSigned: sp.consentSigned,
              profileStatus: sp.profileStatus,
              reviewedBy: sp.reviewedBy ? uuidToObjectId(sp.reviewedBy) : null,
              reviewedAt: sp.reviewedAt,
              reviewNotes: sp.reviewNotes,
              createdAt: sp.createdAt,
              updatedAt: sp.updatedAt,
              deletedAt: sp.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await StudentProfileModel.bulkWrite(ops);
      report["StudentProfile"] = { read: studentProfiles.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`StudentProfiles Migration Complete: ${report["StudentProfile"].migrated} records processed.`);
    }

    // 4. VolunteerProfile
    console.log("\n--- Migrating Volunteer Profiles ---");
    const volunteerProfiles = await prisma.volunteerProfile.findMany();
    console.log(`Found ${volunteerProfiles.length} SQL volunteer profile records.`);
    
    if (volunteerProfiles.length > 0) {
      const ops = volunteerProfiles.map((vp) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(vp.id) },
          update: {
            $set: {
              userId: uuidToObjectId(vp.userId),
              universityAffiliation: vp.universityAffiliation,
              preferredRegionId: vp.preferredRegionId ? uuidToObjectId(vp.preferredRegionId) : null,
              volunteerStatus: vp.volunteerStatus,
              reviewedBy: vp.reviewedBy ? uuidToObjectId(vp.reviewedBy) : null,
              reviewedAt: vp.reviewedAt,
              createdAt: vp.createdAt,
              updatedAt: vp.updatedAt,
              deletedAt: vp.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await VolunteerProfileModel.bulkWrite(ops);
      report["VolunteerProfile"] = { read: volunteerProfiles.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`VolunteerProfiles Migration Complete: ${report["VolunteerProfile"].migrated} records processed.`);
    }

    // 5. RegionalAdminProfile
    console.log("\n--- Migrating Regional Admin Profiles ---");
    const regionalAdminProfiles = await prisma.regionalAdminProfile.findMany();
    console.log(`Found ${regionalAdminProfiles.length} SQL regional admin profile records.`);
    
    if (regionalAdminProfiles.length > 0) {
      const ops = regionalAdminProfiles.map((rap) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(rap.id) },
          update: {
            $set: {
              userId: uuidToObjectId(rap.userId),
              regionId: uuidToObjectId(rap.regionId),
              status: rap.status,
              assignedByUserId: rap.assignedByUserId ? uuidToObjectId(rap.assignedByUserId) : null,
              createdAt: rap.createdAt,
              updatedAt: rap.updatedAt,
              deletedAt: rap.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await RegionalAdminProfileModel.bulkWrite(ops);
      report["RegionalAdminProfile"] = { read: regionalAdminProfiles.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`RegionalAdminProfiles Migration Complete: ${report["RegionalAdminProfile"].migrated} records processed.`);
    }

    // 6. University
    console.log("\n--- Migrating Universities ---");
    const universities = await prisma.university.findMany();
    console.log(`Found ${universities.length} SQL university records.`);
    
    if (universities.length > 0) {
      const ops = universities.map((uni) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(uni.id) },
          update: {
            $set: {
              regionId: uuidToObjectId(uni.regionId),
              name: uni.name,
              city: uni.city,
              isLondon: uni.isLondon,
              isActive: uni.isActive,
              createdAt: uni.createdAt,
              updatedAt: uni.updatedAt,
              deletedAt: uni.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await UniversityModel.bulkWrite(ops);
      report["University"] = { read: universities.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Universities Migration Complete: ${report["University"].migrated} records processed.`);
    }

    // 7. ConfigOption
    console.log("\n--- Migrating Config Options ---");
    const configOptions = await prisma.configOption.findMany();
    console.log(`Found ${configOptions.length} SQL config option records.`);
    
    if (configOptions.length > 0) {
      const ops = configOptions.map((co) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(co.id) },
          update: {
            $set: {
              groupKey: co.groupKey,
              value: co.value,
              labelEn: co.labelEn,
              labelAr: co.labelAr,
              sortOrder: co.sortOrder,
              isActive: co.isActive,
              metadata: co.metadata,
              createdAt: co.createdAt,
              updatedAt: co.updatedAt,
              deletedAt: co.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await ConfigOptionModel.bulkWrite(ops);
      report["ConfigOption"] = { read: configOptions.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`ConfigOptions Migration Complete: ${report["ConfigOption"].migrated} records processed.`);
    }

    // 8. Offer
    console.log("\n--- Migrating Offers ---");
    const offers = await prisma.offer.findMany();
    console.log(`Found ${offers.length} SQL offer records.`);
    
    if (offers.length > 0) {
      const ops = offers.map((o) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(o.id) },
          update: {
            $set: {
              studentUserId: uuidToObjectId(o.studentUserId),
              regionId: uuidToObjectId(o.regionId),
              universityId: o.universityId ? uuidToObjectId(o.universityId) : null,
              universityName: o.universityName,
              courseName: o.courseName,
              courseField: o.courseField,
              courseLevel: o.courseLevel,
              durationYears: Number(o.durationYears),
              programmeStartDate: o.programmeStartDate,
              offerType: o.offerType,
              conditions: o.conditions,
              tuitionFeePerYear: Number(o.tuitionFeePerYear),
              courseFeeSourceUrl: o.courseFeeSourceUrl,
              hasScholarship: o.hasScholarship,
              scholarshipName: o.scholarshipName,
              scholarshipAmountPerYear: o.scholarshipAmountPerYear ? Number(o.scholarshipAmountPerYear) : null,
              scholarshipCoversLivingCost: o.scholarshipCoversLivingCost,
              privateFundingAmount: Number(o.privateFundingAmount),
              privateFundingSource: o.privateFundingSource,
              livingCostLocationKey: o.livingCostLocationKey,
              livingCostForVisa: o.livingCostForVisa ? Number(o.livingCostForVisa) : null,
              boardingFees: o.boardingFees ? Number(o.boardingFees) : null,
              reviewStatus: o.reviewStatus,
              lockedForReview: o.lockedForReview,
              mentorId: o.mentorId ? uuidToObjectId(o.mentorId) : null,
              reviewedBy: o.reviewedBy ? uuidToObjectId(o.reviewedBy) : null,
              reviewedAt: o.reviewedAt,
              reviewNotes: o.reviewNotes,
              createdAt: o.createdAt,
              updatedAt: o.updatedAt,
              deletedAt: o.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await OfferModel.bulkWrite(ops);
      report["Offer"] = { read: offers.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Offers Migration Complete: ${report["Offer"].migrated} records processed.`);
    }

    // 9. OfferRevision
    console.log("\n--- Migrating Offer Revisions ---");
    const offerRevisions = await prisma.offerRevision.findMany();
    console.log(`Found ${offerRevisions.length} SQL offer revision records.`);
    
    if (offerRevisions.length > 0) {
      const ops = offerRevisions.map((or) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(or.id) },
          update: {
            $set: {
              offerId: uuidToObjectId(or.offerId),
              editedBy: uuidToObjectId(or.editedBy),
              beforeData: or.beforeData,
              afterData: or.afterData,
              changedFields: or.changedFields,
              createdAt: or.createdAt
            }
          },
          upsert: true
        }
      }));
      const res = await OfferRevisionModel.bulkWrite(ops);
      report["OfferRevision"] = { read: offerRevisions.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`OfferRevisions Migration Complete: ${report["OfferRevision"].migrated} records processed.`);
    }

    // 10. Document
    console.log("\n--- Migrating Documents ---");
    const docs = await prisma.document.findMany();
    console.log(`Found ${docs.length} SQL document records.`);
    
    if (docs.length > 0) {
      const ops = docs.map((d) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(d.id) },
          update: {
            $set: {
              ownerUserId: uuidToObjectId(d.ownerUserId),
              studentProfileId: d.studentProfileId ? uuidToObjectId(d.studentProfileId) : null,
              offerId: d.offerId ? uuidToObjectId(d.offerId) : null,
              documentType: d.documentType,
              originalFilename: d.originalFilename,
              mimeType: d.mimeType,
              fileSizeBytes: d.fileSizeBytes,
              storageBucket: d.storageBucket,
              storageKey: d.storageKey,
              status: d.status,
              uploadedBy: uuidToObjectId(d.uploadedBy),
              createdAt: d.createdAt,
              deletedAt: d.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await DocumentModel.bulkWrite(ops);
      report["Document"] = { read: docs.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Documents Migration Complete: ${report["Document"].migrated} records processed.`);
    }

    // 11. Query (Alert)
    console.log("\n--- Migrating Queries (Alerts) ---");
    const queries = await prisma.query.findMany();
    console.log(`Found ${queries.length} SQL query records.`);
    
    if (queries.length > 0) {
      const ops = queries.map((q) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(q.id) },
          update: {
            $set: {
              studentUserId: uuidToObjectId(q.studentUserId),
              offerId: q.offerId ? uuidToObjectId(q.offerId) : null,
              regionId: q.regionId ? uuidToObjectId(q.regionId) : null,
              queryType: q.queryType,
              title: q.title,
              message: q.message,
              status: q.status,
              assignedToUserId: q.assignedToUserId ? uuidToObjectId(q.assignedToUserId) : null,
              assignedByUserId: q.assignedByUserId ? uuidToObjectId(q.assignedByUserId) : null,
              acceptedAt: q.acceptedAt,
              resolvedAt: q.resolvedAt,
              createdAt: q.createdAt,
              updatedAt: q.updatedAt,
              deletedAt: q.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await QueryModel.bulkWrite(ops);
      report["Query"] = { read: queries.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Queries Migration Complete: ${report["Query"].migrated} records processed.`);
    }

    // 12. QueryMessage (AlertMessage)
    console.log("\n--- Migrating Query Messages (Alert Messages) ---");
    const queryMessages = await prisma.queryMessage.findMany();
    console.log(`Found ${queryMessages.length} SQL query message records.`);
    
    if (queryMessages.length > 0) {
      const ops = queryMessages.map((qm) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(qm.id) },
          update: {
            $set: {
              queryId: uuidToObjectId(qm.queryId),
              senderUserId: uuidToObjectId(qm.senderUserId),
              message: qm.message,
              createdAt: qm.createdAt,
              deletedAt: qm.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await QueryMessageModel.bulkWrite(ops);
      report["QueryMessage"] = { read: queryMessages.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`QueryMessages Migration Complete: ${report["QueryMessage"].migrated} records processed.`);
    }

    // 13. Announcement
    console.log("\n--- Migrating Announcements ---");
    const announcements = await prisma.announcement.findMany();
    console.log(`Found ${announcements.length} SQL announcement records.`);
    
    if (announcements.length > 0) {
      const ops = announcements.map((a) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(a.id) },
          update: {
            $set: {
              title: a.title,
              body: a.body,
              category: a.category,
              createdByUserId: uuidToObjectId(a.createdByUserId),
              isPublished: a.isPublished,
              publishedAt: a.publishedAt,
              createdAt: a.createdAt,
              updatedAt: a.updatedAt,
              deletedAt: a.deletedAt
            }
          },
          upsert: true
        }
      }));
      const res = await AnnouncementModel.bulkWrite(ops);
      report["Announcement"] = { read: announcements.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`Announcements Migration Complete: ${report["Announcement"].migrated} records processed.`);
    }

    // 14. AppConfig
    console.log("\n--- Migrating App Config ---");
    const appConfig = await prisma.appConfig.findMany();
    console.log(`Found ${appConfig.length} SQL app config records.`);
    
    if (appConfig.length > 0) {
      const ops = appConfig.map((ac) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(ac.id) },
          update: {
            $set: {
              key: ac.key,
              value: ac.value,
              description: ac.description,
              updatedBy: ac.updatedBy,
              createdAt: ac.createdAt,
              updatedAt: ac.updatedAt
            }
          },
          upsert: true
        }
      }));
      const res = await AppConfigModel.bulkWrite(ops);
      report["AppConfig"] = { read: appConfig.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`AppConfig Migration Complete: ${report["AppConfig"].migrated} records processed.`);
    }

    // 15. AuthToken
    console.log("\n--- Migrating Auth Tokens ---");
    const authTokens = await prisma.authToken.findMany();
    console.log(`Found ${authTokens.length} SQL auth token records.`);
    
    if (authTokens.length > 0) {
      const ops = authTokens.map((at) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(at.id) },
          update: {
            $set: {
              userId: uuidToObjectId(at.userId),
              tokenHash: at.tokenHash,
              type: at.type,
              expiresAt: at.expiresAt,
              usedAt: at.usedAt,
              createdAt: at.createdAt
            }
          },
          upsert: true
        }
      }));
      const res = await AuthTokenModel.bulkWrite(ops);
      report["AuthToken"] = { read: authTokens.length, migrated: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
      console.log(`AuthTokens Migration Complete: ${report["AuthToken"].migrated} records processed.`);
    }

    // 16. AuditLog
    console.log("\n--- Migrating Audit Logs ---");
    const auditLogsCount = await prisma.auditLog.count();
    console.log(`Found ${auditLogsCount} SQL audit log records.`);
    
    let migratedAuditCount = 0;
    for (let i = 0; i < auditLogsCount; i += BATCH_SIZE) {
      const auditBatch = await prisma.auditLog.findMany({
        skip: i,
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" }
      });
      const ops = auditBatch.map((al) => ({
        updateOne: {
          filter: { _id: uuidToObjectId(al.id) },
          update: {
            $set: {
              actorUserId: al.actorUserId ? uuidToObjectId(al.actorUserId) : null,
              action: al.action,
              entityType: al.entityType,
              entityId: al.entityId ? uuidToObjectId(al.entityId) : null,
              metadata: al.metadata,
              ipAddress: al.ipAddress,
              userAgent: al.userAgent,
              createdAt: al.createdAt
            }
          },
          upsert: true
        }
      }));
      const res = await AuditLogModel.bulkWrite(ops);
      migratedAuditCount += (res.upsertedCount || 0) + (res.modifiedCount || 0);
      console.log(`Migrated audit logs batch ${i + auditBatch.length}/${auditLogsCount}...`);
    }
    report["AuditLog"] = { read: auditLogsCount, migrated: migratedAuditCount };
    console.log(`AuditLogs Migration Complete: ${report["AuditLog"].migrated} records processed.`);

    console.log("\n====================================");
    console.log("DATABASE MIGRATION FINAL REPORT");
    console.log("====================================");
    console.table(report);
    console.log("====================================");
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
