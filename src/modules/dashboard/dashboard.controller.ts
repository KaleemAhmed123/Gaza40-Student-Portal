import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  getAdminDashboard,
  getMentorDashboard,
  getStudentDashboard
} from "./dashboard.service";

export const getStudentDashboardHandler = asyncHandler(async (req, res) => {
  const dashboard = await getStudentDashboard(req.authUser!.id);
  sendSuccess(res, { dashboard });
});

export const getAdminDashboardHandler = asyncHandler(async (req, res) => {
  const dashboard = await getAdminDashboard(req.authUser!.id);
  sendSuccess(res, { dashboard });
});

export const getMentorDashboardHandler = asyncHandler(async (req, res) => {
  const dashboard = await getMentorDashboard(req.authUser!.id);
  sendSuccess(res, { dashboard });
});
