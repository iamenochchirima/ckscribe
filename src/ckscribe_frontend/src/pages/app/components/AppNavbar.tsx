import React from 'react'
import { Link } from 'react-router-dom'

const AppNavbar = () => {
  return (
    <div className='flex justify-between items-center text-lg'>
      <div className="">
        <h3
          className="text-2xl font-bold text-zinc-300"
        >
          ckSCRIBE
        </h3>
      </div>
      <div className="">
        <ul className='flex items-center gap-4 '>
          <li>
            <Link to="/runes">
              Runes
            </Link>
          </li>
          <li>
            <Link to="/ordinals">
              Ordinals
            </Link>
          </li>
          <li>
            <Link to="/brc20">
              BRC20
            </Link>
          </li>
          <li>
            <Link to="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <button
              className="px-3 py-1  text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          </li>
        </ul>

      </div>
    </div>
  )
}

export default AppNavbar