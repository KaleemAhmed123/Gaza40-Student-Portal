import { RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  // Fetch user roles to verify if they are a reviewer
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { roles: true }
  });

  if (user?.roles.includes(RoleCode.reviewer) && input.type !== "admin_profile_submitted") {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });

  return notification;
}

export async function getUserNotifications(userId: string, limit: number = 20, skip: number = 0) {
  const [notifications, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, totalUnread };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
