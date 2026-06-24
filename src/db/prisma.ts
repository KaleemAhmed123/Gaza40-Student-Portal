import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const slowQueryThresholdMs = 500;
const logSlowQueries = env.NODE_ENV !== "production";
const retryableReadOperations = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy"
]);
const maxReadAttempts = 3;
const baseRetryDelayMs = 250;

const prismaClient = new PrismaClient({
  log: logSlowQueries ? [{ emit: "event", level: "query" }] : []
});

if (logSlowQueries) {
  prismaClient.$on("query", (event) => {
    if (event.duration < slowQueryThresholdMs) {
      return;
    }

    console.warn(
      `[db:slow] ${event.duration}ms`
    );
  });
}

function isRetryableDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  // TODO: make it more predictable and robust in future (it's fragile as of now)
  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Timed out fetching a new connection") ||
    error.message.includes("Connection terminated") ||
    error.message.includes("Connection closed")
  );
}

async function delay(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        if (!retryableReadOperations.has(operation)) {
          return query(args);
        }

        for (let attempt = 1; attempt <= maxReadAttempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            if (
              attempt === maxReadAttempts ||
              !isRetryableDatabaseConnectionError(error)
            ) {
              throw error;
            }

            const retryDelayMs = baseRetryDelayMs * attempt;
            console.warn(
              `[db:retry] ${operation} failed because the database connection was unavailable. Retrying in ${retryDelayMs}ms (${attempt}/${maxReadAttempts})`
            );
            await delay(retryDelayMs);
          }
        }

        return query(args);
      }
    }
  }
});
