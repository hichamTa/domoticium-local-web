import { readFileSync } from "fs";

// Sans ça, Next.js pré-rendait cette page en STATIQUE au moment du build
// Docker (aucun /data/options.json ni addon joignable à ce moment-là) et
// aurait servi éternellement la même page d'erreur figée à chaque requête
// réelle une fois déployé — trouvé en testant le build local avant de
// pousser, pas supposé.
export const dynamic = "force-dynamic";

// Squelette du chantier "accès local" (2026-09-06, cf. HANDOFF.md du dépôt
// domoticium-web) — 1re page réelle, volontairement simple : prouve que
// l'app locale peut lire les équipements directement depuis l'addon
// Domoticium (127.0.0.1:8098, même réseau hôte — host_network: true des deux
// côtés), sans jamais passer par Supabase/le cloud. Pas encore la vraie
// interface "équipements par pièce" soignée décidée avec Hicham — juste
// assez pour vérifier que le bon chemin de données fonctionne.

interface LocalDevice {
  entityId: string;
  name: string;
  domain: string;
  state: string | null;
}

interface LocalRoom {
  name: string;
  devices: LocalDevice[];
}

// Entités internes HA/Supervisor (CPU/mémoire de chaque module, versions,
// sauvegardes...) — bruit technique, pas de vrais équipements. La route
// addon /local/devices ne les filtre pas encore (cf. HANDOFF) ; filtré ici
// en attendant, pour ne pas polluer la toute première vraie page.
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

async function fetchLocalDevices(): Promise<{ rooms: LocalRoom[] } | { error: string }> {
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
    const rooms = data.rooms
      .map((r) => ({ ...r, devices: r.devices.filter((d) => !isNoise(d.entityId)) }))
      .filter((r) => r.devices.length > 0);
    return { rooms };
  } catch (e) {
    return { error: `Impossible de joindre l'addon Domoticium (127.0.0.1:8098) : ${e instanceof Error ? e.message : String(e)}` };
  }
}

export default async function LocalDashboardPage() {
  const result = await fetchLocalDevices();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 64px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Domoticium — Accès local</h1>
      <p style={{ color: "#9a9aa4", fontSize: 14, marginTop: 0, marginBottom: 28 }}>
        Squelette de vérification — pas encore l&apos;interface finale.
      </p>

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
      ) : result.rooms.length === 0 ? (
        <p style={{ color: "#9a9aa4" }}>Aucun équipement trouvé.</p>
      ) : (
        result.rooms.map((room) => (
          <section key={room.name} style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "#8a8a94",
                marginBottom: 10,
              }}
            >
              {room.name}
            </h2>
            <div style={{ display: "grid", gap: 8 }}>
              {room.devices.map((d) => (
                <div
                  key={d.entityId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#1a1c22",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 14,
                  }}
                >
                  <span>{d.name}</span>
                  <span style={{ color: "#9a9aa4", fontVariantNumeric: "tabular-nums" }}>
                    {d.state ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
