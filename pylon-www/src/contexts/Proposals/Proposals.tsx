import React, { useCallback, useEffect, useState } from 'react'

import usePylon from '../../hooks/usePylon'
import { getProposals } from '../../pylonUtils'

import Context from './context'
import { Proposal } from './types'


const Proposals: React.FC = ({ children }) => {

  const [proposals, setProposals] = useState<Proposal[]>([])
  const pylon = usePylon()
  
  const fetchProposals = useCallback(async () => {
    const propsArr: Proposal[] = await getProposals(pylon)

    setProposals(propsArr)
  }, [pylon, setProposals])

  useEffect(() => {
    if (pylon) {
      fetchProposals()
    }
  }, [pylon, fetchProposals])

  return (
    <Context.Provider value={{ proposals }}>
      {children}
    </Context.Provider>
  )
}

export default Proposals
