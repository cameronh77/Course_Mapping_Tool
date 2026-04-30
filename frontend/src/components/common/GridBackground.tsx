import React, { useState } from "react";
import type { Pathway } from "../../types";

// Grid Layout Constants — must match UnitCanvas
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
  pathways?: Pathway[];
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  expectedDuration,
  numberTeachingPeriods,
  pathways = [],
}) => {
  const years = expectedDuration || DEFAULT_YEARS;
  const semestersPerYear = numberTeachingPeriods || DEFAULT_SEMESTERS;
  const totalCols = years;
  const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
  const totalHeight = START_Y + totalRows * ROW_HEIGHT + 100;
  const totalWidth = START_X + totalCols * COL_WIDTH;

  const [openGate, setOpenGate] = useState<number | null>(null);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ minWidth: totalWidth, minHeight: totalHeight }}
    >
      {/* ── Year headers ───────────────────────────────────────────────── */}
      {Array.from({ length: totalCols }).map((_, col) => (
        <div
          key={`year-${col}`}
          className="absolute border-b-2 border-gray-300 flex items-center justify-center font-bold text-gray-700 text-xl"
          style={{ top: 20, left: START_X + col * COL_WIDTH, width: COL_WIDTH, height: 40 }}
        >
          Year {col + 1}
        </div>
      ))}

      {/* ── Semester row groups ─────────────────────────────────────────── */}
      {Array.from({ length: semestersPerYear }).map((_, s) => {
        const semStartY = START_Y + s * (MAX_UNITS_PER_SEM * ROW_HEIGHT);
        const semHeight = MAX_UNITS_PER_SEM * ROW_HEIGHT;
        return (
          <div key={`sem-group-${s}`}>
            <div
              className="absolute border-r-2 border-gray-300 bg-gray-50 flex items-center justify-center font-bold text-gray-600 uppercase tracking-widest text-lg"
              style={{
                top: semStartY,
                left: 0,
                width: START_X,
                height: semHeight,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Teaching Period {s + 1}
            </div>
            {s > 0 && (
              <div
                className="absolute border-t-2 border-gray-300"
                style={{ top: semStartY, left: 0, width: START_X + totalCols * COL_WIDTH }}
              />
            )}
            {Array.from({ length: MAX_UNITS_PER_SEM }).map((_, unitInSem) => {
              const absRow = s * MAX_UNITS_PER_SEM + unitInSem;
              return (
                <div key={`sem-${s}-unit-${unitInSem}`}>
                  {Array.from({ length: totalCols }).map((_, col) => (
                    <div
                      key={`slot-${col}-${absRow}`}
                      className="absolute border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 flex items-center justify-center"
                      style={{
                        top: START_Y + absRow * ROW_HEIGHT + 20,
                        left: START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2,
                        width: UNIT_BOX_WIDTH,
                        height: 80,
                      }}
                    >
                      <span className="text-gray-400 font-medium text-xs opacity-50">
                        Drop Unit Here
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Pathway lane overlays ───────────────────────────────────────── */}
      {pathways.map((pathway) => {
        if (!pathway.color) return null;
        const entryYear = pathway.entryYear ?? 1;
        const entrySemester = pathway.entrySemester ?? 1;

        // The lane starts at the entry point column and runs to the end
        const startCol = entryYear - 1;
        const laneLeft = START_X + startCol * COL_WIDTH;
        const laneWidth = (totalCols - startCol) * COL_WIDTH;

        // Determine which semester rows belong to this pathway's entry semester onwards
        const entrySemIdx = entrySemester - 1; // 0-based
        const laneTop = START_Y + entrySemIdx * (MAX_UNITS_PER_SEM * ROW_HEIGHT);
        const laneHeight = totalHeight - laneTop - 20;

        const hex = pathway.color;
        const isOpen = openGate === pathway.sId;

        return (
          <React.Fragment key={`pathway-lane-${pathway.sId}`}>
            {/* Tinted column band from entry point onwards */}
            <div
              className="absolute rounded-lg"
              style={{
                top: laneTop,
                left: laneLeft,
                width: laneWidth,
                height: laneHeight,
                backgroundColor: hex + "12",
                border: `2px solid ${hex}30`,
                pointerEvents: "none",
              }}
            />

            {/* Left border accent on entry column */}
            <div
              className="absolute"
              style={{
                top: laneTop,
                left: laneLeft,
                width: 4,
                height: laneHeight,
                backgroundColor: hex,
                borderRadius: 2,
                opacity: 0.7,
                pointerEvents: "none",
              }}
            />

            {/* ── Entry gate badge ──────────────────────────────────────── */}
            <div
              className="absolute z-20"
              style={{
                top: laneTop - 14,
                left: laneLeft + 8,
                pointerEvents: "auto",
              }}
            >
              <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-md hover:brightness-90 transition-all"
                style={{ backgroundColor: hex }}
                onClick={() => setOpenGate(isOpen ? null : pathway.sId)}
                title={`${pathway.sName} — entry requirements`}
              >
                <span
                  className="w-2 h-2 rounded-full bg-white opacity-80"
                />
                {pathway.sName}
                <svg
                  className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Requirements popover */}
              {isOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-2xl z-30 overflow-hidden"
                  style={{ borderTopColor: hex, borderTopWidth: 3 }}
                >
                  <div
                    className="px-3 py-2 text-xs font-bold text-white"
                    style={{ backgroundColor: hex }}
                  >
                    Entry from Year {entryYear}, Period {entrySemester}
                  </div>

                  {pathway.description && (
                    <p className="px-3 py-2 text-xs text-gray-600 border-b border-gray-100 italic">
                      {pathway.description}
                    </p>
                  )}

                  {pathway.requirements.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-gray-400 italic">
                      No entry requirements defined.
                    </p>
                  ) : (
                    <ul className="px-3 py-2 flex flex-col gap-2">
                      {pathway.requirements.map((req, i) => {
                        const isLast = i === pathway.requirements.length - 1;
                        return (
                          <React.Fragment key={req.reqId}>
                            <li className="flex items-start gap-2">
                              <span
                                className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                                style={{ backgroundColor: hex }}
                              >
                                {req.type === "COMPLETE_UNIT" && "U"}
                                {req.type === "MIN_CREDITS" && "C"}
                                {req.type === "COMPLETE_N_FROM" && "N"}
                                {req.type === "CUSTOM" && "✓"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-800 font-medium leading-snug">
                                  {req.label}
                                </p>
                                {req.type === "COMPLETE_N_FROM" && req.unitOptions.length > 0 && (
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    From:{" "}
                                    {req.unitOptions.map((u) => u.unit.unitName).join(", ")}
                                  </p>
                                )}
                                {req.type === "COMPLETE_UNIT" && req.targetValue && (
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    Unit: {req.targetValue}
                                  </p>
                                )}
                              </div>
                            </li>
                            {!isLast && req.logicGroup && (
                              <li className="flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full bg-gray-100">
                                  {req.logicGroup}
                                </span>
                              </li>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
