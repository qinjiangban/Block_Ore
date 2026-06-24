"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import { getAddress } from "viem";

import {
  createOnchainBlockOreAdapter,
  isBlockOreConfigured,
} from "@/lib/adapters/onchain-block-ore-adapter";
import { useGameContext } from "@/store/game-context";
import { wagmiConfig } from "../web3/wagmi-config";

type TreasurySnapshotView = {
  usdcBalance: string;
  nativeBalance: string;
  contractAddress: string;
  treasuryAddress: string;
};

type AdminPurchaseView = {
  txHash: string;
  user?: string;
  tier: number;
  pricePaid: number;
  createdAt?: string;
};

type WithdrawalEntry = {
  txHash: string;
  amountUsd: number;
  createdAt?: string;
};

export function useBlockOreAdapter() {
  const { address } = useConnection(wagmiConfig as any);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { currentChainId: chainId } = useGameContext();
  const resolvedChainId = chainId ?? 84532;

  const [treasurySnapshot, setTreasurySnapshot] =
    useState<TreasurySnapshotView | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<AdminPurchaseView[]>(
    [],
  );
  const [treasuryHistory, setTreasuryHistory] = useState<WithdrawalEntry[]>([]);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [contractReady, setContractReady] = useState(false);

  const adapter = useMemo(() => {
    if (!publicClient || !resolvedChainId || !isBlockOreConfigured(resolvedChainId))
      return null;

    return createOnchainBlockOreAdapter({
      chainId: resolvedChainId,
      publicClient,
      walletAddress: address,
      walletClient: walletClient ?? undefined,
    });
  }, [chainId, publicClient, address, walletClient]);

  const isOwner = useMemo(() => {
    if (!contractOwner || !address) return false;
    try {
      return getAddress(contractOwner) === getAddress(address);
    } catch {
      return false;
    }
  }, [contractOwner, address]);

  const loadData = useCallback(async () => {
    if (!adapter || !publicClient) return;

    try {
      const snapshot = await adapter.getTreasurySnapshot();
      setTreasurySnapshot({
        usdcBalance: Number(snapshot.contractTokenBalance).toFixed(2),
        nativeBalance: Number(snapshot.contractNativeBalance).toFixed(6),
        contractAddress: snapshot.paymentToken,
        treasuryAddress: snapshot.treasury,
      });
      setContractOwner(snapshot.owner);
      setContractReady(true);
    } catch {
      setContractReady(false);
    }

    try {
      const purchases = await adapter.getRecentPurchaseRecords(10);
      setPurchaseHistory(
        purchases.map((p) => ({
          txHash: p.txHash,
          user: p.wallet,
          tier: p.tier === "basic" ? 0 : p.tier === "advanced" ? 1 : 2,
          pricePaid: Number(p.pricePaid ?? 0n),
          createdAt: p.createdAt,
        })),
      );
    } catch {
      setPurchaseHistory([]);
    }

    try {
      const withdrawals = await adapter.getRecentWithdrawalRecords(10);
      setTreasuryHistory(
        withdrawals.map((w) => ({
          txHash: w.txHash,
          amountUsd: Number(w.amount ?? 0n),
          createdAt: w.createdAt,
        })),
      );
    } catch {
      setTreasuryHistory([]);
    }
  }, [adapter, publicClient]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withdrawTreasury = useCallback(
    async (amount: bigint) => {
      if (!adapter) return false;
      try {
        await adapter.withdrawTreasury(amount);
        void loadData();
        return true;
      } catch {
        return false;
      }
    },
    [adapter, loadData],
  );

  const refresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  return {
    treasurySnapshot,
    treasuryHistory,
    purchaseHistory,
    defaultUsdcConfig: { address: "", symbol: "USDC", decimals: 6 },
    pickaxPrices: { basic: "1.99", advanced: "8.99", diamond: "16.99" },
    contractOwner,
    adapter: adapter ? { ...adapter, isOwner } : null,
    contractReady,
    withdrawTreasury,
    refresh,
    setOwner: async () => {},
    setTreasury: async () => {},
    updatePickaxePrice: async () => {},
  };
}

export function useOreNftAdapter() {
  return {
    balanceOf: () => Promise.resolve(0),
    tokensOfOwner: () => Promise.resolve([]),
  };
}
