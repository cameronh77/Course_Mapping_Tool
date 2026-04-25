import React from "react";

// Grid Layout Constants
const COL_WIDTH = 600; 
const ROW_HEIGHT = 150; 
const START_X = 80;  
const START_Y = 80;  
const DEFAULT_YEARS = 3;
const DEFAULT_SEMESTERS = 2;
const MAX_UNITS_PER_SEM = 4; 
const UNIT_BOX_WIDTH = 256; 

interface GridBackgroundProps {
  expectedDuration?: number;
  numberTeachingPeriods?: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  expectedDuration,
  numberTeachingPeriods
}) => {
  const years = expectedDuration || DEFAULT_YEARS;
  const semestersPerYear = numberTeachingPeriods || DEFAULT_SEMESTERS;
  const totalCols = years;
  const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ minWidth: START_X + totalCols * COL_WIDTH, minHeight: START_Y + totalRows * ROW_HEIGHT + 100 }}>
      {Array.from({ length: totalCols }).map((_, col) => (
        <div key={`year-${col}`} className="absolute border-b-2 border-gray-300 flex items-center justify-center font-bold text-gray-700 text-xl" style={{ top: 20, left: START_X + col * COL_WIDTH, width: COL_WIDTH, height: 40 }}>
          Year {col + 1}
        </div>
      ))}
      {Array.from({ length: semestersPerYear }).map((_, s) => {
        const semStartY = START_Y + s * (MAX_UNITS_PER_SEM * ROW_HEIGHT);
        const semHeight = MAX_UNITS_PER_SEM * ROW_HEIGHT;
        return (
          <div key={`sem-group-${s}`}>
            <div className="absolute border-r-2 border-gray-300 bg-gray-50 flex items-center justify-center font-bold text-gray-600 uppercase tracking-widest text-lg" style={{ top: semStartY, left: 0, width: START_X, height: semHeight, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Teaching Period {s + 1}
            </div>
            {s > 0 && <div className="absolute border-t-2 border-gray-300" style={{ top: semStartY, left: 0, width: START_X + totalCols * COL_WIDTH }} />}
            {Array.from({ length: MAX_UNITS_PER_SEM }).map((_, unitInSem) => {
              const absRow = s * MAX_UNITS_PER_SEM + unitInSem;
              return (
                <div key={`sem-${s}-unit-${unitInSem}`}>
                  {Array.from({ length: totalCols }).map((_, col) => (
                    <div key={`slot-${col}-${absRow}`} className="absolute border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 flex items-center justify-center" style={{ top: START_Y + absRow * ROW_HEIGHT + 20, left: START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2, width: UNIT_BOX_WIDTH, height: 80 }}>
                      <span className="text-gray-400 font-medium text-xs opacity-50">Drop Unit Here</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
