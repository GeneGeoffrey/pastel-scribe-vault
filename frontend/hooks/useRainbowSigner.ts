"use client";

import { useEffect, useState } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { type WalletClient } from "viem";
import { ethers } from "ethers";

type RainbowSignerState = {
  walletClient: WalletClient | undefined;
  publicClient: ReturnType<typeof usePublicClient>;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  browserProvider: ethers.BrowserProvider | undefined;
  eip1193Provider: ethers.Eip1193Provider | undefined;
};

export function useRainbowSigner(): RainbowSignerState {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner>();
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider>();
  const [eip1193Provider, setEip1193Provider] = useState<ethers.Eip1193Provider>();

  useEffect(() => {
    let cancelled = false;

    async function setupSigner() {
      if (!walletClient) {
        setBrowserProvider(undefined);
        setEip1193Provider(undefined);
        setEthersSigner(undefined);
        return;
      }

      const provider = walletClient.transport as unknown as ethers.Eip1193Provider;
      const browser = new ethers.BrowserProvider(provider);
      const signer = await browser.getSigner(walletClient.account.address);

      if (!cancelled) {
        setBrowserProvider(browser);
        setEip1193Provider(provider);
        setEthersSigner(signer);
      }
    }

    setupSigner();

    return () => {
      cancelled = true;
    };
  }, [walletClient]);

  return {
    walletClient,
    publicClient,
    ethersSigner,
    browserProvider,
    eip1193Provider,
  };
}

