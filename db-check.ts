import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB CHECK ===");
  const regions = await prisma.region.findMany();
  console.log("Regions in DB:", regions.map(r => ({ id: r.id, code: r.code, name: r.name, isActive: r.isActive })));

  const unis = await prisma.university.findMany({
    include: { region: true }
  });
  console.log("Universities in DB:", unis.map(u => ({ id: u.id, name: u.name, regionName: u.region.name, isActive: u.isActive })));
}

main().catch(err => {
  console.error("DB check failed:", err);
});
