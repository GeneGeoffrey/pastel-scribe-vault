"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

type Props = {
  children: ReactNode;
};

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "encrypted-mood-demo";

// In production (Vercel), only support Sepolia testnet
// In development, support both hardhat and sepolia
const isProduction = process.env.NODE_ENV === "production";

const wagmiConfig = getDefaultConfig({
  appName: "Encrypted Mood Diary",
  projectId,
  chains: isProduction ? [sepolia] : [hardhat, sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#8f5bff",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
        >
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
