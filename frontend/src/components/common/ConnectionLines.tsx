import React from "react";
import type { UnitRelationship, UnitBox as UnitBoxType } from "../../types";

// Grid Layout Constants
const COL_WIDTH = 600; 
const ROW_HEIGHT = 150; 
const START_X = 80;  
const START_Y = 80;  
const DEFAULT_SEMESTERS = 2;
const MAX_UNITS_PER_SEM = 4; 
const UNIT_BOX_WIDTH = 256; 

interface ConnectionLinesProps {
  relationships: UnitRelationship[];
  unitBoxes: UnitBoxType[];
  numberTeachingPeriods?: number;
  hoveredUnit?: string | null;
  onDeleteRelationship: (relationshipId: number) => void;
}

const getRelationshipColor = (type: UnitRelationship["relationshipType"]) => {
  switch (type) {
    case "PREREQUISITE": return "#EF4444";
    case "COREQUISITE": return "#F59E0B";
    case "PROGRESSION": return "#10B981";
    case "CONNECTED": return "#6366F1";
    default: return "#6B7280";
  }
};

const getCurvePath = (source: UnitBoxType, target: UnitBoxType, relId: number, numberTeachingPeriods?: number) => {
  const UNIT_HEIGHT = 80;
  const semestersPerYear = numberTeachingPeriods || DEFAULT_SEMESTERS;
  
  const sx = source.x + UNIT_BOX_WIDTH / 2;
  const sy = source.y + UNIT_HEIGHT / 2;
  const tx = target.x + UNIT_BOX_WIDTH / 2;
  const ty = target.y + UNIT_HEIGHT / 2;
  const colS = Math.max(0, Math.round((source.x - START_X) / COL_WIDTH));
  const colT = Math.max(0, Math.round((target.x - START_X) / COL_WIDTH));
  const isSameCol = colS === colT;
  const fanOffset = (relId % 7) * 15 - 45; 
  let d = "";
  let endX, endY, angle;

  if (isSameCol) {
    const startX = sx + UNIT_BOX_WIDTH / 2;
    endX = tx + UNIT_BOX_WIDTH / 2;
    endY = ty;
    const corridorX = START_X + (colS + 1) * COL_WIDTH + fanOffset;
    d = `M ${startX} ${sy} C ${corridorX} ${sy}, ${corridorX} ${ty}, ${endX} ${ty}`;
    angle = Math.PI;
  } else if (Math.abs(colS - colT) === 1) {
    const isLtoR = colT > colS;
    const startX = sx + (isLtoR ? 1 : -1) * (UNIT_BOX_WIDTH / 2);
    endX = tx + (isLtoR ? -1 : 1) * (UNIT_BOX_WIDTH / 2);
    endY = ty;
    const corridorX = START_X + Math.max(colS, colT) * COL_WIDTH + fanOffset;
    d = `M ${startX} ${sy} C ${corridorX} ${sy}, ${corridorX} ${ty}, ${endX} ${ty}`;
    angle = isLtoR ? 0 : Math.PI;
  } else {
    const isLtoR = colT > colS;
    const startX = sx + (isLtoR ? 1 : -1) * (UNIT_BOX_WIDTH / 2);
    endX = tx + (isLtoR ? -1 : 1) * (UNIT_BOX_WIDTH / 2);
    endY = ty;
    const corridor1X = START_X + (isLtoR ? colS + 1 : colS) * COL_WIDTH + fanOffset;
    const corridor2X = START_X + (isLtoR ? colT : colT + 1) * COL_WIDTH + fanOffset;
    const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
    const bottomY = START_Y + totalRows * ROW_HEIGHT + 60 + Math.abs(fanOffset) * 2;
    const midX = (corridor1X + corridor2X) / 2;
    d = `M ${startX} ${sy} C ${corridor1X} ${sy}, ${corridor1X} ${bottomY}, ${midX} ${bottomY} C ${corridor2X} ${bottomY}, ${corridor2X} ${ty}, ${endX} ${ty}`;
    angle = isLtoR ? 0 : Math.PI;
  }
  return { d, endX, endY, angle };
};

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  relationships,
  unitBoxes,
  numberTeachingPeriods,
  hoveredUnit,
  onDeleteRelationship
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      {relationships.map((rel) => {
        const sourceUnit = unitBoxes.find((u) => u.unitId === rel.unitId);
        const targetUnit = unitBoxes.find((u) => u.unitId === rel.relatedId);
        if (!sourceUnit || !targetUnit) return null;
        
        const { d, endX, endY, angle } = getCurvePath(sourceUnit, targetUnit, rel.id, numberTeachingPeriods);
        const color = getRelationshipColor(rel.relationshipType);
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;
        
        // Determine if this connection is related to the hovered unit
        const isRelated = hoveredUnit && (rel.unitId === hoveredUnit || rel.relatedId === hoveredUnit);
        
        return (
          <g 
            key={rel.id} 
            className="cursor-pointer pointer-events-auto transition-all duration-200" 
            style={{
              opacity: hoveredUnit ? (isRelated ? 1 : 0.15) : 0.5,
              filter: isRelated && hoveredUnit ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'drop-shadow(0 0 1px rgba(0,0,0,0.1))',
            }}
            onClick={() => onDeleteRelationship(rel.id)}
          >
            <path 
              d={d} 
              stroke={color} 
              strokeWidth={isRelated && hoveredUnit ? "4.5" : "3"} 
              fill="none" 
              className="transition-all duration-200"
            />
            <polygon 
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`} 
              fill={color}
              className="transition-all duration-200"
            />
            {/* Transparent hit area for easier clicking */}
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}
    </svg>
  );
};
