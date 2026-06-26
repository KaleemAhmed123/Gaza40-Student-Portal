import { appEmitter, AppEvents } from "../../shared/events";
import { createNotification } from "./notification.service";
import { emitToUser } from "../chat/chat.socket";
import { prisma } from "../../db/prisma";

/**
 * A helper to safely dispatch a notification without throwing errors.
 */
async function safelyDispatchNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    const notification = await createNotification(input);
    emitToUser(input.userId, "notification_new_message", notification);
  } catch (error) {
    console.error("[Notification Listener] Failed to dispatch notification:", error);
  }
}

// ---------------------------------------------------------------------------
// Student Profile Events
// ---------------------------------------------------------------------------

appEmitter.on(AppEvents.PROFILE_SUBMITTED, async (payload: { studentUserId: string }) => {
  safelyDispatchNotification({
    userId: payload.studentUserId,
    type: "profile_submitted",
    title: "Profile Submitted",
    body: "Your profile has been successfully submitted and is now under review.",
    link: "/student/profile",
  });

  // Notify Master Admins
  try {
    const student = await prisma.user.findUnique({ where: { id: payload.studentUserId }, select: { fullName: true }});
    const masterAdmins = await prisma.user.findMany({
      where: { roles: { has: "master_admin" }, deletedAt: null, accountStatus: "active" },
      select: { id: true }
    });
    
    masterAdmins.forEach(admin => {
      safelyDispatchNotification({
        userId: admin.id,
        type: "admin_profile_submitted",
        title: "New Profile Submitted",
        body: `${student?.fullName || 'A student'} has submitted a new profile for review.`,
        link: "/admin/student-reviews"
      });
    });
  } catch(e) {
    console.error("[Notification Listener] Failed to notify admins for profile submission:", e);
  }
});

appEmitter.on(AppEvents.PROFILE_APPROVED, (payload: { studentUserId: string }) => {
  safelyDispatchNotification({
    userId: payload.studentUserId,
    type: "profile_approved",
    title: "Profile Approved!",
    body: "Congratulations! Your profile has been approved.",
    link: "/student/profile",
  });
});

appEmitter.on(AppEvents.PROFILE_REJECTED, (payload: { studentUserId: string, reason?: string }) => {
  safelyDispatchNotification({
    userId: payload.studentUserId,
    type: "profile_rejected",
    title: "Profile Update Required",
    body: "Your profile requires some updates or has been rejected. Please review.",
    link: "/student/profile",
  });
});

appEmitter.on(AppEvents.PROFILE_CHANGES_REQUESTED, (payload: { studentUserId: string }) => {
  safelyDispatchNotification({
    userId: payload.studentUserId,
    type: "profile_changes_requested",
    title: "Changes Requested",
    body: "Action required: We've requested some changes to your profile.",
    link: "/student/profile",
  });
});

// ---------------------------------------------------------------------------
// Offer Events
// ---------------------------------------------------------------------------

appEmitter.on(AppEvents.OFFER_SUBMITTED, async (payload: { studentUserId: string, studentName: string, offerId: string, regionId: string }) => {
  // We notify admins (Master & Regional)
  try {
    const admins = await prisma.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        OR: [
          { roles: { has: "master_admin" } },
          {
            roles: { has: "regional_admin" },
            regionalAdminProfile: { regionId: payload.regionId, status: "active", deletedAt: null }
          }
        ]
      },
      select: { id: true }
    });

    admins.forEach(admin => {
      safelyDispatchNotification({
        userId: admin.id,
        type: "admin_offer_submitted",
        title: "New Offer Submitted",
        body: `${payload.studentName} has submitted a new offer for review.`,
        link: "/admin/offer-reviews" // Adjust this if regional admin uses a different route, but standardizing to the main view is fine.
      });
    });
  } catch (e) {
    console.error("[Notification Listener] Failed to notify admins for offer submission:", e);
  }
});

appEmitter.on(AppEvents.OFFER_STATUS_UPDATED, (payload: { studentUserId: string, status: string, offerId: string }) => {
  safelyDispatchNotification({
    userId: payload.studentUserId,
    type: "offer_status_updated",
    title: "Offer Status Updated",
    body: `Your offer status has been updated to: ${payload.status}.`,
    link: `/student/offers/${payload.offerId}`,
  });
});

appEmitter.on(AppEvents.OFFER_MENTOR_ASSIGNED, (payload: { mentorUserId: string, offerId: string, studentName: string }) => {
  safelyDispatchNotification({
    userId: payload.mentorUserId,
    type: "mentor_assigned",
    title: "New Student Assigned",
    body: `You have been assigned to mentor ${payload.studentName} for their offer.`,
    link: `/mentor/offers/${payload.offerId}`,
  });
});

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

appEmitter.on(AppEvents.ANNOUNCEMENT_CREATED, (payload: { title: string, targetUserIds: string[] }) => {
  // To avoid spamming thousands of socket emits simultaneously, 
  // you might want a specialized broadcast logic, but for simplicity we iterate.
  payload.targetUserIds.forEach(userId => {
    safelyDispatchNotification({
      userId,
      type: "new_announcement",
      title: "New Announcement",
      body: payload.title,
      link: "/student/announcements", // Could be different per role, but they usually land in common place
    });
  });
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

appEmitter.on(AppEvents.QUERY_REPLIED, (payload: { targetUserId: string, queryId: string, title: string }) => {
  safelyDispatchNotification({
    userId: payload.targetUserId,
    type: "query_replied",
    title: "New Reply to your Query",
    body: `You have a new reply regarding: ${payload.title}`,
    link: `/student/queries/${payload.queryId}`, // Again, link might differ by role
  });
});

appEmitter.on(AppEvents.QUERY_ASSIGNED, (payload: { assigneeUserId: string, queryId: string, title: string }) => {
  safelyDispatchNotification({
    userId: payload.assigneeUserId,
    type: "query_assigned",
    title: "Query Assigned to You",
    body: `You have been assigned to handle a query: ${payload.title}`,
    link: `/mentor/queries/${payload.queryId}`, 
  });
});

// ---------------------------------------------------------------------------
// Regional Admin
// ---------------------------------------------------------------------------
// Note: Regional Admins are notified about new offers within the OFFER_SUBMITTED listener above.

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

appEmitter.on(AppEvents.CHAT_GROUP_ADDED, (payload: { userId: string, groupName: string }) => {
  safelyDispatchNotification({
    userId: payload.userId,
    type: "chat_group_added",
    title: "Added to Group",
    body: `You have been added to the chat group: ${payload.groupName}`,
    link: "/chat",
  });
});

console.log("[Events] Notification listeners registered successfully.");
