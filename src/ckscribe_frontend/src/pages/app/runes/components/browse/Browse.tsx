import { useState } from "react";
import { fetchRunes } from "../../../../../api/runes";

const Browse = () => {
    const [address, setAddress] = useState("");
    const [runes, setRunes] = useState<any[]>([]);
  
    const handleFetchRunes = async () => {
      try {
        const fetchedRunes = await fetchRunes(address);
        setRunes(fetchedRunes);
      } catch (error) {
        console.error("Error fetching runes:", error);
      }
    };
  return (
    <div className=" flex flex-col items-center justify-center py-12 px-4">
  <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md">
    <h1 className="text-3xl font-bold text-center mb-6">Fetch Runes</h1>
    
    <div className="mb-4">
      <input
        type="text"
        placeholder="Enter BTC Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-3 text-lg bg-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>

    <button
      onClick={handleFetchRunes}
      className="w-full py-3 text-lg font-semibold text-white bg-blue-600 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
    >
      Fetch Runes
    </button>

    <ul className="mt-6 space-y-4 text-lg">
      {runes.map((rune, index) => (
        <li key={index} className="bg-gray-700 p-3 rounded-md shadow-md">
          <span className="font-semibold">TxID:</span> {rune.txid}, <span className="font-semibold">Amount:</span> {rune.amount} BTC
        </li>
      ))}
    </ul>
  </div>
</div>

  )
}

export default Browse