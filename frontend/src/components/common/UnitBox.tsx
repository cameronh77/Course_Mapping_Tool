import React from "react";

interface UnitBoxProps {
  unitName: string;
  onClick: () => void;
}   

export const UnitBox: React.FC<UnitBoxProps> = ({ unitName, onClick }) => {
  return (
    <button
      onClick={onClick}
      className ="w-full text-left"
    >
    <div className="border border-gray-300 rounded-md p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h2 className="text-lg font-semibold">{unitName}</h2>
    </div>
    </button>
  );
};
