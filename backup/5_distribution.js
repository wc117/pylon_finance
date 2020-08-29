// ============ Contracts ============


// Protocol
// deployed second
const PYLONImplementation = artifacts.require("PYLONDelegate");
const PYLONProxy = artifacts.require("PYLONDelegator");

// deployed third
// const PYLONReserves = artifacts.require("PYLONReserves");
// const PYLONRebaser = artifacts.require("PYLONRebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const PYLON_wETHPool = artifacts.require("PYLONwETHPool");
const PYLON_wBTCPool = artifacts.require("PYLONwBTCPool");
const PYLON_yaLINKPool = artifacts.require("PYLONyaLINKPool");
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
  // let yReserves = await PYLONReserves.deployed()
  // let yRebaser = await PYLONRebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {
    await deployer.deploy(PYLON_wETHPool);
    await deployer.deploy(PYLON_wBTCPool);
    await deployer.deploy(PYLONIncentivizer);
    await deployer.deploy(PYLON_yaLINKPool);
    await deployer.deploy(PYLON_LENDPool);
    await deployer.deploy(PYLON_COMPPool);
    await deployer.deploy(PYLON_SNXPool);

    let weth_pool = new web3.eth.Contract(PYLON_wETHPool.abi, PYLON_wETHPool.address);
    let wbtc_pool = new web3.eth.Contract(PYLON_wBTCPool.abi, PYLON_wBTCPool.address);
    let lend_pool = new web3.eth.Contract(PYLON_LENDPool.abi, PYLON_LENDPool.address);
    let snx_pool = new web3.eth.Contract(PYLON_SNXPool.abi, PYLON_SNXPool.address);
    let comp_pool = new web3.eth.Contract(PYLON_COMPPool.abi, PYLON_COMPPool.address);
    let yalink_pool = new web3.eth.Contract(PYLON_yaLINKPool.abi, PYLON_yaLINKPool.address);
    let ycrv_pool = new web3.eth.Contract(PYLONIncentivizer.abi, PYLONIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        weth_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        wbtc_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        lend_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        snx_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        comp_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        yalink_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
        ycrv_pool.methods.setRewardDistribution('0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F').send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      ]);

    let one_four = web3.utils.toBN(1400).mul(web3.utils.toBN(10**18));
    // let six_three = web3.utils.toBN(6300);

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      pylon.transfer(PYLON_wETHPool.address, one_four.toString()),
      pylon.transfer(PYLON_wBTCPool.address, one_four.toString()),
      pylon.transfer(PYLON_LENDPool.address, one_four.toString()),
      pylon.transfer(PYLON_SNXPool.address, one_four.toString()),
      pylon.transfer(PYLON_COMPPool.address, one_four.toString()),
      pylon.transfer(PYLON_yaLINKPool.address, one_four.toString()),
      pylon._setIncentivizer(PYLONIncentivizer.address),
    ]);

    await Promise.all([
      weth_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),
      wbtc_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),
      lend_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),
      snx_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),
      comp_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),
      yalink_pool.methods.notifyRewardAmount(one_four.toString()).send({from:'0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F'}),

      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 500000}),
    ]);

    await Promise.all([
      weth_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      wbtc_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      yalink_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
    ]);
    await Promise.all([
      weth_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      wbtc_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      yalink_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: '0xe0C5DD869A841ec269E79cd86529C5F766CBBE7F', gas: 100000}),
    ]);
  }

  await Promise.all([
    pylon._setPendingGov(Timelock.address),
    // yReserves._setPendingGov(Timelock.address),
    // yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        PYLONProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      // tl.executeTransaction(
      //   PYLONReserves.address,
      //   0,
      //   "_acceptGov()",
      //   "0x",
      //   0
      // ),

      // tl.executeTransaction(
      //   PYLONRebaser.address,
      //   0,
      //   "_acceptGov()",
      //   "0x",
      //   0
      // ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
