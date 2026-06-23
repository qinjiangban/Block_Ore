import type { LeaderboardEntry, RevealReward, UserStats } from "@/lib/types";

export type BlockOreAdapter = {
  getUserStats: (wallet: `0x${string}`) => Promise<UserStats>;
  mine: (
    wallet: `0x${string}`,
  ) => Promise<{ requestBlock: number; nonce: number; txHash: `0x${string}` }>;
  reveal: (wallet: `0x${string}`, nonce: number) => Promise<RevealReward>;
  getLeaderboard: () => Promise<LeaderboardEntry[]>;
};

export type SubgraphAdapter = {
  getLeaderboard: () => Promise<LeaderboardEntry[]>;
  getRecentActivity: () => Promise<
    Array<{
      wallet: string;
      oreType: string;
      pointsAwarded: number;
      createdAt: string;
    }>
  >;
};
