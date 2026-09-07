import { readFileSync } from "fs";
import { LogOut } from "lucide-react";
import type { LocalDevice, LocalRoom } from "@/lib/types";
import { Dashboard } from "@/components/Dashboard";

// "Vraie" interface du chantier "accès local" (2026-09-07, cf. HANDOFF.md du
// dépôt domoticium-web) — équipements par pièce + panneau alarme à droite,
// décidé avec Hicham. Reprend les VRAIS tokens de couleur/Tailwind de l'app
// cloud (globals.css/tailwind.config.ts copiés depuis domoticium-web) — le
// filtrage du bruit HA/Supervisor et la résolution des noms se font
// maintenant côté addon (handle_local_devices, main.py), plus ici : cette
// page n'a plus à deviner quoi que ce soit. Migration vers le contrat
// backend/local.ts (posé côté domoticium-web) reste à faire.
export const dynamic = "force-dynamic";

function readIngestSecret(): string | null {
  try {
    const raw = readFileSync("/data/options.json", "utf-8");
    const options = JSON.parse(raw) as { ingest_secret?: string };
    return options.ingest_secret || null;
  } catch {
    return null;
  }
}

async function fetchLocalDevices(): Promise<{ rooms: LocalRoom[]; alarm: LocalDevice | null } | { error: string }> {
  const secret = readIngestSecret();
  if (!secret) {
    return { error: "ingest_secret absent de /data/options.json — configuration de l'add-on incomplète." };
  }
  try {
    const res = await fetch("http://127.0.0.1:8098/local/devices", {
      headers: { "X-Site-Secret": secret },
      cache: "no-store",
    });
    if (!res.ok) {
      return { error: `L'addon Domoticium a répondu ${res.status} — vérifier qu'il tourne bien.` };
    }
    const data = (await res.json()) as { rooms: LocalRoom[] };

    // L'alarme est extraite des pièces pour son propre panneau dédié (décidé
    // avec Hicham : "équipements par pièce" + "alarme à droite"), pas mélangée
    // aux cartes d'équipement — au plus une seule alarme par site aujourd'hui,
    // le premier trouvé fait foi.
    let alarm: LocalDevice | null = null;
    const rooms = data.rooms
      .map((r) => {
        const devices = r.devices.filter((d) => {
          if (d.domain === "alarm_control_panel") {
            if (!alarm) alarm = d;
            return false;
          }
          return true;
        });
        return { ...r, devices };
      })
      .filter((r) => r.devices.length > 0);

    return { rooms, alarm };
  } catch (e) {
    return { error: `Impossible de joindre l'addon Domoticium (127.0.0.1:8098) : ${e instanceof Error ? e.message : String(e)}` };
  }
}

export default async function LocalDashboardPage() {
  const result = await fetchLocalDevices();

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 md:px-8">
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Domoticium — Accès local</h1>
          <p className="text-sm text-muted-foreground">Pilotage de vos équipements sans internet.</p>
        </div>
        <a
          href="/api/auth/logout"
          className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Se déconnecter
        </a>
      </div>

      {"error" in result ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {result.error}
        </div>
      ) : (
        <Dashboard rooms={result.rooms} alarmDevice={result.alarm} />
      )}
    </main>
  );
}
