require('dotenv-flow').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
var Web3 = require('web3');
// var p = ;
module.exports = {
  compilers: {
    solc: {
      version: '0.5.17',
      docker: process.env.DOCKER_COMPILER !== undefined
        ? process.env.DOCKER_COMPILER === 'true' : true,
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 50000
        },
        evmVersion: 'istanbul',
      },
    },
  },
  networks: {
    test: {
      host: '0.0.0.0',
      port: 8545,
      network_id: '1001',
      gasPrice: 50000000000,
      gas: 8000000,
      network_id: '1001',
    },
    distribution: {
      host: '0.0.0.0',
      port: 8545,
      network_id: '1001',
      gasPrice: 50000000000,
      gas: 8000000,
      network_id: '1001',
    },
    test_ci: {
      host: '0.0.0.0',
      port: 8545,
      gasPrice: 1,
      gas: 10000000,
      network_id: '1001',
    },
    mainnet: {
      network_id: '1',
      provider: () => new HDWalletProvider(
        [process.env.DEPLOYER_PRIVATE_KEY],
        "https://mainnet.infura.io/v3/731a2b3d28e445b7ac56f23507614fea",
        0,
        1,
      ),
      gasPrice: Number(process.env.GAS_PRICE),
      gas: 8000000,
      from: process.env.DEPLOYER_ACCOUNT,
      timeoutBlocks: 800,
    },
    kovan: {
      network_id: '42',
      provider: () => new HDWalletProvider(
        "dash good add razor hood lawn minor assault cousin trial intact express",
        'https://kovan.infura.io/v3/0938d3d84c34400eada0c2e5091d9618',
        0,
        1,
      ),
      gasPrice: 10000000000, // 10 gwei
      gas: 6900000,
      from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F',
      timeoutBlocks: 500,
    },
    ropsten: {
      provider: () => new HDWalletProvider(
        "dash good add razor hood lawn minor assault cousin trial intact express",
        "https://ropsten.infura.io/v3/7b42e75b764f4008b6ecf3893c40c749",
        0,
        1,
      ),
      from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F',
      network_id: 3,
      gas: 1000000000      //make sure this gas allocation isn't over 4M, which is the max
    },
    dev: {
      host: 'localhost',
      port: 8445,
      network_id: '1005',
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000,
    },
    coverage: {
      host: '0.0.0.0',
      network_id: '1002',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 1,
    },
    docker: {
      host: 'localhost',
      network_id: '1313',
      port: 8545,
      gasPrice: 1,
    },
  },
};
