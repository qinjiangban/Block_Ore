import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { Attribution } from "ox/erc8021";

import { blockOreEnv } from "@/lib/env";
import { evmChains } from "@/lib/web3/chains";

const activeChains =
  blockOreEnv.baseNetwork === "mainnet" ? evmChains.prod : evmChains.dev;

const MAINNET_RPC = "https://ethereum-rpc.publicnode.com";
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_kvfh7urx"],
});

export const wagmiConfig = createConfig({
  chains: [activeChains.base, activeChains.ethereum] as const,
  transports: {
    [base.id]: http(blockOreEnv.baseRpcUrl || base.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(
      blockOreEnv.baseSepoliaRpcUrl || baseSepolia.rpcUrls.default.http[0],
    ),
    [mainnet.id]: http(blockOreEnv.ethereumRpcUrl || MAINNET_RPC),
    [sepolia.id]: http(blockOreEnv.ethereumSepoliaRpcUrl || SEPOLIA_RPC),
  },
  dataSuffix: BUILDER_CODE_SUFFIX,
});
