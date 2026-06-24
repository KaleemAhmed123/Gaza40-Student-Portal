import { asyncHandler, sendSuccess } from "../../../shared/http";
import { getAdminVolunteerProfile } from "./admin-volunteer-profile.service";

export const getAdminVolunteerProfileHandler = asyncHandler(async (req, res) => {
  const result = await getAdminVolunteerProfile(req.authUser!.id, req.params.id);
  sendSuccess(res, result);
});
