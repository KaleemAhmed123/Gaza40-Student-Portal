import { prisma } from "../../db/prisma";
import { ApiError } from "../../shared/http";
import { canDirectChat, canCreateGroup, canAddMemberToGroup } from "./chat.permissions";
import { appEmitter, AppEvents } from "../../shared/events";

async function enrichConversationMembers(conversations: any[]) {
  // Batch fetch regions for volunteer profile preferredRegionIds to avoid N+1 queries
  const preferredRegionIds = new Set<string>();
  for (const conv of conversations) {
    if (!conv?.members) continue;
    for (const member of conv.members) {
      const regId = member.user?.volunteerProfile?.preferredRegionId;
      if (regId) {
        preferredRegionIds.add(regId);
      }
    }
  }

  const regionsMap = new Map<string, { id: string; name: string }>();
  if (preferredRegionIds.size > 0) {
    const regions = await prisma.region.findMany({
      where: { id: { in: Array.from(preferredRegionIds) } },
      select: { id: true, name: true }
    });
    for (const r of regions) {
      regionsMap.set(r.id, r);
    }
  }

  for (const conv of conversations) {
    if (!conv?.members) continue;
    for (const member of conv.members) {
      if (!member.user) continue;

      let resolvedRegion: { id: string; name: string } | null = null;

      // 1. Regional Admin Profile
      if (member.user.regionalAdminProfile?.region) {
        resolvedRegion = {
          id: member.user.regionalAdminProfile.region.id,
          name: member.user.regionalAdminProfile.region.name
        };
      }
      // 2. Student Offers (using approved university name instead of region name as requested!)
      else if (member.user.studentOffers && member.user.studentOffers[0]) {
        resolvedRegion = {
          id: "student_uni",
          name: member.user.studentOffers[0].universityName
        };
      }
      // 3. Mentor Volunteer Profile
      else if (member.user.volunteerProfile?.preferredRegionId) {
        const reg = regionsMap.get(member.user.volunteerProfile.preferredRegionId);
        if (reg) {
          resolvedRegion = reg;
        }
      }

      // Attach virtual property
      member.user.region = resolvedRegion;
    }
  }

  return conversations;
}

export async function enrichConversation(conv: any) {
  if (!conv) return conv;
  const [enriched] = await enrichConversationMembers([conv]);
  return enriched;
}

export async function getConversations(userId: string) {
  // If master_admin, fetch ALL groups + own direct chats
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  const isAdmin = user?.roles.includes("master_admin");

  if (isAdmin) {
    const adminGroups = await prisma.conversation.findMany({
      where: { type: "group" },
      include: { 
        members: {
          include: {
            user: {
              select: {
                id: true, fullName: true, roles: true,
                studentProfile: { select: { locationInGaza: true, locationOther: true } },
                volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
                regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
                studentOffers: {
                  where: { reviewStatus: "approved" },
                  take: 1,
                  select: { universityName: true }
                }
              }
            }
          }
        } 
      },
    });
    
    const adminDirects = await prisma.conversation.findMany({
      where: {
        type: "direct",
        members: { some: { userId } }
      },
      include: { 
        members: {
          include: {
            user: {
              select: {
                id: true, fullName: true, roles: true,
                studentProfile: { select: { locationInGaza: true, locationOther: true } },
                volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
                regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
                studentOffers: {
                  where: { reviewStatus: "approved" },
                  take: 1,
                  select: { universityName: true }
                }
              }
            }
          }
        } 
      },
      orderBy: { lastMessageAt: "desc" }
    });

    const combined = [...adminGroups, ...adminDirects].sort((a, b) => {
      const dateA = a.lastMessageAt || a.createdAt;
      const dateB = b.lastMessageAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    return enrichConversationMembers(combined);
  }

  // Normal user: fetch only where member
  const list = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, fullName: true, roles: true,
              studentProfile: { select: { locationInGaza: true, locationOther: true } },
              volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
              regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
              studentOffers: {
                where: { reviewStatus: "approved" },
                take: 1,
                select: { universityName: true }
              }
            }
          }
        }
      }
    },
    orderBy: { lastMessageAt: "desc" }
  });

  return enrichConversationMembers(list);
}

