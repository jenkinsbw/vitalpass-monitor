import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vitalpass.local";
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin";
const name = process.env.SEED_ADMIN_NAME ?? "Admin";
const lastName = process.env.SEED_ADMIN_LAST_NAME ?? "User";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        lastName,
        passwordHash,
      },
      create: {
        email,
        name,
        lastName,
        passwordHash,
      },
    });

    console.log(`Seeded admin user ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
