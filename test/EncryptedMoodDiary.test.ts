import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedMoodDiary } from "../types";

describe("EncryptedMoodDiary", function () {
  let encryptedMoodDiary: EncryptedMoodDiary;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const EncryptedMoodDiaryFactory = await ethers.getContractFactory("EncryptedMoodDiary");
    encryptedMoodDiary = (await EncryptedMoodDiaryFactory.deploy()) as EncryptedMoodDiary;
    await encryptedMoodDiary.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await encryptedMoodDiary.getAddress()).to.be.properAddress;
    });

    it("Should initialize with zero entry count", async function () {
      expect(await encryptedMoodDiary.getEntryCount()).to.equal(0);
    });
  });

  describe("Basic functionality", function () {
    it("Should allow getting entry count", async function () {
      const count = await encryptedMoodDiary.getEntryCount();
      expect(Number(count)).to.be.a("number");
    });

    it("Should have proper contract interface", async function () {
      // Test basic view functions don't revert
      await expect(encryptedMoodDiary.getEntryCount()).to.not.be.reverted;
      await expect(encryptedMoodDiary.canDecryptTrend()).to.not.be.reverted;
    });
  });
});
