import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import type {
  CreateAnnouncementInput,
  ListAdminAnnouncementsQuery,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput
} from "./announcement.validation";

const announcementInclude = {
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  }
};

async function ensureCategory(category?: string) {
  if (!category) {
    return;
  }

  const option = await prisma.configOption.findFirst({
    where: {
      groupKey: "announcement_category",
      value: category,
      isActive: true,
      deletedAt: null
    }
  });

  if (!option) {
    throw new ApiError(400, "Announcement category is invalid or inactive");
  }
}

async function ensureAnnouncement(id: string) {
  const announcement = await prisma.announcement.findFirst({
    where: { id, deletedAt: null },
    include: announcementInclude
  });

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
}

export async function listPublishedAnnouncements(query: ListAnnouncementsQuery) {
  return prisma.announcement.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      ...(query.category ? { category: query.category } : {})
    },
    include: announcementInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getPublishedAnnouncement(id: string) {
  const announcement = await prisma.announcement.findFirst({
    where: { id, deletedAt: null, isPublished: true },
    include: announcementInclude
  });

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
}

export async function listAdminAnnouncements(query: ListAdminAnnouncementsQuery) {
  return prisma.announcement.findMany({
    where: {
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.isPublished === undefined ? {} : { isPublished: query.isPublished })
    },
    include: announcementInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getAdminAnnouncement(id: string) {
  return ensureAnnouncement(id);
}

export async function createAnnouncement(input: {
  userId: string;
  data: CreateAnnouncementInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  await ensureCategory(input.data.category);

  const isPublished = input.data.isPublished ?? false;
  const announcement = await prisma.announcement.create({
    data: {
      title: input.data.title,
      body: input.data.body,
      category: input.data.category,
      createdByUserId: input.userId,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined
    },
    include: announcementInclude
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

  return announcement;
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

  const updatedAnnouncement = await prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      title: input.data.title,
      body: input.data.body,
      category: input.data.category,
      isPublished: input.data.isPublished,
      publishedAt: publishNow ? new Date() : unpublishNow ? null : undefined
    },
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "announcement_updated",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished: updatedAnnouncement.isPublished, category: updatedAnnouncement.category },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return updatedAnnouncement;
}

export async function deleteAnnouncement(input: {
  userId: string;
  announcementId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const announcement = await ensureAnnouncement(input.announcementId);

  const deletedAnnouncement = await prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      isPublished: false,
      deletedAt: new Date()
    },
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "announcement_deleted",
    entityType: "announcement",
    entityId: announcement.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return deletedAnnouncement;
}
