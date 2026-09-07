import { NextRequest, NextResponse } from "next/server";
import { haBaseUrl, setSession } from "@/lib/session";

// GET /api/auth/callback — HA redirige ici après une connexion réussie, avec
// un code d'autorisation à usage unique (?code=...). On l'échange contre les
// jetons via /auth/token (endpoint DOCUMENTÉ, cf. developers.home-assistant.io/
// docs/auth_api) — même mécanisme que l'app compagnon officielle de HA.
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const origin = `http://${host}`;
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const tokenRes = await fetch(`${haBaseUrl(host)}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: origin,
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    console.error("[auth/callback] Échange de code refusé par HA :", tokenRes.status, detail.slice(0, 300));
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  await setSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  });

  return NextResponse.redirect(`${origin}/`);
}
