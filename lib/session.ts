import { cookies } from "next/headers";

// Authentification déléguée à Home Assistant (chantier "accès local", décidé
// avec Hicham 2026-09-06) — flux OAuth2 standard et DOCUMENTÉ de HA
// (developers.home-assistant.io/docs/auth_api), PAS une réinvention maison :
// /auth/authorize (page de connexion NATIVE de HA, jamais notre code — cette
// app ne voit ni ne stocke jamais le mot de passe du client) puis /auth/token
// pour échanger le code contre des jetons. client_id doit partager host+port
// avec redirect_uri (contrainte documentée) — les deux sont dérivés de la
// requête entrante (Host header), pas codés en dur, pour rester valides que
// l'accès se fasse par IP brute ou par le futur nom mDNS.

const COOKIE_NAME = "domoticium_local_session";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    // Pas de `secure` : accès local en HTTP simple (comme le reste du
    // serveur de commandes de l'addon principal, cf. HANDOFF) — chiffrer le
    // réseau local n'était pas dans le périmètre de ce chantier.
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours — le refresh_token HA dure tant qu'il n'est pas révoqué
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function haBaseUrl(host: string): string {
  // L'add-on HA lui-même tourne toujours sur le port 8123, quel que soit le
  // nom/IP utilisé pour joindre CETTE app (192.168.x.x, ou pi-<slug>.local
  // une fois le mDNS en place) — même hôte, port différent.
  const hostname = host.split(":")[0];
  return `http://${hostname}:8123`;
}
