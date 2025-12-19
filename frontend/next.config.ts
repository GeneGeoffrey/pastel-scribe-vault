import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized configuration for FHEVM and production deployment
  experimental: {
    optimizePackageImports: ['@fhevm/solidity', '@rainbow-me/rainbowkit'],
  },

  // Turbopack configuration
  turbopack: {},

  // Security headers for FHEVM compatibility
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // Bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sepolia.etherscan.io',
      },
    ],
  },
};

export default nextConfig;
