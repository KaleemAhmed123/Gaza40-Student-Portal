import { asyncHandler, sendSuccess } from "../../../shared/http";
import { listAdminStudents } from "./admin-student-grid.service";
import { listAdminStudentsQuerySchema } from "./admin-student-grid.validation";

export const listAdminStudentsHandler = asyncHandler(async (req, res) => {
  const query = listAdminStudentsQuerySchema.parse(req.query);
  const result = await listAdminStudents(req.authUser!.id, query);
  sendSuccess(res, result);
});
