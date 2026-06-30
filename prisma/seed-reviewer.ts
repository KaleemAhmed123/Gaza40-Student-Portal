import { PrismaClient, RoleCode, AccountStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "reviewer@example.com";
  const password = "ReviewerPassword123!";
  const fullName = "Development Profile Reviewer";

  console.log("Seeding reviewer account...");
  const passwordHash = await bcrypt.hash(password, 12);

  const reviewer = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      plainPassword: password,
      fullName,
      accountStatus: AccountStatus.active,
      roles: { set: [RoleCode.reviewer] },
      deletedAt: null
    },
    create: {
      email,
      passwordHash,
      plainPassword: password,
      fullName,
      accountStatus: AccountStatus.active,
      roles: [RoleCode.reviewer],
      deletedAt: null
    }
  });

  console.log("Profile Reviewer seeded successfully!");
  console.log(`Email: ${reviewer.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
