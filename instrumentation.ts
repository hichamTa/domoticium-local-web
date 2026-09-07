// Hook de démarrage officiel de Next.js (exécuté une fois, au lancement du
// serveur) — endroit prévu pour ce genre d'effet de bord, pas un hack sur le
// point d'entrée. https://nextjs.org/docs/app/guides/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMdnsAnnouncer } = await import("./lib/mdns");
    startMdnsAnnouncer();
  }
}
