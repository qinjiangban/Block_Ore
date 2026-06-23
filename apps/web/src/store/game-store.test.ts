import { beforeEach, describe, expect, it } from "vitest";

import { useGameStore } from "@/store/game-store";

describe("game-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      currentWallet: undefined,
      stats: undefined,
      achievements: [],
      latestMine: undefined,
      lastReward: undefined,
      latestReceipt: undefined,
      pendingReward: undefined,
      currentBlock: 19450231,
      activity: [],
      toasts: [],
      selectedLeaderboardTab: "TOP_10",
      inventoryModalOpen: false,
      shopOpen: false,
    });
  });

  it("连接钱包后初始化玩家数据", () => {
    useGameStore.getState().connectWallet();
    const state = useGameStore.getState();

    expect(state.currentWallet).toBeDefined();
    expect(state.stats?.remainingFreeMines).toBe(10);
    expect(state.achievements.length).toBeGreaterThan(0);
    expect(state.toasts[0]?.title).toBe("钱包已连接");
  });

  it("完整跑通一次 mine 到 reveal", () => {
    useGameStore.getState().connectWallet();

    const startResult = useGameStore.getState().startMining();
    expect(startResult.ok).toBe(true);
    expect(useGameStore.getState().latestMine?.status).toBe("pending");

    useGameStore.getState().setMineWaiting();
    useGameStore.getState().tickMineBlock();
    useGameStore.getState().tickMineBlock();
    useGameStore.getState().tickMineBlock();

    expect(useGameStore.getState().latestMine?.status).toBe("revealable");

    const beforePoints = useGameStore.getState().stats?.points ?? 0;
    useGameStore.getState().revealLatestMine();
    const state = useGameStore.getState();

    expect(state.latestMine?.status).toBe("done");
    expect(state.lastReward).toBeDefined();
    expect((state.stats?.points ?? 0) >= beforePoints).toBe(true);
    expect(state.toasts[0]).toBeDefined();
  });

  it("购买矿镐会增加付费次数", () => {
    useGameStore.getState().connectWallet();
    useGameStore.getState().buyPickaxe("advanced");

    expect(useGameStore.getState().stats?.remainingPaidMines).toBe(50);
    expect(useGameStore.getState().latestReceipt?.tier).toBe("advanced");
  });

  it("断开钱包会清空当前会话状态", () => {
    useGameStore.getState().connectWallet();
    useGameStore.getState().buyPickaxe("basic");
    useGameStore.getState().disconnectWallet();

    const state = useGameStore.getState();
    expect(state.currentWallet).toBeUndefined();
    expect(state.latestReceipt).toBeUndefined();
    expect(state.toasts[0]?.title).toBe("钱包已断开");
  });
});
