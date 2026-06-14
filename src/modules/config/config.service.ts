import {
  regionRepository,
  configOptionRepository,
  universityRepository
} from "../../db/repositories";
import { ApiError } from "../../shared/http";
import type {
  createConfigOptionSchema,
  createRegionSchema,
  createUniversitySchema,
  listUniversitiesQuerySchema,
  updateConfigOptionSchema,
  updateRegionSchema,
  updateUniversitySchema
} from "./config.validation";
import type { z } from "zod";

type CreateConfigOptionInput = z.infer<typeof createConfigOptionSchema>;
type UpdateConfigOptionInput = z.infer<typeof updateConfigOptionSchema>;
type CreateRegionInput = z.infer<typeof createRegionSchema>;
type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
type CreateUniversityInput = z.infer<typeof createUniversitySchema>;
type UpdateUniversityInput = z.infer<typeof updateUniversitySchema>;
type ListUniversitiesQuery = z.infer<typeof listUniversitiesQuerySchema>;

export async function listRegions() {
  return regionRepository.find({ isActive: true }, { sort: { name: "asc" } });
}

export async function listConfigOptions(groupKey: string) {
  return configOptionRepository.findActiveByGroup(groupKey);
}

export async function listUniversities(query: ListUniversitiesQuery) {
  // First, find all active region IDs to simulate the join condition
  const activeRegions = await regionRepository.find({ isActive: true });
  const activeRegionIds = activeRegions.map((r) => r._id);

  const filter: any = {
    isActive: true,
    regionId: { $in: activeRegionIds }
  };

  if (query.regionId) {
    filter.regionId = query.regionId;
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  return universityRepository.find(filter, {
    populate: "regionId",
    sort: { name: "asc" },
    limit: 50
  });
}

export async function createConfigOption(input: CreateConfigOptionInput) {
  return configOptionRepository.create({
    groupKey: input.groupKey,
    value: input.value,
    labelEn: input.labelEn,
    labelAr: input.labelAr,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    metadata: input.metadata
  });
}

export async function updateConfigOption(id: string, input: UpdateConfigOptionInput) {
  await ensureConfigOption(id);

  return configOptionRepository.update(id, {
    ...input,
    metadata: input.metadata
  });
}

export async function deactivateConfigOption(id: string) {
  await ensureConfigOption(id);

  return configOptionRepository.update(id, {
    isActive: false,
    deletedAt: new Date()
  });
}

export async function createRegion(input: CreateRegionInput) {
  return regionRepository.create({
    code: input.code,
    name: input.name,
    isActive: input.isActive
  });
}

export async function updateRegion(id: string, input: UpdateRegionInput) {
  await ensureRegion(id);

  return regionRepository.update(id, input);
}

export async function deactivateRegion(id: string) {
  await ensureRegion(id);

  return regionRepository.update(id, {
    isActive: false,
    deletedAt: new Date()
  });
}

export async function createUniversity(input: CreateUniversityInput) {
  await ensureRegion(input.regionId);

  const university = await universityRepository.create({
    regionId: input.regionId,
    name: input.name,
    city: input.city,
    isLondon: input.isLondon,
    isActive: input.isActive
  });

  return university.populate("regionId");
}

export async function updateUniversity(id: string, input: UpdateUniversityInput) {
  await ensureUniversity(id);

  if (input.regionId) {
    await ensureRegion(input.regionId);
  }

  const university = await universityRepository.update(id, input);
  return university ? university.populate("regionId") : null;
}

export async function deactivateUniversity(id: string) {
  await ensureUniversity(id);

  const university = await universityRepository.update(id, {
    isActive: false,
    deletedAt: new Date()
  });

  return university ? university.populate("regionId") : null;
}

async function ensureConfigOption(id: string) {
  const option = await configOptionRepository.findById(id);
  if (!option) {
    throw new ApiError(404, "Config option not found");
  }
}

async function ensureRegion(id: string) {
  const region = await regionRepository.findById(id);
  if (!region) {
    throw new ApiError(404, "Region not found");
  }
}

async function ensureUniversity(id: string) {
  const university = await universityRepository.findById(id);
  if (!university) {
    throw new ApiError(404, "University not found");
  }
}
