import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedMoodDiary";

task("task:address", "Prints the EncryptedMoodDiary address").setAction(async (_args, hre) => {
  const diary = await hre.deployments.get(CONTRACT_NAME);
  console.log(`${CONTRACT_NAME} address is ${diary.address}`);
});

task("task:stats", "Shows encrypted stats and entry count")
  .addOptionalParam("address", "Optionally specify the contract address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const diaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get(CONTRACT_NAME);

    const diary = await ethers.getContractAt(CONTRACT_NAME, diaryDeployment.address);
    const count = await diary.getEntryCount();
    const encryptedTrend = await diary.getEncryptedTrend();
    console.log(`Entry count            : ${count}`);
    console.log(`Encrypted average handle: ${encryptedTrend}`);
  });

task("task:submit-mood", "Encrypts a mood score (1-5) and records it on-chain")
  .addParam("value", "Mood score between 1 and 5")
  .addOptionalParam("address", "Optionally specify the contract address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const score = Number(taskArguments.value);

    // Validate mood score range
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Mood score must be an integer between 1 and 5");
    }

    await fhevm.initializeCLIApi();

    const diaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const diary = await ethers.getContractAt(CONTRACT_NAME, diaryDeployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(diaryDeployment.address, signer.address)
      .add32(score)
      .encrypt();

    const tx = await diary
      .connect(signer)
      .submitMood(encryptedInput.handles[0], encryptedInput.inputProof);
    console.log(`Waiting for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`submitMood(${score}) status=${receipt?.status}`);
  });

task("task:decrypt-trend", "Requests permission and decrypts the latest average mood")
  .addOptionalParam("address", "Optionally specify the contract address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const diaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get(CONTRACT_NAME);

    const [signer] = await ethers.getSigners();
    const diary = await ethers.getContractAt(CONTRACT_NAME, diaryDeployment.address);

    const tx = await diary.connect(signer).requestTrendHandle();
    console.log(`requestTrendHandle tx:${tx.hash}...`);
    await tx.wait();

    const encryptedTrend = await diary.getEncryptedTrend();
    if (encryptedTrend === ethers.ZeroHash) {
      console.log("No entries recorded yet.");
      return;
    }

    const clearTrend = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTrend,
      diaryDeployment.address,
      signer,
    );

    console.log(`Encrypted trend : ${encryptedTrend}`);
    console.log(`Average mood    : ${clearTrend}`);
  });
