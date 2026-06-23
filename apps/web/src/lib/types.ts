export type OreType =
  | "STONE"
  | "IRON"
  | "SILVER"
  | "GOLD"
  | "DIAMOND"
  | "GENESIS";

export type LeaderboardTab = "TOP_10" | "TOP_100" | "TOP_1000";

export type MineStatus =
  | "idle"
  | "pending"
  | "waiting"
  | "revealable"
  | "revealing"
  | "done"
  | "failed";

export type PickaxeTier = "basic" | "advanced" | "diamond";

export type PickaxeOffer = {
  id: PickaxeTier;
  name: string;
  price: string;
  mines: number;
  accent: string;
  description: string;
};

export type TreasurySnapshot = {
  owner: `0x${string}`;
  treasury: `0x${string}`;
  paymentToken: `0x${string}`;
  trackedTokenBalance: bigint;
  contractTokenBalance: bigint;
  contractNativeBalance: bigint;
};

export type OwnedNftAsset = {
  tokenId: number;
  oreType: "DIAMOND" | "GENESIS";
  tokenUri: string;
};

export type AdminPurchaseRecord = {
  id: string;
  wallet: `0x${string}`;
  tier: PickaxeTier;
  minesAdded: number;
  pricePaid: bigint;
  blockNumber: bigint;
  createdAt: string;
  txHash: `0x${string}`;
};

export type AdminWithdrawalRecord = {
  id: string;
  kind: "USDC" | "ETH";
  recipient: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
  createdAt: string;
  txHash: `0x${string}`;
};

export type AchievementKey =
  | "juniorMiner"
  | "seniorMiner"
  | "goldMiner"
  | "diamondHunter"
  | "genesisFinder";

export type Achievement = {
  key: AchievementKey;
  title: string;
  description: string;
  target: number;
  current: number;
  unlocked: boolean;
};

export type UserStats = {
  wallet: `0x${string}`;
  points: number;
  totalMines: number;
  remainingFreeMines: number;
  remainingPaidMines: number;
  oreCounts: Record<OreType, number>;
  unlockedNfts: OreType[];
};

export type RevealReward = {
  oreType: OreType;
  pointsAwarded: number;
  mintedNft: boolean;
  title: string;
  quote: string;
};

export type MineSession = {
  nonce: number;
  requestBlock: number;
  waitBlocksRemaining: number;
  status: MineStatus;
  txHash: `0x${string}`;
};

export type ActivityFeedItem = {
  id: string;
  wallet: string;
  oreType: OreType;
  pointsAwarded: number;
  createdAt: string;
};

export type LeaderboardEntry = {
  wallet: string;
  points: number;
  totalMines: number;
  diamondCount: number;
  genesisCount: number;
  rank: number;
  highlight?: boolean;
};

export type ToastTone = "info" | "success" | "warning";

export type ToastMessage = {
  id: string;
  title: string;
  description: string;
  tone: ToastTone;
};

export type PurchaseReceipt = {
  id: string;
  tier: PickaxeTier;
  title: string;
  price: string;
  paymentSymbol: string;
  minesAdded: number;
  createdAt: string;
};
