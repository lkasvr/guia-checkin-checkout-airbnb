import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg/90 px-5 py-3 backdrop-blur">
        <Link href="/admin" className="font-display text-[20px] no-underline">
          Anfyi <span className="text-terra">·</span> superadmin
        </Link>
        <span className="ml-auto hidden text-[14px] text-soft sm:inline">
          {session.user.email}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="rounded-full border border-line bg-card px-4 py-2 text-[14px] font-semibold text-soft transition-transform active:scale-95">
            Sair
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-[820px] px-5 py-7">{children}</main>
    </div>
  );
}
