import { prisma } from "../../db/prisma";

export async function searchUniversities(input: {
  query?: string;
  regionId?: string;
  limit?: number;
}) {
  const q = input.query?.trim() ?? "";
  const limit = Math.min(input.limit ?? 20, 50);

  return prisma.university.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(input.regionId ? { regionId: input.regionId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    select: {
      id: true,
      name: true,
      city: true,
      isLondon: true,
      regionId: true,
      region: {
        select: { id: true, code: true, name: true }
      }
    },
    orderBy: { name: "asc" },
    take: limit
  });
}
