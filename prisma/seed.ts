import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FAMILY_EMAIL ?? "famille@mealplanner.fr";
  const password = process.env.FAMILY_PASSWORD ?? "famille123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Compte famille déjà créé.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name: "Famille" },
  });

  console.log(`Compte famille créé : ${email} / ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
