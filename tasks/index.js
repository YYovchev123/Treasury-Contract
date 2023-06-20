const { task } = require("hardhat/config");

// // Task for deployment
// task("deploy", "deploy instance of Treasury contract").setAction(
//   async (taskArgs, hre) => {
//     const account = (await hre.ethers.getSigners())[0];
//     const treasury = await hre.ethers.deployContract("Treasury", account);
//     await treasury.waitForDeployment();
//     console.log(`Treasury deployed to ${treasury.target}`);
//   }
// );

// // Interaction task for storeFunds()
// task("store", "Store funds in Treasury contract").setAction(
//   async (taskArgs, hre) => {
//     const account = (await hre.ethers.getSigners())[0];
//     const account1 = (await hre.ethers.getSigners())[1];
//     const value = 1000;
//     const treasury = await hre.ethers.deployContract("Treasury", account);
//     await treasury.waitForDeployment();
//     await treasury.connect(account1).storeFunds({ value: value });
//     console.log(`Treasury deployed to ${treasury.target}`);
//     console.log(`Acount1 stored ${value} in ${treasury.target}`);
//   }
// );

// Task for deployment
task("deploy", "deploy instance of Treasury contract").setAction(
  async (taskArgs, hre) => {
    const account = (await hre.ethers.getSigners())[0];
    const treasury = await hre.ethers.deployContract("Treasury", account);
    await treasury.waitForDeployment();
    console.log(`Treasury deployed to ${treasury.target}`);
  }
);

// Interaction task for storeFunds()
task("store", "Store funds in Treasury contract").setAction(
  async (taskArgs, hre) => {
    const account = (await hre.ethers.getSigners())[0];
    const account1 = (await hre.ethers.getSigners())[1];
    const value = 1000;
    const treasury = await hre.ethers.deployContract("Treasury", account);
    await treasury.waitForDeployment();
    await treasury.connect(account1).storeFunds({ value: value });
    console.log(`Treasury deployed to ${treasury.target}`);
    console.log(`Acount1 stored ${value} in ${treasury.target}`);
  }
);
