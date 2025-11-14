"use client";

// Main dashboard component for mood diary

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { clsx } from "clsx";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useRainbowSigner } from "@/hooks/useRainbowSigner";
import { useMoodDiary } from "@/hooks/useMoodDiary";

const MOCK_CHAINS = { 31337: "http://localhost:8545" };

const MOOD_LABELS = [
  { score: 1, label: "Stormy", tone: "Anxious or drained" },
  { score: 2, label: "Cloudy", tone: "Low energy" },
  { score: 3, label: "Calm", tone: "Balanced baseline" },
  { score: 4, label: "Bright", tone: "Motivated" },
  { score: 5, label: "Radiant", tone: "Joyful & energized" },
];

export default function Home() {
  const { address, chainId, isConnected, status: accountStatus } = useAccount();
  const { storage } = useInMemoryStorage();
  const {
    ethersSigner,
    browserProvider,
    eip1193Provider,
  } = useRainbowSigner();

  // Only use mock chains in development (localhost/hardhat)
  // In production (Vercel), only use Sepolia testnet
  const isProduction = process.env.NODE_ENV === "production";
  const mockChains = isProduction ? undefined : MOCK_CHAINS;

  const { instance, status: fheStatus, error: fheError } = useFhevm({
    provider: eip1193Provider,
    chainId,
    enabled: Boolean(eip1193Provider && chainId),
    initialMockChains: mockChains,
  });

  const diary = useMoodDiary({
    instance,
    storage,
    chainId,
    walletAddress: address as `0x${string}` | undefined,
    ethersSigner,
    ethersProvider: browserProvider,
  });

  const [selectedMood, setSelectedMood] = useState(3);

  // Enhanced mood selection state management with validation

  const decryptedAverage = useMemo(() => {
    if (!diary.clearTrend?.clear) return undefined;
    const value =
      typeof diary.clearTrend.clear === "string"
        ? Number(diary.clearTrend.clear)
        : Number(diary.clearTrend.clear);
    return Number.isFinite(value) ? value : undefined;
  }, [diary.clearTrend]);

  const displayedHandle =
    diary.trendHandle ??
    diary.networkTrendHandle ??
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  return (
    <div className="flex flex-col gap-10 py-6">
      {/* Main container for encrypted mood diary application */}
      <section className="glass-card p-6 md:p-10 space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-300">
          Encrypted Mood Diary · Zama FHEVM
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-white">
          Capture your daily emotions in a fully encrypted diary.
        </h1>
        <p className="text-base sm:text-lg text-slate-200 max-w-3xl">
          Every score is encrypted locally, aggregated privately on-chain, and
          decrypted only when you explicitly request access. Build privacy
          compliant well-being analytics without exposing personal emotions.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            "Fully Homomorphic Encryption",
            "Rainbow Wallet Ready",
            "Secure Aggregation",
            "Decrypt On Demand",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced responsive layout for mood diary interface with improved mobile experience */}
        <div className="glass-card p-4 sm:p-6 lg:col-span-2 space-y-4 sm:space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-violet-200">
                Daily check-in
              </p>
              <h2 className="text-2xl font-semibold text-white">
                How are you feeling today?
              </h2>
            </div>
            <button
              onClick={diary.refreshStats}
              disabled={diary.isSubmitting}
              className="text-xs font-semibold uppercase tracking-widest text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh stats ↺
            </button>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3" role="radiogroup" aria-label="Mood selection">
            {MOOD_LABELS.map((mood) => (
              <button
                key={mood.score}
                onClick={() => setSelectedMood(mood.score)}
                onKeyDown={(e) => {
                  if (e.key >= '1' && e.key <= '5') {
                    setSelectedMood(parseInt(e.key));
                  }
                }}
                aria-label={`Select mood: ${mood.label} - ${mood.tone}`}
                className={clsx(
                  "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition",
                  selectedMood === mood.score
                    ? "border-white/80 bg-white/20 text-white"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-white/50 hover:bg-white/10",
                )}
              >
                <span className="text-2xl font-semibold">{mood.score}</span>
                <span className="text-sm font-semibold">{mood.label}</span>
                <span className="text-[11px] text-slate-300">{mood.tone}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => diary.submitMood(selectedMood)}
            disabled={!diary.isReadyForTx || diary.isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#8f5bff] to-[#3ec5ff] px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-2xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 w-full sm:w-auto"
          >
            {diary.isSubmitting ? "🔐 Encrypting mood..." : "Save encrypted mood"}
          </button>
          <p className="text-sm text-slate-300">
            Your wallet signs the entry; the clear score never leaves your
            device.
          </p>
        </div>

        <div className="glass-card p-6 space-y-5" aria-live="polite">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">
              Aggregated insight
            </p>
            <h3 className="text-3xl font-bold text-white">
              {decryptedAverage ?? "Encrypted"}
            </h3>
            <p className="text-sm text-slate-300">
              Average mood trend across {diary.entryCount} encrypted entries.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Entries recorded</span>
              <span className="font-semibold text-white">{diary.entryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Your encrypted handle</span>
              <span className="font-mono text-xs text-white">
                {displayedHandle
                  ? `${displayedHandle.slice(0, 6)}…${displayedHandle.slice(-4)}`
                  : "0x0000"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={diary.requestTrendHandle}
              disabled={!diary.isReadyForTx || diary.isRequestingAccess}
              className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/60 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {diary.isRequestingAccess
                ? "🔗 Sharing handle..."
                : "Share trend to wallet"}
            </button>
            <button
              onClick={diary.decryptTrend}
              disabled={!diary.canDecrypt}
              className="rounded-2xl border border-lime-200/60 bg-lime-200/20 px-4 py-3 text-sm font-semibold text-lime-100 transition hover:bg-lime-200/30 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {diary.isDecrypting ? "Decrypting..." : "Decrypt average"}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Handles must be explicitly refreshed for every wallet after new
            entries land. Use “Share trend to wallet” whenever you need the
            latest average.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            System status & telemetry
          </h3>
          <StatusRow label="FHEVM runtime" value={fheStatus} />
          <StatusRow
            label="Wallet status"
            value={
              isConnected
                ? `Connected · ${address?.slice(0, 6)}…${address?.slice(-4)}`
                : accountStatus === "connecting"
                  ? "Connecting..."
                  : "Not connected"
            }
          />
          <StatusRow
            label="Active chain"
            value={chainId ? `Chain ID ${chainId}` : "Unknown"}
          />
          <StatusRow
            label="Contract address"
            value={
              diary.contractAddress
                ? `${diary.contractAddress.slice(0, 10)}…`
                : "Not deployed"
            }
          />
          <StatusRow
            label="Encrypted handle ready"
            value={diary.trendHandle ? "Yes" : "Pending"}
          />
          {diary.message && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-slate-100">
              {diary.message}
            </div>
          )}
          {chainId && chainId !== 11155111 && chainId !== 31337 && (
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              ⚠️ Please switch to Sepolia testnet (Chain ID: 11155111) to use this application.
            </div>
          )}
          {fheError && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
              <strong>FHEVM Error:</strong> {fheError.message}
              <br />
              <small>Please check your wallet connection and try refreshing the page.</small>
            </div>
          )}
          {/* Enhanced error handling for FHEVM operations with user-friendly messages */}
        </div>

        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white">
            Privacy-preserving analytics pipeline
          </h3>
          <div className="space-y-4">
            {[
              {
                title: "1 · Mood Capture",
                detail:
                  "User selects a 1–5 score; no value leaves the browser unencrypted.",
              },
              {
                title: "2 · FHE Encryption",
                detail:
                  "Rainbow wallet signs the encrypted payload and generates proof for FHEVM.",
              },
              {
                title: "3 · Secure Aggregation",
                detail:
                  "Smart contract adds encrypted scores and recomputes the moving average with FHE.div.",
              },
              {
                title: "4 · Controlled Decryption",
                detail:
                  "Only wallets explicitly authorised via requestTrendHandle() can decrypt the average.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-sm text-slate-200">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-slate-200">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
