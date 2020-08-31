import { useCallback } from 'react'

import { useWallet } from 'use-wallet'

import { delegate } from '../pylonUtils'
import usePylon from './usePylon'

const useDelegate = (address?: string) => {
  const { account } = useWallet()
  const pylon = usePylon()

  const handleDelegate = useCallback(async () => {
    const txHash = await delegate(pylon ,address || account, account)
    console.log(txHash)
  }, [account, address])

  return { onDelegate: handleDelegate }
}

export default useDelegate