import React, { useState, useRef } from "react";

interface FieldTooltipProps {
  text: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({ text }) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  const hide = () => setPos(null);

  return (
    <span className="inline-flex items-center ml-1.5 align-middle">
      <span
        ref={btnRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help select-none leading-none"
      >
        ?
      </span>
      {pos && (
        <span
          className="pointer-events-none fixed w-56 bg-gray-800 text-white text-xs rounded-md px-2.5 py-2 z-[9999] leading-snug shadow-lg whitespace-normal"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, calc(-100% - 8px))",
          }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
};
