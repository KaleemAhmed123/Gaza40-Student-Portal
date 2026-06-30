import { RoleCode } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { ApiError } from "../../../shared/http";
import { getAdminScope } from "../../../shared/auth-scope";

export async function getAdminVolunteerProfile(actorUserId: string, volunteerId: string) {
  const scope = await getAdminScope(actorUserId);

  const volunteer = await prisma.user.findFirst({
    where: {
      id: volunteerId,
      deletedAt: null,
      roles: { has: RoleCode.mentor },
      volunteerProfile: {
        is: {
          deletedAt: null,
          ...(scope.role === "regional_admin" ? { preferredRegionId: scope.regionId } : {})
        }
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      roles: true,
      accountStatus: true,
      createdAt: true,
      volunteerProfile: {
        select: {
          id: true,
          universityAffiliation: true,
          preferredRegionId: true,
          volunteerStatus: true,
          reviewedBy: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true
        }
      },
      regionalAdminProfile: {
        select: {
          id: true,
          regionId: true,
          status: true,
          region: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found or you do not have access to this volunteer");
  }

  // Fetch Assigned Students (offers where mentorId is this volunteer)
  const assignedOffers = await prisma.offer.findMany({
    where: { mentorId: volunteer.id, deletedAt: null },
    select: {
      id: true,
      studentUserId: true,
      student: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          studentProfile: {
            select: {
              profileStatus: true,
              locationInGaza: true
            }
          }
        }
      },
      universityName: true,
      courseName: true,
      courseLevel: true,
      offerType: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch Audit Logs related to this volunteer
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "volunteer",
      entityId: volunteer.id
    },
    select: {
      id: true,
      action: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50 // Limit to 50 most recent logs
  });

  return {
    volunteer,
    assignedStudents: assignedOffers.map(offer => ({
      offerId: offer.id,
      studentId: offer.studentUserId,
      fullName: offer.student.fullName,
      email: offer.student.email,
      phone: offer.student.phone,
      profileStatus: offer.student.studentProfile?.profileStatus,
      locationInGaza: offer.student.studentProfile?.locationInGaza,
      universityName: offer.universityName,
      courseName: offer.courseName,
      courseLevel: offer.courseLevel,
      offerType: offer.offerType,
      assignedAt: offer.createdAt
    })),
    auditLogs
  };
}
