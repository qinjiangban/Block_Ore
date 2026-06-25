"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { dataSuffix, PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Attribution } from 'ox/erc8021';
import { blockOreEnv, isPrivyConfigured } from "@/lib/env";
import {
  supportedChains,
  defaultChain,
} from "@/lib/web3/chains";
import { wagmiConfig } from "@/lib/web3/wagmi-config";
import { GameProvider } from "@/store/game-context";
import { SettingsProvider } from "@/store/settings-context";

const WalletModeContext = createContext<{ configured: boolean }>({
  configured: false,
});

export const useWalletMode = () => useContext(WalletModeContext);

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const modeValue = useMemo(
    () => ({ configured: isPrivyConfigured }),
    [],
  );

  const inner = (
    <GameProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
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
            {inner}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </WalletModeContext.Provider>
  );
}
