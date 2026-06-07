import { asyncHandler, sendSuccess } from "../../../shared/http";
import { createRegionalAdmin, listRegionalAdmins } from "./admin-regional-admin.service";
import { createRegionalAdminSchema } from "./admin-regional-admin.validation";

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
