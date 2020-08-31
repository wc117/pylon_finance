import { useCallback } from 'react'

import { useWallet } from 'use-wallet'
import { Pylon } from '../pylon'
import { rebase } from '../pylonUtils'

import usePylon from '../hooks/usePylon'

const useRebase = () => {
  const { account } = useWallet()
  const pylon = usePylon()

  const handleRebase = useCallback(async () => {
    const txHash = await rebase(pylon, account)
    console.log(txHash)
  }, [account, pylon])

  return { onRebase: handleRebase }
}

export default useRebase