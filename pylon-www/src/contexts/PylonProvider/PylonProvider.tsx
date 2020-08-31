import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Pylon } from '../../pylon'

export interface PylonContext {
  pylon?: typeof Pylon
}

export const Context = createContext<PylonContext>({
  pylon: undefined,
})

declare global {
  interface Window {
    pylonsauce: any
  }
}

const PylonProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [pylon, setPylon] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const pylonLib = new Pylon(
        ethereum,
        "1",
        false, {
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
      setPylon(pylonLib)
      window.pylonsauce = pylonLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ pylon }}>
      {children}
    </Context.Provider>
  )
}

export default PylonProvider
