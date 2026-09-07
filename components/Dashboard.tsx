"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LocalDevice, LocalRoom } from "@/lib/types";
import { TOGGLABLE_DOMAINS } from "@/lib/types";
import { AlarmPanel } from "./AlarmPanel";

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
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#1a1c22",
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 14,
        opacity: pending ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <span>{device.name}</span>
      {togglable ? (
        <button
          onClick={handleToggle}
          disabled={pending}
          aria-pressed={isOn}
          aria-label={`${device.name} — ${isOn ? "allumé" : "éteint"}`}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: "none",
            background: isOn ? "#3b82f6" : "#3a3d46",
            position: "relative",
            cursor: pending ? "default" : "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: isOn ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s",
            }}
          />
        </button>
      ) : (
        <span style={{ color: "#9a9aa4", fontVariantNumeric: "tabular-nums" }}>
          {device.state ?? "—"}
        </span>
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: alarmDevice ? "1fr 320px" : "1fr",
        gap: 24,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
        {error && (
          <div
            style={{
              background: "#2a1616",
              border: "1px solid #5a2a2a",
              borderRadius: 8,
              padding: "10px 16px",
              color: "#f5b8b8",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {rooms.length === 0 ? (
          <p style={{ color: "#9a9aa4" }}>Aucun équipement trouvé.</p>
        ) : (
          rooms.map((room) => (
            <section key={room.name}>
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
