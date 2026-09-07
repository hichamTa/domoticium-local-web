export const metadata = {
  title: "Domoticium — Accès local",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0f1115",
          color: "#e8e8ec",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
