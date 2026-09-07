"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LocalDevice } from "@/lib/types";

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  disarmed: { label: "Désarmée", color: "#4ade80" },
  armed_home: { label: "Armée — Présent", color: "#60a5fa" },
  armed_away: { label: "Armée — Absent", color: "#f97316" },
  armed_night: { label: "Armée — Nuit", color: "#a78bfa" },
  pending: { label: "Armement en cours…", color: "#facc15" },
  arming: { label: "Armement en cours…", color: "#facc15" },
  disarming: { label: "Désarmement en cours…", color: "#facc15" },
  triggered: { label: "⚠ Alarme déclenchée", color: "#f87171" },
};

async function sendAlarmCommand(service: string, entityId: string, code: string) {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, entityId, data: code ? { code } : {} }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Commande refusée — code incorrect ?");
  }
}

export function AlarmPanel({
  device,
  onError,
}: {
  device: LocalDevice;
  onError: (msg: string) => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const current = (device.state && STATE_LABELS[device.state]) || {
    label: device.state ?? "État inconnu",
    color: "#9a9aa4",
  };

  const act = (service: string) => {
    startTransition(async () => {
      try {
        await sendAlarmCommand(service, device.entityId, code);
        router.refresh();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  };

  return (
    <aside
      style={{
        background: "#1a1c22",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "sticky",
        top: 24,
      }}
    >
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "#8a8a94", margin: 0 }}>
        Alarme
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: current.color, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 500 }}>{current.label}</span>
      </div>

      <input
        type="password"
        inputMode="numeric"
        placeholder="Code (si requis)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          background: "#0f1115",
          border: "1px solid #2a2d36",
          borderRadius: 8,
          padding: "8px 12px",
          color: "#e8e8ec",
          fontSize: 14,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => act("alarm_control_panel.alarm_disarm")}
          disabled={pending}
          style={btnStyle("#3b82f6")}
        >
          Désarmer
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_home")}
          disabled={pending}
          style={btnStyle("#2a2d36")}
        >
          Présent
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_night")}
          disabled={pending}
          style={btnStyle("#2a2d36")}
        >
          Nuit
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_away")}
          disabled={pending}
          style={btnStyle("#2a2d36")}
        >
          Absent
        </button>
      </div>
    </aside>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 0",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };
}
