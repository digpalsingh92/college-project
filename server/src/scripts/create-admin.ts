import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.findIndex((value) => value === flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const email = getArg("--email");
  const password = getArg("--password");
  const name = getArg("--name") ?? "Admin";

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- --email <email> --password <password> [--name <name>]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        role: "admin",
      },
    });

    console.log(`Updated existing user as admin: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Created new admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
