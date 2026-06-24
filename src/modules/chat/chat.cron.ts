import cron from "node-cron";
import { prisma } from "../../db/prisma";
import { deleteFromStorage } from "../../shared/storage";

export const startChatCronJobs = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running 7-day chat retention cleanup...");
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find old messages with attachments
      const oldMessagesWithAttachments = await prisma.chatMessage.findMany({
        where: { 
          createdAt: { lt: sevenDaysAgo },
          attachmentUrl: { not: null }
        },
        select: { attachmentUrl: true }
      });

      let deletedAttachments = 0;

      // Delete attachments from R2
      for (const msg of oldMessagesWithAttachments) {
        if (msg.attachmentUrl && msg.attachmentUrl.startsWith("chat/")) {
          await deleteFromStorage(msg.attachmentUrl).catch(err => {
            console.error(`[Cron] Failed to delete attachment ${msg.attachmentUrl}:`, err);
          });
          deletedAttachments++;
        }
      }

      // Delete messages from DB
      const result = await prisma.chatMessage.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } }
      });

      // Optionally, we could clean up completely empty conversations
      // For now, we just delete the messages as per the retention policy.
      
      console.log(`[Cron] Cleanup complete. Deleted ${result.count} old messages and ${deletedAttachments} R2 attachments.`);

    } catch (error) {
      console.error("[Cron] Error during chat retention cleanup:", error);
    }
  });
};
