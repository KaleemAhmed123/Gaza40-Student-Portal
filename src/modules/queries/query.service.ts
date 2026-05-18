import { QueryStatus, RegionalAdminStatus, RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { sendEmailBestEffort } from "../../shared/email";
import { ApiError } from "../../shared/http";
import type {
  AddQueryMessageInput,
  AssignQueryInput,
  CreateQueryInput,
  ListQueriesQuery
} from "./query.validation";

const queryInclude = {
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      studentProfile: {
        select: {
          emergencyContactFirstName: true,
          emergencyContactRelation: true,
          emergencyContactPhone: true
        }
      }
    }
  },
  region: true,
  offer: {
    select: {
      id: true,
      universityName: true,
      courseName: true,
      reviewStatus: true,
      regionId: true
    }
  },
  assignedTo: {
    select: { id: true, fullName: true, email: true }
  },
  assignedBy: {
    select: { id: true, fullName: true, email: true }
  },
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: {
        select: { id: true, fullName: true, email: true, roles: true }
      }
    }
  }
};

function categoryMetadataRequires(metadata: unknown, key: "requiresRegion" | "requiresUniversity") {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      key in metadata &&
      (metadata as Record<string, unknown>)[key] === true
  );
}

async function getActiveQueryCategory(queryType: string) {
  const category = await prisma.configOption.findFirst({
    where: {
      groupKey: "query_category",
      value: queryType,
      isActive: true,
      deletedAt: null
    }
  });

  if (!category) {
    throw new ApiError(400, "Query category is invalid or inactive");
  }

  return category;
}

async function getAdminScope(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active"
    },
    include: { regionalAdminProfile: true }
  });

  if (!user) {
    throw new ApiError(403, "You do not have permission to access queries");
  }

  if (user.roles.includes(RoleCode.master_admin)) {
    return { isMasterAdmin: true, regionId: undefined };
  }

  if (
    user.roles.includes(RoleCode.regional_admin) &&
    user.regionalAdminProfile?.status === "active" &&
    !user.regionalAdminProfile.deletedAt
  ) {
    return { isMasterAdmin: false, regionId: user.regionalAdminProfile.regionId };
  }

  throw new ApiError(403, "You do not have permission to access queries");
}

async function assertAdminCanAccessQuery(userId: string, regionId: string | null) {
  const scope = await getAdminScope(userId);

  if (scope.isMasterAdmin) {
    return scope;
  }

  if (!regionId || scope.regionId !== regionId) {
    throw new ApiError(403, "You do not have permission to access this query");
  }

  return scope;
}

async function getQueryOrThrow(queryId: string) {
  const query = await prisma.query.findFirst({
    where: { id: queryId, deletedAt: null },
    include: queryInclude
  });

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  return query;
}

function assertQueryWritable(status: QueryStatus) {
  if (status === QueryStatus.resolved) {
    throw new ApiError(409, "Resolved queries are read-only");
  }
}

async function notifyAdmins(queryId: string) {
  const query = await getQueryOrThrow(queryId);
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      accountStatus: "active",
      OR: [
        { roles: { has: RoleCode.master_admin } },
        ...(query.regionId
          ? [
              {
                roles: { has: RoleCode.regional_admin },
                regionalAdminProfile: {
                  regionId: query.regionId,
                status: RegionalAdminStatus.active,
                  deletedAt: null
                }
              }
            ]
          : [])
      ]
    },
    select: { email: true }
  });

  sendEmailBestEffort({
    to: admins.map((admin) => admin.email),
    subject: `New Gaza40+ query: ${query.title}`,
    text: `${query.student.fullName} raised a query.\n\n${query.message}`
  });
}

function notifyAssignee(email: string, title: string) {
  sendEmailBestEffort({
    to: [email],
    subject: `Gaza40+ query assigned: ${title}`,
    text: `A query has been assigned to you: ${title}`
  });
}

