import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
