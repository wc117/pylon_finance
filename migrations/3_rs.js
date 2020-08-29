// ============ Contracts ============

// Token
// deployed first
const PYLONImplementation = artifacts.require("PYLONDelegate");
const PYLONProxy = artifacts.require("PYLONDelegator");

// Rs
// deployed second
const PYLONReserves = artifacts.require("PYLONReserves");
const PYLONRebaser = artifacts.require("PYLONRebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(PYLONReserves, reserveToken, PYLONProxy.address);
  await deployer.deploy(PYLONRebaser,
      PYLONProxy.address,
      reserveToken,
      uniswap_factory,
      PYLONReserves.address
  );
  let rebase = new web3.eth.Contract(PYLONRebaser.abi, PYLONRebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log(pair)
  let pylon = await PYLONProxy.deployed();
  await pylon._setRebaser(PYLONRebaser.address);
  let reserves = await PYLONReserves.deployed();
  await reserves._setRebaser(PYLONRebaser.address)
}
