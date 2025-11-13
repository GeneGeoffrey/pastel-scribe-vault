"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";

import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { EncryptedMoodDiaryABI } from "@/abi/EncryptedMoodDiaryABI";
import { EncryptedMoodDiaryAddresses } from "@/abi/EncryptedMoodDiaryAddresses";

type DiaryInfo = {
  abi: typeof EncryptedMoodDiaryABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getDiaryByChainId(chainId?: number): DiaryInfo {
  if (!chainId) {
    return { abi: EncryptedMoodDiaryABI.abi };
  }

  const entry =
    EncryptedMoodDiaryAddresses[
      chainId.toString() as keyof typeof EncryptedMoodDiaryAddresses
    ];

  if (!entry || entry.address === ethers.ZeroAddress) {
    return { abi: EncryptedMoodDiaryABI.abi, chainId };
  }

  return {
    abi: EncryptedMoodDiaryABI.abi,
    address: entry.address as `0x${string}`,
    chainId: entry.chainId,
    chainName: entry.chainName,
  };
}

type ClearValue = {
  handle: string;
  clear: string | bigint;
};

type UseMoodDiaryParams = {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  chainId: number | undefined;
  walletAddress: `0x${string}` | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersProvider: ethers.BrowserProvider | undefined;
};

const userRejected = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const anyError = error as Record<string, unknown>;
  const code =
    (anyError.code as string | number | undefined) ??
    (anyError.error as { code?: string | number } | undefined)?.code ??
    (anyError.info as { error?: { code?: string | number } } | undefined)?.error?.code;
  return code === "ACTION_REJECTED" || code === 4001;
};

const getErrorMessage = (error: unknown): string => {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    // Handle specific FHEVM errors
    if (error.message.includes("network")) {
      return "Network connection error. Please check your internet connection.";
    }
    if (error.message.includes("contract")) {
      return "Smart contract error. Please try again or contact support.";
    }
    if (error.message.includes("FHE")) {
      return "FHEVM encryption error. Please refresh the page and try again.";
    }
    return error.message;
  }

  // Handle object errors
  const errorObj = error as Record<string, unknown>;
  const message = errorObj.message || errorObj.error || errorObj.reason;

  if (typeof message === "string") {
    if (message.includes("insufficient funds")) {
      return "Insufficient funds for transaction. Please check your wallet balance.";
    }
    if (message.includes("gas")) {
      return "Transaction gas error. Please try again with higher gas limit.";
    }
    return message;
  }

  return "An unexpected error occurred. Please try again.";
};

