import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "@/lib/db";

// Hash 10-rounds pré-computado (constante): comparado quando o e-mail não
// existe, para o bcrypt.compare rodar sempre e normalizar o tempo de resposta
// (evita enumeração de e-mail por timing). Literal em vez de hashSync para não
// custar CPU de bcrypt no cold start de cada função. (rate limiting = follow-up)
const DUMMY_HASH = "$2b$10$Po83ok8l.3lU6L8NMOjhd.G0y.QhsPkOmWbkxffRLGrBDM1qHDZFi";

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!ok || !user?.passwordHash) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = String(token.id);
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// Deduplica a verificação do JWT dentro de um mesmo render (layout + page
// chamam auth() no mesmo request) via cache() do React.
export const auth = cache(nextAuth.auth);
