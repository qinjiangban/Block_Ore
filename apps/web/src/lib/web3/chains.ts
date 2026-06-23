import type { Chain } from "viem";
import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
} from "viem/chains";

import { blockOreEnv } from "@/lib/env";

export const evmChains = {
  dev: {
    ethereum: sepolia,
    base: baseSepolia,
  },
  prod: {
    ethereum: mainnet,
    base,
  },
} as const;

export const activeChains =
  blockOreEnv.baseNetwork === "mainnet"
    ? evmChains.prod
    : evmChains.dev;

export const supportedChains: Chain[] = [
  activeChains.ethereum,
  activeChains.base,
];

export const supportedChainsTuple = [
  activeChains.ethereum,
  activeChains.base,
] as const;

export const defaultChain: Chain = activeChains.base;

// 向后兼容别名
export const activeChain = activeChains.base;

export const chainLabelById: Record<number, string> = {
  [mainnet.id]: "Ethereum Mainnet",
  [base.id]: "Base Mainnet",
  [sepolia.id]: "Ethereum Sepolia",
  [baseSepolia.id]: "Base Sepolia",
};

export const chainShortLabel: Record<number, string> = {
  [mainnet.id]: "ETH",
  [base.id]: "Base",
  [sepolia.id]: "Sepolia",
  [baseSepolia.id]: "Base Sepolia",
};

export const chainIconColor: Record<number, string> = {
  [mainnet.id]: "#627EEA",
  [base.id]: "#0052FF",
  [sepolia.id]: "#627EEA",
  [baseSepolia.id]: "#0052FF",
};

export const getChainLabel = (chainId?: number) => {
  if (!chainId) return chainLabelById[defaultChain.id];
  return chainLabelById[chainId] ?? `Chain #${chainId}`;
};

export const getChainShortLabel = (chainId?: number) => {
  if (!chainId) return chainShortLabel[defaultChain.id];
  return chainShortLabel[chainId] ?? `#${chainId}`;
};

export const getChainIconColor = (chainId?: number) => {
  if (!chainId) return chainIconColor[defaultChain.id];
  return chainIconColor[chainId] ?? "#888";
};
