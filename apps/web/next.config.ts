import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const turbopackAliases = {
  "@farcaster/mini-app-solana": "./src/lib/shims/empty-module.ts",
  "@react-native-async-storage/async-storage":
    "./src/lib/shims/empty-module.ts",
  "@solana/kit": "./src/lib/shims/solana-kit.ts",
  "@solana-program/memo": "./src/lib/shims/solana-memo.ts",
  "@solana-program/system": "./src/lib/shims/solana-system.ts",
  "@solana-program/token": "./src/lib/shims/solana-token.ts",
  "@solana/wallet-standard-features": "./src/lib/shims/empty-module.ts",
  "@wallet-standard/app": "./src/lib/shims/wallet-standard-app.ts",
  "@wallet-standard/base": "./src/lib/shims/empty-module.ts",
  "@wallet-standard/features": "./src/lib/shims/empty-module.ts",
  "@stripe/crypto": "./src/lib/shims/empty-module.ts",
  "x402/client": "./src/lib/shims/x402-client.ts",
  "x402/types": "./src/lib/shims/empty-module.ts",
} as const;

const webpackAliases = Object.fromEntries(
  Object.entries(turbopackAliases).map(([key, value]) => [
    key,
    path.join(__dirname, value),
  ]),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: turbopackAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      ...webpackAliases,
    };

    return config;
  },
};

export default withNextIntl(nextConfig);
