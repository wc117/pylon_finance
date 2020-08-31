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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let ycrv_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let weth_account = "0xf9e11762d522ea29dd78178c9baf83b7b093aacc";
  let uni_ampl_account = "0x8c545be506a335e24145edd6e01d2754296ff018";
  let comp_account = "0xc89b6f0146642688bb254bf93c28fccf1e182c81";
  let lend_account = "0x3b08aa814bea604917418a9f0907e7fc430e742c";
  let link_account = "0xbe6977e08d4479c0a6777539ae0e8fa27be4e9d6";
  let mkr_account = "0xf37216a8ac034d08b4663108d7532dfcb44583ed";
  let snx_account = "0xb696d629cd0a00560151a434f6b4478ad6c228d7"
  let yfi_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  beforeAll(async () => {
    const accounts = await pylon.web3.eth.getAccounts();
    pylon.addAccount(accounts[0]);
    user = accounts[0];
    pylon.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await pylon.testing.snapshot();
  });

  beforeEach(async () => {
    await pylon.testing.resetEVM("0x2");
  });

  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await pylon.testing.resetEVM("0x2");
      let a = await pylon.web3.eth.getBlock('latest');

      let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

      expect(pylon.toBigN(a["timestamp"]).toNumber()).toBeLessThan(pylon.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

      await pylon.testing.expectThrow(
        pylon.contracts.eth_pool.methods.stake(
          pylon.toBigN(200).times(pylon.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await pylon.web3.eth.getBlock('latest');

      starttime = await pylon.contracts.ampl_pool.methods.starttime().call();

      expect(pylon.toBigN(a["timestamp"]).toNumber()).toBeLessThan(pylon.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await pylon.contracts.UNIAmpl.methods.approve(pylon.contracts.ampl_pool.options.address, -1).send({from: user});

      await pylon.testing.expectThrow(pylon.contracts.ampl_pool.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool 2 early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await pylon.testing.resetEVM("0x2");
      let a = await pylon.web3.eth.getBlock('latest');

      await pylon.contracts.weth.methods.transfer(user, pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString()).send({
        from: weth_account
      });
      await pylon.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
        from: uni_ampl_account
      });

      let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await pylon.testing.increaseTime(waittime);
      }

      await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

      await pylon.contracts.eth_pool.methods.stake(
        pylon.toBigN(200).times(pylon.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await pylon.contracts.UNIAmpl.methods.approve(pylon.contracts.ampl_pool.options.address, -1).send({from: user});

      await pylon.contracts.ampl_pool.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await pylon.testing.expectThrow(pylon.contracts.ampl_pool.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await pylon.testing.expectThrow(pylon.contracts.eth_pool.methods.withdraw(
        pylon.toBigN(201).times(pylon.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("incentivizer pool", () => {
    test("joining and exiting", async() => {
      await pylon.testing.resetEVM("0x2");

      await pylon.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
        from: ycrv_account
      });

      await pylon.contracts.weth.methods.transfer(user, pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await pylon.web3.eth.getBlock('latest');

      let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await pylon.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

      await pylon.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await pylon.contracts.eth_pool.methods.earned(user).call();

      let rr = await pylon.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await pylon.testing.increaseTime(86400);
      // await pylon.testing.mineBlock();

      earned = await pylon.contracts.eth_pool.methods.earned(user).call();

      rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await pylon.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

      console.log("pylon bal", pylon_bal)
      // start rebasing
        //console.log("approve pylon")
        await pylon.contracts.pylon.methods.approve(
          pylon.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve ycrv")
        await pylon.contracts.ycrv.methods.approve(
          pylon.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let ycrv_bal = await pylon.contracts.ycrv.methods.balanceOf(user).call()

        console.log("ycrv_bal bal", ycrv_bal)

        console.log("add liq/ create pool")
        await pylon.contracts.uni_router.methods.addLiquidity(
          pylon.contracts.pylon.options.address,
          pylon.contracts.ycrv.options.address,
          pylon_bal,
          pylon_bal,
          pylon_bal,
          pylon_bal,
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

        await pylon.contracts.uni_pair.methods.approve(
          pylon.contracts.ycrv_pool.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await pylon.contracts.ycrv_pool.methods.starttime().call();

        a = await pylon.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime)
        }

        await pylon.contracts.ycrv_pool.methods.stake(bal).send({from: user, gas: 400000});


        earned = await pylon.contracts.ampl_pool.methods.earned(user).call();

        rr = await pylon.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await pylon.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await pylon.testing.increaseTime(625000 + 1000);

        earned = await pylon.contracts.ampl_pool.methods.earned(user).call();

        rr = await pylon.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await pylon.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await pylon.contracts.ycrv_pool.methods.exit().send({from: user, gas: 400000});

        pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call();


        expect(pylon.toBigN(pylon_bal).toNumber()).toBeGreaterThan(0)
        console.log("pylon bal after staking in pool 2", pylon_bal);
    });
  });

  describe("ampl", () => {
    test("rewards from pool 1s ampl", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
          from: uni_ampl_account
        });
        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          //console.log("missed entry");
        }

        await pylon.contracts.UNIAmpl.methods.approve(pylon.contracts.ampl_pool.options.address, -1).send({from: user});

        await pylon.contracts.ampl_pool.methods.stake(
          "5000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.ampl_pool.methods.earned(user).call();

        let rr = await pylon.contracts.ampl_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.ampl_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.ampl_pool.methods.earned(user).call();

        rpt = await pylon.contracts.ampl_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.ampl_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        // let k = await pylon.contracts.eth_pool.methods.exit().send({
        //   from: user,
        //   gas: 300000
        // });
        //
        // //console.log(k.events)

        // weth_bal = await pylon.contracts.weth.methods.balanceOf(user).call()

        // expect(weth_bal).toBe(pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString())

        let ampl_bal = await pylon.contracts.UNIAmpl.methods.balanceOf(user).call()

        expect(ampl_bal).toBe("5000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("eth", () => {
    test("rewards from pool 1s eth", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.contracts.weth.methods.transfer(user, pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

        await pylon.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        let rr = await pylon.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
    test("rewards from pool 1s eth with rebase", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await pylon.contracts.weth.methods.transfer(user, pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

        await pylon.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        let rr = await pylon.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(125000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await pylon.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        console.log("pylon bal", pylon_bal)
        // start rebasing
          //console.log("approve pylon")
          await pylon.contracts.pylon.methods.approve(
            pylon.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await pylon.contracts.ycrv.methods.approve(
            pylon.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await pylon.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          console.log("add liq/ create pool")
          await pylon.contracts.uni_router.methods.addLiquidity(
            pylon.contracts.pylon.options.address,
            pylon.contracts.ycrv.options.address,
            pylon_bal,
            pylon_bal,
            pylon_bal,
            pylon_bal,
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
          //console.log("init swap")
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "10000000000000000",
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

          await pylon.testing.increaseTime(43200);

          //console.log("init twap")
          await pylon.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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
          //console.log("second swap")
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

          a = await pylon.web3.eth.getBlock('latest');

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

          let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

          let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

          let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

          // new balance > old balance
          expect(pylon.toBigN(bal).toNumber()).toBeLessThan(pylon.toBigN(bal1).toNumber());
          // increases reserves
          expect(pylon.toBigN(resycrv).toNumber()).toBeGreaterThan(0);

          r = await pylon.contracts.uni_pair.methods.getReserves().call();
          q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(pylon.toBigN(q).toNumber()).toBeGreaterThan(pylon.toBigN(10**18).toNumber());


        await pylon.testing.increaseTime(525000 + 100);


        j = await pylon.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await pylon.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(
          pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toNumber()
        ).toBeGreaterThan(two_fity.toNumber())
    });
    test("rewards from pool 1s eth with negative rebase", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await pylon.contracts.weth.methods.transfer(user, pylon.toBigN(2000).times(pylon.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.weth.methods.approve(pylon.contracts.eth_pool.options.address, -1).send({from: user});

        await pylon.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        let rr = await pylon.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(125000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.eth_pool.methods.earned(user).call();

        rpt = await pylon.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await pylon.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        console.log("pylon bal", pylon_bal)
        // start rebasing
          //console.log("approve pylon")
          await pylon.contracts.pylon.methods.approve(
            pylon.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await pylon.contracts.ycrv.methods.approve(
            pylon.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await pylon.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          pylon_bal = pylon.toBigN(pylon_bal);
          console.log("add liq/ create pool")
          await pylon.contracts.uni_router.methods.addLiquidity(
            pylon.contracts.pylon.options.address,
            pylon.contracts.ycrv.options.address,
            pylon_bal.times(.1).toString(),
            pylon_bal.times(.1).toString(),
            pylon_bal.times(.1).toString(),
            pylon_bal.times(.1).toString(),
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
          //console.log("init swap")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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

          //console.log("init twap")
          await pylon.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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
          //console.log("second swap")
          await pylon.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000",
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

          a = await pylon.web3.eth.getBlock('latest');

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

          let bal1 = await pylon.contracts.pylon.methods.balanceOf(user).call();

          let resPYLON = await pylon.contracts.pylon.methods.balanceOf(pylon.contracts.reserves.options.address).call();

          let resycrv = await pylon.contracts.ycrv.methods.balanceOf(pylon.contracts.reserves.options.address).call();

          expect(pylon.toBigN(bal1).toNumber()).toBeLessThan(pylon.toBigN(bal).toNumber());
          expect(pylon.toBigN(resycrv).toNumber()).toBe(0);

          r = await pylon.contracts.uni_pair.methods.getReserves().call();
          q = await pylon.contracts.uni_router.methods.quote(pylon.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(pylon.toBigN(q).toNumber()).toBeLessThan(pylon.toBigN(10**18).toNumber());


        await pylon.testing.increaseTime(525000 + 100);


        j = await pylon.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await pylon.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(
          pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toNumber()
        ).toBeLessThan(two_fity.toNumber())
    });
  });

  describe("yfi", () => {
    test("rewards from pool 1s yfi", async () => {
        await pylon.testing.resetEVM("0x2");
        await pylon.contracts.yfi.methods.transfer(user, "500000000000000000000").send({
          from: yfi_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.yfi_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.yfi.methods.approve(pylon.contracts.yfi_pool.options.address, -1).send({from: user});

        await pylon.contracts.yfi_pool.methods.stake(
          "500000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.yfi_pool.methods.earned(user).call();

        let rr = await pylon.contracts.yfi_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.yfi_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.yfi_pool.methods.earned(user).call();

        rpt = await pylon.contracts.yfi_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.yfi_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.yfi.methods.balanceOf(user).call()

        expect(weth_bal).toBe("500000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("comp", () => {
    test("rewards from pool 1s comp", async () => {
        await pylon.testing.resetEVM("0x2");
        await pylon.contracts.comp.methods.transfer(user, "50000000000000000000000").send({
          from: comp_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.comp_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.comp.methods.approve(pylon.contracts.comp_pool.options.address, -1).send({from: user});

        await pylon.contracts.comp_pool.methods.stake(
          "50000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.comp_pool.methods.earned(user).call();

        let rr = await pylon.contracts.comp_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.comp_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.comp_pool.methods.earned(user).call();

        rpt = await pylon.contracts.comp_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.comp_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.comp.methods.balanceOf(user).call()

        expect(weth_bal).toBe("50000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("lend", () => {
    test("rewards from pool 1s lend", async () => {
        await pylon.testing.resetEVM("0x2");
        await pylon.web3.eth.sendTransaction({from: user2, to: lend_account, value : pylon.toBigN(100000*10**18).toString()});

        await pylon.contracts.lend.methods.transfer(user, "10000000000000000000000000").send({
          from: lend_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.lend_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.lend.methods.approve(pylon.contracts.lend_pool.options.address, -1).send({from: user});

        await pylon.contracts.lend_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.lend_pool.methods.earned(user).call();

        let rr = await pylon.contracts.lend_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.lend_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.lend_pool.methods.earned(user).call();

        rpt = await pylon.contracts.lend_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.lend_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.lend.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("link", () => {
    test("rewards from pool 1s link", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.web3.eth.sendTransaction({from: user2, to: link_account, value : pylon.toBigN(100000*10**18).toString()});

        await pylon.contracts.link.methods.transfer(user, "10000000000000000000000000").send({
          from: link_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.link_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.link.methods.approve(pylon.contracts.link_pool.options.address, -1).send({from: user});

        await pylon.contracts.link_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.link_pool.methods.earned(user).call();

        let rr = await pylon.contracts.link_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.link_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.link_pool.methods.earned(user).call();

        rpt = await pylon.contracts.link_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.link_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.link.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("mkr", () => {
    test("rewards from pool 1s mkr", async () => {
        await pylon.testing.resetEVM("0x2");
        await pylon.web3.eth.sendTransaction({from: user2, to: mkr_account, value : pylon.toBigN(100000*10**18).toString()});
        let eth_bal = await pylon.web3.eth.getBalance(mkr_account);

        await pylon.contracts.mkr.methods.transfer(user, "10000000000000000000000").send({
          from: mkr_account
        });

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.mkr_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.mkr.methods.approve(pylon.contracts.mkr_pool.options.address, -1).send({from: user});

        await pylon.contracts.mkr_pool.methods.stake(
          "10000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.mkr_pool.methods.earned(user).call();

        let rr = await pylon.contracts.mkr_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.mkr_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.mkr_pool.methods.earned(user).call();

        rpt = await pylon.contracts.mkr_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.mkr_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.mkr.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000")


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("snx", () => {
    test("rewards from pool 1s snx", async () => {
        await pylon.testing.resetEVM("0x2");

        await pylon.web3.eth.sendTransaction({from: user2, to: snx_account, value : pylon.toBigN(100000*10**18).toString()});

        let snx_bal = await pylon.contracts.snx.methods.balanceOf(snx_account).call();

        console.log(snx_bal)

        await pylon.contracts.snx.methods.transfer(user, snx_bal).send({
          from: snx_account
        });

        snx_bal = await pylon.contracts.snx.methods.balanceOf(user).call();

        console.log(snx_bal)

        let a = await pylon.web3.eth.getBlock('latest');

        let starttime = await pylon.contracts.snx_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await pylon.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await pylon.contracts.snx.methods.approve(pylon.contracts.snx_pool.options.address, -1).send({from: user});

        await pylon.contracts.snx_pool.methods.stake(
          snx_bal
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await pylon.contracts.snx_pool.methods.earned(user).call();

        let rr = await pylon.contracts.snx_pool.methods.rewardRate().call();

        let rpt = await pylon.contracts.snx_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await pylon.testing.increaseTime(625000 + 100);
        // await pylon.testing.mineBlock();

        earned = await pylon.contracts.snx_pool.methods.earned(user).call();

        rpt = await pylon.contracts.snx_pool.methods.rewardPerToken().call();

        let ysf = await pylon.contracts.pylon.methods.pylonsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let pylon_bal = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let j = await pylon.contracts.snx_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await pylon.contracts.snx.methods.balanceOf(user).call()

        expect(weth_bal).toBe(snx_bal)


        let pylon_bal2 = await pylon.contracts.pylon.methods.balanceOf(user).call()

        let two_fity = pylon.toBigN(250).times(pylon.toBigN(10**3)).times(pylon.toBigN(10**18))
        expect(pylon.toBigN(pylon_bal2).minus(pylon.toBigN(pylon_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });
})
