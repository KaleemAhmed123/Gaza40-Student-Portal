import { prisma } from "../src/db/prisma";

const collectionsWithSoftDelete = [
  "User",
  "StudentProfile",
  "VolunteerProfile",
  "RegionalAdminProfile",
  "Region",
  "University",
  "ConfigOption",
  "Offer",
  "Document",
  "Alert",
  "AlertMessage",
  "Announcement"
] as const;

async function main() {
  for (const collection of collectionsWithSoftDelete) {
    const result = await prisma.$runCommandRaw({
      update: collection,
      updates: [
        {
          q: { deletedAt: { $exists: false } },
          u: { $set: { deletedAt: null } },
          multi: true
        }
      ]
    });

    console.log(`${collection}:`, JSON.stringify(result));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
