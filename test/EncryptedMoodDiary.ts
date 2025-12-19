import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

// Enhanced test suite for encrypted mood diary functionality
import { FhevmType } from "@fhevm/hardhat-plugin";
import {
  EncryptedMoodDiary,
  EncryptedMoodDiary__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployDiary() {
  const factory = (await ethers.getContractFactory(
    "EncryptedMoodDiary",
  )) as EncryptedMoodDiary__factory;
  const diary = (await factory.deploy()) as EncryptedMoodDiary;
  const address = await diary.getAddress();
  return { diary, address };
}

describe("EncryptedMoodDiary", function () {
  let signers: Signers;
  let diary: EncryptedMoodDiary;
  let diaryAddress: string;

  before(async () => {
    const e = await ethers.getSigners();
    signers = { deployer: e[0], alice: e[1], bob: e[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("EncryptedMoodDiary tests run only in mock mode");
      this.skip();
    }
    ({ diary, address: diaryAddress } = await deployDiary());
  });

  it("starts with zero entries and empty encrypted handles", async function () {
    expect(await diary.getEntryCount()).to.eq(0); // Verify initial state
    expect(await diary.getEncryptedTrend()).to.eq(ethers.ZeroHash);
    expect(await diary.getEncryptedTotalScore()).to.eq(ethers.ZeroHash);
  });

  it("stores encrypted scores and exposes decryptable average to the author", async function () {
    const encryptedFive = await fhevm
      .createEncryptedInput(diaryAddress, signers.alice.address)
      .add32(5)
      .encrypt();

    await (
      await diary
        .connect(signers.alice)
        .submitMood(encryptedFive.handles[0], encryptedFive.inputProof)
    ).wait();

    expect(await diary.getEntryCount()).to.eq(1);

    const encryptedTrend = await diary.connect(signers.alice).getMyTrendHandle();
    const clearTrend = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTrend,
      diaryAddress,
      signers.alice,
    );
    expect(clearTrend).to.eq(5);
  });

  it("computes a privacy-preserving average trend shareable with other users", async function () {
    // Test multi-user scenario with encrypted aggregation
    // Alice logs 5
    const encrypt = async (score: number, author: HardhatEthersSigner) =>
      fhevm
        .createEncryptedInput(diaryAddress, author.address)
        .add32(score)
        .encrypt();

    const encFive = await encrypt(5, signers.alice);
    await (
      await diary
        .connect(signers.alice)
        .submitMood(encFive.handles[0], encFive.inputProof)
    ).wait();

    // Bob logs 3
    const encThree = await encrypt(3, signers.bob);
    await (
      await diary
        .connect(signers.bob)
        .submitMood(encThree.handles[0], encThree.inputProof)
    ).wait();

    expect(await diary.getEntryCount()).to.eq(2);

    // Bob should be able to decrypt immediately
    const bobHandle = await diary.connect(signers.bob).getMyTrendHandle();
    const clearTrendBob = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobHandle,
      diaryAddress,
      signers.bob,
    );
    expect(clearTrendBob).to.eq(4);

    // Alice already allowed previously; ensure she still can decrypt as well
    await (
      await diary
        .connect(signers.alice)
        .requestTrendHandle()
    ).wait();
    const aliceHandle = await diary.connect(signers.alice).getMyTrendHandle();
    const clearTrendAlice = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceHandle,
      diaryAddress,
      signers.alice,
    );
    expect(clearTrendAlice).to.eq(4);

    // A new user must request access before decrypting
    await (
      await diary
        .connect(signers.deployer)
        .requestTrendHandle()
    ).wait();

    expect(
      await diary.connect(signers.deployer).canDecryptTrend(),
    ).to.eq(true);

    const handleForAdmin = await diary
      .connect(signers.deployer)
      .getMyTrendHandle();

    const decryptedAdmin = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handleForAdmin,
      diaryAddress,
      signers.deployer,
    );
    expect(decryptedAdmin).to.eq(4);
  });
});
