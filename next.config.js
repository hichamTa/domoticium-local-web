/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nécessaire pour tourner comme add-on HAOS : produit un serveur Node
  // autonome (.next/standalone), pas de dépendance à Vercel.
  output: "standalone",
};

module.exports = nextConfig;
