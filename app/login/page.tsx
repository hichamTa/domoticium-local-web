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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Domoticium — Accès local</h1>
        <p style={{ color: "#9a9aa4", fontSize: 14, maxWidth: 360 }}>
          Connectez-vous avec votre compte Home Assistant pour piloter vos équipements sans internet.
        </p>
      </div>

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

      <a
        href="/api/auth/login"
        style={{
          background: "#3b82f6",
          color: "#fff",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Se connecter
      </a>
    </main>
  );
}
