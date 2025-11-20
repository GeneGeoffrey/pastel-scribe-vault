"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
// 2025-11-16 12:33 - Code update

// Wallet connection button component
// 2025-11-16 12:34 - Code update
export function WalletButton() {
  return (
    <ConnectButton
      showBalance={false}
// 2025-11-16 12:33 - Code update
      accountStatus={{
        largeScreen: "address",
        smallScreen: "avatar",
      }}
    />
  );
}

