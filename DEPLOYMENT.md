# Encrypted Mood Diary - Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Encrypted Mood Diary application to various environments.

## Prerequisites

- Node.js 20+
- npm 7.0.0+
- Hardhat
- MetaMask or Rainbow Wallet (for testing)
- Sepolia testnet ETH (for deployment)

## Network Configuration

### Supported Networks

- **Sepolia Testnet** (Recommended for production testing)
- **Localhost** (For development)

### Environment Setup

1. Copy the configuration template:
   ```bash
   cp config.example.json config.json
   ```

2. Update `config.json` with your network settings:
   ```json
   {
     "networks": {
       "sepolia": {
         "contractAddress": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
         "rpcUrl": "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
       }
     }
   }
   ```

## Contract Deployment

### Automated Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to localhost
npm run deploy:localhost

# Full deployment (contract + frontend)
npm run full-deploy
```

### Manual Deployment

1. Compile contracts:
   ```bash
   npm run compile
   ```

2. Run deployment script:
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

3. Verify contract on Etherscan:
   ```bash
   npm run verify:sepolia
   ```

## Frontend Deployment

### Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=0x...
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
   ```

3. Deploy automatically on push to main branch

### Manual Frontend Build

```bash
cd frontend
npm install
npm run build
npm run start
```

## Testing

### Run Test Suite

```bash
# Run all tests
npm test

# Run tests on Sepolia
npm run test:sepolia

# Generate coverage report
npm run coverage
```

### Manual Testing Checklist

- [ ] Contract deploys successfully
- [ ] Frontend connects to wallet
- [ ] Mood submission works
- [ ] Trend decryption functions
- [ ] Error handling works properly

## Troubleshooting

### Common Issues

1. **FHEVM Initialization Failed**
   - Ensure you're using Sepolia testnet
   - Check wallet connection

2. **Contract Deployment Failed**
   - Verify sufficient testnet ETH balance
   - Check network configuration

3. **Frontend Build Failed**
   - Run `npm install` in frontend directory
   - Check Node.js version compatibility

### Support

For issues not covered here, please check:
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Security Considerations

- Never commit private keys to version control
- Use environment variables for sensitive configuration
- Test thoroughly on testnet before mainnet deployment
- Implement proper access controls in production
