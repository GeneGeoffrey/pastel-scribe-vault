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
  {
    score: 1,
    label: "Stormy",
    tone: "Anxious or drained",
    emoji: "⛈️",
    colorClass: "mood-1",
    description: "Feeling overwhelmed or exhausted"
  },
  {
    score: 2,
    label: "Cloudy",
    tone: "Low energy",
    emoji: "☁️",
    colorClass: "mood-2",
    description: "A bit down or unfocused"
  },
  {
    score: 3,
    label: "Calm",
    tone: "Balanced baseline",
    emoji: "🌤️",
    colorClass: "mood-3",
    description: "Steady and content"
  },
  {
    score: 4,
    label: "Bright",
    tone: "Motivated",
    emoji: "☀️",
    colorClass: "mood-4",
    description: "Positive and driven"
  },
  {
    score: 5,
    label: "Radiant",
    tone: "Joyful & energized",
    emoji: "✨",
    colorClass: "mood-5",
    description: "Exceptionally happy and vibrant"
  },
];

const MOOD_TAGS = [
  { id: 'work', label: 'Work', emoji: '💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦', color: 'bg-green-100 text-green-700' },
  { id: 'health', label: 'Health', emoji: '🏥', color: 'bg-red-100 text-red-700' },
  { id: 'social', label: 'Social', emoji: '👥', color: 'bg-purple-100 text-purple-700' },
  { id: 'personal', label: 'Personal', emoji: '🧘', color: 'bg-orange-100 text-orange-700' },
  { id: 'finance', label: 'Finance', emoji: '💰', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'environment', label: 'Environment', emoji: '🏠', color: 'bg-gray-100 text-gray-700' },
  { id: 'other', label: 'Other', emoji: '🤔', color: 'bg-slate-100 text-slate-700' }
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
    ...(mockChains && { initialMockChains: mockChains }),
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

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
    <div className="flex flex-col gap-12 py-8 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-500/10 blur-xl"></div>
        <div className="floating-element absolute top-40 right-20 w-24 h-24 rounded-full bg-blue-500/10 blur-xl"></div>
        <div className="floating-element absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-green-500/10 blur-xl"></div>
      </div>

      {/* Hero Section with Enhanced Design */}
      <section className="glass-card-emotional p-8 md:p-12 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 status-online"></div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 font-medium">
              Encrypted Mood Diary · Zama FHEVM
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight gradient-text mb-6">
            Capture your daily emotions in a fully encrypted diary.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-4xl leading-relaxed mb-8">
            Every score is encrypted locally, aggregated privately on-chain, and
            decrypted only when you explicitly request access. Build privacy
            compliant well-being analytics without exposing personal emotions.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Fully Homomorphic Encryption", icon: "🔐" },
              { label: "Rainbow Wallet Ready", icon: "🌈" },
              { label: "Secure Aggregation", icon: "📊" },
              { label: "Decrypt On Demand", icon: "🔓" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/90 px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-300/70 transition-colors cursor-default shadow-sm"
              >
                <span className="text-base">{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced responsive layout for mood diary interface with improved mobile experience */}
        <div className="glass-card-emotional p-6 sm:p-8 lg:col-span-2 space-y-6 sm:space-y-8">
          <header className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌟</span>
                <p className="text-sm uppercase tracking-[0.4em] text-violet-600 font-medium">
                  Daily check-in
                </p>
              </div>
              <h2 className="text-3xl font-bold text-slate-800">
                How are you feeling today?
              </h2>
              <p className="text-slate-600 text-sm">
                Your emotions are encrypted and private
              </p>
            </div>
            <button
              onClick={diary.refreshStats}
              disabled={diary.isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/50 bg-white/80 text-sm font-medium text-slate-600 hover:text-slate-800 hover:border-slate-300/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              <span className="text-base">🔄</span>
              Refresh
            </button>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" role="radiogroup" aria-label="Mood selection">
            {MOOD_LABELS.map((mood) => (
              <button
                key={mood.score}
                onClick={() => setSelectedMood(mood.score)}
                onKeyDown={(e) => {
                  if (e.key >= '1' && e.key <= '5') {
                    setSelectedMood(parseInt(e.key));
                  }
                }}
                aria-label={`Select mood: ${mood.label} - ${mood.description}`}
                className={clsx(
                  "mood-button flex flex-col items-center rounded-3xl border-2 px-6 py-5 text-center transition-all duration-300 focus-ring group",
                  selectedMood === mood.score
                    ? "border-slate-300 bg-white/90 text-slate-800 selected scale-105 shadow-lg"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white/90 hover:scale-102 hover:shadow-md",
                )}
                style={{
                  background: selectedMood === mood.score
                    ? `var(--mood-${mood.score}-bg)`
                    : undefined,
                  borderColor: selectedMood === mood.score
                    ? `var(--mood-${mood.score}-border)`
                    : undefined,
                }}
              >
                <span className="text-3xl mb-2">{mood.emoji}</span>
                <span className="text-xl font-bold mb-1">{mood.score}</span>
                <span className="text-sm font-semibold mb-2">{mood.label}</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                  {mood.tone}
                </span>
              </button>
            ))}
          </div>

          {/* Tags Selection */}
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-medium">What influenced your mood? (Optional)</p>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.id)
                        ? prev.filter(id => id !== tag.id)
                        : [...prev, tag.id]
                    );
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-ring ${
                    selectedTags.includes(tag.id)
                      ? `${tag.color} ring-2 ring-slate-400 ring-offset-1`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-base">{tag.emoji}</span>
                  {tag.label}
                  {selectedTags.includes(tag.id) && (
                    <span className="ml-1 text-xs">×</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => diary.submitMood(selectedMood)}
              disabled={!diary.isReadyForTx || diary.isSubmitting}
              className="btn-emotional inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-bold text-slate-800 shadow-2xl transition-all duration-300 hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-40 w-full sm:w-auto relative overflow-hidden group"
            >
              {diary.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-800 border-t-transparent mr-3"></div>
                  <span className="relative z-10">🔐 Encrypting your mood...</span>
                </>
              ) : (
                <>
                  <span className="text-xl mr-3">🔒</span>
                  <span className="relative z-10">Save Encrypted Mood{selectedTags.length > 0 ? ` + ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}` : ''}</span>
                </>
              )}
              {!diary.isSubmitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-blue-50/80 rounded-xl p-4 border border-blue-200/50">
              <span className="text-blue-500">🛡️</span>
              <p>
                Your wallet signs the entry; the clear score never leaves your device.
                All data is fully homomorphically encrypted.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card-emotional p-6 space-y-6" aria-live="polite">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 emotional-pulse"></div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-500 font-medium">
                Aggregated Insight
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-5xl font-bold gradient-text">
                {decryptedAverage ?? "•••"}
              </h3>
              <p className="text-slate-600">
                Average mood trend across <span className="text-slate-800 font-semibold">{diary.entryCount}</span> encrypted entries
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-50/80 p-5 text-sm backdrop-blur-sm shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="text-base">📊</span>
                Entries recorded
              </span>
              <span className="font-bold text-slate-800 text-lg">{diary.entryCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="text-base">🔑</span>
                Encrypted handle
              </span>
              <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded border">
                {displayedHandle
                  ? `${displayedHandle.slice(0, 6)}…${displayedHandle.slice(-4)}`
                  : "0x0000...0000"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={diary.requestTrendHandle}
              disabled={!diary.isReadyForTx || diary.isRequestingAccess}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-purple-300/60 bg-purple-100/80 px-6 py-4 text-sm font-bold text-purple-700 transition-all duration-300 hover:border-purple-400/70 hover:bg-purple-200/80 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus-ring"
            >
              {diary.isRequestingAccess ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-200 border-t-transparent"></div>
                  <span>🔄 Sharing handle...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">📤</span>
                  <span>Share Trend to Wallet</span>
                </>
              )}
            </button>
            <button
              onClick={diary.decryptTrend}
              disabled={!diary.canDecrypt}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-green-300/60 bg-green-100/80 px-6 py-4 text-sm font-bold text-green-700 transition-all duration-300 hover:border-green-400/70 hover:bg-green-200/80 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 focus-ring"
            >
              {diary.isDecrypting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-200 border-t-transparent"></div>
                  <span>🔓 Decrypting...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🔑</span>
                  <span>Decrypt Average</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-1">Privacy Reminder</p>
                <p>Handles must be explicitly refreshed for every wallet after new entries land. Use &ldquo;Share trend to wallet&rdquo; whenever you need the latest average.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card-emotional p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚙️</span>
            <h3 className="text-xl font-bold text-slate-800">
              System Status & Telemetry
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatusRow label="FHEVM Runtime" value={fheStatus} status={fheStatus === 'ready' ? 'online' : 'loading'} />
            <StatusRow
              label="Wallet Status"
              value={
                isConnected
                  ? `Connected · ${address?.slice(0, 6)}…${address?.slice(-4)}`
                  : accountStatus === "connecting"
                    ? "Connecting..."
                    : "Not connected"
              }
              status={isConnected ? 'online' : accountStatus === "connecting" ? 'loading' : 'offline'}
            />
            <StatusRow
              label="Active Chain"
              value={chainId ? `Chain ID ${chainId}` : "Unknown"}
              status={chainId ? 'online' : 'offline'}
            />
            <StatusRow
              label="Contract Address"
              value={
                diary.contractAddress
                  ? `${diary.contractAddress.slice(0, 10)}…`
                  : "Not deployed"
              }
              status={diary.contractAddress ? 'online' : 'offline'}
            />
            <StatusRow
              label="Encrypted Handle"
              value={diary.trendHandle ? "Ready" : "Pending"}
              status={diary.trendHandle ? 'online' : 'pending'}
            />
          </div>

          {diary.message && (
            <div className="rounded-2xl border border-blue-200/50 bg-blue-50/80 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">💬</span>
                <span className="font-medium text-slate-800">System Message</span>
              </div>
              {diary.message}
            </div>
          )}

          {chainId && chainId !== 11155111 && chainId !== 31337 && (
            <div className="rounded-2xl border border-yellow-200/50 bg-yellow-50/80 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="font-medium text-slate-800">Network Warning</span>
              </div>
              Please switch to Sepolia testnet (Chain ID: 11155111) to use this application.
            </div>
          )}

          {fheError && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/80 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600">❌</span>
                <span className="font-medium text-slate-800">FHEVM Error</span>
              </div>
              <p className="mb-2">{fheError.message}</p>
              <p className="text-xs opacity-80">Please check your wallet connection and try refreshing the page.</p>
            </div>
          )}
        </div>

        <div className="glass-card-emotional p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔒</span>
            <h3 className="text-xl font-bold text-slate-800">
              Privacy-Preserving Analytics Pipeline
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Mood Capture",
                detail: "User selects a 1–5 score; no value leaves the browser unencrypted.",
                icon: "🎭",
                color: "from-purple-500/20 to-purple-600/20",
              },
              {
                step: "2",
                title: "FHE Encryption",
                detail: "Rainbow wallet signs the encrypted payload and generates proof for FHEVM.",
                icon: "🔐",
                color: "from-blue-500/20 to-blue-600/20",
              },
              {
                step: "3",
                title: "Secure Aggregation",
                detail: "Smart contract adds encrypted scores and recomputes the moving average with FHE.div.",
                icon: "⚡",
                color: "from-green-500/20 to-green-600/20",
              },
              {
                step: "4",
                title: "Controlled Decryption",
                detail: "Only wallets explicitly authorised via requestTrendHandle() can decrypt the average.",
                icon: "🗝️",
                color: "from-orange-500/20 to-orange-600/20",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200/50 bg-gradient-to-r from-white/90 to-slate-50/80 p-5 hover:border-slate-300/60 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/60 text-xs font-bold text-slate-700 border border-slate-300/50">
                        {item.step}
                      </span>
                      <p className="text-lg font-bold text-slate-800">{item.title}</p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="absolute left-6 top-full w-px h-4 bg-gradient-to-b from-slate-300/40 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mood Calendar Section */}
      <section className="glass-card-emotional p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <h3 className="text-xl font-bold text-slate-800">
              Mood History Calendar
            </h3>
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors focus-ring"
          >
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
        </div>

        {showCalendar && (
          <div className="space-y-4">
            <MoodCalendar />
          </div>
        )}
      </section>
    </div>
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status?: 'online' | 'offline' | 'loading' | 'pending' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'loading': return 'bg-blue-400 status-loading';
      case 'pending': return 'bg-yellow-400';
      case 'offline': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50/50 rounded-lg p-2">
      <span className="text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {status && (
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        )}
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function MoodCalendar() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days for current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

  // Mock mood data for demonstration (in real app, this would come from the diary)
  const generateMockMoodData = () => {
    const moodData: { [key: number]: number } = {};
    // Add some random mood entries for the last 10 days
    for (let i = 1; i <= Math.min(10, daysInMonth); i++) {
      if (Math.random() > 0.3) { // 70% chance of having a mood entry
        moodData[i] = Math.floor(Math.random() * 5) + 1;
      }
    }
    // Add today's mood if not already present
    if (!moodData[currentDate.getDate()]) {
      moodData[currentDate.getDate()] = 3; // Default neutral mood
    }
    return moodData;
  };

  const moodData = generateMockMoodData();

  const getMoodColor = (mood: number) => {
    const colors = {
      1: 'bg-red-200 border-red-300',
      2: 'bg-orange-200 border-orange-300',
      3: 'bg-blue-200 border-blue-300',
      4: 'bg-green-200 border-green-300',
      5: 'bg-purple-200 border-purple-300'
    };
    return colors[mood as keyof typeof colors] || 'bg-gray-100 border-gray-200';
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = {
      1: '⛈️',
      2: '☁️',
      3: '🌤️',
      4: '☀️',
      5: '✨'
    };
    return emojis[mood as keyof typeof emojis] || '❓';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-slate-800">
          {monthNames[currentMonth]} {currentYear}
        </h4>
        <p className="text-sm text-slate-600 mt-1">
          Your mood journey this month
        </p>
      </div>

      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }, (_, day) => {
          const dayNumber = day + 1;
          const hasMood = moodData[dayNumber];
          const isToday = dayNumber === currentDate.getDate();

          return (
            <div
              key={dayNumber}
              className={`
                aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all duration-200
                ${hasMood
                  ? getMoodColor(hasMood)
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }
                ${isToday ? 'ring-2 ring-slate-400 ring-offset-1' : ''}
              `}
            >
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">{dayNumber}</div>
                {hasMood && (
                  <div className="text-lg">
                    {getMoodEmoji(hasMood)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-4 h-4 rounded border-2 bg-white border-slate-200"></div>
          <span>No entry</span>
        </div>
        {MOOD_LABELS.slice(0, 5).map(mood => (
          <div key={mood.score} className="flex items-center gap-2 text-sm text-slate-600">
            <div className={`w-4 h-4 rounded border-2 ${getMoodColor(mood.score).replace('border-', 'border-').replace('bg-', 'bg-')}`}></div>
            <span>{mood.emoji} {mood.label}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-500 mt-4">
        💡 This is a preview calendar. Full functionality will include your actual mood history.
      </div>
    </div>
  );
}
