import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import type { Chain } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { Attribution } from "ox/erc8021";

import { blockOreEnv } from "@/lib/env";
import { hardhatLocal, supportedChains } from "@/lib/web3/chains";

const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_kvfh7urx"],
});

// 每条链对应的 Alchemy RPC URL
const rpcUrlByChainId: Record<number, string> = {
  [mainnet.id]: blockOreEnv.ethereumMainnetRpcUrl,
  [base.id]: blockOreEnv.baseMainnetRpcUrl,
  [sepolia.id]: blockOreEnv.ethereumSepoliaRpcUrl,
  [baseSepolia.id]: blockOreEnv.baseSepoliaRpcUrl,
  [hardhatLocal.id]: blockOreEnv.hardhatRpcUrl,
};

const transports = supportedChains.reduce<
  Record<number, ReturnType<typeof http>>
>((acc, chain) => {
  acc[chain.id] = http(
    rpcUrlByChainId[chain.id] ?? chain.rpcUrls.default.http[0],
  );
  return acc;
}, {});

export const wagmiConfig = createConfig({
  chains: supportedChains as [Chain, ...Chain[]],
  transports,
  dataSuffix: BUILDER_CODE_SUFFIX,
});
