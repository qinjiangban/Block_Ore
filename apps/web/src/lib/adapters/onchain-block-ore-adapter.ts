"use client";

import {
  decodeEventLog,
  erc20Abi,
  formatUnits,
  getAddress,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
  type WalletClient,
  zeroAddress,
} from "viem";

import { blockOreAbi } from "@/lib/contracts/abis/block-ore";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { oreMeta } from "@/lib/game-data";
import { oreNftAbi } from "@/lib/contracts/abis/ore-nft";
import type {
  ActivityFeedItem,
  AdminPurchaseRecord,
  AdminWithdrawalRecord,
  LeaderboardEntry,
  MineSession,
  OwnedNftAsset,
  OreType,
  PickaxeTier,
  PurchaseReceipt,
  RevealReward,
  TreasurySnapshot,
  UserStats,
} from "@/lib/types";

const ORE_TYPES: OreType[] = [
  "STONE",
  "IRON",
  "SILVER",
  "GOLD",
  "DIAMOND",
  "GENESIS",
];
const EMPTY_HASH = `0x${"0".repeat(64)}` as const;

export const BLOCK_ORE_REVEAL_DELAY_BLOCKS = 3;

export const PICKAXE_TIER_CONFIG: Record<
  PickaxeTier,
  {
    tier: number;
    title: string;
    price: bigint;
  }
> = {
  basic: {
    tier: 0,
    title: "普通矿镐到账",
    price: 1_990_000n,
  },
  advanced: {
    tier: 1,
    title: "高级矿镐到账",
    price: 8_990_000n,
  },
  diamond: {
    tier: 2,
    title: "钻石矿镐到账",
    price: 16_990_000n,
  },
};

type ContractStatsView = {
  points: bigint;
  totalMines: bigint;
  remainingFreeMines: bigint;
  remainingPaidMines: bigint;
  oreCounts: readonly bigint[];
};

type ContractPendingMine = {
  requestBlock: bigint;
  revealed: boolean;
};

const getBlockOreAddress = (chainId: number) =>
  getContractAddresses(chainId)?.blockOre as Address | undefined;
const getUsdcAddress = (chainId: number) =>
  getContractAddresses(chainId)?.usdc as Address | undefined;
const getOreNftAddress = (chainId: number) =>
  getContractAddresses(chainId)?.oreNft as Address | undefined;

const formatPriceLabel = (value: bigint) => `${formatUnits(value, 6)} USDC`;

const formatRelativeTime = (timestamp: number) => {
  const diff = Math.max(Math.floor(Date.now() / 1000) - timestamp, 0);

  if (diff < 60) {
    return "刚刚";
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} 分钟前`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} 小时前`;
  }
  if (diff < 86400 * 7) {
    return `${Math.floor(diff / 86400)} 天前`;
  }

  return new Date(timestamp * 1000).toLocaleDateString("zh-CN");
};

const toPickaxeTier = (tierValue: number | bigint): PickaxeTier => {
  const numericTier = Number(tierValue);
  if (numericTier === 1) {
    return "advanced";
  }
  if (numericTier === 2) {
    return "diamond";
  }

  return "basic";
};

export const isBlockOreConfigured = (chainId?: number) =>
  Boolean(chainId && getBlockOreAddress(chainId));
export const isPaymentTokenConfigured = (chainId?: number) =>
  Boolean(chainId && getUsdcAddress(chainId));

export const getOnchainMineStatus = (
  requestBlock: number,
  currentBlock: number,
): MineSession["status"] => {
  if (currentBlock > requestBlock + BLOCK_ORE_REVEAL_DELAY_BLOCKS) {
    return "revealable";
  }

  return "waiting";
};

export const getWaitBlocksRemaining = (
  requestBlock: number,
  currentBlock: number,
) => Math.max(requestBlock + BLOCK_ORE_REVEAL_DELAY_BLOCKS - currentBlock, 0);

export const toUserStats = (
  wallet: Address,
  stats: ContractStatsView,
): UserStats => {
  const oreCounts = ORE_TYPES.reduce(
    (acc, oreType, index) => ({
      ...acc,
      [oreType]: Number(stats.oreCounts[index] ?? 0n),
    }),
    {} as UserStats["oreCounts"],
  );

  return {
    wallet,
    points: Number(stats.points),
    totalMines: Number(stats.totalMines),
    remainingFreeMines: Number(stats.remainingFreeMines),
    remainingPaidMines: Number(stats.remainingPaidMines),
    oreCounts,
    unlockedNfts: ORE_TYPES.filter(
      (oreType) =>
        ["DIAMOND", "GENESIS"].includes(oreType) && oreCounts[oreType] > 0,
    ),
  };
};

