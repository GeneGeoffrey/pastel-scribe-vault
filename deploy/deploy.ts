import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedMoodDiary = await deploy("EncryptedMoodDiary", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedMoodDiary contract: `, deployedMoodDiary.address);
};
export default func;
func.id = "deploy_encryptedMoodDiary"; // id required to prevent reexecution
func.tags = ["EncryptedMoodDiary"];
