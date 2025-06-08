import { fileURLToPath } from "url";
import createJiti from "jiti";
import { env } from "next-runtime-env";
import { configureRuntimeEnv } from "next-runtime-env/build/configure.js";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

configureRuntimeEnv();

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@kan/api",
    "@kan/db",
    "@kan/shared",
    "@kan/auth",
    "@kan/stripe",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /** Cloudflare Pages支持 - 简单配置 */
  output: "export",
  trailingSlash: true,
  distDir: "out",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `*.${env("NEXT_PUBLIC_STORAGE_DOMAIN")}`,
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    unoptimized: true, // Cloudflare Pages需要
  },
  
  /** 减少构建问题 */
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
  
  experimental: {
    instrumentationHook: true,
    // 移除 optimizeCss 避免 critters 问题
  },
};

export default config;
