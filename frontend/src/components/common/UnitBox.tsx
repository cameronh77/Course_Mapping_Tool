import React from "react";

interface UnitBoxProps {
  unitId?: string;
  unitName: string;
  color?: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

/**
 * A presentational component for displaying a unit box.
 * Can be wrapped with Draggable to make it draggable.
 */
export const UnitBox: React.FC<UnitBoxProps> = ({
  unitId,
  unitName,
  color = "#3B82F6",
  onDelete,
  showDelete = true,
}) => {
  return (
    <div className="w-64 cursor-move select-none group">
      <div className="transition-shadow duration-200 relative shadow-sm">
        <div
          className="border border-gray-300 p-4 rounded shadow-sm hover:shadow-md transition-shadow duration-300"
          style={{
            backgroundColor: color,
            color: "white",
          }}
        >
          <h2 className="text-lg font-semibold text-center text-white">
            {unitId || unitName}
          </h2>
        </div>

        {/* Delete button - appears on hover */}
        {showDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Delete unit"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
