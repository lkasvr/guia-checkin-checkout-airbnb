import { config as loadEnv } from "dotenv";
import { randomBytes } from "node:crypto";

loadEnv({ path: [".env.local", ".env"] });
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, StayStatus } from "../src/generated/prisma/client";
import { ap1305c } from "../src/data/apartments/1305c";

const CHAT =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

/**
 * Regras genéricas do prédio "Residencial DF Plaza" — as mesmas do 1305C,
 * exceto "Proibido fumar", que continua sendo escolha por apartamento (campo
 * "Fumo" do formulário). Somadas às regras específicas de cada apartamento
 * na hora de montar o guia (`overlayBuildingLiveContent`), nunca substituindo.
 */
const dfPlazaRules = {
  sub: { pt: "Combinações simples para a boa convivência no prédio.", en: "Simple ground rules for getting along in the building." },
  items: [
    {
      icon: "🧺",
      hot: true,
      title: { pt: "Uso da varanda", en: "Balcony use" },
      text: {
        pt: "É terminantemente proibido estender roupas, toalhas ou objetos na sacada. O descumprimento gera multa de um salário mínimo aplicada pelo condomínio.",
        en: "Hanging clothes, towels or any objects on the balcony is strictly prohibited. Violations carry a fine of one minimum wage, charged by the building association.",
      },
    },
    {
      icon: "🤫",
      title: { pt: "Lei do silêncio · 22h às 08h", en: "Quiet hours · 10pm to 8am" },
      text: { pt: "Respeite o sossego dos vizinhos.", en: "Please respect the neighbors' rest." },
    },
    {
      icon: "🗑️",
      title: { pt: "Lixo ensacado", en: "Bag your trash" },
      text: {
        pt: "Deposite na lixeira comum do corredor, perto dos elevadores.",
        en: "Drop it in the shared bin in the hallway, near the elevators.",
      },
    },
    {
      icon: "👕",
      title: { pt: "Passe roupa só na tábua", en: "Iron only on the board" },
      text: { pt: "Nunca sobre a cama ou os móveis.", en: "Never on the bed or furniture." },
    },
    {
      icon: "👥",
      title: { pt: "Somente hóspedes registrados", en: "Registered guests only" },
      text: {
        pt: "Sobre convidados, consulte a anfitriã antes.",
        en: "For visitors, please check with the host first.",
      },
    },
    {
      icon: "💳",
      hot: true,
      title: { pt: "Cartão de garagem · R$ 300", en: "Garage card · R$ 300" },
      text: {
        pt: "Taxa em caso de perda ou não devolução.",
        en: "Fee in case of loss or non-return.",
      },
    },
  ],
};

/**
 * Check-in/check-out do 1305C, com as partes específicas da unidade trocadas
 * por marcadores — vira o template do prédio "Residencial DF Plaza"
 * (`Building.checkinTemplate`/`checkoutTemplate`). Ao criar/editar um
 * apartamento nesse prédio, `applyBuildingTemplate`
 * (`src/data/buildApartmentContent.ts`) troca `{{TORRE}}`/`{{ANDAR}}`/
 * `{{UNIDADE}}`/`{{VAGA}}`/`{{CHECKOUT_HORA}}` pelos valores da unidade.
 */
