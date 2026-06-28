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
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid announcement ID format");
  }
  const announcement = await prisma.announcement.findFirst({
    where: { id, deletedAt: null },
    include: announcementInclude
  });

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
}

async function ensureAdminAccess(
  announcement: any,
  user: { id: string; roles: string[] },
  strictlyOwn = false
) {
  if (user.roles.includes("regional_admin") && !user.roles.includes("master_admin")) {
    if (announcement.createdByUserId === user.id) {
      return;
    }
    if (strictlyOwn) {
      throw new ApiError(403, "You do not have permission to modify this announcement");
    }
    const profile = await prisma.regionalAdminProfile.findUnique({
      where: { userId: user.id }
    });
    const regId = profile?.regionId ?? null;
    if (announcement.regionId === null || (regId && announcement.regionId === regId)) {
      return;
    }
    throw new ApiError(403, "You do not have permission to access this announcement");
  }
}

async function validateRegionTarget(regionId: string | null | undefined, user: { id: string; roles: string[] }) {
  if (!regionId) {
    return;
  }

  const region = await prisma.region.findFirst({
    where: { id: regionId, deletedAt: null }
  });
  if (!region) {
    throw new ApiError(400, "Target region does not exist");
  }

  if (user.roles.includes("regional_admin") && !user.roles.includes("master_admin")) {
    const profile = await prisma.regionalAdminProfile.findUnique({
      where: { userId: user.id }
    });
    if (!profile || profile.regionId !== regionId) {
      throw new ApiError(403, "You can only target announcements to your assigned region");
    }
  }
}

export async function listPublishedAnnouncements(query: ListAnnouncementsQuery, user: { id: string; roles: string[] }) {
  const isMasterAdmin = user.roles.includes("master_admin");
  const isRegionalAdmin = user.roles.includes("regional_admin");
  const isStudent = user.roles.includes("student");
  const isMentor = user.roles.includes("mentor");

  let regionFilter: any = {};

  if (isMasterAdmin) {
    regionFilter = {};
  } else if (isRegionalAdmin) {
    const profile = await prisma.regionalAdminProfile.findUnique({
      where: { userId: user.id }
    });
    const regId = profile?.regionId ?? null;
    regionFilter = {
      OR: [
        { regionId: null },
        ...(regId ? [{ regionId: regId }] : [])
      ]
    };
  } else if (isStudent) {
    const studentOffers = await prisma.offer.findMany({
      where: { studentUserId: user.id, deletedAt: null },
      select: { regionId: true }
    });
    const studentRegionIds = studentOffers.map(o => o.regionId).filter(Boolean);
    regionFilter = {
      OR: [
        { regionId: null },
        ...(studentRegionIds.length > 0 ? [{ regionId: { in: studentRegionIds } }] : [])
      ]
    };
  } else if (isMentor) {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: user.id }
    });
    const mentorOffers = await prisma.offer.findMany({
      where: { mentorId: user.id, deletedAt: null },
      select: { regionId: true }
    });
    const mentorRegionIds = [
      ...(volunteerProfile?.preferredRegionId ? [volunteerProfile.preferredRegionId] : []),
      ...mentorOffers.map(o => o.regionId)
    ].filter(Boolean);

    regionFilter = {
      OR: [
        { regionId: null },
        ...(mentorRegionIds.length > 0 ? [{ regionId: { in: mentorRegionIds } }] : [])
      ]
    };
  } else {
    regionFilter = { regionId: null };
  }

  return prisma.announcement.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      ...(query.category ? { category: query.category } : {}),
      ...regionFilter
    },
    include: announcementInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getPublishedAnnouncement(id: string) {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid announcement ID format");
  }
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
  let filter: any = { deletedAt: null };

  if (isRegional) {
    const profile = await prisma.regionalAdminProfile.findUnique({
      where: { userId: user.id }
    });
    const regId = profile?.regionId ?? null;
    filter.OR = [
      { regionId: null },
      ...(regId ? [{ regionId: regId }] : []),
      { createdByUserId: user.id }
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }
  if (query.isPublished !== undefined) {
    filter.isPublished = query.isPublished;
  }

  return prisma.announcement.findMany({
    where: filter,
    include: announcementInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getAdminAnnouncement(id: string, user: { id: string; roles: string[] }) {
  const announcement = await ensureAnnouncement(id);
  await ensureAdminAccess(announcement, user, false);
  return announcement;
}

async function validateAnnouncementLimits(body: string) {
  if (!body) return;

  const limits = await prisma.appConfig.findUnique({
    where: { key: "announcement_limits" }
  });
  const limitsValue = (limits?.value as any) || {};
  const maxCharacters = Number(limitsValue.maxCharacters) ?? 15000;
  const maxImages = Number(limitsValue.maxImages) ?? 5;

  const plainText = body.replace(/<[^>]*>/g, '').trim();
  if (plainText.length > maxCharacters) {
    throw new ApiError(
      400,
      `Announcement text length (${plainText.length}) exceeds the maximum allowed limit of ${maxCharacters} characters (excluding HTML formatting).`
    );
  }

  const imageCount = (body.match(/<img[^>]*>/g) || []).length;
  if (imageCount > maxImages) {
    throw new ApiError(
      400,
      `Announcement contains ${imageCount} images, which exceeds the maximum allowed limit of ${maxImages} images.`
    );
  }
}

export async function createAnnouncement(input: {
  user: { id: string; roles: string[] };
  data: CreateAnnouncementInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  await ensureCategory(input.data.category);
  await validateRegionTarget(input.data.regionId, input.user);
  await validateAnnouncementLimits(input.data.body);

  const isPublished = input.data.isPublished ?? false;
  const createPayload: any = {
    title: input.data.title,
    body: input.data.body,
    category: input.data.category,
    regionId: input.data.regionId || null,
    createdByUserId: input.user.id,
    isPublished,
    publishedAt: isPublished ? new Date() : undefined,
    showApplyButton: (input.data as any).showApplyButton ?? false,
    applyLink: (input.data as any).applyLink || null,
    deletedAt: null
  };
  const announcement = await (prisma.announcement as any).create({
    data: createPayload,
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.user.id,
    action: "announcement_created",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished, category: input.data.category, regionId: input.data.regionId },
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
  await ensureAdminAccess(announcement, input.user, true);

  await ensureCategory(input.data.category);
  if (input.data.regionId !== undefined) {
    await validateRegionTarget(input.data.regionId, input.user);
  }
  if (input.data.body !== undefined) {
    await validateAnnouncementLimits(input.data.body);
  }

  const publishNow = input.data.isPublished === true && !announcement.isPublished;
  const unpublishNow = input.data.isPublished === false;

  const updatePayload: any = {
    title: input.data.title,
    body: input.data.body,
    category: input.data.category,
    regionId: input.data.regionId !== undefined ? (input.data.regionId || null) : undefined,
    isPublished: input.data.isPublished,
    publishedAt: publishNow ? new Date() : unpublishNow ? null : undefined,
    showApplyButton: (input.data as any).showApplyButton,
    applyLink: (input.data as any).applyLink
  };
  const updatedAnnouncement = await (prisma.announcement as any).update({
    where: { id: announcement.id },
    data: updatePayload,
    include: announcementInclude
  });

  await recordAuditLog({
    actorUserId: input.user.id,
    action: "announcement_updated",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { isPublished: updatedAnnouncement.isPublished, category: updatedAnnouncement.category, regionId: updatedAnnouncement.regionId },
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
  await ensureAdminAccess(announcement, input.user, true);

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
