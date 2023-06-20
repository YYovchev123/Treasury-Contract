const hre = require("hardhat");

async function main() {
  const treasury = await hre.ethers.deployContract("Treasury");

  await treasury.waitForDeployment();

  console.log(`Treasury deployed to ${treasury.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
