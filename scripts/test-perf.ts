import jwt from "jsonwebtoken";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const secret = process.env.JWT_ACCESS_SECRET || "replace-with-a-long-random-secret";

async function run() {
  console.log("Looking for an actual Master Admin in the database...");
  const admin = await prisma.user.findFirst({
    where: { roles: { has: "master_admin" } }
  });

  if (!admin) {
    console.log("No master_admin found in the DB. Cannot perform real load test.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found admin: ${admin.email}. Generating valid JWT...`);
  const payload = {
    sub: admin.id,
    email: admin.email,
    roles: admin.roles
  };

  const token = jwt.sign(payload, secret, { expiresIn: "1h" });

  console.log("\nStarting 10-second load test on Admin Student Grid (Hitting real DB data)...");

  try {
    const output = execSync(
      `npx autocannon -c 50 -d 15 -H "Cookie: accessToken=${token}" "http://localhost:3000/api/chat/users/search?q=k"`,
      { encoding: "utf8" }
    );
    console.log(output);
  } catch (error) {
    console.error("Autocannon test failed.");
    console.error(error.stdout);
  } finally {
    await prisma.$disconnect();
  }
}

run();
