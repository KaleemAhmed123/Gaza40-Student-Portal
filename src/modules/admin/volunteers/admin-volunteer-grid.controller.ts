import { csvFilename } from "../../../shared/csv";
import { asyncHandler, sendSuccess } from "../../../shared/http";
import {
  exportAdminVolunteersCsv,
  listAdminVolunteers,
  updateVolunteerAssignment
} from "./admin-volunteer-grid.service";
import {
  listAdminVolunteersQuerySchema,
  updateVolunteerAssignmentSchema
} from "./admin-volunteer-grid.validation";

export const listAdminVolunteersHandler = asyncHandler(async (req, res) => {
  const query = listAdminVolunteersQuerySchema.parse(req.query);
  const result = await listAdminVolunteers(req.authUser!.id, query);
  sendSuccess(res, result);
});

export const exportAdminVolunteersHandler = asyncHandler(async (req, res) => {
  const query = listAdminVolunteersQuerySchema.parse(req.query);
  const csv = await exportAdminVolunteersCsv({
    userId: req.authUser!.id,
    query,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${csvFilename("volunteers-export")}"`);
  res.send(csv);
});

export const updateVolunteerAssignmentHandler = asyncHandler(async (req, res) => {
  const input = updateVolunteerAssignmentSchema.parse(req.body);
  const volunteer = await updateVolunteerAssignment({
    actorUserId: req.authUser!.id,
    volunteerUserId: req.params.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });

  sendSuccess(res, { volunteer });
});
