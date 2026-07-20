import type { Metadata } from "next";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Entrar · Anfyi",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e; // re-lança o NEXT_REDIRECT de sucesso
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-[420px] flex-col justify-center px-6">
      <p className="text-center text-[12px] font-bold uppercase tracking-[0.34em] text-coffee">
        Anfyi
      </p>
      <h1 className="mt-3 text-center font-display text-[34px] font-normal">
        Área do anfitrião
      </h1>

      {error && (
        <p className="mt-5 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-center text-[14.5px] text-terra">
          E-mail ou senha inválidos.
        </p>
      )}

      <form action={login} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-soft">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border border-line bg-card px-4 py-3 text-[16px] text-ink outline-none focus:border-coffee"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-soft">
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-xl border border-line bg-card px-4 py-3 text-[16px] text-ink outline-none focus:border-coffee"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-ink px-6 py-3.5 text-[15.5px] font-bold text-bg transition-transform active:scale-95"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
