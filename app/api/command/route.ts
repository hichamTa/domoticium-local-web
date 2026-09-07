import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";

// POST /api/command — relaie une commande (équipement OU alarme, même
// mécanisme HA générique) vers la route /cmd déjà existante et déjà en
// production sur l'addon principal (127.0.0.1:8098) — celle-là même utilisée
// par l'app cloud, filtrée côté addon par ALLOWED_SERVICES (whitelist stricte
// par domaine, alarm_control_panel y compris). Rien de nouveau à construire
// côté addon pour l'envoi de commandes, uniquement pour la lecture
// (/local/devices, déjà en place).
export async function POST(req: NextRequest) {
  let body: { service?: string; entityId?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { service, entityId, data } = body;
  if (!service || !entityId) {
    return NextResponse.json({ error: "service et entityId requis" }, { status: 400 });
  }

  let secret: string;
  try {
    const options = JSON.parse(readFileSync("/data/options.json", "utf-8")) as { ingest_secret?: string };
    if (!options.ingest_secret) throw new Error("absent");
    secret = options.ingest_secret;
  } catch {
    return NextResponse.json({ error: "Configuration de l'add-on incomplète" }, { status: 500 });
  }

  try {
    const res = await fetch("http://127.0.0.1:8098/cmd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Site-Secret": secret },
      body: JSON.stringify({ service, entity_id: entityId, data: data ?? {} }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: detail || `Addon a répondu ${res.status}` }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: `Addon injoignable : ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }
}
