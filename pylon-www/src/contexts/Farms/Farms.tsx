import React, { useCallback, useEffect, useState } from "react";

import { Contract } from "web3-eth-contract";

import { pylon as pylonAddress } from "../../constants/tokenAddresses";
import usePylon from "../../hooks/usePylon";
import { getPoolContracts } from "../../pylonUtils";

import Context from "./context";
import { Farm } from "./types";

// const NAME_FOR_POOL: { [key: string]: string } = {
//   eth_pool: 'Weth Homestead',
//   yam_pool: 'YAM',
//   crv_pool: 'Curvy Fields',
//   yfi_pool: 'YFI Farm',
//   yfii_pool: 'YFII Farm',
//   comp_pool: 'Compounding Hills',
//   link_pool: 'Marine Gardens',
//   lend_pool: 'Aave Agriculture',
//   snx_pool: 'Spartan Grounds',
//   mkr_pool: 'Maker Range',
//   ycrvUNIV_pool: 'Eternal Lands',
// }

// const ICON_FOR_POOL: { [key: string]: string } = {
//   yfi_pool: '🐋',
//   yfii_pool: '🦈',
//   yam_pool: '🍠',
//   eth_pool: '🌎',
//   crv_pool: '🚜',
//   comp_pool: '💸',
//   link_pool: '🔗',
//   lend_pool: '🏕️',
//   snx_pool: '⚔️',
//   mkr_pool: '🐮',
//   ycrvUNIV_pool: '🌈',
// }

const NAME_FOR_POOL: { [key: string]: string } = {
  eth_pool: "Nexus",
  comp_pool: "Gateway",
  // link_pool: 'Marine Gardens',
  lend_pool: "Robotics Facility",
  snx_pool: "Fleet Beacon",
  btc_pool: "Shield Battery",
  yalink_pool: "Photon Cannon",
  ycrvUNIV_pool: "Twilight Council",
};

const ICON_FOR_POOL: { [key: string]: string } = {
  eth_pool: "nexus.png",
  comp_pool: "gateway.png",
  // link_pool: '🔗',
  lend_pool: "robotics_facility.png",
  snx_pool: "fleet_beacon.png",
  btc_pool: "shield_battery.png",
  yalink_pool: "photon_cannon.png",
  ycrvUNIV_pool: "twilight_council.png",
};

// const SORT_FOR_POOL: { [key: string]: number } = {
//   yfi_pool: 0,
//   eth_pool: 1,
//   ampl_pool: 2,
//   comp_pool: 3,
//   ycrv_pool: 4,
//   link_pool: 5,
//   lend_pool: 6,
//   snx_pool: 7,
//   mkr_pool: 8,
// }

// const SORT_FOR_POOL: { [key: string]: number } = {
//   eth_pool: 6,
//   comp_pool: 2,
//   link_pool: 3,
//   lend_pool: 1,
//   snx_pool: 4,
//   btc_pool: 5,
// }

const Farms: React.FC = ({ children }) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const pylon = usePylon();

  const fetchPools = useCallback(async () => {
    const pools: { [key: string]: Contract } = await getPoolContracts(pylon);

    const farmsArr: Farm[] = [];
    const poolKeys = Object.keys(pools);

    console.log(poolKeys);

    for (let i = 0; i < poolKeys.length; i++) {
      const poolKey = poolKeys[i];
      const pool = pools[poolKey];
      let tokenKey = poolKey.replace("_pool", "");
      if (tokenKey === "eth") {
        tokenKey = "weth";
      } else if (tokenKey === "ycrvUNIV") {
        //tokenKey = 'uni_lp'
        tokenKey = "";
      } else if (tokenKey === "btc") {
        tokenKey = "wbtc";
      } else if (tokenKey === "yalink") {
        tokenKey = "link";
      }

      const method = pool.methods[tokenKey];
      if (method) {
        try {
          let tokenAddress = "";
          if (tokenKey === "uni_lp") {
            // checking
            tokenAddress = "0xEbC1E9a5D9E2FB9e5c5981b12D2062512D2847BE";
          } else {
            tokenAddress = await method().call();
          }
          farmsArr.push({
            contract: pool,
            name: NAME_FOR_POOL[poolKey],
            depositToken: tokenKey,
            depositTokenAddress: tokenAddress,
            earnToken: "pylon",
            earnTokenAddress: pylonAddress,
            icon: ICON_FOR_POOL[poolKey],
            id: tokenKey,
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
    setFarms(farmsArr);
  }, [pylon, setFarms]);

  useEffect(() => {
    if (pylon) {
      fetchPools();
    }
  }, [pylon, fetchPools]);

  return <Context.Provider value={{ farms }}>{children}</Context.Provider>;
};

export default Farms;
