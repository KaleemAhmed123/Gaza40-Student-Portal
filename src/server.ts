import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { app } from "./app";
import { initSocket } from "./modules/chat/chat.socket";
import { startChatCronJobs } from "./modules/chat/chat.cron";
import { registerCsvCleanupCron } from "./modules/csv-generator/csv-generator.cron";

// Initialize event listeners
import "./modules/notifications/notification.listeners";

/**
 * On startup, reset any CsvJob records that are stuck in `generating` state
 * due to a previous process crash or restart.
 */
async function resetStuckCsvJobs(): Promise<void> {
  const { count } = await prisma.csvJob.updateMany({
    where: { status: "generating" },
    data:  { status: "failed", errorMessage: "Process restarted — please retry" },
  });
  if (count > 0) {
    console.log(`[csv-startup] Reset ${count} stuck generating CSV job(s) to failed`);
  }
}

const server = app.listen(env.PORT, async () => {
  console.log(`API server listening on port ${env.PORT}`);
  await resetStuckCsvJobs();
  startChatCronJobs();
  registerCsvCleanupCron();
});

initSocket(server);

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
