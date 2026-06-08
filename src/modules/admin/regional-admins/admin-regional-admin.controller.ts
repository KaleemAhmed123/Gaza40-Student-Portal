import { asyncHandler, sendSuccess } from "../../../shared/http";
import {
  createRegionalAdmin,
  listRegionalAdmins,
  updateRegionalAdmin,
  deleteRegionalAdmin
} from "./admin-regional-admin.service";
import { createRegionalAdminSchema, updateRegionalAdminSchema } from "./admin-regional-admin.validation";

export const listRegionalAdminsHandler = asyncHandler(async (_req, res) => {
  const regionalAdmins = await listRegionalAdmins();
  sendSuccess(res, { regionalAdmins });
});

export const createRegionalAdminHandler = asyncHandler(async (req, res) => {
  const input = createRegionalAdminSchema.parse(req.body);
  const creatorUserId = req.authUser!.id;
  const regionalAdmin = await createRegionalAdmin(input, creatorUserId);
  sendSuccess(res, { regionalAdmin }, 201);
});

export const updateRegionalAdminHandler = asyncHandler(async (req, res) => {
  const input = updateRegionalAdminSchema.parse(req.body);
  const regionalAdmin = await updateRegionalAdmin(req.params.id, input);
  sendSuccess(res, { regionalAdmin });
});

export const deleteRegionalAdminHandler = asyncHandler(async (req, res) => {
  await deleteRegionalAdmin(req.params.id);
  sendSuccess(res, { deleted: true });
});