export async function getOrCreateDirectChat(initiatorId: string, targetId: string) {
  const allowed = await canDirectChat(initiatorId, targetId);
  if (!allowed) {
    throw new ApiError(403, "You do not have permission to direct chat with this user.");
  }

  // Look for existing direct chat
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "direct",
      AND: [
        { members: { some: { userId: initiatorId } } },
        { members: { some: { userId: targetId } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, fullName: true, roles: true,
              studentProfile: { select: { locationInGaza: true, locationOther: true } },
              volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
              regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
              studentOffers: {
                where: { reviewStatus: "approved" },
                take: 1,
                select: { universityName: true }
              }
            }
          }
        }
      }
    }
  });

  if (existing) return enrichConversation(existing);

  // Create new
  const created = await prisma.conversation.create({
    data: {
      type: "direct",
      createdBy: initiatorId,
      members: {
        create: [
          { userId: initiatorId, role: "member" },
          { userId: targetId, role: "member" }
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, fullName: true, roles: true,
              studentProfile: { select: { locationInGaza: true, locationOther: true } },
              volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
              regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
              studentOffers: {
                where: { reviewStatus: "approved" },
                take: 1,
                select: { universityName: true }
              }
            }
          }
        }
      }
    }
  });

  return enrichConversation(created);
}

export async function createGroupChat(creatorId: string, name: string, initialMemberIds: string[]) {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    include: { regionalAdminProfile: true }
  });
  if (!creator || !canCreateGroup(creator.roles)) {
    throw new ApiError(403, "You do not have permission to create groups.");
  }

  // Filter out creator from initial members to avoid duplicate membership rows
  const uniqueMemberIds = Array.from(new Set(initialMemberIds.filter(id => id !== creatorId)));

  // Validate student additions in creation flow
  const { getAppConfig } = require("../config/app-config.service");
  const enableStudentChat = await getAppConfig("enable_student_chat");

  const members = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true, roles: true }
  });

  for (const targetUser of members) {
    if (targetUser.roles.includes("student")) {
      if (!enableStudentChat) {
        throw new ApiError(400, "Student chat feature is disabled");
      }
      
      if (creator.roles.includes("master_admin")) {
        // Master Admin can add any student
        continue;
      }
      
      if (creator.roles.includes("regional_admin")) {
        // Regional Admin creator: check student's region matches
        const regionalRegionId = creator.regionalAdminProfile?.regionId;
        if (!regionalRegionId) {
          throw new ApiError(403, "Regional admin has no assigned region");
        }
        
        const studentHasOfferInRegion = await prisma.offer.findFirst({
          where: {
            studentUserId: targetUser.id,
            regionId: regionalRegionId,
            deletedAt: null
          }
        });
        
        if (!studentHasOfferInRegion) {
          throw new ApiError(403, "You can only add students from your own region to groups");
        }
      } else {
        throw new ApiError(403, "Only admins can add students to groups");
      }
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "group",
      name,
      createdBy: creatorId,
      members: {
        create: [
          { userId: creatorId, role: "admin" }, // Creator is always admin
          ...uniqueMemberIds.map(userId => ({ userId, role: "member" as const }))
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, fullName: true, roles: true,
              studentProfile: { select: { locationInGaza: true, locationOther: true } },
              volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
              regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
            }
          }
        }
      }
    }
  });

  // Notify all members that a new conversation exists
  import("./chat.socket").then(({ emitToUser }) => {
    conversation.members.forEach(m => {
      if (m.userId !== creatorId) {
        emitToUser(m.userId, "conversation_updated", { conversationId: conversation.id });
        appEmitter.emit(AppEvents.CHAT_GROUP_ADDED, { userId: m.userId, groupName: conversation.name });
      }
    });
  });

  return conversation;
}

export async function addGroupMember(adderId: string, conversationId: string, targetId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.type !== "group") {
    throw new ApiError(400, "Invalid group conversation");
  }

  const allowed = await canAddMemberToGroup(adderId, targetId, conversationId);
  if (!allowed) {
    throw new ApiError(403, "You do not have permission to add this user to the group");
  }

  try {
    const newMember = await prisma.conversationMember.create({
      data: {
        conversationId,
        userId: targetId,
        role: "member"
      }
    });

    // Send email notification asynchronously
    prisma.user.findUnique({ where: { id: targetId } }).then((targetUser) => {
      if (targetUser?.email) {
        import("../../shared/email").then(({ sendEmailBestEffort }) => {
          import("../../shared/email-templates").then(({ emailTemplates }) => {
            import("../../config/env").then(({ env }) => {
              sendEmailBestEffort({
                to: [targetUser.email],
                subject: `You've been added to the group: ${conversation.name}`,
                text: `You have been added to the conversation "${conversation.name}". Log in to start chatting!`,
                html: emailTemplates.notification(
                  targetUser.fullName,
                  "Added to Group",
                  `You have been added to the chat group <strong>"${conversation.name}"</strong>. Log in to start chatting with your group!`,
                  `${env.FRONTEND_URL}/chat`,
                  "Open Chat"
                )
              });
            });
          });
        });
      }
    });

    appEmitter.emit(AppEvents.CHAT_GROUP_ADDED, { userId: targetId, groupName: conversation.name });

    return newMember;
  } catch (error) {
    // Unique constraint violation means already a member
    return prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: targetId } }
    });
  }
}

