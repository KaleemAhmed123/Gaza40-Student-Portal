import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { app } from "./app";

const server = app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
