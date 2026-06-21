import { DocumentStatus, ProfileStatus } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { recordAuditLog } from "../../../shared/audit";
import { sendEmailBestEffort } from "../../../shared/email";
import { ApiError } from "../../../shared/http";


const profileInclude = {
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true
    }
  },
  documents: {
    where: {
      status: DocumentStatus.active,
      deletedAt: null
    },
    select: {
      id: true,
      documentType: true,
      originalFilename: true,
      mimeType: true,
      fileSizeBytes: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" as const }
  }
};

export async function listStudentProfiles(status?: ProfileStatus) {
  return prisma.studentProfile.findMany({
    where: {
      deletedAt: null,
      ...(status ? { profileStatus: status } : {})
    },
    include: profileInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getStudentProfileForAdmin(profileId: string) {
  const profile = await prisma.studentProfile.findFirst({
    where: {
      id: profileId,
      deletedAt: null
    },
    include: profileInclude
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  return profile;
}

const allowedReviewStatuses = [
  ProfileStatus.approved,
  ProfileStatus.changes_requested,
  ProfileStatus.rejected
] as const;

type ReviewStatus = (typeof allowedReviewStatuses)[number];

const reviewActions: Record<ReviewStatus, string> = {
  approved: "student_profile_approved",
  changes_requested: "student_profile_changes_requested",
  rejected: "student_profile_rejected"
};

export async function reviewStudentProfile(input: {
  profileId: string;
  reviewerUserId: string;
  status: ReviewStatus;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const profile = await prisma.studentProfile.findFirst({
    where: {
      id: input.profileId,
      deletedAt: null
    }
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  if (profile.profileStatus !== ProfileStatus.under_review) {
    throw new ApiError(409, "Only profiles under review can be reviewed");
  }

  const reviewedProfile = await prisma.studentProfile.update({
    where: { id: input.profileId },
    data: {
      profileStatus: input.status,
      reviewedBy: input.reviewerUserId,
      reviewedAt: new Date(),
      reviewNotes: input.notes
    },
    include: profileInclude
  });

  await recordAuditLog({
    actorUserId: input.reviewerUserId,
    action: reviewActions[input.status],
    entityType: "student_profile",
    entityId: input.profileId,
    metadata: {
      status: input.status,
      notesProvided: Boolean(input.notes)
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  // Notify the student by email
  const studentUser = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { email: true, fullName: true }
  });

  if (studentUser) {
    if (input.status === ProfileStatus.approved) {
      sendEmailBestEffort({
        to: [studentUser.email],
        subject: "Your Gaza40+ profile has been approved!",
        text: `Hi ${studentUser.fullName},\n\nGreat news! Your Gaza40+ onboarding profile has been reviewed and approved.\n\nYou can now log in to your student portal to submit university offers, track your application, and connect with your mentor.\n\nLog in at: ${process.env.FRONTEND_URL ?? 'https://app.gaza40.org'}\n\nBest regards,\nThe Gaza40+ Team`
      });
    } else if (input.status === ProfileStatus.rejected) {
      const reasonSection = input.notes
        ? `\n\nReason for rejection:\n${input.notes}\n`
        : "";
      sendEmailBestEffort({
        to: [studentUser.email],
        subject: "Update on your Gaza40+ profile review",
        text: `Hi ${studentUser.fullName},\n\nThank you for submitting your Gaza40+ onboarding profile. Unfortunately, after review, we were unable to approve your profile at this time.${reasonSection}\nIf you have questions or would like to appeal this decision, please contact us at ${process.env.ADMIN_CONTACT_EMAIL ?? 'admin@gaza40.org'}.\n\nBest regards,\nThe Gaza40+ Team`
      });
    }
  }

  return reviewedProfile;
}
