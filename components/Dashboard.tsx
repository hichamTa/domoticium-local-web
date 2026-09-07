"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Lightbulb, Power, Gauge, type LucideIcon } from "lucide-react";
import type { LocalDevice, LocalRoom } from "@/lib/types";
import { TOGGLABLE_DOMAINS } from "@/lib/types";
import { AlarmPanel } from "./AlarmPanel";

const DOMAIN_ICON: Record<string, LucideIcon> = {
  light: Lightbulb,
  switch: Power,
};

async function sendCommand(service: string, entityId: string, data?: Record<string, unknown>) {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, entityId, data }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Commande refusée");
  }
}

function deviceDomainService(domain: string): string {
  // "toggle" existe pour light ET switch (ALLOWED_SERVICES côté addon) — un
  // seul appel suffit, pas besoin de connaître l'état actuel côté client.
  return `${domain}.toggle`;
}

function DeviceRow({ device, onError }: { device: LocalDevice; onError: (msg: string) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const togglable = TOGGLABLE_DOMAINS.has(device.domain);
  const isOn = device.state === "on";
  const Icon = DOMAIN_ICON[device.domain] ?? Gauge;

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await sendCommand(deviceDomainService(device.domain), device.entityId);
        router.refresh();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  };

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg bg-card px-4 py-3 text-sm transition-opacity"
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon
          className={`h-4 w-4 shrink-0 ${togglable && isOn ? "text-primary" : "text-muted-foreground"}`}
        />
        <span className="truncate">{device.name}</span>
      </div>
      {togglable ? (
        <button
          onClick={handleToggle}
          disabled={pending}
          aria-pressed={isOn}
          aria-label={`${device.name} — ${isOn ? "allumé" : "éteint"}`}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: isOn ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
            style={{ left: isOn ? 22 : 2 }}
          />
        </button>
      ) : (
        <span className="shrink-0 tabular-nums text-muted-foreground">{device.state ?? "—"}</span>
      )}
    </div>
  );
}

export function Dashboard({
  rooms,
  alarmDevice,
}: {
  rooms: LocalRoom[];
  alarmDevice: LocalDevice | null;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={alarmDevice ? "grid gap-6 md:grid-cols-[1fr_300px]" : "grid gap-6"}>
      <div className="min-w-0 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun équipement trouvé.</p>
        ) : (
          rooms.map((room) => (
            <section key={room.name}>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {room.name}
              </h2>
              <div className="space-y-2">
                {room.devices.map((d) => (
                  <DeviceRow key={d.entityId} device={d} onError={setError} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {alarmDevice && <AlarmPanel device={alarmDevice} onError={setError} />}
    </div>
  );
}
