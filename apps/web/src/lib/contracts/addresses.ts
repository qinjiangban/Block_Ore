import { base, baseSepolia } from "viem/chains";

import { blockOreEnv } from "@/lib/env";

export const contractAddresses = {
  [base.id]: {
    blockOre: blockOreEnv.blockOreAddressBase || undefined,
    oreNft: blockOreEnv.oreNftAddressBase || undefined,
    usdc: blockOreEnv.usdcAddressBase || undefined,
  },
  [baseSepolia.id]: {
    blockOre: blockOreEnv.blockOreAddressBaseSepolia || undefined,
    oreNft: blockOreEnv.oreNftAddressBaseSepolia || undefined,
    usdc: blockOreEnv.usdcAddressBaseSepolia || undefined,
  },
} as const;

export const getContractAddresses = (chainId?: number) =>
  chainId
    ? contractAddresses[chainId as keyof typeof contractAddresses]
    : undefined;
