import type { Chain } from "viem";
import { defineChain } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";

import { blockOreEnv } from "@/lib/env";

/** Hardhat 本地网络（chainId 31337） */
export const hardhatLocal: Chain = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [blockOreEnv.hardhatRpcUrl] },
  },
  testnet: true,
});

/** 当前环境支持的链：
 *  开发 = Base Sepolia + Hardhat 本地
 *  生产 = Ethereum 主网 + Base 主网 */
export const supportedChains: Chain[] =
  blockOreEnv.baseNetwork === "mainnet"
    ? [mainnet, base]
    : [baseSepolia, hardhatLocal];

export const supportedChainsTuple =
  blockOreEnv.baseNetwork === "mainnet"
    ? ([mainnet, base] as const)
    : ([baseSepolia, hardhatLocal] as const);

export const defaultChain: Chain =
  blockOreEnv.baseNetwork === "mainnet" ? base : baseSepolia;

// 向后兼容别名
export const activeChain = defaultChain;

export const chainLabelById: Record<number, string> = {
  [mainnet.id]: "Ethereum Mainnet",
  [base.id]: "Base Mainnet",
  [sepolia.id]: "Ethereum Sepolia",
  [baseSepolia.id]: "Base Sepolia",
  [hardhatLocal.id]: "Hardhat Local",
};

export const chainShortLabel: Record<number, string> = {
  [mainnet.id]: "ETH",
  [base.id]: "Base",
  [sepolia.id]: "Sepolia",
  [baseSepolia.id]: "Base Sepolia",
  [hardhatLocal.id]: "Hardhat",
};

export const chainIconColor: Record<number, string> = {
  [mainnet.id]: "#627EEA",
  [base.id]: "#0052FF",
  [sepolia.id]: "#627EEA",
  [baseSepolia.id]: "#0052FF",
  [hardhatLocal.id]: "#FFB300",
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
