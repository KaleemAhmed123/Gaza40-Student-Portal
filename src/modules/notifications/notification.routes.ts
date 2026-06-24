import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getUserNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", getUserNotificationsHandler);
notificationRouter.post("/read-all", markAllNotificationsReadHandler);
notificationRouter.post("/:id/read", markNotificationReadHandler);
