import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const accounts = [
  {
    email: "admin@example.com",
    newPassword: "AdminSaleem@1416",
    label: "Master Admin",
  },
  {
    email: "regional.uk@example.com",
    newPassword: "RegionalAdminSaleem@1416",
    label: "Regional Admin",
  },
  {
    email: "volunteer@example.com",
    newPassword: "MentorSaleem@1416",
    label: "Mentor",
  },
];

async function main() {
  console.log("Updating passwords for seeded accounts...\n");

  for (const account of accounts) {
    const user = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (!user) {
      console.warn(`⚠️  User not found: ${account.email} (${account.label}) — skipping.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(account.newPassword, 12);

    await prisma.user.update({
      where: { email: account.email },
      data: { passwordHash },
    });

    console.log(`✅  ${account.label} (${account.email}) — password updated.`);
  }

  console.log("\nDone. Old passwords will no longer work.");
}

main()
  .catch((error) => {
    console.error("Error updating passwords:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
