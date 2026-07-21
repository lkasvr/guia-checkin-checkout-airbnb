import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SLUG, parseHost } from "@/lib/tenant";

/**
 * Roteia por Host (Next 16 proxy):
 * - anfyi.com.br / www  → /marketing
 * - app.anfyi.com.br    → /dashboard/*
 * - checkin<slug>.…     → /s/<slug>/checkin
 * - checkout<slug>.…    → /s/<slug>/checkout
 * - <slug>.anfyi.com.br → /s/<slug>
 * - localhost / *.vercel.app → só a raiz vira o guia padrão; resto passa direto (dev)
 */
export function proxy(req: NextRequest) {
  const route = parseHost(req.headers.get("host"));
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  switch (route.kind) {
    case "apex":
      if (pathname === "/") {
        url.pathname = "/marketing";
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();

    case "dashboard":
      // app.anfyi.com.br → rotas top-level (/dashboard, /login); raiz vai ao dashboard
      if (pathname === "/") {
        url.pathname = "/dashboard";
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();

    case "admin":
      // admin.anfyi.com.br → área do superadmin; raiz vai ao /admin
      if (pathname === "/") {
        url.pathname = "/admin";
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();

    case "checkin":
    case "checkout":
      url.pathname = `/s/${route.slug}/${route.kind}`;
      return NextResponse.rewrite(url);

    case "guide":
      url.pathname = `/s/${route.slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);

    case "external":
      if (pathname === "/") {
        url.pathname = `/s/${DEFAULT_SLUG}`;
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
  }
}

export const config = {
  // ignora assets do Next, rotas de API e arquivos com extensão
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
