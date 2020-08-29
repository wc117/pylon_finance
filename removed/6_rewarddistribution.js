var fs = require('fs')

// ============ Contracts ============


// Protocol
// deployed second
const PYLONImplementation = artifacts.require("PYLONDelegate");
const PYLONProxy = artifacts.require("PYLONDelegator");

// deployed third
const PYLONReserves = artifacts.require("PYLONReserves");
const PYLONRebaser = artifacts.require("PYLONRebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const PYLON_ETHPool = artifacts.require("PYLONwETHPool");
const PYLON_uAMPLPool = artifacts.require("PYLONwBTCPool");
const PYLON_YFIPool = artifacts.require("PYLONYFIPool");
const PYLON_LINKPool = artifacts.require("PYLONyaLINKPool");
const PYLON_MKRPool = artifacts.require("PYLONMKRPool");
const PYLON_LENDPool = artifacts.require("PYLONLENDPool");
const PYLON_COMPPool = artifacts.require("PYLONCOMPPool");
const PYLON_SNXPool = artifacts.require("PYLONSNXPool");


// deployed fifth
const PYLONIncentivizer = artifacts.require("PYLONIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let pylon = await PYLONProxy.deployed();
  let yReserves = await PYLONReserves.deployed()
  let yRebaser = await PYLONRebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {

    let eth_pool = new web3.eth.Contract(PYLON_ETHPool.abi, PYLON_ETHPool.address);
    let ampl_pool = new web3.eth.Contract(PYLON_uAMPLPool.abi, PYLON_uAMPLPool.address);
    let yfi_pool = new web3.eth.Contract(PYLON_YFIPool.abi, PYLON_YFIPool.address);
    let lend_pool = new web3.eth.Contract(PYLON_LENDPool.abi, PYLON_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(PYLON_MKRPool.abi, PYLON_MKRPool.address);
    let snx_pool = new web3.eth.Contract(PYLON_SNXPool.abi, PYLON_SNXPool.address);
    let comp_pool = new web3.eth.Contract(PYLON_COMPPool.abi, PYLON_COMPPool.address);
    let link_pool = new web3.eth.Contract(PYLON_LINKPool.abi, PYLON_LINKPool.address);
    let ycrv_pool = new web3.eth.Contract(PYLONIncentivizer.abi, PYLONIncentivizer.address);

    console.log("setting distributor");
    console.log(accounts[0]);
    await Promise.all([
        eth_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ampl_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        yfi_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        lend_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        mkr_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        snx_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        comp_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        link_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
      ]);

    let two_fifty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(250));
    let one_five = two_fifty.mul(web3.utils.toBN(6));

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      pylon.transfer(PYLON_ETHPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_uAMPLPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_YFIPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_LENDPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_MKRPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_SNXPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_COMPPool.address, two_fifty.toString()),
      pylon.transfer(PYLON_LINKPool.address, two_fifty.toString()),
      pylon._setIncentivizer(PYLONIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      ampl_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      yfi_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      lend_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      mkr_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      snx_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      comp_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      link_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),

      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: accounts[0], gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
  }

  await Promise.all([
    pylon._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        PYLONProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        PYLONReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        PYLONRebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
