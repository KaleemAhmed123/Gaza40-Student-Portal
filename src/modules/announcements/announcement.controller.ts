import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncement,
  getPublishedAnnouncement,
  listAdminAnnouncements,
  listPublishedAnnouncements,
  updateAnnouncement
} from "./announcement.service";
import {
  createAnnouncementSchema,
  listAdminAnnouncementsQuerySchema,
  listAnnouncementsQuerySchema,
  updateAnnouncementSchema
} from "./announcement.validation";

export const listPublishedAnnouncementsHandler = asyncHandler(async (req, res) => {
  const query = listAnnouncementsQuerySchema.parse(req.query);
  const announcements = await listPublishedAnnouncements(query, req.authUser!);
  sendSuccess(res, { announcements });
});

export const getPublishedAnnouncementHandler = asyncHandler(async (req, res) => {
  const announcement = await getPublishedAnnouncement(req.params.id);
  sendSuccess(res, { announcement });
});

export const listAdminAnnouncementsHandler = asyncHandler(async (req, res) => {
  const query = listAdminAnnouncementsQuerySchema.parse(req.query);
  const announcements = await listAdminAnnouncements(query, req.authUser!);
  sendSuccess(res, { announcements });
});

export const getAdminAnnouncementHandler = asyncHandler(async (req, res) => {
  const announcement = await getAdminAnnouncement(req.params.id, req.authUser!);
  sendSuccess(res, { announcement });
});

export const createAnnouncementHandler = asyncHandler(async (req, res) => {
  const input = createAnnouncementSchema.parse(req.body);
  const announcement = await createAnnouncement({
    user: req.authUser!,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { announcement }, 201);
});

export const updateAnnouncementHandler = asyncHandler(async (req, res) => {
  const input = updateAnnouncementSchema.parse(req.body);
  const announcement = await updateAnnouncement({
    user: req.authUser!,
    announcementId: req.params.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { announcement });
});

export const deleteAnnouncementHandler = asyncHandler(async (req, res) => {
  const announcement = await deleteAnnouncement({
    user: req.authUser!,
    announcementId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { announcement });
});
