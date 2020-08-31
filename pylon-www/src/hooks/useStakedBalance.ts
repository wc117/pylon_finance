import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getStaked } from '../pylonUtils'
import usePylon from './usePylon'

const useStakedBalance = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const pylon = usePylon()

  const fetchBalance = useCallback(async () => {
    const balance = await getStaked(pylon, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, pylon])

  useEffect(() => {
    if (account && pool && pylon) {
      fetchBalance()
    }
  }, [account, pool, setBalance, pylon])

  return balance
}

export default useStakedBalance