export async function removeGroupMember(removerId: string, conversationId: string, targetId: string) {
  // Validate conversation is a group
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.type !== "group") {
    throw new ApiError(400, "Invalid group conversation");
  }

  // Allow master_admin or group creator to remove
  const remover = await prisma.user.findUnique({ where: { id: removerId }, select: { roles: true } });
  const isMasterAdmin = remover?.roles.includes("master_admin");
  const isCreator = conversation.createdBy === removerId;

  if (!isMasterAdmin && !isCreator) {
    throw new ApiError(403, "You do not have permission to remove members from this group");
  }

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId, userId: targetId } }
  });
}

export async function getMessages(conversationId: string, userId: string, limit = 50, cursor?: string) {
  // Validate membership or master_admin
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!user?.roles.includes("master_admin")) {
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });
    if (!membership) throw new ApiError(403, "Not a member of this conversation");
  }

  const messages = await prisma.chatMessage.findMany({
    where: { 
      conversationId, 
      OR: [
        { deletedAt: null },
        { deletedAt: { isSet: false } }
      ]
    },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: { 
      sender: { 
        select: { 
          id: true, fullName: true, roles: true,
          studentProfile: { select: { locationInGaza: true, locationOther: true } },
          volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
          regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
        } 
      } 
    }
  });

  return messages.reverse();
}

// In-memory cache for regions to drastically improve search performance
let cachedRegionMap: Record<string, {id: string, name: string}> | null = null;
let lastRegionFetchTime = 0;
const REGION_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const searchChatUsers = async (query: string, role?: string, regionId?: string, university?: string, limit = 20) => {
  const where: any = {};
  
  if (query) {
    where.OR = [
      { fullName: { startsWith: query, mode: "insensitive" } },
      { email: { startsWith: query, mode: "insensitive" } }
    ];
  }
  
  if (role) {
    where.roles = { has: role };
  }

  // Filter out students if student chat is disabled
  const { getAppConfig } = require("../config/app-config.service");
  const enableStudentChat = await getAppConfig("enable_student_chat");
  if (!enableStudentChat) {
    if (role === "student") {
      return [];
    }
    where.NOT = { roles: { has: "student" } };
  }

  // Optimize DB queries: Apply Region filter in the DB where clause
  if (regionId) {
    const regionFilter = {
      OR: [
        {
          AND: [
            { roles: { has: "mentor" } },
            { volunteerProfile: { is: { preferredRegionId: regionId } } }
          ]
        },
        { roles: { has: "regional_admin" } },
        { roles: { has: "master_admin" } }
      ]
    };
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        regionFilter
      ];
      delete where.OR;
    } else {
      where.OR = regionFilter.OR;
    }
  }

  // Optimize DB queries: Apply University filter in the DB where clause
  if (university) {
    const uniFilter = {
      OR: [
        { volunteerProfile: { is: { universityAffiliation: { contains: university, mode: "insensitive" } } } },
        { studentProfile: { is: { moiInstitutionName: { contains: university, mode: "insensitive" } } } }
      ]
    };
    if (where.AND) {
      where.AND.push(uniFilter);
    } else if (where.OR) {
      where.AND = [
        { OR: where.OR },
        uniFilter
      ];
      delete where.OR;
    } else {
      where.OR = uniFilter.OR;
    }
  }

  const users = await prisma.user.findMany({
    where,
    take: limit,
    select: {
      id: true,
      fullName: true,
      email: true,
      roles: true,
      studentProfile: { select: { locationInGaza: true, locationOther: true } },
      volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
      regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
    }
  });

  // Use cached regions to prevent hitting the DB on every single search request
  if (!cachedRegionMap || Date.now() - lastRegionFetchTime > REGION_CACHE_TTL) {
    const allRegions = await prisma.region.findMany({ select: { id: true, name: true } });
    cachedRegionMap = allRegions.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<string, {id: string, name: string}>);
    lastRegionFetchTime = Date.now();
  }
  const regionMap = cachedRegionMap;

  // Filter and map out region
  let mapped = users.map(u => {
    let region = u.regionalAdminProfile?.region || null;
    let preferredRegionId = u.volunteerProfile?.preferredRegionId || null;
    let regionalAdminRegionId = u.regionalAdminProfile?.regionId || null;

    if (!region && preferredRegionId && regionMap[preferredRegionId]) {
      region = regionMap[preferredRegionId];
    }
    
    let extraInfo = "";
    if (u.roles.includes("student")) {
      extraInfo = u.studentProfile?.locationInGaza || u.studentProfile?.locationOther || "";
    } else if (u.roles.includes("mentor")) {
      extraInfo = u.volunteerProfile?.universityAffiliation || "";
    }

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      roles: u.roles,
      region,
      extraInfo,
      _preferredRegionId: preferredRegionId,
      _regionalAdminRegionId: regionalAdminRegionId
    };
  });

  return mapped;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { members: true } });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isMasterAdmin = user?.roles.includes("master_admin");
  const isCreator = conversation.createdBy === userId;

  if (!isMasterAdmin && !isCreator) {
    throw new ApiError(403, "Only the creator or an admin can delete this conversation");
  }

  // Find attachments
  const messagesWithAttachments = await prisma.chatMessage.findMany({
    where: { conversationId, attachmentUrl: { not: null } },
    select: { attachmentUrl: true }
  });

  const { deleteFromStorage } = await import("../../shared/storage");
  for (const msg of messagesWithAttachments) {
    if (msg.attachmentUrl && msg.attachmentUrl.includes("/api/chat/attachments/")) {
      const parts = msg.attachmentUrl.split("/api/chat/attachments/")[1];
      if (parts) {
        await deleteFromStorage(`chat/${parts}`).catch(err => console.error("R2 Cleanup failed:", err));
      }
    }
  }

  await prisma.conversation.delete({ where: { id: conversationId } });

  import("./chat.socket").then(({ emitToConversation }) => {
    emitToConversation(conversationId, "conversation_deleted", { conversationId });
  });

  return { success: true };
}

