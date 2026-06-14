import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { connectMongoDB, disconnectMongoDB } from "./db/mongodb";
import { app } from "./app";

let server: any;

async function start() {
  try {
    await connectMongoDB();
    server = app.listen(env.PORT, () => {
      console.log(`API server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Fatal error starting server:", error);
    process.exit(1);
  }
}

async function shutdown() {
  const exitCode = 0;
  if (server) {
    server.close(async () => {
      await prisma.$disconnect().catch(() => {});
      await disconnectMongoDB().catch(() => {});
      process.exit(exitCode);
    });
  } else {
    await prisma.$disconnect().catch(() => {});
    await disconnectMongoDB().catch(() => {});
    process.exit(exitCode);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
