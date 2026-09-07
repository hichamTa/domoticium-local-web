"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import type { LocalDevice } from "@/lib/types";

const STATE_LABELS: Record<string, { label: string; dotClass: string }> = {
  disarmed: { label: "Désarmée", dotClass: "bg-success" },
  armed_home: { label: "Armée — Présent", dotClass: "bg-info" },
  armed_away: { label: "Armée — Absent", dotClass: "bg-warning" },
  armed_night: { label: "Armée — Nuit", dotClass: "bg-info" },
  pending: { label: "Armement en cours…", dotClass: "bg-warning animate-pulse" },
  arming: { label: "Armement en cours…", dotClass: "bg-warning animate-pulse" },
  disarming: { label: "Désarmement en cours…", dotClass: "bg-warning animate-pulse" },
  triggered: { label: "Alarme déclenchée", dotClass: "bg-danger animate-pulse" },
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
    dotClass: "bg-muted-foreground",
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
    <aside className="sticky top-6 h-fit space-y-4 rounded-xl bg-card p-5">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Alarme
      </h2>

      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${current.dotClass}`} />
        <span className="text-sm font-medium">{current.label}</span>
      </div>

      <input
        type="password"
        inputMode="numeric"
        placeholder="Code (si requis)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => act("alarm_control_panel.alarm_disarm")}
          disabled={pending}
          className="rounded-lg bg-primary py-2.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          Désarmer
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_home")}
          disabled={pending}
          className="rounded-lg bg-secondary py-2.5 text-xs font-medium text-secondary-foreground disabled:opacity-60"
        >
          Présent
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_night")}
          disabled={pending}
          className="rounded-lg bg-secondary py-2.5 text-xs font-medium text-secondary-foreground disabled:opacity-60"
        >
          Nuit
        </button>
        <button
          onClick={() => act("alarm_control_panel.alarm_arm_away")}
          disabled={pending}
          className="rounded-lg bg-secondary py-2.5 text-xs font-medium text-secondary-foreground disabled:opacity-60"
        >
          Absent
        </button>
      </div>
    </aside>
  );
}
