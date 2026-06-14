import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'signature'`);
    console.log('Added signature to DocumentType enum');
  } catch (e: any) {
    console.warn('signature:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'english_proficiency'`);
    console.log('Added english_proficiency to DocumentType enum');
  } catch (e: any) {
    console.warn('english_proficiency:', e.message);
  }

  await prisma.$disconnect();
}

main();
