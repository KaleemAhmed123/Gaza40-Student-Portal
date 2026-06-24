import { prisma } from "../../db/prisma";
import { RoleCode } from "@prisma/client";

export async function canDirectChat(initiatorId: string, targetId: string): Promise<boolean> {
  if (initiatorId === targetId) return false;

  const [initiator, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: initiatorId },
      include: {
        regionalAdminProfile: true,
        volunteerProfile: true,
        studentProfile: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: targetId },
      include: {
        regionalAdminProfile: true,
        volunteerProfile: true,
        studentProfile: true,
      },
    }),
  ]);

  if (!initiator || !target) return false;

  const initRoles = initiator.roles;
  const targetRoles = target.roles;

  // Master Admin can chat with anyone
  if (initRoles.includes("master_admin") || targetRoles.includes("master_admin")) {
    return true;
  }

  const isInitRegional = initRoles.includes("regional_admin");
  const isTargetRegional = targetRoles.includes("regional_admin");
  const isInitMentor = initRoles.includes("mentor");
  const isTargetMentor = targetRoles.includes("mentor");
  const isInitStudent = initRoles.includes("student");
  const isTargetStudent = targetRoles.includes("student");

  // Regional Admin can chat with any other Regional Admin
  if (isInitRegional && isTargetRegional) return true;

  // Mentor to Mentor is strictly prohibited
  if (isInitMentor && isTargetMentor) return false;

  // Regional Admin <-> Mentor (must be same region, or mentor is region-less)
  if ((isInitRegional && isTargetMentor) || (isInitMentor && isTargetRegional)) {
    const regional = isInitRegional ? initiator : target;
    const mentor = isInitMentor ? initiator : target;

    const regionalRegionId = regional.regionalAdminProfile?.regionId;
    const mentorRegionId = mentor.volunteerProfile?.preferredRegionId;

    if (!regionalRegionId) return false;
    
    // As per discussion: region-less mentors can be chatted by any regional admin
    if (!mentorRegionId) return true;
    
    return regionalRegionId === mentorRegionId;
  }

  // Student <-> Mentor/RegionalAdmin (Students can chat with anyone they are assigned to, or globally based on future rules. For V1/V2, simple allow if either is staff)
  if ((isInitStudent && (isTargetMentor || isTargetRegional)) || 
      (isTargetStudent && (isInitMentor || isInitRegional))) {
    return true; // Simplified: staff can DM students, students can DM staff
  }
  
  // Student to Student
  if (isInitStudent && isTargetStudent) return false; // Prohibited for now

  return false;
}

export function canCreateGroup(roles: RoleCode[]): boolean {
  // Only admins and regional admins can create groups. Mentors and students cannot.
  return roles.includes("master_admin") || roles.includes("regional_admin");
}

export async function canAddMemberToGroup(
  adderId: string, 
  targetId: string, 
  conversationId: string
): Promise<boolean> {
  const [adder, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: adderId },
      include: {
        regionalAdminProfile: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: targetId },
      include: {
        volunteerProfile: true,
      },
    }),
  ]);

  if (!adder || !target) return false;

  // Master Admin can add anyone
  if (adder.roles.includes("master_admin")) return true;

  // Must be Group Admin to add
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: adderId } }
  });

  if (!membership || membership.role !== "admin") return false;

  // Regional Admin adding someone
  if (adder.roles.includes("regional_admin")) {
    const isTargetMentor = target.roles.includes("mentor");
    
    // Can add other Regional Admins or Students freely
    if (!isTargetMentor) return true;

    // If target is Mentor, must be same region
    const adderRegion = adder.regionalAdminProfile?.regionId;
    const targetRegion = target.volunteerProfile?.preferredRegionId;

    if (!adderRegion) return false;
    if (!targetRegion) return true; // Region-less mentors can be added

    return adderRegion === targetRegion;
  }

  return false;
}
