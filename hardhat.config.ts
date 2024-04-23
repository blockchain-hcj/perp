import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import {MAINNET_RPC_CONFIG, Secrets, TESTNET_RPC_CONFIG} from "./secrets";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          },
        },
      },
      {
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          },
        },
      }
      ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: 10000000,
      blockGasLimit: 15000000,
      accounts: [
        {
          privateKey: Secrets.TESTNET_PRIVATEKEY,
          balance: "10000000000000000000000",
        },
      ],
      forking:{
        url: MAINNET_RPC_CONFIG.arb
      }
    },

    arb:{
      url: TESTNET_RPC_CONFIG.arbitrumSepolia,
      accounts:  [Secrets.TESTNET_PRIVATEKEY],
    },

    arbSepolia: {
      url: TESTNET_RPC_CONFIG.arbitrumSepolia,
      accounts:  [Secrets.TESTNET_PRIVATEKEY],
    }
  },
  defaultNetwork: "arbSepolia",


};

export default config;
