import { Pylon } from '../../pylon'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
} from '../../pylonUtils'

const getCurrentPrice = async (pylon: typeof Pylon): Promise<number> => {
  // FORBROCK: get current PYLON price
  return gCP(pylon)
}

const getTargetPrice = async (pylon: typeof Pylon): Promise<number> => {
  // FORBROCK: get target PYLON price
  return gTP(pylon)
}

const getCirculatingSupply = async (pylon: typeof Pylon): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(pylon)
}

const getNextRebaseTimestamp = async (pylon: typeof Pylon): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(pylon) as number
  return nextRebase * 1000
}

const getTotalSupply = async (pylon: typeof Pylon): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(pylon)
}

export const getStats = async (pylon: typeof Pylon) => {
  const curPrice = await getCurrentPrice(pylon)
  const circSupply = await getCirculatingSupply(pylon)
  const nextRebase = await getNextRebaseTimestamp(pylon)
  const targetPrice = await getTargetPrice(pylon)
  const totalSupply = await getTotalSupply(pylon)
  return {
    circSupply,
    curPrice,
    nextRebase,
    targetPrice,
    totalSupply
  }
}
