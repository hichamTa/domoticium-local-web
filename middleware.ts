import { NextRequest, NextResponse } from "next/server";

// Vérification LÉGÈRE (présence du cookie de session uniquement, pas d'appel
// réseau à HA à chaque requête — resterait à ajouter une vérification de
// validité réelle/révocation si ce squelette devient la version définitive,
// cf. HANDOFF côté web, entrée "chantier accès local").
const COOKIE_NAME = "domoticium_local_session";
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/callback", "/api/auth/logout"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const session = req.cookies.get(COOKIE_NAME);
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
