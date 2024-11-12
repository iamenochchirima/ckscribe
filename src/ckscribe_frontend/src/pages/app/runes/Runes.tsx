import { useEffect, useState } from "react"
import Etcher from "./components/etch/Etcher"
import Browse from "./components/browse/Browse"
import MyRunes from "./components/myrunes/MyRunes"
import { fetchRunesData } from "../../../api/runes"

const Runes = () => {
  const [show, setShow] = useState("browse")
  const [runes, setRunes] = useState<any[]>([]);
  const [address, setAddress] = useState("mxwv4Z59t2mYgfk27F1GwyschHMoscFC7w");
  const [utxos, setUtxos] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchRunesData();
        setRunes(data);
      } catch (error) {
        console.error("Error loading runes:", error);
      }
    };

    getData();
  }, []);


  return (
    // Your component
    <div className="bg-gradient-to-b from-gray-950 to-blue-950 text-white min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className=" p-6 shadow-lg">
          <ul className="flex  justify-center gap-4">
            <li>
              <button
                onClick={() => setShow("browse")}
                className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Browse
              </button>
            </li>
            <li>
              <button
                onClick={() => setShow("etch")}
                className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Etch Rune
              </button>
            </li>
            <li>
              <button
                onClick={() => setShow("my-runes")}
                className="w-full text-xl font-semibold text-center py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                My Runes
              </button>
            </li>
          </ul>
        </div>

        <div className="container bg-gray-900">
          {show === "browse" && <Browse {...{runes}} />}
          {show === "etch" && <Etcher />}
          {show === "my-runes" && <MyRunes />}
        </div>
      </div>
    </div>

  )
}

export default Runes