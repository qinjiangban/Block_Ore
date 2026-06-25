import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const turbopackAliases = {
  "@farcaster/mini-app-solana": "./src/lib/shims/empty-module.ts",
  "@react-native-async-storage/async-storage":
    "./src/lib/shims/empty-module.ts",
  "@wallet-standard/app": "./src/lib/shims/wallet-standard-app.ts",
  "@wallet-standard/base": "./src/lib/shims/empty-module.ts",
  "@wallet-standard/features": "./src/lib/shims/empty-module.ts",
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
    root: path.resolve(__dirname),
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
