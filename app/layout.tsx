import "./globals.css";

export const metadata = {
  title: "Domoticium — Accès local",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}
