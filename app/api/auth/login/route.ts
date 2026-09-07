import { NextRequest, NextResponse } from "next/server";
import { haBaseUrl } from "@/lib/session";

// GET /api/auth/login — démarre le flux OAuth2 standard de HA. Redirige vers
// /auth/authorize sur l'instance HA elle-même : c'est HA qui affiche l'écran
// de connexion (identifiants HA du client), jamais cette app — aucun mot de
// passe ne transite par notre code à aucun moment.
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const origin = `http://${host}`;
  const redirectUri = `${origin}/api/auth/callback`;

  const url = new URL(`${haBaseUrl(host)}/auth/authorize`);
  url.searchParams.set("client_id", origin);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
