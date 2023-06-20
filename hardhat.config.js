require("@nomicfoundation/hardhat-toolbox");
require("./tasks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: "",
      accounts: [""],
    },
  },
  etherscan: {
    apiKey: "",
  },
};
