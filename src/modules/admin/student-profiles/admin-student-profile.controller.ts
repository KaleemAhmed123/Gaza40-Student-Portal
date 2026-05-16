import { asyncHandler, sendSuccess } from "../../../shared/http";
import {
  getStudentProfileForAdmin,
  listStudentProfiles,
  reviewStudentProfile
} from "./admin-student-profile.service";
import {
  listStudentProfilesQuerySchema,
  reviewStudentProfileSchema
} from "./admin-student-profile.validation";

export const listStudentProfilesHandler = asyncHandler(async (req, res) => {
  const query = listStudentProfilesQuerySchema.parse(req.query);
  const profiles = await listStudentProfiles(query.status);
  sendSuccess(res, { profiles });
});

export const getStudentProfileForAdminHandler = asyncHandler(async (req, res) => {
  const profile = await getStudentProfileForAdmin(req.params.id);
  sendSuccess(res, { profile });
});

export const reviewStudentProfileHandler = asyncHandler(async (req, res) => {
  const input = reviewStudentProfileSchema.parse(req.body);
  const profile = await reviewStudentProfile({
    profileId: req.params.id,
    reviewerUserId: req.authUser!.id,
    status: input.status,
    notes: input.notes,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { profile });
});
