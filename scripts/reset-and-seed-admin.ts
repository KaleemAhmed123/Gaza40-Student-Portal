import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Import Mongoose models
import { UserModel } from "../src/db/models/user.model";
import { StudentProfileModel } from "../src/db/models/student-profile.model";
import { VolunteerProfileModel } from "../src/db/models/volunteer-profile.model";
import { RegionalAdminProfileModel } from "../src/db/models/regional-admin-profile.model";
import { AuthTokenModel } from "../src/db/models/auth-token.model";
import { OfferModel } from "../src/db/models/offer.model";
import { DocumentModel } from "../src/db/models/document.model";
import { QueryModel } from "../src/db/models/query.model";
import { QueryMessageModel } from "../src/db/models/query-message.model";
import { RoleCode, AccountStatus } from "../src/db/models/enums";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://hamza1851:%24%24Shamb3lla%24%241432%24%24@cluster0.htsfc2c.mongodb.net/gaza40";
const adminEmail = process.env.DEV_ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.DEV_ADMIN_PASSWORD || "AdminPassword123!";
const adminName = "Development Master Admin";

async function main() {
  // --- MONGODB ---
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  console.log("Emptying MongoDB User and related collections...");
  await UserModel.deleteMany({});
  await StudentProfileModel.deleteMany({});
  await VolunteerProfileModel.deleteMany({});
  await RegionalAdminProfileModel.deleteMany({});
  await AuthTokenModel.deleteMany({});
  await OfferModel.deleteMany({});
  await DocumentModel.deleteMany({});
  await QueryModel.deleteMany({});
  await QueryMessageModel.deleteMany({});
  console.log("MongoDB collections emptied successfully!");

  console.log("Seeding MongoDB development Master Admin...");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const adminUserMongo = await UserModel.create({
    email: adminEmail,
    passwordHash,
    fullName: adminName,
    accountStatus: AccountStatus.active,
    roles: [RoleCode.master_admin]
  });
  console.log("MongoDB Master Admin seeded successfully.");

  // --- POSTGRESQL (PRISMA) ---
  console.log("\nConnecting to PostgreSQL via Prisma...");
  const prisma = new PrismaClient();
  
  try {
    console.log("Emptying PostgreSQL User and related tables...");
    // Disable constraints or delete in order of dependency to prevent foreign key errors
    await prisma.auditLog.deleteMany({});
    await prisma.queryMessage.deleteMany({});
    await prisma.query.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.offerRevision.deleteMany({});
    await prisma.offer.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.authToken.deleteMany({});
    await prisma.regionalAdminProfile.deleteMany({});
    await prisma.volunteerProfile.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("PostgreSQL tables emptied successfully!");

    console.log("Seeding PostgreSQL development Master Admin...");
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        accountStatus: "active",
        roles: ["master_admin"]
      }
    });
    console.log("PostgreSQL Master Admin seeded successfully.");
  } catch (error) {
    console.warn("PostgreSQL reset/seeding skipped or failed (likely due to DB permissions/state):", error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n================================================");
  console.log("RESET AND SEED SUMMARY");
  console.log("================================================");
  console.log(`MongoDB Admin ID: ${adminUserMongo._id}`);
  console.log(`Admin Email:    ${adminEmail}`);
  console.log(`Admin Password: ${adminPassword}`);
  console.log("================================================");
}

main()
  .catch((err) => {
    console.error("Error executing reset and seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
