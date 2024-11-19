import React from 'react'
import ConnectWallet from '../../components/ConnectWallet'

const Navbar = () => {
  return (
    <div className='flex justify-between items-center'>
      <div className="">
        <h3
          className="text-2xl font-bold text-zinc-300" 
        >
          ckSCRIBE
        </h3>
      </div>
      <div className="">
       <ConnectWallet />
      </div>
    </div>
  )
}

export default Navbar