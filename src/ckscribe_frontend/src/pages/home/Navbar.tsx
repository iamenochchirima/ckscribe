import React from 'react'

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
        <button
          className="px-3 py-1  text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  )
}

export default Navbar