# Encrypted Mood Diary - FHEVM Application

A privacy-preserving mood tracking application built with Fully Homomorphic Encryption (FHEVM). Capture your daily emotions in a fully encrypted diary where only you can decrypt your personal mood trends.

## 🚀 Live Demo

**Application URL:** [https://diarywen-chi.vercel.app/](https://diarywen-chi.vercel.app/)

**Demo Video:** [Watch the demonstration](./daliy.mp4)

🎬 **Video Overview:** This demonstration video showcases the complete user journey:
- Wallet connection and network setup
- Mood score encryption and submission
- Trend calculation and decryption
- Privacy-preserving analytics features

## 📋 Features

- **🔒 Fully Encrypted Storage**: All mood scores are encrypted using FHEVM before leaving your browser
- **📊 Private Analytics**: Compute mood trends on-chain without exposing individual entries
- **🎭 Mood Scale**: 1-5 point scale with descriptive mood labels (Stormy, Cloudy, Calm, Bright, Radiant)
- **🔑 Selective Decryption**: Only authorized wallets can decrypt trend data
- **🌐 Rainbow Wallet Integration**: Seamless Web3 wallet connection
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity 0.8.24, FHEVM (@fhevm/solidity)
- **Web3**: RainbowKit, Wagmi, Viem, Ethers v6
- **Blockchain**: Sepolia Testnet
- **Deployment**: Vercel

## 🎯 Smart Contract

**Network:** Sepolia Testnet
**Contract Address:** `0xf7B6A78531eA4e1a9726D39f56997884db1C0486`
**Contract:** [EncryptedMoodDiary.sol](./contracts/EncryptedMoodDiary.sol)

### Key Functions:
- `submitMood()`: Submit encrypted mood scores (1-5 scale)
- `requestTrendHandle()`: Request access to decrypt trend data
- `getEncryptedTrend()`: Get encrypted moving average
- `canDecryptTrend()`: Check decryption permissions

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 7.0.0+
- MetaMask or Rainbow Wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GeneGeoffrey/pastel-scribe-vault.git
   cd pastel-scribe-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Configure environment**
   ```bash
   # Set up your wallet and network in MetaMask
   # Connect to Sepolia testnet
   ```

4. **Run locally**
   ```bash
   # Start Hardhat node (for local testing)
   npm run test

   # Start frontend (production mode)
   cd frontend && npm run dev
   ```

### Deployment

1. **Deploy smart contract**
   ```bash
   npm run compile
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

2. **Deploy frontend**
   ```bash
   cd frontend
   npm run build
   npm run start
   ```

## 🎮 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and select Rainbow Wallet
2. **Select Mood**: Choose from 5 mood levels (1-5) with descriptive labels
3. **Submit Encrypted**: Your mood is encrypted locally and submitted to the blockchain
4. **View Trends**: Request access to decrypt your personal mood trends
5. **Track Progress**: Monitor your emotional well-being over time

## 🔐 Privacy & Security

- **Zero-Knowledge**: Mood scores never leave your browser in plain text
- **Homomorphic Encryption**: Computations happen on encrypted data
- **Selective Access**: Only you can decrypt your own trend data
- **Blockchain Transparency**: All operations are publicly verifiable

## 📖 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Smart Contract│    │   FHEVM Oracle  │
│   (Encryption)  │───▶│   (Computation) │───▶│   (Decryption)  │
│                 │    │                 │    │                 │
│ • Mood Selection│    │ • Encrypted Sum │    │ • Trend Access  │
│ • FHE Encryption│    │ • Moving Average│    │ • Proof Verification│
│ • Proof Generation│   │ • Access Control│   │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🤝 Contributing

This project demonstrates collaborative development between UI and smart contract teams:

- **UI Team** (GeneGeoffrey): Frontend development, user experience, responsive design
- **Smart Contract Team** (DaisyHalifax): Solidity contracts, FHEVM integration, security

## 📚 API Reference

### Smart Contract Functions

#### `submitMood(externalEuint32 encryptedScore, bytes calldata inputProof) external`

Submits an encrypted mood score to the diary.

**Parameters:**
- `encryptedScore`: FHE-encrypted euint32 handle representing mood score (1-5)
- `inputProof`: ZK proof generated during encryption

**Events Emitted:**
- `MoodSubmitted(address indexed author, uint32 indexed entryNumber)`

#### `requestTrendHandle() external returns (euint32)`

Requests access to decrypt the current encrypted trend.

**Returns:**
- `euint32`: Encrypted handle for trend decryption

**Requirements:**
- Diary must have at least one entry
- Caller must have submitted mood entries

**Events Emitted:**
- `TrendAccessed(address indexed accessor, uint32 entryCount)`

#### `canDecryptTrend() external view returns (bool)`

Checks if the caller can decrypt trend data.

**Returns:**
- `bool`: True if caller has decryption permissions

#### `getEntryCount() external view returns (uint32)`

Returns the total number of mood entries submitted.

**Returns:**
- `uint32`: Total entry count

#### `getEncryptedTrend() external view returns (euint32)`

Returns the encrypted moving average trend.

**Returns:**
- `euint32`: Encrypted trend handle

### Frontend Hooks

#### `useMoodDiary()`

Main hook for mood diary operations.

**Returns:**
```typescript
{
  contractAddress: string | undefined;
  entryCount: number;
  trendHandle: string | undefined;
  clearTrend: ClearValue | undefined;
  message: string;
  isReadyForTx: boolean;
  isSubmitting: boolean;
  isRequestingAccess: boolean;
  isDecrypting: boolean;
  submitMood: (score: number) => Promise<void>;
  requestTrendHandle: () => Promise<void>;
  decryptTrend: () => Promise<void>;
  canDecrypt: boolean;
}
```

## 🔧 Development

### Project Structure

```
pastel-scribe-vault/
├── contracts/              # Solidity smart contracts
│   └── EncryptedMoodDiary.sol
├── frontend/               # Next.js application
│   ├── app/               # Next.js app router
│   ├── components/        # Reusable UI components
│   ├── fhevm/            # FHEVM integration
│   └── hooks/            # React hooks
├── scripts/               # Deployment scripts
├── tasks/                # Hardhat tasks
├── test/                 # Test files
└── types/                # TypeScript type definitions
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111

# Development
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false
NODE_ENV=development
```

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:sepolia

# Coverage report
npm run coverage
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format code
npm run prettier:write

# Type check
npm run build:ts
```

## 🚨 Troubleshooting

### Common Issues

#### Wallet Connection Issues
- Ensure MetaMask or Rainbow Wallet is installed
- Check that you're connected to Sepolia testnet
- Verify wallet permissions

#### FHEVM Errors
- Make sure you're using a supported browser
- Check network connectivity
- Verify FHEVM runtime is properly initialized

#### Contract Interaction Errors
- Confirm contract is deployed and address is correct
- Check wallet has sufficient ETH for gas fees
- Verify transaction parameters

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with proper commit messages
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Add JSDoc comments for public APIs

## 📊 Performance

### Gas Optimization

The contract implements several gas optimization techniques:
- Using `unchecked` blocks for arithmetic operations
- Efficient FHE permission management
- Optimized storage patterns

### Frontend Performance

- Code splitting with Next.js
- Optimized bundle size
- Efficient re-rendering with React hooks

## 🔒 Security

### Smart Contract Security

- Input validation for all public functions
- Access control checks
- Overflow protection
- FHE encryption verification

### Frontend Security

- TypeScript for type safety
- Input sanitization
- Secure wallet integration
- No sensitive data in local storage

## 📈 Roadmap

### Upcoming Features

- [ ] Multi-network support (Mainnet, Polygon, etc.)
- [ ] Advanced analytics dashboard
- [ ] Mood prediction algorithms
- [ ] Social sharing (privacy-preserving)
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom mood scales

### Technical Improvements

- [ ] Gas optimization for bulk operations
- [ ] Improved error messages
- [ ] Better offline support
- [ ] Enhanced accessibility
- [ ] Performance monitoring

## 📞 Support

### Getting Help

- **Documentation**: [Full API Docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/GeneGeoffrey/pastel-scribe-vault/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GeneGeoffrey/pastel-scribe-vault/discussions)

### Community

- **Discord**: Join our community server
- **Twitter**: Follow for updates
- **Blog**: Technical deep-dives and tutorials

## 📄 License

BSD-3-Clause-Clear License

See [LICENSE](./LICENSE) for full license text.

## 🙏 Acknowledgments

- **Zama** for the FHEVM technology
- **Rainbow** for the wallet integration
- **OpenZeppelin** for security patterns
- **Next.js** team for the amazing framework

## 🔗 Links

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama FHEVM](https://www.zama.ai/fhevm)
- [Rainbow Wallet](https://rainbow.me/)
- [Sepolia Testnet](https://sepolia.dev/)
- [Next.js](https://nextjs.org/)
- [Hardhat](https://hardhat.org/)

---

**Contributors:**
- **GeneGeoffrey** (UI/Frontend) - [@ggejqkru7941098](mailto:ggejqkru7941098@outlook.com)
- **DaisyHalifax** (Smart Contracts) - [@jtaap439664](mailto:jtaap439664@outlook.com)

**Last updated:** 2025-11-19