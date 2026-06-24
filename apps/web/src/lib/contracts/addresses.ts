import { base, baseSepolia } from "viem/chains";

import { blockOreEnv, DEFAULT_USDC_ADDRESSES } from "@/lib/env";

export const contractAddresses = {
  [base.id]: {
    blockOre: blockOreEnv.blockOreAddressBase || undefined,
    oreNft: blockOreEnv.oreNftAddressBase || undefined,
    usdc: DEFAULT_USDC_ADDRESSES.base,
  },
  [baseSepolia.id]: {
    blockOre: blockOreEnv.blockOreAddressBaseSepolia || undefined,
    oreNft: blockOreEnv.oreNftAddressBaseSepolia || undefined,
    usdc: DEFAULT_USDC_ADDRESSES.baseSepolia,
  },
} as const;

export const getContractAddresses = (chainId?: number) =>
  chainId
    ? contractAddresses[chainId as keyof typeof contractAddresses]
    : undefined;
