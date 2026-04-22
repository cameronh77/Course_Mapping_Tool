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
  /** Keys "col:absRow" of slots that should render disabled because the
   *  teaching period's CP cap leaves no room for another 6-CP unit there. */
  blockedSlots?: Set<string>;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  expectedDuration,
  numberTeachingPeriods,
  blockedSlots
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
              Semester {s + 1}
            </div>
            {s > 0 && <div className="absolute border-t-2 border-gray-300" style={{ top: semStartY, left: 0, width: START_X + totalCols * COL_WIDTH }} />}
            {Array.from({ length: MAX_UNITS_PER_SEM }).map((_, unitInSem) => {
              const absRow = s * MAX_UNITS_PER_SEM + unitInSem;
              return (
                <div key={`sem-${s}-unit-${unitInSem}`}>
                  {Array.from({ length: totalCols }).map((_, col) => {
                    const isBlocked = blockedSlots?.has(`${col}:${absRow}`);
                    return (
                      <div
                        key={`slot-${col}-${absRow}`}
                        className={`absolute border-2 rounded-lg flex items-center justify-center ${
                          isBlocked
                            ? "border-solid border-red-200 bg-red-50/60"
                            : "border-dashed border-gray-300 bg-gray-50/50"
                        }`}
                        style={{
                          top: START_Y + absRow * ROW_HEIGHT + 20,
                          left:
                            START_X +
                            col * COL_WIDTH +
                            (COL_WIDTH - UNIT_BOX_WIDTH) / 2,
                          width: UNIT_BOX_WIDTH,
                          height: 80,
                          ...(isBlocked && {
                            backgroundImage:
                              "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(239,68,68,0.08) 6px, rgba(239,68,68,0.08) 12px)"
                          })
                        }}
                        title={
                          isBlocked
                            ? "Capacity reached — raise the period's CP cap to use this slot"
                            : undefined
                        }
                      >
                        <span
                          className={`font-medium text-xs ${
                            isBlocked
                              ? "text-red-400/80 uppercase tracking-wider"
                              : "text-gray-400 opacity-50"
                          }`}
                        >
                          {isBlocked ? "Cap Reached" : "Drop Unit Here"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
