import cron from "node-cron";
import { cleanupExpiredCsvJobs } from "./csv-job.service";

/**
 * Registers a daily cron job at 02:00 UTC that:
 *   1. Deletes R2 objects for all completed CsvJobs past their expiresAt
 *   2. Marks those jobs as `expired` in MongoDB
 */
export function registerCsvCleanupCron(): void {
  // "At 02:00 UTC every day"
  cron.schedule("0 2 * * *", async () => {
    console.log("[csv-cleanup] Starting daily expired CSV cleanup...");
    try {
      await cleanupExpiredCsvJobs();
    } catch (err) {
      console.error("[csv-cleanup] Error during cleanup:", err);
    }
  }, {
    timezone: "UTC",
  });

  console.log("[csv-cleanup] Daily cleanup cron registered (02:00 UTC)");
}