function notifyStudent(email: string, title: string) {
  sendEmailBestEffort({
    to: [email],
    subject: `Gaza40+ query updated: ${title}`,
    text: `Your query has been updated: ${title}`
  });
}

export async function createQuery(input: {
  userId: string;
  data: CreateQueryInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const category = await getActiveQueryCategory(input.data.queryType);
  let regionId = input.data.regionId;
  let offerId = input.data.offerId;

  if (offerId) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, studentUserId: input.userId, deletedAt: null },
      select: { id: true, regionId: true }
    });

    if (!offer) {
      throw new ApiError(404, "Offer not found for this student");
    }

    regionId = offer.regionId;
    offerId = offer.id;
  }

  if (regionId) {
    const region = await prisma.region.findFirst({
      where: { id: regionId, isActive: true, deletedAt: null },
      select: { id: true }
    });

    if (!region) {
      throw new ApiError(400, "Region is invalid or inactive");
    }
  }

  if (categoryMetadataRequires(category.metadata, "requiresRegion") && !regionId) {
    throw new ApiError(400, "Region is required for this query category");
  }

  if (categoryMetadataRequires(category.metadata, "requiresUniversity") && !offerId) {
    throw new ApiError(400, "Offer is required for this query category");
  }

  const query = await prisma.$transaction(async (tx) => {
    const createdQuery = await tx.query.create({
      data: {
        studentUserId: input.userId,
        queryType: input.data.queryType,
        title: input.data.title,
        message: input.data.message,
        regionId,
        offerId
      }
    });

    await tx.queryMessage.create({
      data: {
        queryId: createdQuery.id,
        senderUserId: input.userId,
        message: input.data.message
      }
    });

    return createdQuery;
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_created",
    entityType: "query",
    entityId: query.id,
    metadata: { queryType: input.data.queryType, regionId, offerId },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  void notifyAdmins(query.id).catch((error) => {
    console.error(
      `Query admin notification failed: ${error instanceof Error ? error.message : "Unknown notification error"}`
    );
  });

  return getQueryOrThrow(query.id);
}

export async function listMyQueries(userId: string) {
  return prisma.query.findMany({
    where: { studentUserId: userId, deletedAt: null },
    include: queryInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getMyQuery(userId: string, queryId: string) {
  const query = await prisma.query.findFirst({
    where: { id: queryId, studentUserId: userId, deletedAt: null },
    include: queryInclude
  });

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  return query;
}

export async function addStudentMessage(input: {
  userId: string;
  queryId: string;
  data: AddQueryMessageInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getMyQuery(input.userId, input.queryId);
  assertQueryWritable(query.status);

  const message = await prisma.queryMessage.create({
    data: {
      queryId: query.id,
      senderUserId: input.userId,
      message: input.data.message
    },
    include: { sender: { select: { id: true, fullName: true, email: true, roles: true } } }
  });

  await prisma.query.update({ where: { id: query.id }, data: { updatedAt: new Date() } });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_message_added",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  if (query.assignedTo?.email) {
    notifyAssignee(query.assignedTo.email, query.title);
  }

  return message;
}

export async function listAdminQueries(userId: string, query: ListQueriesQuery) {
  const scope = await getAdminScope(userId);

  return prisma.query.findMany({
    where: {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.queryType ? { queryType: query.queryType } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(scope.isMasterAdmin ? {} : { regionId: scope.regionId })
    },
    include: queryInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getAdminQuery(userId: string, queryId: string) {
  const query = await getQueryOrThrow(queryId);
  await assertAdminCanAccessQuery(userId, query.regionId);
  return query;
}

export async function assignQuery(input: {
  userId: string;
  queryId: string;
  data: AssignQueryInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getQueryOrThrow(input.queryId);
  await assertAdminCanAccessQuery(input.userId, query.regionId);
  assertQueryWritable(query.status);

  const assignee = await prisma.user.findFirst({
    where: {
      id: input.data.assignedToUserId,
      deletedAt: null,
      accountStatus: "active",
      roles: { has: RoleCode.mentor },
      volunteerProfile: { deletedAt: null }
    },
    select: { id: true, email: true }
  });

  if (!assignee) {
    throw new ApiError(400, "Assigned user must be an active mentor");
  }

  const updatedQuery = await prisma.query.update({
    where: { id: query.id },
    data: {
      assignedToUserId: assignee.id,
      assignedByUserId: input.userId,
      status: QueryStatus.assigned
    },
    include: queryInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_assigned",
    entityType: "query",
    entityId: query.id,
    metadata: { assignedToUserId: assignee.id },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  notifyAssignee(assignee.email, query.title);

  return updatedQuery;
}

export async function addAdminMessage(input: {
  userId: string;
  queryId: string;
  data: AddQueryMessageInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getAdminQuery(input.userId, input.queryId);
  assertQueryWritable(query.status);

  const message = await prisma.queryMessage.create({
    data: {
      queryId: query.id,
      senderUserId: input.userId,
      message: input.data.message
    },
    include: { sender: { select: { id: true, fullName: true, email: true, roles: true } } }
  });

  await prisma.query.update({ where: { id: query.id }, data: { updatedAt: new Date() } });
  notifyStudent(query.student.email, query.title);

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_message_added",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return message;
}

export async function resolveAdminQuery(input: {
  userId: string;
  queryId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getAdminQuery(input.userId, input.queryId);

  if (query.status === QueryStatus.resolved) {
    return query;
  }

  const updatedQuery = await prisma.query.update({
    where: { id: query.id },
    data: { status: QueryStatus.resolved, resolvedAt: new Date() },
    include: queryInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_resolved",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  notifyStudent(query.student.email, query.title);

  return updatedQuery;
}

export async function listMentorQueries(userId: string) {
  return prisma.query.findMany({
    where: { assignedToUserId: userId, deletedAt: null },
    include: queryInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getMentorQuery(userId: string, queryId: string) {
  const query = await prisma.query.findFirst({
    where: { id: queryId, assignedToUserId: userId, deletedAt: null },
    include: queryInclude
  });

  if (!query) {
    throw new ApiError(404, "Query not found");
  }

  return query;
}

export async function acceptMentorQuery(input: {
  userId: string;
  queryId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getMentorQuery(input.userId, input.queryId);
  assertQueryWritable(query.status);

  if (query.acceptedAt) {
    return query;
  }

  const updatedQuery = await prisma.query.update({
    where: { id: query.id },
    data: { acceptedAt: new Date() },
    include: queryInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_accepted",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  notifyStudent(query.student.email, query.title);

  return updatedQuery;
}

export async function addMentorMessage(input: {
  userId: string;
  queryId: string;
  data: AddQueryMessageInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getMentorQuery(input.userId, input.queryId);
  assertQueryWritable(query.status);

  const message = await prisma.queryMessage.create({
    data: {
      queryId: query.id,
      senderUserId: input.userId,
      message: input.data.message
    },
    include: { sender: { select: { id: true, fullName: true, email: true, roles: true } } }
  });

  await prisma.query.update({ where: { id: query.id }, data: { updatedAt: new Date() } });
  notifyStudent(query.student.email, query.title);

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_message_added",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return message;
}

export async function resolveMentorQuery(input: {
  userId: string;
  queryId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const query = await getMentorQuery(input.userId, input.queryId);

  if (query.status === QueryStatus.resolved) {
    return query;
  }

  const updatedQuery = await prisma.query.update({
    where: { id: query.id },
    data: { status: QueryStatus.resolved, resolvedAt: new Date() },
    include: queryInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "query_resolved",
    entityType: "query",
    entityId: query.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  notifyStudent(query.student.email, query.title);

  return updatedQuery;
}
