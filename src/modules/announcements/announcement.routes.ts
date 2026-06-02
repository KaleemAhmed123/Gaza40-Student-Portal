import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireAnyActiveDbRole, requireAuth } from "../../middleware/auth.middleware";
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAdminAnnouncementHandler,
  getPublishedAnnouncementHandler,
  listAdminAnnouncementsHandler,
  listPublishedAnnouncementsHandler,
  updateAnnouncementHandler
} from "./announcement.controller";

export const announcementRouter = Router();
export const adminAnnouncementRouter = Router();

announcementRouter.use(requireAuth);
announcementRouter.get("/", listPublishedAnnouncementsHandler);
announcementRouter.get("/:id", getPublishedAnnouncementHandler);

adminAnnouncementRouter.use(requireAuth, requireAnyActiveDbRole([RoleCode.master_admin, RoleCode.regional_admin]));
adminAnnouncementRouter.get("/", listAdminAnnouncementsHandler);
adminAnnouncementRouter.post("/", createAnnouncementHandler);
adminAnnouncementRouter.get("/:id", getAdminAnnouncementHandler);
adminAnnouncementRouter.patch("/:id", updateAnnouncementHandler);
adminAnnouncementRouter.delete("/:id", deleteAnnouncementHandler);