export const toRevealReward = (
  oreTypeIndex: number,
  pointsAwarded: bigint,
  mintedNft: boolean,
): RevealReward => {
  const oreType = ORE_TYPES[oreTypeIndex] ?? "STONE";
  const base = oreMeta[oreType];

  return {
    oreType,
    pointsAwarded: Number(pointsAwarded),
    mintedNft,
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
          : "矿层已完成链上解析，奖励已经入账。",
  };
};

export const createPurchaseReceipt = (
  tier: PickaxeTier,
  minesAdded: bigint,
  pricePaid?: bigint,
): PurchaseReceipt => ({
  id: `${Date.now()}`,
  tier,
  title: PICKAXE_TIER_CONFIG[tier].title,
  price: formatPriceLabel(pricePaid ?? PICKAXE_TIER_CONFIG[tier].price),
  paymentSymbol: "USDC",
  minesAdded: Number(minesAdded),
  createdAt: "刚刚",
});

export const createOnchainBlockOreAdapter = ({
  chainId,
  publicClient,
  walletAddress,
  walletClient,
}: {
  chainId: number;
  publicClient: PublicClient;
  walletAddress?: Address;
  walletClient?: WalletClient;
}) => {
  const address = getBlockOreAddress(chainId);
  const usdcAddress = getUsdcAddress(chainId);
  const oreNftAddress = getOreNftAddress(chainId);
  const activeWallet = walletAddress ?? zeroAddress;
  const blockTimeCache = new Map<string, string>();

  if (!address) {
    throw new Error("当前网络尚未配置矿区合约。");
  }

  if (!usdcAddress) {
    throw new Error("当前网络尚未配置 USDC 支付地址。");
  }

  const resolveCreatedAt = async (blockNumber: bigint) => {
    const cacheKey = blockNumber.toString();
    const cached = blockTimeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const block = await publicClient.getBlock({ blockNumber });
    const createdAt = formatRelativeTime(Number(block.timestamp));
    blockTimeCache.set(cacheKey, createdAt);
    return createdAt;
  };

  const getUserStats = async (wallet: Address) => {
    const result = (await publicClient.readContract({
      address,
      abi: blockOreAbi,
      functionName: "getUserStats",
      args: [wallet],
    })) as ContractStatsView;

    return toUserStats(wallet, result);
  };

  const getLatestMine = async (
    wallet: Address,
  ): Promise<MineSession | undefined> => {
    const latestNonce = (await publicClient.readContract({
      address,
      abi: blockOreAbi,
      functionName: "latestNonce",
      args: [wallet],
    })) as bigint;

    if (latestNonce === 0n) {
      return undefined;
    }

    const pending = (await publicClient.readContract({
      address,
      abi: blockOreAbi,
      functionName: "getPendingMine",
      args: [wallet, latestNonce],
    })) as ContractPendingMine;

    if (pending.requestBlock === 0n || pending.revealed) {
      return undefined;
    }

    const currentBlock = Number(await publicClient.getBlockNumber());
    const requestBlock = Number(pending.requestBlock);

    return {
      nonce: Number(latestNonce),
      requestBlock,
      waitBlocksRemaining: getWaitBlocksRemaining(requestBlock, currentBlock),
      status: getOnchainMineStatus(requestBlock, currentBlock),
      txHash: EMPTY_HASH,
    };
  };

  const mine = async () => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address,
      abi: blockOreAbi,
      chain: walletClient.chain,
      functionName: "mine",
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const [event] = receipt.logs
      .map((log) => {
        try {
          return decodeEventLog({
            abi: blockOreAbi,
            data: log.data,
            topics: log.topics,
          });
        } catch {
          return undefined;
        }
      })
      .filter((eventItem) => eventItem?.eventName === "MineRequested")
      .slice(-1);

    if (!event?.args.nonce || !event.args.requestBlock) {
      throw new Error("挖矿交易已确认，但未解析到请求事件。");
    }

    return {
      nonce: Number(event.args.nonce),
      requestBlock: Number(event.args.requestBlock),
      txHash,
    };
  };

  const reveal = async (nonce: number) => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address,
      abi: blockOreAbi,
      chain: walletClient.chain,
      functionName: "reveal",
      args: [BigInt(nonce)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const [event] = receipt.logs
      .map((log) => {
        try {
          return decodeEventLog({
            abi: blockOreAbi,
            data: log.data,
            topics: log.topics,
          });
        } catch {
          return undefined;
        }
      })
      .filter((eventItem) => eventItem?.eventName === "MineRevealed")
      .slice(-1);

    if (
      event?.args.oreType === undefined ||
      event.args.pointsAwarded === undefined ||
      event.args.mintedNft === undefined
    ) {
      throw new Error("Reveal 交易已确认，但未解析到开奖结果。");
    }

    return {
      reward: toRevealReward(
        Number(event.args.oreType),
        event.args.pointsAwarded,
        event.args.mintedNft,
      ),
      txHash,
    };
  };

  const buyMiningPass = async (tier: PickaxeTier) => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const config = PICKAXE_TIER_CONFIG[tier];
    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address,
      abi: blockOreAbi,
      chain: walletClient.chain,
      functionName: "buyMiningPass",
      args: [config.tier],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const [event] = receipt.logs
      .map((log) => {
        try {
          return decodeEventLog({
            abi: blockOreAbi,
            data: log.data,
            topics: log.topics,
          });
        } catch {
          return undefined;
        }
      })
      .filter((eventItem) => eventItem?.eventName === "MiningPassPurchased")
      .slice(-1);

    return {
      receipt: createPurchaseReceipt(
        tier,
        event?.args.minesAdded ?? 0n,
        event?.args.pricePaid,
      ),
      txHash,
    };
  };

  const getUsdcAllowance = async (wallet: Address = activeWallet) =>
    (await publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [wallet, address],
    })) as bigint;

  const getUsdcBalance = async (wallet: Address = activeWallet) =>
    (await publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [wallet],
    })) as bigint;

  const approveUsdc = async (tier: PickaxeTier) => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const config = PICKAXE_TIER_CONFIG[tier];
    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address: usdcAddress,
      abi: erc20Abi,
      chain: walletClient.chain,
      functionName: "approve",
      args: [address, config.price],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      approvedAmount: config.price,
      txHash,
    };
  };

  const getOwner = async () =>
    (await publicClient.readContract({
      address,
      abi: blockOreAbi,
      functionName: "owner",
    })) as Address;

  const getTreasurySnapshot = async (): Promise<TreasurySnapshot> => {
    const [
      owner,
      treasury,
      trackedTokenBalance,
      contractTokenBalance,
      contractNativeBalance,
    ] = await Promise.all([
      getOwner(),
      publicClient.readContract({
        address,
        abi: blockOreAbi,
        functionName: "treasury",
      }) as Promise<Address>,
      publicClient.readContract({
        address,
        abi: blockOreAbi,
        functionName: "usdcTreasuryBalance",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }) as Promise<bigint>,
      publicClient.getBalance({
        address,
      }),
    ]);

    return {
      owner,
      treasury,
      paymentToken: usdcAddress,
      trackedTokenBalance,
      contractTokenBalance,
      contractNativeBalance,
    };
  };

  const withdrawTreasury = async (amount: bigint) => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address,
      abi: blockOreAbi,
      chain: walletClient.chain,
      functionName: "withdrawTreasury",
      args: [amount],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const setTreasury = async (nextTreasury: Address) => {
    if (!walletClient) {
      throw new Error("当前钱包尚未准备好签名能力。");
    }

    const txHash = await walletClient.writeContract({
      account: activeWallet,
      address,
      abi: blockOreAbi,
      chain: walletClient.chain,
      functionName: "setTreasury",
      args: [nextTreasury],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };

  const getCurrentBlock = async () =>
    Number(await publicClient.getBlockNumber());

  const getOwnedNfts = async (wallet: Address): Promise<OwnedNftAsset[]> => {
    if (!oreNftAddress) {
      return [];
    }

    const nextTokenId = (await publicClient.readContract({
      address: oreNftAddress,
      abi: oreNftAbi,
      functionName: "nextTokenId",
    })) as bigint;

    if (nextTokenId <= 1n) {
      return [];
    }

    const items = await Promise.all(
      Array.from({ length: Number(nextTokenId - 1n) }, async (_, index) => {
        const tokenId = BigInt(index + 1);
        const owner = (await publicClient.readContract({
          address: oreNftAddress,
          abi: oreNftAbi,
          functionName: "ownerOf",
          args: [tokenId],
        })) as Address;

        if (owner.toLowerCase() !== wallet.toLowerCase()) {
          return undefined;
        }

        const [oreKind, tokenUri] = await Promise.all([
          publicClient.readContract({
            address: oreNftAddress,
            abi: oreNftAbi,
            functionName: "oreKinds",
            args: [tokenId],
          }) as Promise<number>,
          publicClient.readContract({
            address: oreNftAddress,
            abi: oreNftAbi,
            functionName: "tokenURI",
            args: [tokenId],
          }) as Promise<string>,
        ]);

        return {
          tokenId: Number(tokenId),
          oreType: oreKind === 0 ? "DIAMOND" : "GENESIS",
          tokenUri,
        } satisfies OwnedNftAsset;
      }),
    );

    return items.filter((item): item is OwnedNftAsset => Boolean(item));
  };

  const sortLogsDesc = <TLog extends Pick<Log, "blockNumber" | "logIndex">>(
    logs: TLog[],
  ) =>
    [...logs].sort((a, b) => {
      const blockDiff = Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n));
      if (blockDiff !== 0) {
        return blockDiff;
      }

      return Number((b.logIndex ?? 0) - (a.logIndex ?? 0));
    });

  const getRecentPurchaseRecords = async (
    limit = 10,
  ): Promise<AdminPurchaseRecord[]> => {
    type PurchaseLog = Pick<
      Log,
      "args" | "blockNumber" | "logIndex" | "transactionHash"
    >;

    const logs = await publicClient.getLogs({
      address,
      event: {
        type: "event",
        name: "MiningPassPurchased",
        inputs:
          blockOreAbi.find(
            (item) =>
              item.type === "event" && item.name === "MiningPassPurchased",
          )?.inputs ?? [],
      },
      fromBlock: 0n,
      toBlock: "latest",
    });

    const recentLogs = sortLogsDesc(logs as PurchaseLog[]).slice(0, limit);

    return Promise.all(
      recentLogs.map(async (log) => {
        const args = log.args as {
          user?: Address;
          tier?: number | bigint;
          minesAdded?: bigint;
          pricePaid?: bigint;
        };

        return {
          id: `${log.transactionHash}-${log.logIndex}`,
          wallet: getAddress(args.user ?? zeroAddress),
          tier: toPickaxeTier(args.tier ?? 0),
          minesAdded: Number(args.minesAdded ?? 0n),
          pricePaid: args.pricePaid ?? 0n,
          blockNumber: log.blockNumber ?? 0n,
          createdAt: await resolveCreatedAt(log.blockNumber ?? 0n),
          txHash: log.transactionHash,
        };
      }),
    );
  };

  const getRecentWithdrawalRecords = async (
    limit = 10,
  ): Promise<AdminWithdrawalRecord[]> => {
    type WithdrawalLog = Pick<
      Log,
      "args" | "blockNumber" | "logIndex" | "transactionHash"
    >;

    const [usdcLogs, nativeLogs] = await Promise.all([
      publicClient.getLogs({
        address,
        event: {
          type: "event",
          name: "TreasuryWithdrawn",
          inputs:
            blockOreAbi.find(
              (item) =>
                item.type === "event" && item.name === "TreasuryWithdrawn",
            )?.inputs ?? [],
        },
        fromBlock: 0n,
        toBlock: "latest",
      }),
      publicClient.getLogs({
        address,
        event: {
          type: "event",
          name: "NativeBalanceWithdrawn",
          inputs:
            blockOreAbi.find(
              (item) =>
                item.type === "event" && item.name === "NativeBalanceWithdrawn",
            )?.inputs ?? [],
        },
        fromBlock: 0n,
        toBlock: "latest",
      }),
    ]);

    const records = [
      ...(usdcLogs as WithdrawalLog[]).map((log) => ({
        kind: "USDC" as const,
        recipient: getAddress(
          ((log.args as { recipient?: Address }).recipient ??
            zeroAddress) as Address,
        ),
        amount: ((log.args as { amount?: bigint }).amount ?? 0n) as bigint,
        blockNumber: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
        txHash: log.transactionHash,
      })),
      ...(nativeLogs as WithdrawalLog[]).map((log) => ({
        kind: "ETH" as const,
        recipient: getAddress(
          ((log.args as { recipient?: Address }).recipient ??
            zeroAddress) as Address,
        ),
        amount: ((log.args as { amount?: bigint }).amount ?? 0n) as bigint,
        blockNumber: log.blockNumber ?? 0n,
        logIndex: log.logIndex ?? 0,
        txHash: log.transactionHash,
      })),
    ];

    return Promise.all(
      sortLogsDesc(records)
        .slice(0, limit)
        .map(async (record) => ({
          id: `${record.txHash}-${record.logIndex}`,
          kind: record.kind,
          recipient: record.recipient,
          amount: record.amount,
          blockNumber: record.blockNumber,
          createdAt: await resolveCreatedAt(record.blockNumber),
          txHash: record.txHash,
        })),
    );
  };

  const getLeaderboardEntries = async (
    limit = 100,
  ): Promise<LeaderboardEntry[]> => {
    const logs = await publicClient.getLogs({
      address,
      event: {
        type: "event",
        name: "MineRevealed",
        inputs:
          blockOreAbi.find(
            (item) => item.type === "event" && item.name === "MineRevealed",
          )?.inputs ?? [],
      },
      fromBlock: 0n,
      toBlock: "latest",
    });

    const wallets: Address[] = [
      ...new Set(
        logs
          .map((log) => {
            const args = log.args as { user?: Address };
            return args.user ? getAddress(args.user) : undefined;
          })
          .filter((wallet): wallet is Address => Boolean(wallet)),
      ),
    ];
    if (walletAddress && walletAddress !== zeroAddress) {
      wallets.push(getAddress(walletAddress));
    }

    const uniqueWallets: Address[] = [...new Set(wallets)];
    const entries = await Promise.all(
      uniqueWallets.map(async (wallet) => {
        const stats = await getUserStats(wallet);
        return {
          wallet,
          points: stats.points,
          totalMines: stats.totalMines,
          diamondCount: stats.oreCounts.DIAMOND,
          genesisCount: stats.oreCounts.GENESIS,
        };
      }),
    );

    return entries
      .filter((entry) => entry.totalMines > 0 || entry.points > 0)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.genesisCount !== a.genesisCount)
          return b.genesisCount - a.genesisCount;
        if (b.diamondCount !== a.diamondCount)
          return b.diamondCount - a.diamondCount;
        return b.totalMines - a.totalMines;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        highlight:
          activeWallet !== zeroAddress &&
          entry.wallet.toLowerCase() === activeWallet.toLowerCase(),
      }));
  };

  const getRecentActivity = async (
    limit = 20,
  ): Promise<ActivityFeedItem[]> => {
    const logs = await publicClient.getLogs({
      address,
      event: {
        type: "event",
        name: "MineRevealed",
        inputs:
          blockOreAbi.find(
            (item) => item.type === "event" && item.name === "MineRevealed",
          )?.inputs ?? [],
      },
      fromBlock: 0n,
      toBlock: "latest",
    });

    type RevealLog = Pick<
      Log,
      "args" | "blockNumber" | "logIndex" | "transactionHash"
    >;

    const recentLogs = sortLogsDesc(logs as RevealLog[]).slice(0, limit);

    return Promise.all(
      recentLogs.map(async (log, idx) => {
        const args = log.args as {
          user?: Address;
          oreType?: bigint | number;
          pointsAwarded?: bigint;
        };

        return {
          id: `${log.transactionHash}-${log.logIndex ?? idx}`,
          wallet: getAddress(args.user ?? zeroAddress),
          oreType: ORE_TYPES[Number(args.oreType ?? 0)] ?? "STONE",
          pointsAwarded: Number(args.pointsAwarded ?? 0n),
          createdAt: await resolveCreatedAt(log.blockNumber ?? 0n),
        } satisfies ActivityFeedItem;
      }),
    );
  };

  return {
    address,
    oreNftAddress,
    usdcAddress,
    approveUsdc,
    getCurrentBlock,
    getLatestMine,
    getLeaderboardEntries,
    getOwner,
    getOwnedNfts,
    getRecentActivity,
    getRecentPurchaseRecords,
    getRecentWithdrawalRecords,
    getTreasurySnapshot,
    getUsdcAllowance,
    getUsdcBalance,
    getUserStats,
    mine,
    reveal,
    buyMiningPass,
    setTreasury,
    withdrawTreasury,
  };
};

export type OnchainBlockOreAdapter = ReturnType<
  typeof createOnchainBlockOreAdapter
>;
export type OnchainTxHash = Hex;
