"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { blockOreEnv, isPrivyConfigured } from "@/lib/env";
import {
  supportedChains,
  defaultChain,
  getChainLabel,
} from "@/lib/web3/chains";
import { wagmiConfig } from "@/lib/web3/wagmi-config";
import { useGameStore } from "@/store/game-store";

const queryClient = new QueryClient();

const WalletModeContext = createContext<{ configured: boolean }>({
  configured: false,
});

export const useWalletMode = () => useContext(WalletModeContext);

function WalletSync({ children }: PropsWithChildren) {
  const { address, chain } = useAccount();
  const syncWalletSession = useGameStore((state) => state.syncWalletSession);

  useEffect(() => {
    syncWalletSession({
      wallet: address,
      chainId: chain?.id,
      chainName: getChainLabel(chain?.id),
    });
  }, [address, chain?.id, syncWalletSession]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const modeValue = useMemo(
    () => ({ configured: isPrivyConfigured }),
    [],
  );

  if (!isPrivyConfigured) {
    return (
      <WalletModeContext.Provider value={modeValue}>
        {children}
      </WalletModeContext.Provider>
    );
  }

  return (
    <WalletModeContext.Provider value={modeValue}>
      <PrivyProvider
        appId={blockOreEnv.privyAppId}
        clientId={blockOreEnv.privyClientId || undefined}
        config={{
          loginMethods: ["wallet", "email"],
          appearance: {
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
            <WalletSync>{children}</WalletSync>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </WalletModeContext.Provider>
  );
}
