import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newConfigOptions = [
  {
    groupKey: 'query_type',
    value: 'identity_document_missing',
    labelEn: 'I do not have a passport or national ID (Identity document missing).',
    sortOrder: 40,
    metadata: { assignTo: 'regional_admin' }
  },
  {
    groupKey: 'query_type',
    value: 'moi_certificate_missing',
    labelEn: 'I do not have an English Test Certificate or MOI Certificate.',
    sortOrder: 50,
    metadata: { assignTo: 'regional_admin' }
  },
  {
    groupKey: 'query_type',
    value: 'university_missing',
    labelEn: 'My university/college is missing from the dropdown list.',
    sortOrder: 60,
    metadata: { assignTo: 'regional_admin' }
  }
];

async function main() {
  try {
    for (const option of newConfigOptions) {
      await prisma.configOption.upsert({
        where: {
          groupKey_value: {
            groupKey: option.groupKey,
            value: option.value
          }
        },
        update: {
          labelEn: option.labelEn,
          sortOrder: option.sortOrder,
          isActive: true,
          metadata: option.metadata,
          deletedAt: null
        },
        create: option
      });
      console.log(`Upserted config option: ${option.value}`);
    }
  } catch (error) {
    console.error('Error seeding query categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
