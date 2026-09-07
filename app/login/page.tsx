import { AlertTriangle, House } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    missing_code: "Connexion annulée.",
    token_exchange_failed: "Home Assistant a refusé la connexion — réessayez.",
  };
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <House className="h-7 w-7" />
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight">Domoticium — Accès local</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Connectez-vous avec votre compte Home Assistant pour piloter vos équipements sans internet.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <a
        href="/api/auth/login"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Se connecter
      </a>
    </main>
  );
}