const dfPlazaCheckinTemplate = {
  sub: { pt: "Da portaria até a porta do apartamento.", en: "From the lobby to your apartment door." },
  cards: [
    {
      title: { pt: "Entrando no prédio", en: "Entering the building" },
      steps: [
        {
          n: "1",
          body: {
            pt: '<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class="hint">Essa entrada fica a poucos metros da portaria da {{TORRE}}.</span>',
            en: '<strong>By Uber/taxi?</strong> Get off at DF Plaza Shopping, at the <strong>Coco Bambu restaurant entrance (2nd floor)</strong>.<span class="hint">This entrance is just a few meters from the {{TORRE}} lobby.</span>',
          },
        },
        {
          n: "2",
          body: {
            pt: `Vá à <strong>portaria 24h da {{TORRE}}</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT}).`,
            en: `Go to the <strong>24h {{TORRE}} lobby</strong>, next to the <strong>Spoleto</strong> restaurant, and show your <strong>ID</strong> (the same one sent via ${CHAT}).`,
          },
        },
        {
          n: "3",
          body: {
            pt: "Suba ao <strong>{{ANDAR}}</strong>, apartamento <strong>{{UNIDADE}}</strong>.",
            en: "Go up to the <strong>{{ANDAR}}</strong>, apartment <strong>{{UNIDADE}}</strong>.",
          },
        },
        {
          n: "4",
          body: {
            pt: `Digite na fechadura eletrônica a <strong>senha enviada pelo ${CHAT}</strong>. Pronto, pode entrar.`,
            en: `Enter the <strong>code sent via ${CHAT}</strong> on the electronic lock. That's it, you're in.`,
          },
        },
      ],
    },
    {
      title: { pt: "Chegou de carro?", en: "Arriving by car?" },
      tag: { pt: "{{VAGA}}", en: "{{VAGA}}" },
      banner: "/media/predio.webp",
      steps: [
        {
          n: "1",
          body: {
            pt: 'Estacione primeiro no <strong>Carrefour</strong> para descarregar as malas.<span class="hint">Grátis por 30 min, ou com compra acima de R$ 50.</span>',
            en: 'Park first at the <strong>Carrefour</strong> lot to unload your luggage.<span class="hint">Free for 30 min, or with a purchase over R$ 50.</span>',
          },
        },
        {
          n: "2",
          body: {
            pt: "Suba ao apartamento e pegue o <strong>Cartão Branco</strong> de acesso, deixado na sala de estar.",
            en: "Go up to the apartment and grab the <strong>White Card</strong> left in the living room.",
          },
        },
        {
          n: "3",
          body: {
            pt: "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>{{VAGA}}</strong>.",
            en: "Drive to the residential parking entrance and use the card: <strong>{{VAGA}}</strong>.",
          },
        },
      ],
      alerts: [
        {
          icon: "📍",
          body: {
            pt: "<strong>Anote:</strong> o GPS oscila no subsolo. {{VAGA}}, próxima ao elevador da torre.",
            en: "<strong>Write it down:</strong> GPS is unreliable underground. {{VAGA}}, near the tower elevator.",
          },
        },
        {
          icon: "💳",
          body: {
            pt: "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: taxa de <strong>R$ 300</strong>.",
            en: "<strong>Don't forget the White Card</strong> before going down to park. Loss or non-return: <strong>R$ 300</strong> fee.",
          },
        },
      ],
      video: {
        src: "/media/como-estacionar.mp4",
        poster: "/media/como-estacionar-poster.jpg",
        label: {
          pt: "▶ Tutorial em vídeo · como chegar e estacionar",
          en: "▶ Video tutorial · arriving & parking",
        },
      },
    },
  ],
};

const dfPlazaCheckoutTemplate = {
  sub: { pt: "Alguns passos rápidos antes de você sair. Boa viagem!", en: "A few quick steps before you go. Safe travels!" },
  steps: [
    {
      n: "1",
      body: {
        pt: "O <strong>horário limite de saída é {{CHECKOUT_HORA}}</strong>. Precisa de late checkout? Fale com a anfitriã.",
        en: "<strong>Check-out is until {{CHECKOUT_HORA}}</strong>. Need a late checkout? Message the host.",
      },
    },
    {
      n: "2",
      body: {
        pt: "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (a não devolução gera taxa de R$ 300).",
        en: "Leave the <strong>White garage Card</strong> on the dining table (non-return incurs a R$ 300 fee).",
      },
    },
    {
      n: "3",
      body: {
        pt: "Ensaque o lixo e deixe na lixeira comum do corredor, perto dos elevadores.",
        en: "Bag the trash and drop it in the shared hallway bin, near the elevators.",
      },
    },
    {
      n: "4",
      body: {
        pt: "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.",
        en: "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
      },
    },
  ],
};

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

  // Prédio compartilhado: Lazer/Guia da cidade/Onde Comer do 1305C viram o
  // conteúdo "ao vivo" de qualquer apartamento do DF Plaza; check-in/check-out
  // viram o template (ver `dfPlazaCheckinTemplate` acima).
  const dfPlaza = await prisma.building.upsert({
    where: { name: "Residencial DF Plaza" },
    update: {
      rules: dfPlazaRules as object,
      home: ap1305c.home as object,
      amenities: ap1305c.amenities as object,
      tourism: ap1305c.tourism as object,
      dining: ap1305c.dining as object,
      checkinTemplate: dfPlazaCheckinTemplate as object,
      checkoutTemplate: dfPlazaCheckoutTemplate as object,
    },
    create: {
      name: "Residencial DF Plaza",
      rules: dfPlazaRules as object,
      home: ap1305c.home as object,
      amenities: ap1305c.amenities as object,
      tourism: ap1305c.tourism as object,
      dining: ap1305c.dining as object,
      checkinTemplate: dfPlazaCheckinTemplate as object,
      checkoutTemplate: dfPlazaCheckoutTemplate as object,
    },
  });

  const apartment = await prisma.apartment.upsert({
    where: { slug: "1305c" },
    update: { content: ap1305c as object, buildingId: dfPlaza.id },
    create: {
      hostId: host.id,
      slug: "1305c",
      label: "Ap 1305C · DF Plaza",
      active: true,
      content: ap1305c as object,
      buildingId: dfPlaza.id,
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
    update: { content: ap1305c as object, buildingId: dfPlaza.id },
    create: {
      hostId: demoHost.id,
      slug: "demo",
      label: "Demonstração · Anfyi",
      active: true,
      buildingId: dfPlaza.id,
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
