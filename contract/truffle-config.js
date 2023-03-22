const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
require('dotenv').config()

module.exports = {
  networks: {
    matic: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNENOMIC,
          `https://matic-mumbai.chainstacklabs.com`
        ),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 80001,
    },
  },
  contracts_directory: "./contracts",
  contracts_build_directory: "./abis",
  compilers: {
    solc: {
      version: "^0.8.9",
      optimizer: {
        enabled: true,
        runs: 200,
      }
    },
  },
  plugins: ['truffle-plugin-verify', 'truffle-contract-size'],
  api_keys: {
    polygonscan: process.env.POLYSCANAPIKEY,
  },
  db: {
    enabled: false,
  },
};
