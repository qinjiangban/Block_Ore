"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from "react";

import {
  achievementsFromStats,
  createReward,
  miningProbabilities,
} from "@/lib/game-data";
import type {
  Achievement,
  ActivityFeedItem,
  LeaderboardEntry,
  LeaderboardTab,
  MineSession,
  OreType,
  PickaxeTier,
  PurchaseReceipt,
  RevealReward,
  ToastMessage,
  UserStats,
} from "@/lib/types";

// ─── Internal helpers ──────────────────────────────────────────────

type PendingReward = {
  reward: RevealReward;
};

const pickOre = (): OreType => {
  const total = miningProbabilities.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.floor(Math.random() * total);
  for (const item of miningProbabilities) {
    cursor -= item.weight;
    if (cursor < 0) return item.oreType;
  }
  return "STONE";
};

const buildAchievements = (stats?: UserStats) =>
  stats ? achievementsFromStats(stats) : [];

const createToast = (
  title: string,
  description: string,
  tone: ToastMessage["tone"],
): ToastMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  description,
  tone,
});

const offerMineMap: Record<PickaxeTier, number> = {
  basic: 10,
  advanced: 50,
  diamond: 100,
};

// ─── State ─────────────────────────────────────────────────────────

type GameState = {
  currentWallet?: `0x${string}`;
  currentChainId?: number;
  currentChainName?: string;
  stats?: UserStats;
  achievements: Achievement[];
  latestMine?: MineSession;
  lastReward?: RevealReward;
  latestReceipt?: PurchaseReceipt;
  pendingReward?: PendingReward;
  currentBlock: number;
  activity: ActivityFeedItem[];
  toasts: ToastMessage[];
  selectedLeaderboardTab: LeaderboardTab;
  inventoryModalOpen: boolean;
  shopOpen: boolean;
};

const STORAGE_KEY = "block-ore-store";

function loadInitialState(): GameState {
  if (typeof window === "undefined") {
    return {
      achievements: [],
      currentBlock: 0,
      activity: [],
      toasts: [],
      selectedLeaderboardTab: "TOP_10",
      inventoryModalOpen: false,
      shopOpen: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>;
      return {
        currentWallet: parsed.currentWallet,
        currentChainId: parsed.currentChainId,
        currentChainName: parsed.currentChainName,
        stats: parsed.stats,
        achievements: parsed.achievements ?? [],
        latestMine: parsed.latestMine,
        lastReward: parsed.lastReward,
        latestReceipt: parsed.latestReceipt,
        currentBlock: parsed.currentBlock ?? 0,
        activity: parsed.activity ?? [],
        toasts: [],
        selectedLeaderboardTab: parsed.selectedLeaderboardTab ?? "TOP_10",
        inventoryModalOpen: false,
        shopOpen: false,
      };
    }
  } catch {
    // ignore corrupt data
  }
  return {
    achievements: [],
    currentBlock: 0,
    activity: [],
    toasts: [],
    selectedLeaderboardTab: "TOP_10",
    inventoryModalOpen: false,
    shopOpen: false,
  };
}

function persistState(state: GameState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentWallet: state.currentWallet,
        currentChainId: state.currentChainId,
        currentChainName: state.currentChainName,
        stats: state.stats,
        achievements: state.achievements,
        latestMine: state.latestMine,
        lastReward: state.lastReward,
        latestReceipt: state.latestReceipt,
        currentBlock: state.currentBlock,
        activity: state.activity,
        selectedLeaderboardTab: state.selectedLeaderboardTab,
      }),
    );
  } catch {
    // ignore storage errors
  }
}

// ─── Context type ──────────────────────────────────────────────────

type GameContextType = GameState & {
  connectWallet: () => void;
  disconnectWallet: () => void;
  startMining: () => { ok: boolean; reason?: string };
  setMineWaiting: () => void;
  tickMineBlock: () => void;
  revealLatestMine: () => void;
  buyPickaxe: (tier: PickaxeTier) => void;
  selectLeaderboardTab: (tab: LeaderboardTab) => void;
  setInventoryOpen: (open: boolean) => void;
  setShopOpen: (open: boolean) => void;
  setStats: (stats?: UserStats) => void;
  setLatestMineSession: (mine?: MineSession) => void;
  setLastReward: (reward?: RevealReward) => void;
  setLatestReceipt: (receipt?: PurchaseReceipt) => void;
  setCurrentBlock: (block: number) => void;
  prependActivity: (item: ActivityFeedItem) => void;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  clearLatestReceipt: () => void;
  syncWalletSession: (session: {
    wallet?: `0x${string}`;
    chainId?: number;
    chainName?: string;
  }) => void;
  leaderboard: () => LeaderboardEntry[];
  /** Direct access to current state (for code that needs getState() like Zustand) */
  getState: () => GameState;
};

