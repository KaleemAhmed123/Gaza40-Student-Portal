import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  createConfigOption,
  createRegion,
  createUniversity,
  deactivateConfigOption,
  deactivateRegion,
  deactivateUniversity,
  listConfigOptions,
  listRegions,
  listUniversities,
  updateConfigOption,
  updateRegion,
  updateUniversity
} from "./config.service";
import {
  createConfigOptionSchema,
  createRegionSchema,
  createUniversitySchema,
  listOptionsQuerySchema,
  listUniversitiesQuerySchema,
  updateConfigOptionSchema,
  updateRegionSchema,
  updateUniversitySchema
} from "./config.validation";

export const listRegionsHandler = asyncHandler(async (_req, res) => {
  const regions = await listRegions();
  sendSuccess(res, { regions });
});

export const listConfigOptionsHandler = asyncHandler(async (req, res) => {
  const query = listOptionsQuerySchema.parse(req.query);
  const options = await listConfigOptions(query.groupKey);
  sendSuccess(res, { options });
});

export const listUniversitiesHandler = asyncHandler(async (req, res) => {
  const query = listUniversitiesQuerySchema.parse(req.query);
  const universities = await listUniversities(query);
  sendSuccess(res, { universities });
});

export const createConfigOptionHandler = asyncHandler(async (req, res) => {
  const input = createConfigOptionSchema.parse(req.body);
  const option = await createConfigOption(input);
  sendSuccess(res, { option }, 201);
});

export const updateConfigOptionHandler = asyncHandler(async (req, res) => {
  const input = updateConfigOptionSchema.parse(req.body);
  const option = await updateConfigOption(req.params.id, input);
  sendSuccess(res, { option });
});

export const deactivateConfigOptionHandler = asyncHandler(async (req, res) => {
  const option = await deactivateConfigOption(req.params.id);
  sendSuccess(res, { option });
});

export const createRegionHandler = asyncHandler(async (req, res) => {
  const input = createRegionSchema.parse(req.body);
  const region = await createRegion(input);
  sendSuccess(res, { region }, 201);
});

export const updateRegionHandler = asyncHandler(async (req, res) => {
  const input = updateRegionSchema.parse(req.body);
  const region = await updateRegion(req.params.id, input);
  sendSuccess(res, { region });
});

export const deactivateRegionHandler = asyncHandler(async (req, res) => {
  const region = await deactivateRegion(req.params.id);
  sendSuccess(res, { region });
});

export const createUniversityHandler = asyncHandler(async (req, res) => {
  const input = createUniversitySchema.parse(req.body);
  const university = await createUniversity(input);
  sendSuccess(res, { university }, 201);
});

export const updateUniversityHandler = asyncHandler(async (req, res) => {
  const input = updateUniversitySchema.parse(req.body);
  const university = await updateUniversity(req.params.id, input);
  sendSuccess(res, { university });
});

export const deactivateUniversityHandler = asyncHandler(async (req, res) => {
  const university = await deactivateUniversity(req.params.id);
  sendSuccess(res, { university });
});
