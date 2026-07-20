import { config as loadEnv } from "dotenv";
import { randomBytes } from "node:crypto";

loadEnv({ path: [".env.local", ".env"] });
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, StayStatus } from "../src/generated/prisma/client";
import { ap1305c } from "../src/data/apartments/1305c";

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL!;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const email = process.env.SEED_HOST_EMAIL ?? "anna@anfyi.com.br";
  const password =
    process.env.SEED_HOST_PASSWORD ?? randomBytes(9).toString("base64url");

  const host = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Anna Júlia P. Oliveira",
      passwordHash: await bcrypt.hash(password, 10),
      role: "HOST",
    },
  });

  const apartment = await prisma.apartment.upsert({
    where: { slug: "1305c" },
    update: { content: ap1305c as object },
    create: {
      hostId: host.id,
      slug: "1305c",
      label: "Ap 1305C · DF Plaza",
      active: true,
      content: ap1305c as object,
    },
  });

  // Estadia ativa de exemplo (para testar o time-gating do check-in/checkout)
  const now = Date.now();
  const DAY = 86_400_000;
  let accessCode = randomBytes(16).toString("base64url");
  const stay = await prisma.stay.findFirst({
    where: { apartmentId: apartment.id, status: StayStatus.ACTIVE },
  });
  if (!stay) {
    await prisma.stay.create({
      data: {
        apartmentId: apartment.id,
        guestName: "Hóspede de Teste",
        checkInAt: new Date(now - 1 * DAY),
        checkOutAt: new Date(now + 2 * DAY),
        doorCode: "246810",
        accessCode,
        status: StayStatus.ACTIVE,
      },
    });
  } else {
    accessCode = stay.accessCode; // reaproveita a estadia existente (log fiel)
  }

  console.log("── seed ok ──");
  console.log(`host:      ${email}`);
  if (!process.env.SEED_HOST_PASSWORD) {
    console.log(`senha:     ${password}  (gerada agora — anote e troque depois)`);
  }
  console.log(`apartment: ${apartment.slug} (${apartment.label})`);
  console.log(`stay:      ativa, doorCode 246810, accessCode ${accessCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
