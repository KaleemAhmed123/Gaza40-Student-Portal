import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Add some more regions first
  const extraRegions = [
    { code: "DE", name: "Germany" },
    { code: "CA", name: "Canada" },
    { code: "FR", name: "France" },
    { code: "SE", name: "Sweden" },
    { code: "NL", name: "Netherlands" }
  ];

  console.log("Upserting regions...");
  for (const r of extraRegions) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name, isActive: true, deletedAt: null },
      create: r
    });
  }

  // Get all regions to map by name
  const dbRegions = await prisma.region.findMany();
  const regionMap = new Map(dbRegions.map((r) => [r.name.toLowerCase(), r.id]));

  const universities = [
    // UK
    { name: "University of Oxford", regionName: "UK", city: "Oxford", isLondon: false },
    { name: "University of Cambridge", regionName: "UK", city: "Cambridge", isLondon: false },
    { name: "Imperial College London", regionName: "UK", city: "London", isLondon: true },
    { name: "University College London", regionName: "UK", city: "London", isLondon: true },
    { name: "King's College London", regionName: "UK", city: "London", isLondon: true },
    { name: "University of Manchester", regionName: "UK", city: "Manchester", isLondon: false },
    { name: "University of Edinburgh", regionName: "UK", city: "Edinburgh", isLondon: false },

    // US
    { name: "Harvard University", regionName: "US", city: "Cambridge", isLondon: false },
    { name: "MIT", regionName: "US", city: "Cambridge", isLondon: false },
    { name: "Stanford University", regionName: "US", city: "Stanford", isLondon: false },
    { name: "Columbia University", regionName: "US", city: "New York", isLondon: false },
    { name: "Yale University", regionName: "US", city: "New Haven", isLondon: false },
    { name: "Princeton University", regionName: "US", city: "Princeton", isLondon: false },

    // Egypt
    { name: "Cairo University", regionName: "Egypt", city: "Giza", isLondon: false },
    { name: "Ain Shams University", regionName: "Egypt", city: "Cairo", isLondon: false },
    { name: "Alexandria University", regionName: "Egypt", city: "Alexandria", isLondon: false },
    { name: "The American University in Cairo", regionName: "Egypt", city: "New Cairo", isLondon: false },

    // Germany
    { name: "Technical University of Munich", regionName: "Germany", city: "Munich", isLondon: false },
    { name: "Heidelberg University", regionName: "Germany", city: "Heidelberg", isLondon: false },
    { name: "Ludwig Maximilian University of Munich", regionName: "Germany", city: "Munich", isLondon: false },

    // Canada
    { name: "University of Toronto", regionName: "Canada", city: "Toronto", isLondon: false },
    { name: "McGill University", regionName: "Canada", city: "Montreal", isLondon: false },
    { name: "University of British Columbia", regionName: "Canada", city: "Vancouver", isLondon: false }
  ];

  console.log("Creating universities...");
  for (const uni of universities) {
    const regionId = regionMap.get(uni.regionName.toLowerCase());
    if (!regionId) {
      console.warn(`Region not found for ${uni.regionName}, skipping university ${uni.name}`);
      continue;
    }

    // Try to find if already exists
    const existing = await prisma.university.findFirst({
      where: { name: uni.name, regionId }
    });

    if (existing) {
      await prisma.university.update({
        where: { id: existing.id },
        data: {
          city: uni.city,
          isLondon: uni.isLondon,
          isActive: true,
          deletedAt: null
        }
      });
    } else {
      await prisma.university.create({
        data: {
          name: uni.name,
          regionId,
          city: uni.city,
          isLondon: uni.isLondon,
          isActive: true
        }
      });
    }
  }

  console.log("Successfully seeded regions and universities!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
