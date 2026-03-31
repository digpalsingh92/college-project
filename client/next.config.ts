import type { NextConfig } from "next";

const API_GATEWAY_URL = (process.env.API_GATEWAY_URL || 'http://localhost:5000').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_GATEWAY_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
