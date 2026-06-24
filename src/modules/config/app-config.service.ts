import { prisma } from "../../db/prisma";

export async function getAppConfig(key: string) {
  const config = await prisma.appConfig.findUnique({
    where: { key }
  });
  return config?.value ?? null;
}

export async function listAppConfigs() {
  return prisma.appConfig.findMany({
    orderBy: { key: "asc" }
  });
}

export async function upsertAppConfig(key: string, value: any, updatedByUserId?: string) {
  return prisma.appConfig.upsert({
    where: { key },
    update: { value, updatedBy: updatedByUserId },
    create: { key, value, updatedBy: updatedByUserId }
  });
}
