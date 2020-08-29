// ============ Contracts ============

// Token
// deployed first
const PYLONImplementation = artifacts.require("PYLONDelegate");
const PYLONProxy = artifacts.require("PYLONDelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(PYLONImplementation);
  if (network != "mainnet") {
    await deployer.deploy(PYLONProxy,
      "PYLON",
      "PYLON",
      18, // wei to ETH
      "8400000000000000000000", // print extra few mil for user
      PYLONImplementation.address,
      "0x"
    );
  } else {
    await deployer.deploy(PYLONProxy,
      "PYLON",
      "PYLON",
      18,
      "8400000000000000000000",
      PYLONImplementation.address,
      "0x"
    );
  }

}
