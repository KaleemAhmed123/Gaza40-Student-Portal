import { universityRepository } from "../../db/repositories";

export async function searchUniversities(input: {
  query?: string;
  regionId?: string;
  limit?: number;
}) {
  const q = input.query?.trim() ?? "";
  const limit = Math.min(input.limit ?? 20, 50);

  const filter: any = { isActive: true };
  if (input.regionId) {
    filter.regionId = input.regionId;
  }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } }
    ];
  }

  const unis = await universityRepository.find(filter, {
    populate: "regionId",
    sort: { name: "asc" },
    limit
  });

  return unis.map((uni) => {
    const region: any = uni.regionId && typeof uni.regionId === "object" ? uni.regionId : null;
    return {
      id: uni.id,
      name: uni.name,
      city: uni.city,
      isLondon: uni.isLondon,
      regionId: region ? region.id : uni.regionId,
      region: region
        ? { id: region.id, code: region.code, name: region.name }
        : null
    };
  });
}