const GameContext = createContext<GameContextType | null>(null);

export function useGameContext(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within GameProvider");
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────

export function GameProvider({ children }: PropsWithChildren) {
  const initialState = useMemo(() => loadInitialState(), []);

  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist to localStorage on relevant changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  // ── Actions ──────────────────────────────────────────────────────

  const connectWallet = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentWallet) return;
    dispatch({
      type: "CONNECT_WALLET",
      payload: { currentWallet: s.currentWallet },
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    dispatch({ type: "DISCONNECT_WALLET" });
  }, []);

  const startMining = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentWallet || !s.stats) {
      dispatch({
        type: "PUSH_TOAST",
        payload: createToast(
          "尚未连接钱包",
          "先连接钱包再发起挖矿。",
          "warning",
        ),
      });
      return { ok: false, reason: "Connect your wallet first" };
    }

    if (
      s.latestMine &&
      ["pending", "waiting", "revealable", "revealing"].includes(
        s.latestMine.status,
      )
    ) {
      dispatch({
        type: "PUSH_TOAST",
        payload: createToast(
          "In Progress",
          "Current mining round hasn't finished.",
          "warning",
        ),
      });
      return {
        ok: false,
        reason: "Current mining flow is not complete",
      };
    }

    if (s.stats.remainingFreeMines + s.stats.remainingPaidMines <= 0) {
      dispatch({
        type: "PUSH_TOAST",
        payload: createToast("今日次数已满", "去商店补充矿镐后继续。", "warning"),
      });
      return { ok: false, reason: "今日次数已满" };
    }

    const oreType = pickOre();
    const reward = createReward(oreType);
    const requestBlock = s.currentBlock + 1;

    dispatch({
      type: "START_MINING",
      payload: { oreType, reward, requestBlock, stats: s.stats },
    });

    return { ok: true };
  }, []);

  const setMineWaiting = useCallback(() => {
    dispatch({ type: "SET_MINE_WAITING" });
  }, []);

  const tickMineBlock = useCallback(() => {
    dispatch({ type: "TICK_MINE_BLOCK" });
  }, []);

  const revealLatestMine = useCallback(() => {
    dispatch({ type: "REVEAL_LATEST_MINE" });
  }, []);

  const buyPickaxe = useCallback(
    (tier: PickaxeTier) => {
      const s = stateRef.current;
      if (!s.currentWallet || !s.stats) {
        dispatch({
          type: "PUSH_TOAST",
          payload: createToast(
            "Connect Wallet",
            "Connect before purchasing.",
            "warning",
          ),
        });
        return;
      }

      const purchased = Math.min(
        100 - s.stats.remainingPaidMines,
        offerMineMap[tier],
      );
      if (purchased <= 0) {
        dispatch({
          type: "PUSH_TOAST",
          payload: createToast(
            "Paid Mines Full",
            "Max 100 paid mines per day.",
            "warning",
          ),
        });
        return;
      }

      dispatch({ type: "BUY_PICKAXE", payload: { tier, purchased, stats: s.stats } });
    },
    [],
  );

  const selectLeaderboardTab = useCallback((tab: LeaderboardTab) => {
    dispatch({ type: "SET", payload: { selectedLeaderboardTab: tab } });
  }, []);

  const setInventoryOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET", payload: { inventoryModalOpen: open } });
  }, []);

  const setShopOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET", payload: { shopOpen: open } });
  }, []);

  const setStats = useCallback((stats?: UserStats) => {
    dispatch({ type: "SET_STATS", payload: { stats } });
  }, []);

  const setLatestMineSession = useCallback((latestMine?: MineSession) => {
    dispatch({ type: "SET", payload: { latestMine } });
  }, []);

  const setLastReward = useCallback((lastReward?: RevealReward) => {
    dispatch({ type: "SET", payload: { lastReward } });
  }, []);

  const setLatestReceipt = useCallback((latestReceipt?: PurchaseReceipt) => {
    dispatch({ type: "SET", payload: { latestReceipt } });
  }, []);

  const setCurrentBlock = useCallback((currentBlock: number) => {
    dispatch({ type: "SET", payload: { currentBlock } });
  }, []);

  const prependActivity = useCallback((item: ActivityFeedItem) => {
    dispatch({ type: "PREPEND_ACTIVITY", payload: { item } });
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      dispatch({
        type: "PUSH_TOAST",
        payload: createToast(toast.title, toast.description, toast.tone),
      });
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: "DISMISS_TOAST", payload: { id } });
  }, []);

  const clearLatestReceipt = useCallback(() => {
    dispatch({ type: "SET", payload: { latestReceipt: undefined } });
  }, []);

  const syncWalletSession = useCallback(
    (session: {
      wallet?: `0x${string}`;
      chainId?: number;
      chainName?: string;
    }) => {
      dispatch({
        type: "SET",
        payload: {
          currentWallet: session.wallet,
          currentChainId: session.chainId,
          currentChainName: session.chainName,
        },
      });
    },
    [],
  );

  const leaderboard = useCallback((): LeaderboardEntry[] => {
    const s = stateRef.current;
    if (!s.stats) return [];
    return [
      {
        wallet: s.stats.wallet,
        points: s.stats.points,
        totalMines: s.stats.totalMines,
        diamondCount: s.stats.oreCounts.DIAMOND,
        genesisCount: s.stats.oreCounts.GENESIS,
        rank: 1,
        highlight: true,
      },
    ];
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const ctx = useMemo<GameContextType>(
    () => ({
      ...state,
      connectWallet,
      disconnectWallet,
      startMining,
      setMineWaiting,
      tickMineBlock,
      revealLatestMine,
      buyPickaxe,
      selectLeaderboardTab,
      setInventoryOpen,
      setShopOpen,
      setStats,
      setLatestMineSession,
      setLastReward,
      setLatestReceipt,
      setCurrentBlock,
      prependActivity,
      pushToast,
      dismissToast,
      clearLatestReceipt,
      syncWalletSession,
      leaderboard,
      getState,
    }),
    [
      state,
      connectWallet,
      disconnectWallet,
      startMining,
      setMineWaiting,
      tickMineBlock,
      revealLatestMine,
      buyPickaxe,
      selectLeaderboardTab,
      setInventoryOpen,
      setShopOpen,
      setStats,
      setLatestMineSession,
      setLastReward,
      setLatestReceipt,
      setCurrentBlock,
      prependActivity,
      pushToast,
      dismissToast,
      clearLatestReceipt,
      syncWalletSession,
      leaderboard,
      getState,
    ],
  );

  return <GameContext.Provider value={ctx}>{children}</GameContext.Provider>;
}

// ─── Reducer ───────────────────────────────────────────────────────

type GameAction =
  | { type: "SET"; payload: Partial<GameState> }
  | { type: "SET_STATS"; payload: { stats: UserStats | undefined } }
  | { type: "CONNECT_WALLET"; payload: { currentWallet: `0x${string}` } }
  | { type: "DISCONNECT_WALLET" }
  | {
      type: "START_MINING";
      payload: {
        oreType: OreType;
        reward: RevealReward;
        requestBlock: number;
        stats: UserStats;
      };
    }
  | { type: "SET_MINE_WAITING" }
  | { type: "TICK_MINE_BLOCK" }
  | { type: "REVEAL_LATEST_MINE" }
  | { type: "BUY_PICKAXE"; payload: { tier: PickaxeTier; purchased: number; stats: UserStats } }
  | { type: "PREPEND_ACTIVITY"; payload: { item: ActivityFeedItem } }
  | { type: "PUSH_TOAST"; payload: ToastMessage }
  | { type: "DISMISS_TOAST"; payload: { id: string } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.payload };

    case "SET_STATS":
      return {
        ...state,
        stats: action.payload.stats,
        achievements: buildAchievements(action.payload.stats),
      };

    case "CONNECT_WALLET":
      return {
        ...state,
        toasts: [
          createToast(
            "Wallet Connected",
            "Ready to start on-chain mining.",
            "success",
          ),
          ...state.toasts,
        ].slice(0, 3),
      };

    case "DISCONNECT_WALLET":
      return {
        ...state,
        currentWallet: undefined,
        currentChainId: undefined,
        currentChainName: undefined,
        latestMine: undefined,
        lastReward: undefined,
        latestReceipt: undefined,
        pendingReward: undefined,
        toasts: [
          createToast("钱包已断开", "已退出当前矿工会话。", "info"),
          ...state.toasts,
        ].slice(0, 3),
      };

    case "START_MINING": {
      const { reward, requestBlock, stats, oreType } = action.payload;
      const updatedStats: UserStats = {
        ...stats,
        remainingFreeMines:
          stats.remainingFreeMines > 0
            ? stats.remainingFreeMines - 1
            : stats.remainingFreeMines,
        remainingPaidMines:
          stats.remainingFreeMines > 0
            ? stats.remainingPaidMines
            : Math.max(stats.remainingPaidMines - 1, 0),
      };

      return {
        ...state,
        currentBlock: requestBlock,
        latestMine: {
          nonce: stats.totalMines + 1,
          requestBlock,
          waitBlocksRemaining: 3,
          status: "pending",
          txHash: `0x${"0".repeat(64)}`,
        },
        pendingReward: { reward },
        lastReward: undefined,
        stats: updatedStats,
        achievements: buildAchievements(updatedStats),
        toasts: [
          createToast(
            "Mining Request Submitted",
            `Request block #${requestBlock}, waiting for 3 blocks.`,
            "info",
          ),
          ...state.toasts,
        ].slice(0, 3),
      };
    }

    case "SET_MINE_WAITING": {
      const { latestMine } = state;
      if (!latestMine || latestMine.status !== "pending") return state;
      return { ...state, latestMine: { ...latestMine, status: "waiting" } };
    }

    case "TICK_MINE_BLOCK": {
      const { latestMine } = state;
      if (!latestMine || latestMine.status !== "waiting") return state;
      const waitBlocksRemaining = Math.max(
        latestMine.waitBlocksRemaining - 1,
        0,
      );
      return {
        ...state,
        currentBlock: state.currentBlock + 1,
        latestMine: {
          ...latestMine,
          waitBlocksRemaining,
          status: waitBlocksRemaining === 0 ? "revealable" : "waiting",
        },
      };
    }

    case "REVEAL_LATEST_MINE": {
      const { stats, pendingReward, latestMine } = state;
      if (!stats || !pendingReward || !latestMine || latestMine.status !== "revealable") {
        return state;
      }

      const reward = pendingReward.reward;
      const updatedStats: UserStats = {
        ...stats,
        points: stats.points + reward.pointsAwarded,
        totalMines: stats.totalMines + 1,
        oreCounts: {
          ...stats.oreCounts,
          [reward.oreType]: stats.oreCounts[reward.oreType] + 1,
        },
        unlockedNfts:
          reward.mintedNft && !stats.unlockedNfts.includes(reward.oreType)
            ? [...stats.unlockedNfts, reward.oreType]
            : stats.unlockedNfts,
      };

      const nextActivity: ActivityFeedItem = {
        id: `${Date.now()}`,
        wallet: state.currentWallet ?? stats.wallet,
        oreType: reward.oreType,
        pointsAwarded: reward.pointsAwarded,
        createdAt: "just now",
      };

      return {
        ...state,
        stats: updatedStats,
        achievements: buildAchievements(updatedStats),
        pendingReward: undefined,
        lastReward: reward,
        latestMine: {
          ...latestMine,
          waitBlocksRemaining: 0,
          status: "done",
        },
        activity: [nextActivity, ...state.activity].slice(0, 8),
        toasts: [
          createToast(
            reward.mintedNft ? "Rare Reward Unlocked" : "Reveal Complete",
            reward.mintedNft
              ? `${reward.title} — NFT earned!`
              : `${reward.title} — points credited.`,
            "success",
          ),
          ...state.toasts,
        ].slice(0, 3),
      };
    }

    case "BUY_PICKAXE": {
      const { tier, purchased } = action.payload;
      const updatedStats = {
        ...state.stats!,
        remainingPaidMines: state.stats!.remainingPaidMines + purchased,
      };

      return {
        ...state,
        stats: updatedStats,
        achievements: buildAchievements(updatedStats),
        latestReceipt: {
          id: `${Date.now()}`,
          tier,
          title:
            tier === "basic"
              ? "普通矿镐到账"
              : tier === "advanced"
                ? "高级矿镐到账"
                : "钻石矿镐到账",
          price:
            tier === "basic"
              ? "1.99 USDC"
              : tier === "advanced"
                ? "8.99 USDC"
                : "16.99 USDC",
          paymentSymbol: "USDC",
          minesAdded: purchased,
          createdAt: "刚刚",
        },
        toasts: [
          createToast(
            "Pickaxe Purchased",
            `Added ${purchased} paid mining uses.`,
            "success",
          ),
          ...state.toasts,
        ].slice(0, 3),
      };
    }

    case "PREPEND_ACTIVITY":
      return {
        ...state,
        activity: [action.payload.item, ...state.activity].slice(0, 8),
      };

    case "PUSH_TOAST":
      return {
        ...state,
        toasts: [action.payload, ...state.toasts].slice(0, 3),
      };

    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload.id),
      };

    default:
      return state;
  }
}
