export type BaseNetworkMode = "mainnet" | "sepolia";

export const DEFAULT_USDC_ADDRESSES = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
} as const;

const normalizeMode = (value?: string | null): BaseNetworkMode | undefined => {
  if (!value) return undefined;

  const normalized = value.toLowerCase();
  if (normalized === "base" || normalized === "mainnet") return "mainnet";
  if (normalized === "base-sepolia" || normalized === "sepolia")
    return "sepolia";

  return undefined;
};

export const blockOreEnv = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  privyClientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? "",
  baseNetwork:
    /* //上线主网后使用
      normalizeMode(process.env.NEXT_PUBLIC_BASE_NETWORK) ??
    (process.env.NODE_ENV === "production" ? "mainnet" : "sepolia"),
  */
    normalizeMode(process.env.NEXT_PUBLIC_BASE_NETWORK) ?? "sepolia",

  // RPC
  baseRpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "",
  baseSepoliaRpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? "",
  ethereumRpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ?? "",
  ethereumSepoliaRpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ?? "",

  // Contract addresses
  blockOreAddressBase: process.env.NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE ?? "",
  blockOreAddressBaseSepolia:
    process.env.NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE_SEPOLIA ?? "",
  oreNftAddressBase: process.env.NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE ?? "",
  oreNftAddressBaseSepolia:
    process.env.NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE_SEPOLIA ?? "",
};

export const isPrivyConfigured = Boolean(blockOreEnv.privyAppId);
