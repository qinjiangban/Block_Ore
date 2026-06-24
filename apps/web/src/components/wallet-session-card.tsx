"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSwitchChain } from "wagmi";
import { useTranslations } from "next-intl";

import { useWalletMode } from "@/components/providers/app-providers";
import { useGameContext } from "@/store/game-context";
import { shortenAddress } from "@/lib/utils";
import { useWalletIdentity } from "@/lib/web3/use-wallet-identity";
import {
  chainLabelById,
  chainIconColor,
  supportedChains,
} from "@/lib/web3/chains";

function WalletDropdown({
  address,
  onClose,
}: {
  address: `0x${string}`;
  onClose: () => void;
}) {
  const t = useTranslations("wallet");
  const { logout } = usePrivy();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { stats } = useGameContext();
  const { displayName, avatarUrl } = useWalletIdentity(address);

  const currentId = chain?.id;

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[220px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1225] shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      {/* 用户信息区 */}
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00D4FF]/20 text-[#00D4FF]">
              <Wallet className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {displayName ?? shortenAddress(address)}
            </p>
            {displayName && (
              <p className="truncate text-[11px] text-white/40">
                {shortenAddress(address)}
              </p>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-white/50">
          {stats?.points?.toLocaleString() ?? "--"} {t("points")}
        </p>
      </div>

      {/* 链切换区 */}
      <div className="border-b border-white/[0.06] px-2 py-2">
        <p className="px-2 pb-1 text-[10px] font-medium tracking-wider text-white/30">
          {t("switchNetwork")}
        </p>
        {supportedChains.map((ch) => {
          const active = ch.id === currentId;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                if (switchChain && ch.id !== currentId) {
                  switchChain({ chainId: ch.id });
                }
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${active
                ? "bg-[#00D4FF]/10 text-[#00D4FF]"
                : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: chainIconColor[ch.id] ?? "#888" }}
              />
              {chainLabelById[ch.id] ?? `Chain #${ch.id}`}
              {active && (
                <span className="ml-auto text-[10px] text-[#00D4FF]/60">
                  {t("current")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 退出 */}
      <div className="px-2 py-2">
        <button
          type="button"
          onClick={() => {
            void logout();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-[#FF6B7A]"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("disconnect")}
        </button>
      </div>
    </div>
  );
}

function ConnectedWalletButton() {
  const { address } = useAccount();
  const { displayName, avatarUrl } = useWalletIdentity(address);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  if (!address) return null;

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/10"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={18}
            height={18}
            className="rounded-full"
          />
        ) : (
          <Wallet className="h-3.5 w-3.5 text-[#00D4FF]" />
        )}
        <span className="max-w-[80px] truncate">
          {displayName ?? shortenAddress(address)}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-white/40 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleClose} />
          <WalletDropdown address={address} onClose={handleClose} />
        </>
      )}
    </div>
  );
}

function LoginButton() {
  const t = useTranslations("wallet");
  const { login, ready } = usePrivy();

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => void login()}
      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Wallet className="h-3.5 w-3.5" />
      {t("connect")}
    </button>
  );
}

function RealWalletSessionCard() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();

  if (authenticated && address) {
    return <ConnectedWalletButton />;
  }

  return <LoginButton />;
}

function MockConnectedButton() {
  const t = useTranslations("wallet");
  const { currentWallet, disconnectWallet, stats } = useGameContext();
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/10"
      >
        <Wallet className="h-3.5 w-3.5 text-[#00D4FF]" />
        <span className="max-w-[80px] truncate">
          {shortenAddress(currentWallet)}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-white/40 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={handleClose} />
          <div className="absolute right-0 top-full z-30 mt-2 w-[200px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1225] shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="text-sm font-medium text-white">
                {shortenAddress(currentWallet)}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {stats?.points?.toLocaleString() ?? "--"} {t("points")}
              </p>
            </div>
            <div className="px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  disconnectWallet();
                  handleClose();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-[#FF6B7A]"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("disconnect")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MockWalletSessionCard() {
  const t = useTranslations("wallet");
  const { currentWallet, connectWallet } = useGameContext();

  if (currentWallet) {
    return <MockConnectedButton />;
  }

  return (
    <button
      type="button"
      onClick={connectWallet}
      className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/10 hover:text-white"
    >
      <Wallet className="h-3.5 w-3.5" />
      {t("connect")}
    </button>
  );
}

export function WalletSessionCard() {
  const { configured } = useWalletMode();

  return configured ? <RealWalletSessionCard /> : <MockWalletSessionCard />;
}
