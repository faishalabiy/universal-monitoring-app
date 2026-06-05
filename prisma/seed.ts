import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@ptrekaindo.co.id";
  const password = "password";

  const passwordHash = await bcrypt.hash(password, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Admin already exists:", email);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin created successfully");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });