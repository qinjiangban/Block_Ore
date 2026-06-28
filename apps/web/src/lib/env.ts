export type BaseNetworkMode = "mainnet" | "sepolia";

export const DEFAULT_USDC_ADDRESSES = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
} as const;

const normalizeMode = (value?: string | null): BaseNetworkMode | undefined => {
  if (!value) return undefined;

  const normalized = value.toLowerCase();
  if (
    normalized === "base" ||
    normalized === "mainnet" ||
    normalized === "base-mainnet"
  )
    return "mainnet";
  if (normalized === "sepolia" || normalized === "base-sepolia")
    return "sepolia";

  return undefined;
};

// Alchemy RPC URL = base URL + API key
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";

const alchemyRpc = (baseUrl: string | undefined, fallback: string): string => {
  const url = baseUrl?.trim() || fallback;
  return ALCHEMY_API_KEY ? `${url}${ALCHEMY_API_KEY}` : url;
};

export const blockOreEnv = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  privyClientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? "",
  baseNetwork: normalizeMode(process.env.NEXT_PUBLIC_BASE_NETWORK) ?? "sepolia",

  // Alchemy RPC URLs（base URL + API key 自动拼接）
  baseMainnetRpcUrl: alchemyRpc(
    process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
    "https://base-mainnet.g.alchemy.com/v2/",
  ),
  baseSepoliaRpcUrl: alchemyRpc(
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    "https://base-sepolia.g.alchemy.com/v2/",
  ),
  ethereumMainnetRpcUrl: alchemyRpc(
    process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL,
    "https://eth-mainnet.g.alchemy.com/v2/",
  ),
  ethereumSepoliaRpcUrl: alchemyRpc(
    process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL,
    "https://eth-sepolia.g.alchemy.com/v2/",
  ),
  hardhatRpcUrl:
    process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ?? "http://127.0.0.1:8545",

  // Contract addresses
  blockOreAddressBase: process.env.NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE ?? "",
  blockOreAddressBaseSepolia:
    process.env.NEXT_PUBLIC_BLOCK_ORE_ADDRESS_BASE_SEPOLIA ?? "",
  blockOreAddressHardhat:
    process.env.NEXT_PUBLIC_BLOCK_ORE_ADDRESS_HARDHAT ?? "",

  usdcAddressHardhat: process.env.NEXT_PUBLIC_USDC_ADDRESS_HARDHAT ?? "",

  oreNftAddressBase: process.env.NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE ?? "",
  oreNftAddressBaseSepolia:
    process.env.NEXT_PUBLIC_ORE_NFT_ADDRESS_BASE_SEPOLIA ?? "",
  oreNftAddressHardhat: process.env.NEXT_PUBLIC_ORE_NFT_ADDRESS_HARDHAT ?? "",
};

export const isPrivyConfigured = Boolean(blockOreEnv.privyAppId);
