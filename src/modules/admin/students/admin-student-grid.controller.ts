import { csvFilename } from "../../../shared/csv";
import { asyncHandler, sendSuccess } from "../../../shared/http";
import { exportAdminStudentsCsv, listAdminStudents } from "./admin-student-grid.service";
import { listAdminStudentsQuerySchema } from "./admin-student-grid.validation";

export const listAdminStudentsHandler = asyncHandler(async (req, res) => {
  const query = listAdminStudentsQuerySchema.parse(req.query);
  const result = await listAdminStudents(req.authUser!.id, query);
  sendSuccess(res, result);
});

export const exportAdminStudentsHandler = asyncHandler(async (req, res) => {
  const query = listAdminStudentsQuerySchema.parse(req.query);
  const csv = await exportAdminStudentsCsv({
    userId: req.authUser!.id,
    query,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${csvFilename("students-export")}"`);
  res.send(csv);
});
