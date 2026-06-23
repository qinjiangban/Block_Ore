"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, isAddress, type Address } from "viem";
import { BadgeDollarSign, Shield, Wallet } from "lucide-react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useTranslations } from "next-intl"

import { AppShell, MetaBadge, Panel } from "@/components/app-shell";
import { useWalletMode } from "@/components/providers/app-providers";
import {
  createOnchainBlockOreAdapter,
  isBlockOreConfigured,
  isPaymentTokenConfigured,
} from "@/lib/adapters/onchain-block-ore-adapter";
import type {
  AdminPurchaseRecord,
  AdminWithdrawalRecord,
  TreasurySnapshot,
} from "@/lib/types";
import { activeChain } from "@/lib/web3/chains";
import { shortenAddress } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const formatUsdc = (value: bigint) => `${formatUnits(value, 6)} USDC`;
const formatEth = (value: bigint) => `${formatUnits(value, 18)} ETH`;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("User rejected")) {
      return "You cancelled the wallet signature.";
    }

    return error.message;
  }

  return "Backend operation failed, please retry later.";
};

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge icon={<Shield className="h-4 w-4" />} label="Permissions" value={title} />
          <MetaBadge icon={<BadgeDollarSign className="h-4 w-4" />} label="Payment" value="USDC" />
          <MetaBadge icon={<Wallet className="h-4 w-4" />} label="Status" value="Pending" />
        </div>
      }
    >
      <Panel>
        <p className="text-xs text-cobalt/70">Owner Access</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm text-white/65">{description}</p>
      </Panel>
    </AppShell>
  );
}

