import { asyncHandler, sendSuccess } from "../../../shared/http";
import { listAdminVolunteers } from "./admin-volunteer-grid.service";
import { listAdminVolunteersQuerySchema } from "./admin-volunteer-grid.validation";

export const listAdminVolunteersHandler = asyncHandler(async (req, res) => {
  const query = listAdminVolunteersQuerySchema.parse(req.query);
  const result = await listAdminVolunteers(req.authUser!.id, query);
  sendSuccess(res, result);
});
