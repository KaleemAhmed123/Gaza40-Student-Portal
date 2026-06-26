import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import { appEmitter, AppEvents } from "../../shared/events";
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

// Static list of valid announcement categories (matches frontend form options)
const VALID_ANNOUNCEMENT_CATEGORIES = new Set([
  "misc",
  "deadlines",
  "scholarships",
  "passports",
  "webinars",
  "general",
  "update",
  "alert"
]);

async function ensureCategory(category?: string) {
  if (!category) {
    return;
  }

  // First check against static list of known categories (always valid)
  if (VALID_ANNOUNCEMENT_CATEGORIES.has(category)) {
    return;
  }

  // Fall back to DB config options for any dynamically added categories
  const option = await prisma.configOption.findFirst({
    where: {
      groupKey: "announcement_category",
      value: category,
      isActive: true,
      deletedAt: null
    }
  });

  if (!option) {
    throw new ApiError(400, `Announcement category "${category}" is invalid or inactive`);
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

function ensureAdminAccess(announcement: any, user: { id: string; roles: string[] }) {
  if (user.roles.includes("regional_admin") && !user.roles.includes("master_admin")) {
    if (announcement.createdByUserId !== user.id) {
      throw new ApiError(403, "You do not have permission to access this announcement");
    }
  }
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

export async function listAdminAnnouncements(
  query: ListAdminAnnouncementsQuery,
  user: { id: string; roles: string[] }
) {
  const isRegional = user.roles.includes("regional_admin") && !user.roles.includes("master_admin");

  return prisma.announcement.findMany({
    where: {
      deletedAt: null,
      ...(isRegional ? { createdByUserId: user.id } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.isPublished === undefined ? {} : { isPublished: query.isPublished })
    },
    include: announcementInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getAdminAnnouncement(id: string, user: { id: string; roles: string[] }) {
  const announcement = await ensureAnnouncement(id);
  ensureAdminAccess(announcement, user);
  return announcement;
}

export async function createAnnouncement(input: {
  user: { id: string; roles: string[] };
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
      createdByUserId: input.user.id,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined,
      deletedAt: null
    },
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.user.id,
    action: "announcement_created",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished, category: input.data.category },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  if (isPublished) {
    const users = await prisma.user.findMany({
      where: { deletedAt: null, accountStatus: "active", roles: { hasSome: ["student", "mentor"] } },
      select: { id: true }
    });
    appEmitter.emit(AppEvents.ANNOUNCEMENT_CREATED, {
      title: announcement.title,
      targetUserIds: users.map(u => u.id)
    });
  }

  return announcement;
}

export async function updateAnnouncement(input: {
  user: { id: string; roles: string[] };
  announcementId: string;
  data: UpdateAnnouncementInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const announcement = await ensureAnnouncement(input.announcementId);
  ensureAdminAccess(announcement, input.user);

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
    actorUserId: input.user.id,
    action: "announcement_updated",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished: updatedAnnouncement.isPublished, category: updatedAnnouncement.category },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  if (publishNow) {
    const users = await prisma.user.findMany({
      where: { deletedAt: null, accountStatus: "active", roles: { hasSome: ["student", "mentor"] } },
      select: { id: true }
    });
    appEmitter.emit(AppEvents.ANNOUNCEMENT_CREATED, {
      title: updatedAnnouncement.title,
      targetUserIds: users.map(u => u.id)
    });
  }

  return updatedAnnouncement;
}

export async function deleteAnnouncement(input: {
  user: { id: string; roles: string[] };
  announcementId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const announcement = await ensureAnnouncement(input.announcementId);
  ensureAdminAccess(announcement, input.user);

  const deletedAnnouncement = await prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      isPublished: false,
      deletedAt: new Date()
    },
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.user.id,
    action: "announcement_deleted",
    entityType: "announcement",
    entityId: announcement.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return deletedAnnouncement;
}