function AdminPageView({
  busy,
  nextTreasury,
  notice,
  purchaseRecords,
  onChangeTreasury,
  onRefresh,
  onUpdateTreasury,
  onWithdrawAll,
  withdrawalRecords,
  snapshot,
}: {
  busy: boolean;
  nextTreasury: string;
  notice: string;
  purchaseRecords: AdminPurchaseRecord[];
  onChangeTreasury: (value: string) => void;
  onRefresh: () => void;
  onUpdateTreasury: () => void;
  onWithdrawAll: () => void;
  withdrawalRecords: AdminWithdrawalRecord[];
  snapshot: TreasurySnapshot;
}) {
  const t = useTranslations("admin");

  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge icon={<Shield className="h-4 w-4" />} label={t("owner")} value={shortenAddress(snapshot.owner)} />
          <MetaBadge icon={<BadgeDollarSign className="h-4 w-4" />} label={t("trackedRevenue")} value={formatUsdc(snapshot.trackedTokenBalance)} />
          <MetaBadge icon={<Wallet className="h-4 w-4" />} label={t("treasury")} value={shortenAddress(snapshot.treasury)} />
        </div>
      }
    >
      <Panel>
        <p className="text-xs text-cobalt/70">{t("treasurySnapshot")}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{t("overview")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("usdcContract")}</p>
            <p className="mt-2 break-all text-white">{snapshot.paymentToken}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("treasuryAddress")}</p>
            <p className="mt-2 break-all text-white">{snapshot.treasury}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("contractUsdcBalance")}</p>
            <p className="mt-2 text-white">{formatUsdc(snapshot.contractTokenBalance)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("contractNativeBalance")}</p>
            <p className="mt-2 text-white">{formatEth(snapshot.contractNativeBalance)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/65">{notice}</p>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("treasuryActions")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("actions")}</h3>
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy || snapshot.trackedTokenBalance === 0n}
            onClick={onWithdrawAll}
            className="rounded-2xl border border-cobalt/20 bg-cobalt/10 px-4 py-3 text-sm font-medium text-cobalt transition hover:bg-cobalt/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("withdrawAllUsdc")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onRefresh}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("refreshData")}
          </button>
        </div>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("treasuryConfig")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("updateTreasuryAddress")}</h3>
        <input
          value={nextTreasury}
          onChange={(event) => onChangeTreasury(event.target.value)}
          placeholder="0x..."
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cobalt/40"
        />
        <button
          type="button"
          disabled={busy || !isAddress(nextTreasury)}
          onClick={onUpdateTreasury}
          className="mt-3 w-full rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-medium text-gold transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("updateTreasuryBtn")}
        </button>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("recentPurchases")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("recentPurchasesSub")}</h3>
        <div className="mt-4 space-y-3">
          {purchaseRecords.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              {t("noPurchaseRecords")}
            </div>
          ) : (
            purchaseRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{shortenAddress(record.wallet)}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {record.createdAt} · Tier {record.tier} · +{record.minesAdded} mines
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-cobalt">{formatUsdc(record.pricePaid)}</p>
                    <p className="mt-1 text-xs text-white/45">#{record.blockNumber.toString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("recentWithdrawals")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("recentWithdrawalsSub")}</h3>
        <div className="mt-4 space-y-3">
          {withdrawalRecords.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              {t("noWithdrawalRecords")}
            </div>
          ) : (
            withdrawalRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{shortenAddress(record.recipient)}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {record.createdAt} · {record.kind} {t("recentWithdrawals")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gold">
                      {record.kind === "USDC" ? formatUsdc(record.amount) : formatEth(record.amount)}
                    </p>
                    <p className="mt-1 text-xs text-white/45">#{record.blockNumber.toString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </AppShell>
  );
}

function RealAdminPage() {
  const t = useTranslations("admin");
  const currentWallet = useGameStore((state) => state.currentWallet);
  const currentChainId = useGameStore((state) => state.currentChainId);
  const pushToast = useGameStore((state) => state.pushToast);
  const publicClient = usePublicClient({ chainId: currentChainId ?? activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: currentChainId ?? activeChain.id });
  const [snapshot, setSnapshot] = useState<TreasurySnapshot>();
  const [purchaseRecords, setPurchaseRecords] = useState<AdminPurchaseRecord[]>([]);
  const [withdrawalRecords, setWithdrawalRecords] = useState<AdminWithdrawalRecord[]>([]);
  const [nextTreasury, setNextTreasury] = useState("");
  const [notice, setNotice] = useState(t("noticeDefault"));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const adapter = useMemo(() => {
    if (!currentWallet || !currentChainId || !publicClient) {
      return undefined;
    }

    return createOnchainBlockOreAdapter({
      chainId: currentChainId,
      publicClient,
      walletAddress: currentWallet,
      walletClient,
    });
  }, [currentChainId, currentWallet, publicClient, walletClient]);

  const contractReady = Boolean(
    currentChainId && isBlockOreConfigured(currentChainId) && isPaymentTokenConfigured(currentChainId),
  );
  const canLoadAdminData = Boolean(adapter && currentWallet && contractReady);

  const refresh = useCallback(async () => {
    if (!adapter || !currentWallet) {
      return;
    }

    const [nextSnapshot, nextPurchaseRecords, nextWithdrawalRecords] = await Promise.all([
      adapter.getTreasurySnapshot(),
      adapter.getRecentPurchaseRecords(8),
      adapter.getRecentWithdrawalRecords(8),
    ]);
    const ownerMatched = nextSnapshot.owner.toLowerCase() === currentWallet.toLowerCase();
    setSnapshot(nextSnapshot);
    setPurchaseRecords(nextPurchaseRecords);
    setWithdrawalRecords(nextWithdrawalRecords);
    setIsOwner(ownerMatched);
    setNextTreasury(nextSnapshot.treasury);
    return ownerMatched;
  }, [adapter, currentWallet]);

  useEffect(() => {
    if (!canLoadAdminData) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const ownerMatched = await refresh();
        if (!cancelled && !ownerMatched) {
          setNotice(t("noticeNotOwner"));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [canLoadAdminData, refresh, t]);

  if (!currentWallet) {
    return <PlaceholderPage title={t("waitingConnect")} description={t("connectOwnerDesc")} />;
  }

  if (!contractReady) {
    return <PlaceholderPage title={t("contractNotConfigured")} description={t("contractNotConfiguredDesc")} />;
  }

  if (loading || !snapshot) {
    return <PlaceholderPage title={t("loading")} description={notice} />;
  }

  if (!isOwner) {
    return <PlaceholderPage title={t("noPermission")} description={t("noPermissionDesc")} />;
  }

  const handleWithdrawAll = async () => {
    if (!adapter || !snapshot || snapshot.trackedTokenBalance === 0n) {
      return;
    }

    setBusy(true);
    setNotice(t("confirmWithdraw"));

    try {
      await adapter.withdrawTreasury(snapshot.trackedTokenBalance);
      await refresh();
      setNotice(t("withdrawSuccess"));
      pushToast({
        title: "Treasury Withdrawn",
        description: t("withdrawSuccessToast"),
        tone: "success",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setNotice(message);
      pushToast({ title: t("withdrawFailed"), description: message, tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateTreasury = async () => {
    if (!adapter || !isAddress(nextTreasury)) {
      return;
    }

    setBusy(true);
    setNotice(t("confirmUpdateTreasury"));

    try {
      await adapter.setTreasury(nextTreasury as Address);
      await refresh();
      setNotice(t("updateSuccess"));
      pushToast({
        title: "Treasury Updated",
        description: t("updateSuccessToast"),
        tone: "success",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setNotice(message);
      pushToast({ title: t("updateFailed"), description: message, tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = () => {
    setBusy(true);
    void refresh()
      .then(() => {
        setNotice(t("refreshSuccess"));
      })
      .catch((error) => {
        setNotice(getErrorMessage(error));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <AdminPageView
      busy={busy}
      nextTreasury={nextTreasury}
      notice={notice}
      purchaseRecords={purchaseRecords}
      onChangeTreasury={setNextTreasury}
      onRefresh={handleRefresh}
      onUpdateTreasury={() => {
        void handleUpdateTreasury();
      }}
      onWithdrawAll={() => {
        void handleWithdrawAll();
      }}
      withdrawalRecords={withdrawalRecords}
      snapshot={snapshot}
    />
  );
}

export default function AdminPage() {
  const { configured } = useWalletMode();

  if (!configured) {
    return <PlaceholderPage title="Onchain Mode Only" description="Admin panel is only available in real wallet mode." />;
  }

  return <RealAdminPage />;
}
