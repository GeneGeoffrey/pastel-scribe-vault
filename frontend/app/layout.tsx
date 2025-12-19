import type { Metadata } from "next";
import Image from "next/image";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { WalletButton } from "@/components/WalletButton";

export const metadata: Metadata = {
  title: "Encrypted Mood Diary",
  description: "Privacy-preserving mood analytics powered by FHEVM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="zama-bg text-foreground antialiased">
        <div className="fixed inset-0 w-full h-full zama-bg z-[-20]" />
        <Providers>
          <main className="flex flex-col max-w-screen-xl mx-auto px-6 md:px-10 pb-16 min-w-[320px]">
            <nav className="flex w-full py-8 items-center justify-between">
              <Image
                src="/moodmark-logo.svg"
                alt="Encrypted Mood Diary"
                width={280}
                height={60}
                priority
              />
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm uppercase tracking-widest text-slate-600">
                  Rainbow Wallet Access
                </span>
                <WalletButton />
              </div>
            </nav>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
