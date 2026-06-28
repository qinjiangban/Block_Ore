"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { dataSuffix, PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Attribution } from 'ox/erc8021';
import { blockOreEnv, isPrivyConfigured } from "@/lib/env";
import {
  supportedChains,
  defaultChain,
} from "@/lib/web3/chains";
import { wagmiConfig } from "@/lib/web3/wagmi-config";
import { GameProvider, useGameContext } from "@/store/game-context";
import { SettingsProvider } from "@/store/settings-context";

const WalletModeContext = createContext<{ configured: boolean }>({
  configured: false,
});

export const useWalletMode = () => useContext(WalletModeContext);

/** 将 Privy/wagmi 钱包地址同步到 GameContext.currentWallet */
function WalletSync() {
  const { address, chainId } = useAccount();
  const { syncWalletSession } = useGameContext();
  const prevRef = useRef({ addr: "", cid: 0 });

  useEffect(() => {
    const prev = prevRef.current;
    if (address && (address !== prev.addr || (chainId ?? 0) !== prev.cid)) {
      prevRef.current = { addr: address, cid: chainId ?? 0 };

      import("@/lib/web3/chains").then(({ chainLabelById }) => {
        const cid = chainId ?? 0;
        syncWalletSession({
          wallet: address as `0x${string}`,
          chainId: cid,
          chainName: chainLabelById[cid] ?? `Chain #${cid}`,
        });
      });
      return;
    }

    if (!address && prev.addr) {
      prevRef.current = { addr: "", cid: 0 };
      syncWalletSession({});
    }
  }, [address, chainId, syncWalletSession]);

  return null;
}

function AppInner({ children }: PropsWithChildren) {
  return (
    <>
      <WalletSync />
      {children}
    </>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const modeValue = useMemo(
    () => ({ configured: isPrivyConfigured }),
    [],
  );

  const inner = (
    <GameProvider>
      <AppInner>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </AppInner>
    </GameProvider>
  );

  if (!isPrivyConfigured) {
    return (
      <WalletModeContext.Provider value={modeValue}>
        {inner}
      </WalletModeContext.Provider>
    );
  }

  const ERC_8021_ATTRIBUTION_SUFFIX = Attribution.toDataSuffix({
    codes: ['bc_kvfh7urx']
  });

  return (
    <WalletModeContext.Provider value={modeValue}>


      <PrivyProvider
        appId={blockOreEnv.privyAppId}
        clientId={blockOreEnv.privyClientId || undefined}
        config={{
          plugins: [dataSuffix(ERC_8021_ATTRIBUTION_SUFFIX)],
          loginMethods: ["wallet", "email", "google", "twitter", "github", "farcaster"],
          appearance: {
            logo: "/logo.svg",
            theme: "dark",
            accentColor: "#00D4FF",
            walletChainType: "ethereum-only",
            showWalletLoginFirst: true,
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          supportedChains,
          defaultChain,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            {inner}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </WalletModeContext.Provider>
  );
}
