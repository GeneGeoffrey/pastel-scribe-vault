import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { EncryptedMoodDiary } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedMoodDiarySepolia", function () {
  let signers: Signers;
  let diary: EncryptedMoodDiary;
  let diaryAddress: string;

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This suite only runs against Sepolia");
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedMoodDiary");
      diaryAddress = deployment.address;
      diary = await ethers.getContractAt(
        "EncryptedMoodDiary",
        deployment.address,
      );
    } catch (e) {
      (e as Error).message += ". Run `npx hardhat deploy --network sepolia` first.";
      throw e;
    }

    const [alice] = await ethers.getSigners();
    signers = { alice };
  });

  it("records a mood entry and decrypts the shared average", async function () {
    this.timeout(4 * 60_000);

    const encryptedFour = await fhevm
      .createEncryptedInput(diaryAddress, signers.alice.address)
      .add32(4)
      .encrypt();

    const submitTx = await diary
      .connect(signers.alice)
      .submitMood(encryptedFour.handles[0], encryptedFour.inputProof);
    await submitTx.wait();

    expect(await diary.getEntryCount()).to.be.greaterThan(0);

    const grantTx = await diary.connect(signers.alice).requestTrendHandle();
    await grantTx.wait();

    const encryptedTrend = await diary.getEncryptedTrend();
    expect(encryptedTrend).to.not.eq(ethers.ZeroHash);

    const clearTrend = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTrend,
      diaryAddress,
      signers.alice,
    );
    expect(clearTrend).to.eq(4);
  });
});
