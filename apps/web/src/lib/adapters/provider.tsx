"use client";

import { useMemo } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { createOnchainBlockOreAdapter } from "@/lib/adapters/onchain-block-ore-adapter";
import type { OnchainBlockOreAdapter } from "@/lib/adapters/onchain-block-ore-adapter";
import { isBlockOreConfigured } from "@/lib/adapters/onchain-block-ore-adapter";

export function useBlockOreAdapter(): {
  adapter: OnchainBlockOreAdapter | null;
  contractReady: boolean;
  purchaseHistory: ReturnType<OnchainBlockOreAdapter["getPurchaseHistory"]>;
  treasurySnapshot: Awaited<ReturnType<OnchainBlockOreAdapter["getTreasurySnapshot"]>> | null;
  treasuryHistory: ReturnType<OnchainBlockOreAdapter["getWithdrawalHistory"]>;
  withdrawTreasury: OnchainBlockOreAdapter["withdrawTreasury"];
  defaultUsdcConfig: { address: string; symbol: string; decimals: number } | null;
  contractOwner: string | null;
  pickaxPrices: Record<string, bigint>;
  setOwner: OnchainBlockOreAdapter["setOwner"];
  setTreasury: OnchainBlockOreAdapter["setTreasury"];
  updatePickaxePrice: OnchainBlockOreAdapter["updatePickaxePrice"];
  configSettings: Record<string, string>;
} {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const chainId = chain?.id;
  const contractReady = Boolean(
    address && chainId && isBlockOreConfigured(chainId),
  );

  const adapter = useMemo(() => {
    if (!address || !chainId || !publicClient || !walletClient) return null;
    if (!isBlockOreConfigured(chainId)) return null;

    return createOnchainBlockOreAdapter({
      publicClient,
      walletClient,
      address,
      chainId,
    });
  }, [address, chainId, publicClient, walletClient]);

  const purchaseHistory = adapter?.getPurchaseHistory() ?? [];
  const treasurySnapshot = null;
  const treasuryHistory = adapter?.getWithdrawalHistory() ?? [];
  const withdrawTreasury = adapter?.withdrawTreasury ?? (async () => false);
  const defaultUsdcConfig = adapter?.getDefaultUsdcConfig() ?? null;
  const contractOwner = adapter?.contractOwner ?? null;
  const pickaxPrices = adapter?.pickaxePrices ?? {};
  const setOwner = adapter?.setOwner ?? (async () => { });
  const setTreasury = adapter?.setTreasury ?? (async () => { });
  const updatePickaxePrice = adapter?.updatePickaxePrice ?? (async () => { });
  const configSettings = adapter?.getConfigSettings() ?? {};

  return {
    adapter,
    contractReady,
    purchaseHistory,
    treasurySnapshot,
    treasuryHistory,
    withdrawTreasury,
    defaultUsdcConfig,
    contractOwner,
    pickaxPrices,
    setOwner,
    setTreasury,
    updatePickaxePrice,
    configSettings,
  };
}

export function useOreNftAdapter() {
  return {};
}
