import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js usa .env.local; o CLI do Prisma não carrega env sozinho (v7).
loadEnv({ path: [".env.local", ".env"] });

// CLI (migrate/db pull/seed) usa a conexão DIRETA do Neon (sem pooler).
// O runtime usa a pooled via adapter em src/lib/db.ts.
const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error(
    "Nenhuma URL de conexão encontrada. Defina DIRECT_URL, DATABASE_URL_UNPOOLED ou DATABASE_URL (ver .env.local).",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