export async function deleteMessage(conversationId: string, messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.conversationId !== conversationId) throw new ApiError(404, "Message not found");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  
  const isMasterAdmin = user?.roles.includes("master_admin");
  const isCreator = conversation?.createdBy === userId;
  const isSender = message.senderUserId === userId;

  if (!isMasterAdmin && !isCreator && !isSender) {
    throw new ApiError(403, "You do not have permission to delete this message");
  }

  if (message.attachmentUrl && message.attachmentUrl.includes("/api/chat/attachments/")) {
    const parts = message.attachmentUrl.split("/api/chat/attachments/")[1];
    if (parts) {
      const { deleteFromStorage } = await import("../../shared/storage");
      await deleteFromStorage(`chat/${parts}`).catch(err => console.error("R2 Cleanup failed:", err));
    }
  }

  await prisma.chatMessage.delete({ where: { id: messageId } });

  import("./chat.socket").then(({ emitToConversation }) => {
    emitToConversation(conversationId, "message_deleted", { messageId, conversationId });
  });

  return { success: true };
}

export async function editMessage(conversationId: string, messageId: string, userId: string, content: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.conversationId !== conversationId) throw new ApiError(404, "Message not found");

  if (message.senderUserId !== userId) {
    throw new ApiError(403, "You do not have permission to edit this message");
  }

  const updatedMessage = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { content, updatedAt: new Date() },
    include: {
      sender: {
        select: {
          id: true, fullName: true, roles: true,
          studentProfile: { select: { locationInGaza: true, locationOther: true } },
          volunteerProfile: { select: { preferredRegionId: true, universityAffiliation: true } },
          regionalAdminProfile: { select: { regionId: true, region: { select: { name: true, id: true } } } },
        }
      }
    }
  });

  import("./chat.socket").then(({ emitToConversation }) => {
    emitToConversation(conversationId, "message_updated", updatedMessage);
  });

  return updatedMessage;
}

export async function getChatShortcuts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: true,
      volunteerProfile: { select: { preferredRegionId: true } }
    }
  });

  if (!user) return [];

  // 1. If Regional Admin, return all active Master Admins
  if (user.roles.includes("regional_admin")) {
    const admins = await prisma.user.findMany({
      where: {
        roles: { has: "master_admin" },
        accountStatus: "active"
      },
      select: { id: true, fullName: true, email: true }
    });
    return admins.map(admin => ({
      id: admin.id,
      label: `Admin: ${admin.fullName}`,
      role: "master_admin"
    }));
  }

  // 2. If Mentor, return all active Regional Admins for their preferred region
  if (user.roles.includes("mentor")) {
    const preferredRegionId = user.volunteerProfile?.preferredRegionId;
    if (!preferredRegionId) {
      // If mentor is regionless, return all active regional admins
      const regionalAdmins = await prisma.user.findMany({
        where: {
          roles: { has: "regional_admin" },
          accountStatus: "active"
        },
        select: { id: true, fullName: true, email: true }
      });
      return regionalAdmins.map(ra => ({
        id: ra.id,
        label: `Regional Admin: ${ra.fullName}`,
        role: "regional_admin"
      }));
    }

    const regionalAdmins = await prisma.user.findMany({
      where: {
        roles: { has: "regional_admin" },
        accountStatus: "active",
        regionalAdminProfile: { is: { regionId: preferredRegionId } }
      },
      select: { id: true, fullName: true, email: true }
    });
    return regionalAdmins.map(ra => ({
      id: ra.id,
      label: `Regional Admin: ${ra.fullName}`,
      role: "regional_admin"
    }));
  }

  return [];
}
