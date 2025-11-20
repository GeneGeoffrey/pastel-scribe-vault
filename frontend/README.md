# Encrypted Mood Diary – Frontend

This Next.js application provides the RainbowKit-powered dashboard for the
Encrypted Mood Diary MVP. It runs alongside the Hardhat project in the repo
root and showcases a complete client workflow:

1. Encrypt a 1–5 mood score with the FHEVM SDK.
2. Send the encrypted payload through RainbowKit/wagmi.
3. Request the aggregated trend handle.
4. Decrypt the shared handle locally.

## Requirements

- Node.js 20+
- A WalletConnect project ID (needed by RainbowKit). You can create one for
  free at [cloud.walletconnect.com](https://cloud.walletconnect.com/).
- A wallet supported by RainbowKit (Rainbow, MetaMask, Coinbase Wallet, etc.).

## Setup

```bash
cd frontend
npm install

# Create .env.local with your WalletConnect project id
echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=00000000000000000000000000000000" > .env.local

# Ensure the Hardhat contracts are deployed (localhost or Sepolia)
cd ..
npx hardhat deploy --network localhost
```

## Development server

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 and connect a wallet via the “Rainbow Wallet
Access” button. The UI mirrors the MVP acceptance criteria:

- Daily mood capture card with encrypted submissions.
- Aggregated trend card with request/decrypt controls.
- Status + telemetry of FHEVM runtime, chain, and contract.
- Narrative of the encryption pipeline for stakeholder review.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js with turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production bundle |
| `npm run lint` | Run Next.js linting |
| `npm run genabi` | Copy ABI/addresses from the Hardhat project |

## Key files

- `hooks/useRainbowSigner.ts` – adapts RainbowKit’s wallet client into an
  `ethers.JsonRpcSigner`.
- `hooks/useMoodDiary.tsx` – end-to-end orchestration (encrypt, submit, request,
  decrypt) built on top of `useFhevm`.
- `app/page.tsx` – the UX layers matching the @zama-9 reference flows.

## Troubleshooting

- **Handles decrypt to zero hashes** – ensure you clicked “Share trend to
  wallet” before decrypting; the contract only allows wallets that either
  submitted an entry or explicitly requested access.
- **RainbowKit cannot connect** – double-check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  was populated and restart `npm run dev`.
- **ABI mismatch** – rerun `npm run genabi` after redeploying the contract.
