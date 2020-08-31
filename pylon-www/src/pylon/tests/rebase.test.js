import {
  Yam
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const pylon = new Yam(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await pylon.web3.eth.getAccounts();
    pylon.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await pylon.testing.snapshot();
  });

  beforeEach(async () => {
    await pylon.testing.resetEVM("0x2");
    let a = await pylon.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await pylon.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await pylon.contracts.uni_fact.methods.createPair(
        pylon.contracts.ycrv.options.address,
        pylon.contracts.pylon.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();
      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();
      expect(pylon.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();
      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(1000);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await pylon.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(pylon.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(pylon.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();
      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(1000);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await pylon.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(pylon.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(pylon.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await pylon.testing.increaseTime(12 * 60 * 60);

      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await pylon.contracts.pylon.methods.balanceOf(
          pylon.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await pylon.testing.increaseTime(i);

      let r = await pylon.contracts.uni_pair.methods.getReserves().call();
      let q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      console.log("bal user, bal pylon res, bal res crv", bal1, resPYLON, resycrv);
      r = await pylon.contracts.uni_pair.methods.getReserves().call();
      q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(pylon.toBigN(bal).toNumber()).toBeLessThan(pylon.toBigN(bal1).toNumber());
      // used full pylon reserves
      expect(pylon.toBigN(resPYLON).toNumber()).toBe(0);
      // increases reserves
      expect(pylon.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(pylon.toBigN(q).toNumber()).toBeGreaterThan(pylon.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await pylon.testing.increaseTime(i);

      let r = await pylon.contracts.uni_pair.methods.getReserves().call();
      let q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      // balance decreases
      expect(pylon.toBigN(bal1).toNumber()).toBeLessThan(pylon.toBigN(bal).toNumber());
      // no increases to reserves
      expect(pylon.toBigN(resPYLON).toNumber()).toBe(0);
      expect(pylon.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await pylon.testing.increaseTime(i);

      let r = await pylon.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      // no change
      expect(pylon.toBigN(bal1).toNumber()).toBe(pylon.toBigN(bal).toNumber());
      // no increases to reserves
      expect(pylon.toBigN(resPYLON).toNumber()).toBe(0);
      expect(pylon.toBigN(resycrv).toNumber()).toBe(0);
      r = await pylon.contracts.uni_pair.methods.getReserves().call();
      q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with PYLON in reserves", async () => {
      await pylon.contracts.pylon.methods.transfer(pylon.contracts.reserves.options.address, pylon.toBigN(60000*10**18).toString()).send({from: user});
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await pylon.testing.increaseTime(i);


      let r = await pylon.contracts.uni_pair.methods.getReserves().call();
      let q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

      console.log(bal, bal1, resPYLON, resycrv);
      expect(pylon.toBigN(bal).toNumber()).toBeLessThan(pylon.toBigN(bal1).toNumber());
      expect(pylon.toBigN(resPYLON).toNumber()).toBeGreaterThan(0);
      expect(pylon.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await pylon.contracts.uni_pair.methods.getReserves().call();
      q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(pylon.toBigN(q).toNumber()).toBeGreaterThan(pylon.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await pylon.testing.expectThrow(pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await pylon.testing.expectThrow(pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await pylon.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await pylon.testing.increaseTime(i + pylon.toBigN(len).toNumber()+1);

      let b = await pylon.testing.expectThrow(pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await pylon.contracts.pylon.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await pylon.contracts.ycrv.methods.approve(
        pylon.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await pylon.contracts.uni_router.methods.addLiquidity(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await pylon.contracts.uni_fact.methods.getPair(
        pylon.contracts.pylon.options.address,
        pylon.contracts.ycrv.options.address
      ).call();

      pylon.contracts.uni_pair.options.address = pair;
      let bal = await pylon.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await pylon.testing.increaseTime(43200);

      await pylon.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await pylon.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await pylon.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          pylon.contracts.ycrv.options.address,
          pylon.contracts.pylon.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await pylon.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await pylon.contracts.pylon.methods.balanceOf(user).call();

      let a = await pylon.web3.eth.getBlock('latest');

      let offset = await pylon.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = pylon.toBigN(offset).toNumber();
      let interval = await pylon.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = pylon.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await pylon.testing.increaseTime(i - 1);



      let b = await pylon.testing.expectThrow(pylon.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
