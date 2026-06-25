import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getConversationsHandler,
  getDirectChatHandler,
  createGroupChatHandler,
  addGroupMemberHandler,
  getMessagesHandler,
  uploadAttachmentHandler,
  getAttachmentUrlHandler,
  searchUsersHandler,
  deleteConversationHandler,
  deleteMessageHandler,
  removeGroupMemberHandler
} from "./chat.controller";
import { uploadChatAttachment } from "./chat.upload";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/conversations", getConversationsHandler);
chatRouter.post("/conversations/direct", getDirectChatHandler);
chatRouter.post("/conversations/group", createGroupChatHandler);
chatRouter.post("/conversations/:id/members", addGroupMemberHandler);
chatRouter.delete("/conversations/:id/members/:userId", removeGroupMemberHandler);
chatRouter.get("/conversations/:id/messages", getMessagesHandler);
chatRouter.post("/conversations/:id/attachments", uploadChatAttachment.single("file"), uploadAttachmentHandler);
chatRouter.get("/attachments/:conversationId/:fileId", getAttachmentUrlHandler);
chatRouter.get("/users/search", searchUsersHandler);
chatRouter.delete("/conversations/:id", deleteConversationHandler);
chatRouter.delete("/conversations/:id/messages/:messageId", deleteMessageHandler);
