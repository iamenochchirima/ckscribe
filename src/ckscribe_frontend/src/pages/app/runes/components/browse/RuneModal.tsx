import { IoMdClose } from "react-icons/io";

const RuneModal = ({ selectedRune, closeModal }) => {
    return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="relative bg-gray-800 text-white p-8 rounded-lg shadow-lg w-11/12 sm:w-1/2">
        <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all duration-300"
        >
            <IoMdClose size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">{selectedRune.spaced_rune}</h2>
        <p className="text-sm text-gray-400 mb-4">Block: {selectedRune.block}</p>
        <p className="text-sm text-gray-400 mb-4">Etching: {selectedRune.etching}</p>
        <p className="text-sm text-gray-400 mb-4">Number: {selectedRune.number}</p>
        <p className="text-sm text-gray-400 mb-4">Symbol: {selectedRune.symbol}</p>
        <p className="text-sm text-gray-400 mb-4">Amount: {selectedRune.terms.amount}</p>
        <p className="text-sm text-gray-400 mb-4">Cap: {selectedRune.terms.cap}</p>
        <p className="text-sm text-gray-400 mb-4">Turbo: {selectedRune.turbo ? "Yes" : "No"}</p>
        <p className="text-sm text-gray-400 mb-4">Timestamp: {new Date(selectedRune.timestamp * 1000).toLocaleString()}</p>
    </div>
</div>

    )
}

export default RuneModal