import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/asesorias',
        destination: '/asesoria-ia.html',
      },
    ]
  },
};

export default nextConfig;
