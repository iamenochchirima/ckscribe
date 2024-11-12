import React, { useState } from 'react'
import RuneModal from './RuneModal';

const RuneCard = ({ rune }) => {
    const [selectedRune, setSelectedRune] = useState(rune);
    const [showModal, setShowModal] = useState(false);


    return (
        <div className="">
            <div
                className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={() => {
                    setSelectedRune(rune);
                    setShowModal(true);
                }}
            >
                <h3 className="text-xl font-semibold mb-2 truncate">{rune.spaced_rune}</h3>
                <p className="text-sm text-gray-400">Block: {rune.block}</p>
                <p className="text-sm text-gray-400">Symbol: {rune.symbol}</p>
            </div>
            {showModal && <RuneModal selectedRune={selectedRune} closeModal={() => setShowModal(false)} />}
        </div>
    )
}

export default RuneCard