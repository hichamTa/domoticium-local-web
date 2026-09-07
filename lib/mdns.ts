import { networkInterfaces } from "os";
import { readFileSync } from "fs";

// Annonce mDNS/Bonjour du nom local "pi-<site>.local" (chantier "accès local",
// décidé avec Hicham 2026-09-07) — délibérément fait par CET add-on lui-même
// plutôt qu'en renommant le nom système du Raspberry (déjà utilisé par HA sous
// "homeassistant.local") : renommer le hostname système a un historique
// documenté de CASSER la résolution mDNS existante sur certaines installations
// HAOS (github.com/home-assistant/supervisor#2403) — risque réel et inutile
// sur un système déjà utilisé au quotidien. Annoncer un nom EN PLUS, sans
// toucher au nom système, est purement additif : aucun risque pour ce qui
// fonctionne déjà.
//
// La résolution de nom ne dépend pas du port — une fois "pi-<site>.local"
// résolu, ça marche aussi bien pour cette app (:8100) que pour HA lui-même
// (:8123), sans rien configurer de plus.

function readSitePrefix(): string | null {
  try {
    const raw = readFileSync("/data/options.json", "utf-8");
    const options = JSON.parse(raw) as { site_prefix?: string };
    return options.site_prefix || null;
  } catch {
    return null;
  }
}

function ownLanIPv4(): string | null {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

export function startMdnsAnnouncer(): void {
  const sitePrefix = readSitePrefix();
  const ip = ownLanIPv4();

  if (!sitePrefix || !ip) {
    console.warn(
      `[mdns] Annonce désactivée — site_prefix=${sitePrefix ?? "absent"} ip=${ip ?? "introuvable"}`
    );
    return;
  }

  const hostname = `pi-${sitePrefix}.local`;

  // Import dynamique : ce module ne doit tourner que côté serveur Node (jamais
  // pendant le build Next.js, qui exécute aussi ce fichier dans certains
  // contextes) — chargé uniquement au démarrage réel via instrumentation.ts.
  const mdns = require("multicast-dns")();

  mdns.on("query", (query: { questions: Array<{ name: string; type: string }> }) => {
    const asksForUs = query.questions.some(
      (q) => q.type === "A" && q.name.toLowerCase() === hostname.toLowerCase()
    );
    if (asksForUs) {
      mdns.respond({
        answers: [{ name: hostname, type: "A", ttl: 120, data: ip }],
      });
    }
  });

  console.log(`[mdns] "${hostname}" annoncé → ${ip}`);
}