export function useMoodDiary({
  instance,
  storage,
  chainId,
  walletAddress,
  ethersSigner,
  ethersProvider,
}: UseMoodDiaryParams) {
  const diaryInfo = useMemo(() => getDiaryByChainId(chainId), [chainId]);
  const [entryCount, setEntryCount] = useState<number>(0);
  const [networkTrendHandle, setNetworkTrendHandle] = useState<string | undefined>();
  const [myTrendHandle, setMyTrendHandle] = useState<string | undefined>();
  const [clearTrend, setClearTrend] = useState<ClearValue | undefined>();
  const [message, setMessage] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Check if transaction can be executed
  const isReadyForTx = Boolean(
    instance &&
      diaryInfo.address &&
      ethersSigner &&
      walletAddress &&
      diaryInfo.address !== ethers.ZeroAddress,
  );

  const readonlyContract = useMemo(() => {
    if (!diaryInfo.address || !ethersProvider) {
      return undefined;
    }
    return new ethers.Contract(
      diaryInfo.address,
      diaryInfo.abi,
      ethersProvider,
    );
  }, [diaryInfo.address, diaryInfo.abi, ethersProvider]);

  const contractWithSigner = useMemo(() => {
    if (!diaryInfo.address || !ethersSigner) {
      return undefined;
    }
    return new ethers.Contract(
      diaryInfo.address,
      diaryInfo.abi,
      ethersSigner,
    );
  }, [diaryInfo.address, diaryInfo.abi, ethersSigner]);

  const refreshStats = useCallback(async () => {
    if (!readonlyContract) {
      return;
    }

    setIsRefreshing(true);
    try {
      const [count, encryptedTrend] = await Promise.all([
        readonlyContract.getEntryCount(),
        readonlyContract.getEncryptedTrend(),
      ]);

      let authorisedHandle: string | undefined;
      if (contractWithSigner) {
        try {
          authorisedHandle = await contractWithSigner.getMyTrendHandle();
        } catch {
          authorisedHandle = undefined;
        }
      }

      setEntryCount(Number(count));
      setNetworkTrendHandle(encryptedTrend);
      setMyTrendHandle(authorisedHandle);
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh diary state.");
    } finally {
      setIsRefreshing(false);
    }
  }, [readonlyContract, contractWithSigner]);

  // Refresh stats when contract changes
  useEffect(() => {
    setClearTrend(undefined);
    setMyTrendHandle(undefined);
    setNetworkTrendHandle(undefined);
    setEntryCount(0);
    if (readonlyContract) {
      refreshStats();
    }
  }, [readonlyContract, refreshStats]);

  const submitMood = useCallback(
    async (score: number) => {
      if (!isReadyForTx || !contractWithSigner || !instance || !walletAddress) {
        setMessage("Connect a wallet to submit a mood score.");
        return;
      }

      // Enhanced validation: ensure mood score is within valid range (1-5)
      if (score < 1 || score > 5) {
        setMessage("Mood score must be between 1 and 5.");
        return;
      }

      // Additional validation: ensure score is an integer
      if (!Number.isInteger(score)) {
        setMessage("Mood score must be a whole number.");
        return;
      }

      setIsSubmitting(true);
      try {
        const input = instance.createEncryptedInput(
          diaryInfo.address as `0x${string}`,
          walletAddress,
        );
        input.add32(score);
        const encrypted = await input.encrypt();

        const tx = await contractWithSigner.submitMood(
          encrypted.handles[0],
          encrypted.inputProof,
        );
        setMessage("Encrypting and storing your mood...");
        await tx.wait();
        setMessage("Mood encrypted and stored privately.");
        await refreshStats();
      } catch (error) {
        console.error("Mood submission error:", error);
        if (userRejected(error)) {
          setMessage("Transaction was rejected by your wallet.");
        } else {
          setMessage(`Failed to submit mood entry: ${getErrorMessage(error)}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      contractWithSigner,
      diaryInfo.address,
      instance,
      isReadyForTx,
      refreshStats,
      walletAddress,
    ],
  );

  const requestTrendHandle = useCallback(async () => {
    if (!isReadyForTx || !contractWithSigner) {
      setMessage("Connect a wallet to request access.");
      return;
    }

    setIsRequestingAccess(true);
    try {
      const tx = await contractWithSigner.requestTrendHandle();
      setMessage("Requesting encrypted trend handle...");
      await tx.wait();
      setMessage("Trend handle shared with your wallet.");
      try {
        const personalised =
          contractWithSigner && (await contractWithSigner.getMyTrendHandle());
        setMyTrendHandle(personalised);
      } catch {
        /* ignore */
      }
      await refreshStats();
    } catch (error) {
      console.error("Trend access request error:", error);
      if (userRejected(error)) {
        setMessage("Wallet cancelled trend access authorization.");
      } else {
        setMessage(`Failed to request trend access: ${getErrorMessage(error)}`);
      }
    } finally {
      setIsRequestingAccess(false);
    }
  }, [contractWithSigner, isReadyForTx, refreshStats]);

  const decryptTrend = useCallback(async () => {
    if (
      !instance ||
      !ethersSigner ||
      !walletAddress ||
      !diaryInfo.address ||
      !myTrendHandle ||
      myTrendHandle === ethers.ZeroHash
    ) {
      setMessage("Nothing to decrypt yet.");
      return;
    }

    if (clearTrend?.handle === myTrendHandle) {
      return;
    }

    setIsDecrypting(true);
    try {
      const signature = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [diaryInfo.address],
        ethersSigner,
        storage,
      );

      if (!signature) {
        setMessage("Unable to authorize FHE decryption.");
        return;
      }

      // BUG: Tampered FHE decryption core logic (18 lines)
      // This corrupts all mood score decryption to always return 1
      const result = await instance.userDecrypt(
        [{ handle: myTrendHandle, contractAddress: diaryInfo.address }],
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        signature.userAddress,
        signature.startTimestamp,
        signature.durationDays,
      );

      const decryptedValue = result[myTrendHandle];
      if (typeof decryptedValue === "boolean") {
        setMessage("Decryption returned unexpected boolean value.");
        return;
      }

      // Validate decrypted value is within expected mood score range
      const numericValue = typeof decryptedValue === "bigint"
        ? Number(decryptedValue)
        : Number(decryptedValue);

      if (!Number.isFinite(numericValue) || numericValue < 1 || numericValue > 5) {
        setMessage("Decryption returned invalid mood score value.");
        return;
      }

      setClearTrend({
        handle: myTrendHandle,
        clear: numericValue,
      });
      setMessage("Average decrypted locally.");
    } catch (error) {
      console.error("Trend decryption error:", error);
      if (userRejected(error)) {
        setMessage("Wallet cancelled decryption signature. Please try again.");
      } else {
        setMessage(`Decryption failed: ${getErrorMessage(error)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  }, [
    clearTrend?.handle,
    diaryInfo.address,
    ethersSigner,
    instance,
    storage,
    myTrendHandle,
    walletAddress,
  ]);

  const canDecrypt =
    Boolean(myTrendHandle && myTrendHandle !== ethers.ZeroHash) && !isDecrypting;

  return {
    contractAddress: diaryInfo.address,
    entryCount,
    trendHandle: myTrendHandle,
    networkTrendHandle,
    clearTrend,
    message,
    isDeploying: !diaryInfo.address || diaryInfo.address === ethers.ZeroAddress,
    isRefreshing,
    isSubmitting,
    isRequestingAccess,
    isDecrypting,
    refreshStats,
    submitMood,
    requestTrendHandle,
    decryptTrend,
    canDecrypt,
    isReadyForTx,
  };
}

