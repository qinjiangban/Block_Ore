"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import {
  RiArrowLeftLine,
  RiFileCopyLine,
  RiCheckLine,
} from "react-icons/ri";

import { AppShell, Panel } from "@/components/app-shell";
import { createOnchainBlockOreAdapter, isBlockOreConfigured } from "@/lib/adapters/onchain-block-ore-adapter";
import { oreMeta, achievementsFromStats } from "@/lib/game-data";
import type { UserStats, OwnedNftAsset, ActivityFeedItem } from "@/lib/types";

const ORE_TYPES = ["STONE", "IRON", "SILVER", "GOLD", "DIAMOND", "GENESIS"] as const;

const truncateWallet = (wallet: string) =>
  `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

export default function PlayerProfilePage() {
  const params = useParams();
  const walletAddress = params?.address as string;
  const publicClient = usePublicClient();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [nfts, setNfts] = useState<OwnedNftAsset[]>([]);
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!walletAddress || !publicClient) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const chainId = await publicClient.getChainId().catch(() => 0);
      if (!isBlockOreConfigured(chainId)) {
        if (!cancelled) {
          setError("当前网络尚未部署合约");
          setLoading(false);
        }
        return;
      }

      try {
        const adapter = createOnchainBlockOreAdapter({
          publicClient,
          chainId,
        });

        const [userStats, userNfts, recentActivity] = await Promise.all([
          adapter.getUserStats(walletAddress as `0x${string}`),
          adapter.getOwnedNfts(walletAddress as `0x${string}`),
          adapter.getRecentActivity(10),
        ]);

        if (!cancelled) {
          setStats(userStats);
          setNfts(userNfts);

          const filteredActivity = (recentActivity as ActivityFeedItem[]).filter(
            (item) => item.wallet.toLowerCase() === walletAddress.toLowerCase(),
          );
          setActivity(filteredActivity);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("加载玩家数据失败，该地址可能尚未参与挖矿。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, publicClient]);

  if (!walletAddress) {
    return (
      <AppShell>
        <Panel>
          <p className="text-sm text-white/50">无效地址</p>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell
      aside={
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
        >
          <RiArrowLeftLine className="h-3.5 w-3.5" />
          返回
        </Link>
      }
    >
      {/* 玩家地址 */}
      <Panel>
        <p className="text-xs text-cobalt/70">玩家</p>
        <div className="mt-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">
            {truncateWallet(walletAddress)}
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-white/[0.08] bg-white/[0.05] p-1.5 text-white/40 transition hover:border-white/20 hover:text-white"
          >
            {copied ? <RiCheckLine className="h-3.5 w-3.5 text-green-400" /> : <RiFileCopyLine className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 font-mono text-xs text-white/35 break-all">{walletAddress}</p>
      </Panel>

      {loading && (
        <Panel>
          <p className="text-sm text-white/40">加载中...</p>
        </Panel>
      )}

      {error && !loading && (
        <Panel>
          <p className="text-sm text-white/50">{error}</p>
        </Panel>
      )}

      {stats && !loading && (
        <>
          {/* 概况统计 */}
          <Panel>
            <p className="text-xs text-cobalt/70">挖矿数据</p>
            <h2 className="mt-2 text-xl font-semibold text-white">统计概览</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-2xl font-bold text-white">{stats.totalMines}</p>
                <p className="mt-1 text-xs text-white/45">总挖矿次数</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-2xl font-bold text-white">{stats.points}</p>
                <p className="mt-1 text-xs text-white/45">总积分</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-2xl font-bold text-white">{stats.remainingFreeMines}</p>
                <p className="mt-1 text-xs text-white/45">剩余免费次数</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <p className="text-2xl font-bold text-white">{stats.remainingPaidMines}</p>
                <p className="mt-1 text-xs text-white/45">剩余付费次数</p>
              </div>
            </div>
          </Panel>

          {/* 矿石分布 */}
          <Panel>
            <p className="text-xs text-cobalt/70">矿石</p>
            <h2 className="mt-2 text-xl font-semibold text-white">矿石仓库</h2>
            <div className="mt-4 space-y-2">
              {ORE_TYPES.map((oreType) => {
                const meta = oreMeta[oreType];
                const count = stats.oreCounts[oreType] ?? 0;
                const maxCount = Math.max(
                  ...ORE_TYPES.map((t) => stats.oreCounts[t] ?? 0),
                  1,
                );
                const barWidth = (count / maxCount) * 100;

                return (
                  <div key={oreType} className="flex items-center gap-3">
                    <span className={`w-20 text-xs font-medium ${meta.accent}`}>
                      {meta.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor:
                              oreType === "GENESIS"
                                ? "rgb(103, 232, 249)"
                                : oreType === "DIAMOND"
                                  ? "rgb(196, 181, 253)"
                                  : oreType === "GOLD"
                                    ? "rgb(253, 230, 138)"
                                    : "rgb(148, 163, 184)",
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-white">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* 成就 */}
          <Panel>
            <p className="text-xs text-cobalt/70">成就</p>
            <h2 className="mt-2 text-xl font-semibold text-white">解锁成就</h2>
            <div className="mt-4 space-y-2">
              {achievementsFromStats(stats).map((achievement) => (
                <div
                  key={achievement.key}
                  className={`rounded-2xl border p-3 ${achievement.unlocked
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-white/[0.06] bg-white/[0.03] opacity-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${achievement.unlocked ? "text-green-300" : "text-white/50"
                      }`}>
                      {achievement.title}
                    </p>
                    {achievement.unlocked && (
                      <span className="text-xs text-green-400">已解锁</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/40">{achievement.description}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-1.5 rounded-full bg-cobalt transition-all"
                      style={{
                        width: `${Math.min((achievement.current / achievement.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/30">
                    {achievement.current}/{achievement.target}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* NFT */}
          <Panel>
            <p className="text-xs text-cobalt/70">NFT</p>
            <h2 className="mt-2 text-xl font-semibold text-white">已铸造 NFT</h2>
            {nfts.length === 0 && (
              <p className="mt-4 text-sm text-white/35">尚未铸造任何 NFT</p>
            )}
            <div className="mt-4 space-y-2">
              {nfts.map((nft) => (
                <div
                  key={nft.tokenId}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {nft.oreType === "GENESIS" ? "创世矿石" : "钻石矿石"} #{nft.tokenId}
                    </p>
                    <p className="mt-0.5 text-xs text-white/35">Token ID: {nft.tokenId}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${nft.oreType === "GENESIS"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-violet-500/20 text-violet-300"
                      }`}
                  >
                    {nft.oreType}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* 近期挖矿记录 */}
          <Panel>
            <p className="text-xs text-cobalt/70">记录</p>
            <h2 className="mt-2 text-xl font-semibold text-white">近期挖矿记录</h2>
            {activity.length === 0 && (
              <p className="mt-4 text-sm text-white/35">暂无挖矿记录</p>
            )}
            <div className="mt-4 space-y-2">
              {activity.map((item) => {
                const meta = oreMeta[item.oreType as keyof typeof oreMeta];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
                  >
                    <div>
                      <p className="text-sm text-white">
                        挖掘到 <span className={meta?.accent ?? "text-white/60"}>{item.oreType}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-white/35">+{item.pointsAwarded} 分</p>
                    </div>
                    <span className="text-xs text-white/35">{item.createdAt}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
