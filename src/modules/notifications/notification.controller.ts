import { asyncHandler, sendSuccess } from "../../shared/http";
import * as notificationService from "./notification.service";
import { z } from "zod";

const listNotificationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

export const getUserNotificationsHandler = asyncHandler(async (req, res) => {
  const query = listNotificationsQuery.parse(req.query);
  const result = await notificationService.getUserNotifications(
    req.authUser!.id,
    query.limit,
    query.skip
  );

  sendSuccess(res, result);
});

export const markNotificationReadHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.markNotificationAsRead(req.authUser!.id, id);
  sendSuccess(res, { success: true });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.authUser!.id);
  sendSuccess(res, { success: true });
});
