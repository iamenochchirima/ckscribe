import { Link } from "react-router-dom"

const Hero = () => {
  return (
    <div >
      <div className="flex justify-center w-full h-md:mt-[250px] h-sm:mt-[150px] mt-[100px]">
        <div className=" flex justify-center  w-full  items-center">
          <div className="text-center">
            <h1 className="md:text-5xl text-4xl font-bold text-blue-300">
              ckSCRIBE
            </ h1>
            <div className="mt-5">
              <p 
              className="text-xl font-bold text-gray-white"
              >
                Inscribe, Mint, Trade, and Manage Your Bitcoin Assets, All in One Place..</p>
           
            </div>
            <div className="flex ts:flex-row flex-col gap-3 mt-10 justify-center ">
              <Link  to="/dashboard" className="bg-customPink text-white px-4 py-2 rounded-lg">Launch App</Link>
              <button className="text-customPurple bg-white px-3 py-2 rounded-lg">Connect Wallet</button>
            </div>
          </div>
         
        </div>
      </div>
    </div>
  )
}

export default Hero