import {
  announcementRepository,
  configOptionRepository
} from "../../db/repositories";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import type {
  CreateAnnouncementInput,
  ListAdminAnnouncementsQuery,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput
} from "./announcement.validation";

const announcementPopulate = {
  path: "createdByUserId",
  select: "fullName email"
};

function mapAnnouncement(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  
  // Resolve createdBy object to match Prisma output structure
  let createdBy = null;
  if (obj.createdByUserId && typeof obj.createdByUserId === "object") {
    createdBy = {
      id: obj.createdByUserId.id || obj.createdByUserId._id?.toString(),
      fullName: obj.createdByUserId.fullName,
      email: obj.createdByUserId.email
    };
  }

  return {
    id: obj.id,
    title: obj.title,
    body: obj.body,
    category: obj.category,
    isPublished: obj.isPublished,
    publishedAt: obj.publishedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    deletedAt: obj.deletedAt,
    createdBy
  };
}

async function ensureCategory(category?: string) {
  if (!category) {
    return;
  }

  const option = await configOptionRepository.findOne({
    groupKey: "announcement_category",
    value: category,
    isActive: true
  });

  if (!option) {
    throw new ApiError(400, "Announcement category is invalid or inactive");
  }
}

async function ensureAnnouncement(id: string) {
  const announcement = await announcementRepository.findById(id, announcementPopulate);

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
}

export async function listPublishedAnnouncements(query: ListAnnouncementsQuery) {
  const filter: any = { isPublished: true };
  if (query.category) {
    filter.category = query.category;
  }

  const docs = await announcementRepository.find(filter, {
    populate: announcementPopulate,
    sort: { publishedAt: -1, createdAt: -1 }
  });

  return docs.map(mapAnnouncement);
}

export async function getPublishedAnnouncement(id: string) {
  const announcement = await announcementRepository.findOne(
    { _id: id, isPublished: true },
    announcementPopulate
  );

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return mapAnnouncement(announcement);
}

export async function listAdminAnnouncements(query: ListAdminAnnouncementsQuery) {
  const filter: any = {};
  if (query.category) {
    filter.category = query.category;
  }
  if (query.isPublished !== undefined) {
    filter.isPublished = query.isPublished;
  }

  const docs = await announcementRepository.find(filter, {
    populate: announcementPopulate,
    sort: { updatedAt: -1, createdAt: -1 }
  });

  return docs.map(mapAnnouncement);
}

export async function getAdminAnnouncement(id: string) {
  const announcement = await ensureAnnouncement(id);
  return mapAnnouncement(announcement);
}

export async function createAnnouncement(input: {
  userId: string;
  data: CreateAnnouncementInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  await ensureCategory(input.data.category);

  const isPublished = input.data.isPublished ?? false;
  const announcement = await announcementRepository.create({
    title: input.data.title,
    body: input.data.body,
    category: input.data.category,
    createdByUserId: input.userId,
    isPublished,
    publishedAt: isPublished ? new Date() : undefined
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "announcement_created",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished, category: input.data.category },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  const populated = await announcement.populate(announcementPopulate);
  return mapAnnouncement(populated);
}

export async function updateAnnouncement(input: {
  userId: string;
  announcementId: string;
  data: UpdateAnnouncementInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const announcement = await ensureAnnouncement(input.announcementId);
  await ensureCategory(input.data.category);

  const publishNow = input.data.isPublished === true && !announcement.isPublished;
  const unpublishNow = input.data.isPublished === false;

  const updatedAnnouncement = await announcementRepository.update(input.announcementId, {
    title: input.data.title,
    body: input.data.body,
    category: input.data.category,
    isPublished: input.data.isPublished,
    publishedAt: publishNow ? new Date() : unpublishNow ? null : undefined
  });

  if (!updatedAnnouncement) {
    throw new ApiError(404, "Announcement not found");
  }

  await recordAuditLog({
    actorUserId: input.userId,
    action: "announcement_updated",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished: updatedAnnouncement.isPublished, category: updatedAnnouncement.category },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  const populated = await updatedAnnouncement.populate(announcementPopulate);
  return mapAnnouncement(populated);
}

export async function deleteAnnouncement(input: {
  userId: string;
  announcementId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const announcement = await ensureAnnouncement(input.announcementId);

  const deletedAnnouncement = await announcementRepository.update(input.announcementId, {
    isPublished: false,
    deletedAt: new Date()
  });

  if (!deletedAnnouncement) {
    throw new ApiError(404, "Announcement not found");
  }

  await recordAuditLog({
    actorUserId: input.userId,
    action: "announcement_deleted",
    entityType: "announcement",
    entityId: announcement.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  const populated = await deletedAnnouncement.populate(announcementPopulate);
  return mapAnnouncement(populated);
}
