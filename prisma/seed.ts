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

  // A senha só é gravada ao criar o host. Para redefinir a de uma conta que já
  // existe, passe SEED_HOST_PASSWORD explicitamente — é a saída para recuperar
  // acesso. Sem isso, um seed rotineiro nunca mexe em credencial.
  const explicitPassword = process.env.SEED_HOST_PASSWORD;
  const hostExisted = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // bcrypt custa dezenas de ms de propósito: só gera o hash quando ele vai
  // mesmo ser gravado (host novo, ou senha passada explicitamente).
  const password = explicitPassword ?? randomBytes(9).toString("base64url");
  const passwordHash =
    !hostExisted || explicitPassword ? await bcrypt.hash(password, 10) : "";

  const host = await prisma.user.upsert({
    where: { email },
    update: explicitPassword ? { passwordHash } : {},
    create: {
      email,
      name: "Anna Júlia P. Oliveira",
      passwordHash,
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

  // Tenant de demonstração para prospecção: demo.anfyi.com.br mostra o guia
  // completo e, por nunca ter estadia, nunca expõe senha de fechadura.
  const demoEmail = "demo@anfyi.com.br";
  const demoExisted = await prisma.user.findUnique({
    where: { email: demoEmail },
    select: { id: true },
  });
  const demoHost = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Anfyi · Demonstração",
      passwordHash: demoExisted
        ? ""
        : await bcrypt.hash(randomBytes(12).toString("base64url"), 10),
      role: "HOST",
    },
  });
  const demo = await prisma.apartment.upsert({
    where: { slug: "demo" },
    update: { content: ap1305c as object },
    create: {
      hostId: demoHost.id,
      slug: "demo",
      label: "Demonstração · Anfyi",
      active: true,
      content: ap1305c as object,
    },
  });

  // Estadia de exemplo: só com SEED_DEMO_STAY=1. Sem o guard, rodar o seed em
  // produção inventaria um hóspede e publicaria uma senha de fechadura falsa.
  const wantsDemoStay = process.env.SEED_DEMO_STAY === "1";
  let stayLog = "pulada (defina SEED_DEMO_STAY=1 para criar uma de teste)";

  if (wantsDemoStay) {
    const now = Date.now();
    const DAY = 86_400_000;
    const existing = await prisma.stay.findFirst({
      where: { apartmentId: apartment.id, status: StayStatus.ACTIVE },
    });
    if (existing) {
      stayLog = "já existia uma ativa, mantida";
    } else {
      await prisma.stay.create({
        data: {
          apartmentId: apartment.id,
          guestName: "Hóspede de Teste",
          checkInAt: new Date(now - 1 * DAY),
          checkOutAt: new Date(now + 2 * DAY),
          doorCode: "246810",
          accessCode: randomBytes(16).toString("base64url"),
          status: StayStatus.ACTIVE,
        },
      });
      stayLog = "criada, ativa por 2 dias (apague pelo painel quando terminar)";
    }
  }

  console.log("── seed ok ──");
  console.log(`host:      ${email} (${hostExisted ? "já existia" : "criado"})`);
  if (!hostExisted && !explicitPassword) {
    console.log(`senha:     ${password}  (gerada agora, anote — não será exibida de novo)`);
  } else if (explicitPassword) {
    console.log("senha:     redefinida via SEED_HOST_PASSWORD");
  }
  console.log(`apartment: ${apartment.slug} (${apartment.label})`);
  console.log(`demo:      ${demo.slug} (${demo.label})`);
  console.log(`stay:      ${stayLog}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
