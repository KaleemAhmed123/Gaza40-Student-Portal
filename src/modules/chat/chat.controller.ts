import { asyncHandler, sendSuccess } from "../../shared/http";
import * as chatService from "./chat.service";
import { z } from "zod";
import { prisma } from "../../db/prisma";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  memberIds: z.array(z.string()).max(100)
});

export const getConversationsHandler = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.authUser!.id);
  sendSuccess(res, { conversations });
});

export const getDirectChatHandler = asyncHandler(async (req, res) => {
  const { targetId } = req.body;
  if (!targetId) throw new Error("targetId is required");
  
  const conversation = await chatService.getOrCreateDirectChat(req.authUser!.id, targetId);
  sendSuccess(res, { conversation });
});

export const createGroupChatHandler = asyncHandler(async (req, res) => {
  const input = createGroupSchema.parse(req.body);
  const conversation = await chatService.createGroupChat(req.authUser!.id, input.name, input.memberIds);
  sendSuccess(res, { conversation }, 201);
});

export const addGroupMemberHandler = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { targetId } = req.body;
  if (!targetId) throw new Error("targetId is required");

  const membership = await chatService.addGroupMember(req.authUser!.id, conversationId, targetId);
  
  // Notify existing members and the newly added user to refresh their conversations
  const { emitToConversation, emitToUser } = require("./chat.socket");
  emitToConversation(conversationId, "conversation_updated", {});
  emitToUser(targetId, "conversation_updated", {});

  sendSuccess(res, { membership });
});

export const removeGroupMemberHandler = asyncHandler(async (req, res) => {
  const { id: conversationId, userId: targetId } = req.params;
  
  await chatService.removeGroupMember(req.authUser!.id, conversationId, targetId);
  
  const { emitToConversation, emitToUser } = require("./chat.socket");
  emitToConversation(conversationId, "conversation_updated", {});
  emitToUser(targetId, "conversation_deleted", { conversationId });

  sendSuccess(res, { success: true });
});

export const getMessagesHandler = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  
  const messages = await chatService.getMessages(conversationId, req.authUser!.id, limit, cursor);
  sendSuccess(res, { messages });
});

export const uploadAttachmentHandler = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  
  if (!req.file) {
    throw new Error("File is required");
  }

  // Validate access
  const membership = await chatService.getMessages(conversationId, req.authUser!.id, 1);
  // If getMessages doesn't throw, user has access to conversation

  const { uploadToStorage } = await import("../../shared/storage");
  const { key, bucket } = await uploadToStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    `chat/${conversationId}`
  );

  sendSuccess(res, { 
    attachment: {
      url: `/api/chat/attachments/${conversationId}/${key.split('/').pop()}`, 
      bucket,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    }
  }, 201);
});

export const getAttachmentUrlHandler = asyncHandler(async (req, res) => {
  const { conversationId, fileId } = req.params;
  
  // Validate access to conversation
  await chatService.getMessages(conversationId, req.authUser!.id, 1);
  
  const key = `chat/${conversationId}/${fileId}`;
  const { getSignedStorageUrl } = await import("../../shared/storage");
  const signedUrl = await getSignedStorageUrl(key);
  
  if (!signedUrl) {
    res.status(404).send("File not found");
    return;
  }
  
  res.redirect(302, signedUrl);
});

export const searchUsersHandler = asyncHandler(async (req, res) => {
  const query = req.query.q as string || "";
  const role = req.query.role as string || undefined;
  const university = req.query.university as string || undefined;
  let regionId = req.query.regionId as string || undefined;

  // Enforce regional admin's own region
  if (req.authUser?.roles.includes("regional_admin") && !req.authUser?.roles.includes("master_admin")) {
    // If the regional admin profile is loaded, check its regionId
    const regionalProfile = await prisma.regionalAdminProfile.findUnique({
      where: { userId: req.authUser.id }
    });
    if (regionalProfile) {
      regionId = regionalProfile.regionId;
    }
  }

  const users = await chatService.searchChatUsers(query, role, regionId, university);
  sendSuccess(res, { users });
});

export const deleteConversationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await chatService.deleteConversation(id, req.authUser!.id);
  sendSuccess(res, { message: "Conversation deleted successfully" });
});

export const deleteMessageHandler = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;
  await chatService.deleteMessage(id, messageId, req.authUser!.id);
  sendSuccess(res, { message: "Message deleted successfully" });
});

export const editMessageHandler = asyncHandler(async (req, res) => {
  const { id, messageId } = req.params;
  const { content } = req.body;
  if (content === undefined || content === null) {
    throw new Error("Content is required to edit message");
  }

  const message = await chatService.editMessage(id, messageId, req.authUser!.id, content);
  sendSuccess(res, { message });
});

export const getChatShortcutsHandler = asyncHandler(async (req, res) => {
  const shortcuts = await chatService.getChatShortcuts(req.authUser!.id);
  sendSuccess(res, { shortcuts });
});
