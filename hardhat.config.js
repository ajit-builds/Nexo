require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

// Load .env and .env.local if present
try {
  const dotenv = require("dotenv");
  if (fs.existsSync(path.join(__dirname, ".env.local"))) {
    dotenv.config({ path: path.join(__dirname, ".env.local") });
  }
  dotenv.config();
} catch (e) {
  // dotenv optional
}

const AMOY_RPC =
  process.env.ALCHEMY_AMOY_RPC_URL ||
  process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC ||
  "https://polygon-amoy-bor-rpc.publicnode.com";

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY.startsWith("0x") ? process.env.DEPLOYER_PRIVATE_KEY : `0x${process.env.DEPLOYER_PRIVATE_KEY}`]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    amoy: {
      url: AMOY_RPC,
      chainId: 80002,
      accounts: DEPLOYER_KEY,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      amoy: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
