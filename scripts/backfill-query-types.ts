import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill of query_category to query_type...');
  try {
    const categories = await prisma.configOption.findMany({
      where: {
        groupKey: 'query_category',
        deletedAt: null
      }
    });

    console.log(`Found ${categories.length} query categories.`);

    for (const cat of categories) {
      // Determine metadata assignTo
      let assignTo = 'master_admin';
      const metadata = cat.metadata as Record<string, any> | null;
      if (metadata?.requiresRegion) {
        assignTo = 'regional_admin';
      } else if (metadata?.requiresUniversity || metadata?.requiresOffer) {
        assignTo = 'mentor';
      }

      await prisma.configOption.upsert({
        where: {
          groupKey_value: {
            groupKey: 'query_type',
            value: cat.value
          }
        },
        update: {
          labelEn: cat.labelEn,
          labelAr: cat.labelAr,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          metadata: {
            assignTo
          },
          deletedAt: null
        },
        create: {
          groupKey: 'query_type',
          value: cat.value,
          labelEn: cat.labelEn,
          labelAr: cat.labelAr,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          metadata: {
            assignTo
          }
        }
      });
      console.log(`Migrated "${cat.value}" -> query_type (assignTo: ${assignTo})`);
    }

    console.log('Backfill completed successfully!');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
