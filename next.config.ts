import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  async redirects() {
    return [
      // Página antiga, substituída pelo site institucional
      { source: "/como-funciona", destination: "/funcionalidades", permanent: true },
      // Telas antigas do portal do grupo: agora ficam dentro de cada festival
      { source: "/grupo/:pagina(apresentacoes|participantes|midias|mapas-de-luz)", destination: "/grupo/dashboard", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
