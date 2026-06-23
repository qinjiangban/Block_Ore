import type {
  Achievement,
  ActivityFeedItem,
  LeaderboardEntry,
  OreType,
  PickaxeOffer,
  RevealReward,
  UserStats,
} from "@/lib/types";

export const oreMeta: Record<
  OreType,
  {
    label: string;
    chance: string;
    points: number;
    accent: string;
    nft: boolean;
  }
> = {
  STONE: {
    label: "Stone",
    chance: "60%",
    points: 1,
    accent: "text-slate-200",
    nft: false,
  },
  IRON: {
    label: "Iron",
    chance: "25%",
    points: 5,
    accent: "text-zinc-200",
    nft: false,
  },
  SILVER: {
    label: "Silver",
    chance: "10%",
    points: 20,
    accent: "text-sky-200",
    nft: false,
  },
  GOLD: {
    label: "Gold",
    chance: "4%",
    points: 100,
    accent: "text-amber-200",
    nft: false,
  },
  DIAMOND: {
    label: "Diamond",
    chance: "0.9%",
    points: 500,
    accent: "text-violet-200",
    nft: true,
  },
  GENESIS: {
    label: "Genesis",
    chance: "0.1%",
    points: 2000,
    accent: "text-cyan-100",
    nft: true,
  },
};

export const pickaxeOffers: PickaxeOffer[] = [
  {
    id: "basic",
    name: "普通矿镐",
    price: "1.99 USDC",
    mines: 10,
    accent: "from-cobalt/30 to-cobalt/10",
    description: "补充 10 次付费挖矿次数。",
  },
  {
    id: "advanced",
    name: "高级矿镐",
    price: "8.99 USDC",
    mines: 50,
    accent: "from-gold/30 to-gold/10",
    description: "一次补足高频玩家今日战力。",
  },
  {
    id: "diamond",
    name: "钻石矿镐",
    price: "16.99 USDC",
    mines: 100,
    accent: "from-diamond/30 to-genesis/10",
    description: "冲榜玩家的终极补给包。",
  },
];

export const defaultStats = (wallet: `0x${string}`): UserStats => ({
  wallet,
  points: 2480,
  totalMines: 73,
  remainingFreeMines: 10,
  remainingPaidMines: 0,
  oreCounts: {
    STONE: 48,
    IRON: 17,
    SILVER: 6,
    GOLD: 2,
    DIAMOND: 0,
    GENESIS: 0,
  },
  unlockedNfts: [],
});

export const activityFeed: ActivityFeedItem[] = [
  {
    id: "1",
    wallet: "0x8D3B...a127",
    oreType: "GOLD",
    pointsAwarded: 100,
    createdAt: "2 分钟前",
  },
  {
    id: "2",
    wallet: "0x92ac...44Fd",
    oreType: "SILVER",
    pointsAwarded: 20,
    createdAt: "5 分钟前",
  },
  {
    id: "3",
    wallet: "0x71E4...9cab",
    oreType: "DIAMOND",
    pointsAwarded: 500,
    createdAt: "11 分钟前",
  },
  {
    id: "4",
    wallet: "0x2Ba1...7FA3",
    oreType: "IRON",
    pointsAwarded: 5,
    createdAt: "16 分钟前",
  },
];

export const achievementsFromStats = (stats: UserStats): Achievement[] => [
  {
    key: "juniorMiner",
    title: "初级矿工",
    description: "累计完成 10 次挖矿",
    target: 10,
    current: stats.totalMines,
    unlocked: stats.totalMines >= 10,
  },
  {
    key: "seniorMiner",
    title: "高级矿工",
    description: "累计完成 100 次挖矿",
    target: 100,
    current: stats.totalMines,
    unlocked: stats.totalMines >= 100,
  },
  {
    key: "goldMiner",
    title: "黄金矿工",
    description: "累计获得 10 个 Gold",
    target: 10,
    current: stats.oreCounts.GOLD,
    unlocked: stats.oreCounts.GOLD >= 10,
  },
  {
    key: "diamondHunter",
    title: "钻石猎人",
    description: "累计获得 5 个 Diamond",
    target: 5,
    current: stats.oreCounts.DIAMOND,
    unlocked: stats.oreCounts.DIAMOND >= 5,
  },
  {
    key: "genesisFinder",
    title: "创世发现者",
    description: "首次发现 Genesis",
    target: 1,
    current: stats.oreCounts.GENESIS,
    unlocked: stats.oreCounts.GENESIS >= 1,
  },
];

export const miningProbabilities: Array<{ oreType: OreType; weight: number }> =
  [
    { oreType: "STONE", weight: 600 },
    { oreType: "IRON", weight: 250 },
    { oreType: "SILVER", weight: 100 },
    { oreType: "GOLD", weight: 40 },
    { oreType: "DIAMOND", weight: 9 },
    { oreType: "GENESIS", weight: 1 },
  ];

export const createReward = (oreType: OreType): RevealReward => {
  const base = oreMeta[oreType];
  return {
    oreType,
    pointsAwarded: base.points,
    mintedNft: base.nft,
    title:
      oreType === "GENESIS"
        ? "创世矿脉被你锁定"
        : oreType === "DIAMOND"
          ? "发现钻石矿"
          : `获得 ${base.label}`,
    quote:
      oreType === "GENESIS"
        ? "全服仅限 1000 枚，已记入链上荣耀。"
        : oreType === "DIAMOND"
          ? "这次 Reveal 足够点亮整个矿洞。"
          : "矿层已解析，奖励写入本次战绩。",
  };
};

export const baseLeaderboard: LeaderboardEntry[] = [
  {
    wallet: "0x7A2E...1Bd9",
    points: 18840,
    totalMines: 387,
    diamondCount: 12,
    genesisCount: 1,
    rank: 1,
  },
  {
    wallet: "0x8CE1...91F0",
    points: 17620,
    totalMines: 362,
    diamondCount: 10,
    genesisCount: 1,
    rank: 2,
  },
  {
    wallet: "0x19A4...65Dc",
    points: 16210,
    totalMines: 331,
    diamondCount: 9,
    genesisCount: 0,
    rank: 3,
  },
  {
    wallet: "0x21D7...9Ca0",
    points: 14990,
    totalMines: 309,
    diamondCount: 8,
    genesisCount: 0,
    rank: 4,
  },
  {
    wallet: "0x61C2...f43A",
    points: 13220,
    totalMines: 276,
    diamondCount: 6,
    genesisCount: 0,
    rank: 5,
  },
  {
    wallet: "0x4D3B...219e",
    points: 11740,
    totalMines: 248,
    diamondCount: 4,
    genesisCount: 0,
    rank: 6,
  },
];
