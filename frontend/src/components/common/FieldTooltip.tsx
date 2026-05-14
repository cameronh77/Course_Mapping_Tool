import React from "react";

interface FieldTooltipProps {
  text: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({ text }) => (
  <span className="relative inline-flex items-center group/tip ml-1.5 align-middle">
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help select-none leading-none">
      ?
    </span>
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 text-white text-xs rounded-md px-2.5 py-2 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-[9999] leading-snug shadow-lg whitespace-normal">
      {text}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </span>
  </span>
);
