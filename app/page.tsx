import { readFileSync } from "fs";
import type { LocalDevice, LocalRoom } from "@/lib/types";
import { Dashboard } from "@/components/Dashboard";

// "Vraie" interface du chantier "accès local" (2026-09-07, cf. HANDOFF.md du
// dépôt domoticium-web) — équipements par pièce + panneau alarme à droite,
// décidé avec Hicham. Remplace la page de vérification minimale du squelette
// initial. Migration vers le contrat backend/local.ts (posé côté
// domoticium-web) reste à faire — cette page continue d'utiliser sa propre
// logique ad hoc pour l'instant, cf. "reste à faire" dans HANDOFF.
export const dynamic = "force-dynamic";

// Mêmes préfixes de bruit HA/Supervisor que dans le squelette initial —
// toujours filtrés côté page en attendant que /local/devices le fasse
// lui-même (cf. HANDOFF, pas encore fait).
const NOISE_PREFIXES = [
  "sensor.home_assistant_",
  "sensor.backup_",
  "binary_sensor.terminal_ssh",
  "sensor.terminal_ssh",
  "switch.terminal_ssh",
  "binary_sensor.domoticium_en_cours",
  "sensor.domoticium_version",
  "sensor.domoticium_pourcentage",
  "switch.domoticium",
  "binary_sensor.mosquitto_broker",
  "sensor.mosquitto_broker",
  "switch.mosquitto_broker",
  "binary_sensor.zigbee2mqtt_en_cours",
  "sensor.zigbee2mqtt_version",
  "sensor.zigbee2mqtt_pourcentage",
  "switch.zigbee2mqtt",
  "binary_sensor.matter_server",
  "sensor.matter_server",
  "switch.matter_server",
  "binary_sensor.openthread_border_router",
  "sensor.openthread_border_router",
  "switch.openthread_border_router",
  "binary_sensor.frigate_en_cours",
  "sensor.frigate_version",
  "sensor.frigate_pourcentage",
  "switch.frigate",
  "binary_sensor.samba_share",
  "sensor.samba_share",
  "switch.samba_share",
];

function isNoise(entityId: string): boolean {
  return NOISE_PREFIXES.some((p) => entityId.startsWith(p));
}

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
          if (isNoise(d.entityId)) return false;
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
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Domoticium — Accès local</h1>
          <p style={{ color: "#9a9aa4", fontSize: 14, margin: 0 }}>Pilotage de vos équipements sans internet.</p>
        </div>
        <a href="/api/auth/logout" style={{ color: "#9a9aa4", fontSize: 13 }}>
          Se déconnecter
        </a>
      </div>

      {"error" in result ? (
        <div
          style={{
            background: "#2a1616",
            border: "1px solid #5a2a2a",
            borderRadius: 8,
            padding: 16,
            color: "#f5b8b8",
            fontSize: 14,
          }}
        >
          {result.error}
        </div>
      ) : (
        <Dashboard rooms={result.rooms} alarmDevice={result.alarm} />
      )}
    </main>
  );
}
