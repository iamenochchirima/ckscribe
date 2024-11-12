import React, { useState } from "react";
import RuneCard from "./RuneCard";

const Browse = ({ runes }) => {
  const [selectedRune, setSelectedRune] = useState(null);

  // Close the modal
  const closeModal = () => {
    setSelectedRune(null);
  };

  return (
    <div className=" text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Browse Runes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {runes.map(([id, rune]) => (
         <RuneCard key={id} rune={rune}  />
        ))}
      </div>

    </div>
  );
};

export default Browse;
