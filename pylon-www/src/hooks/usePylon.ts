import { useContext } from 'react'
import { Context } from '../contexts/PylonProvider'

const usePylon = () => {
  const { pylon } = useContext(Context)
  return pylon
}

export default usePylon