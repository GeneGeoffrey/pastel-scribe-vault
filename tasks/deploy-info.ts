import { task } from "hardhat/config";

task("deploy-info", "Display deployment information for all networks")
  .setAction(async (_, hre) => {
    const { deployments } = hre;

    console.log("🔐 Encrypted Mood Diary - Deployment Information");
    console.log("==============================================\n");

    // Get network information
    const network = hre.network.name;
    const chainId = hre.network.config.chainId;

    console.log(`Current Network: ${network} (Chain ID: ${chainId})`);
    console.log("----------------------------------------------");

    try {
      // Get deployment info
      const deployment = await deployments.get("EncryptedMoodDiary");
      const contractAddress = deployment.address;

      console.log(`✅ Contract deployed at: ${contractAddress}`);
      console.log(`📅 Deployed at block: ${deployment.receipt?.blockNumber}`);
      console.log(`🔍 Transaction hash: ${deployment.receipt?.transactionHash}`);

      // Display useful commands
      console.log("\n🚀 Useful Commands:");
      console.log("------------------");
      console.log(`Verify contract: npx hardhat verify --network ${network} ${contractAddress}`);
      console.log(`View on Etherscan: https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${contractAddress}`);

      // Environment variables for frontend
      console.log("\n🌐 Frontend Environment Variables:");
      console.log("----------------------------------");
      console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_${network.toUpperCase()}=${contractAddress}`);
      console.log(`NEXT_PUBLIC_DEFAULT_CHAIN_ID=${chainId}`);

    } catch (error) {
      console.log("❌ No deployment found for current network");
      console.log("Run 'npm run deploy:localhost' or 'npm run deploy:sepolia' first");
    }
  });
