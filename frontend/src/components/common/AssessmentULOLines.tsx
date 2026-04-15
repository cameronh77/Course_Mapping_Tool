import React from "react";
import type { AssessmentBox, unitLearningOutcomeBox, AssessmentRelationshipLink } from "../../types";

const BOX_WIDTH = 256;
const BOX_HEIGHT = 100;

export interface AssessmentULOLink {
  assessmentId: number;
  uloId: number;
  unitId: string;
  reversed?: boolean;
}

interface AssessmentULOLinesProps {
  links: AssessmentULOLink[];
  assessmentRelationships: AssessmentRelationshipLink[];
  assessmentBoxes: AssessmentBox[];
  uloBoxes: unitLearningOutcomeBox[];
  hoveredItem: string | null;
  onDeleteLink: (assessmentId: number, uloId: number) => void;
  onDeleteAssessmentRelationship: (assessmentId: number, relatedId: number) => void;
}

// For each box, compute the 4 edge midpoints
type EdgePoint = { x: number; y: number; angle: number };

const getEdgeMidpoints = (box: { x: number; y: number }): EdgePoint[] => [
  { x: box.x + BOX_WIDTH / 2, y: box.y, angle: -Math.PI / 2 },              // top
  { x: box.x + BOX_WIDTH, y: box.y + BOX_HEIGHT / 2, angle: 0 },            // right
  { x: box.x + BOX_WIDTH / 2, y: box.y + BOX_HEIGHT, angle: Math.PI / 2 },  // bottom
  { x: box.x, y: box.y + BOX_HEIGHT / 2, angle: Math.PI },                   // left
];

const getConnectionPath = (
  source: { x: number; y: number },
  target: { x: number; y: number },
  linkIndex: number
) => {
  const fanOffset = (linkIndex % 5) * 8 - 16;

  // Pick the pair of edge midpoints with shortest distance
  const sourceEdges = getEdgeMidpoints(source);
  const targetEdges = getEdgeMidpoints(target);

  let bestDist = Infinity;
  let bestSource = sourceEdges[0];
  let bestTarget = targetEdges[0];

  for (const se of sourceEdges) {
    for (const te of targetEdges) {
      const dx = se.x - te.x;
      const dy = se.y - te.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestSource = se;
        bestTarget = te;
      }
    }
  }

  // Apply fan offset perpendicular to the connection direction
  const isVertical =
    Math.abs(bestSource.angle) === Math.PI / 2 &&
    Math.abs(bestTarget.angle) === Math.PI / 2;
  const sx = bestSource.x + (isVertical ? fanOffset : 0);
  const sy = bestSource.y + (isVertical ? 0 : fanOffset);
  const endX = bestTarget.x + (isVertical ? fanOffset : 0);
  const endY = bestTarget.y + (isVertical ? 0 : fanOffset);

  // Control point distance scales with gap between the points
  const dist = Math.sqrt((endX - sx) ** 2 + (endY - sy) ** 2);
  const cpDist = Math.max(50, dist * 0.4);

  // Control points extend outward from each edge in the edge's normal direction
  const cp1x = sx + Math.cos(bestSource.angle) * cpDist;
  const cp1y = sy + Math.sin(bestSource.angle) * cpDist;
  const cp2x = endX + Math.cos(bestTarget.angle) * cpDist;
  const cp2y = endY + Math.sin(bestTarget.angle) * cpDist;

  const d = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  // Arrow points into the target edge
  const angle = bestTarget.angle + Math.PI; // reverse — points toward the box

  return { d, endX, endY, angle };
};

export const AssessmentULOLines: React.FC<AssessmentULOLinesProps> = ({
  links,
  assessmentRelationships,
  assessmentBoxes,
  uloBoxes,
  hoveredItem,
  onDeleteLink,
  onDeleteAssessmentRelationship,
}) => {
  const arrowLength = 12;
  const arrowAngle = Math.PI / 6;

  return (
    <>
      {/* Assessment ↔ Assessment links — amber */}
      {assessmentRelationships.map((rel, index) => {
        const source = assessmentBoxes.find(
          (a) => a.dbID === rel.assessmentId || a.id === rel.assessmentId
        );
        const target = assessmentBoxes.find(
          (a) => a.dbID === rel.relatedId || a.id === rel.relatedId
        );
        if (!source || !target) return null;

        const { d, endX, endY, angle } = getConnectionPath(source, target, index);
        const linkKey = `assess-assess-${rel.assessmentId}-${rel.relatedId}`;
        const isRelated =
          hoveredItem &&
          (hoveredItem === `assessment-${rel.assessmentId}` ||
            hoveredItem === `assessment-${rel.relatedId}`);

        return (
          <g
            key={linkKey}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              opacity: hoveredItem ? (isRelated ? 1 : 0.15) : 0.5,
              filter: isRelated
                ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))"
                : "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
            onClick={() => onDeleteAssessmentRelationship(rel.assessmentId, rel.relatedId)}
          >
            <path d={d} stroke="#F59E0B" strokeWidth={isRelated ? "4.5" : "3"} fill="none" strokeDasharray="6 3" className="transition-all duration-200" />
            <polygon
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill="#F59E0B"
            />
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}

      {/* Assessment ↔ ULO links — purple */}
      {links.map((link, index) => {
        const assessment = assessmentBoxes.find(
          (a) => a.dbID === link.assessmentId || a.id === link.assessmentId
        );
        const ulo = uloBoxes.find(
          (u) => u.uloId === link.uloId || u.id === link.uloId
        );
        if (!assessment || !ulo) return null;

        const src = link.reversed ? ulo : assessment;
        const tgt = link.reversed ? assessment : ulo;
        const { d, endX, endY, angle } = getConnectionPath(src, tgt, index);
        const linkKey = `${link.assessmentId}-${link.uloId}`;

        const isRelated =
          hoveredItem &&
          (hoveredItem === `assessment-${link.assessmentId}` ||
            hoveredItem === `ulo-${link.uloId}`);

        return (
          <g
            key={linkKey}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              opacity: hoveredItem ? (isRelated ? 1 : 0.15) : 0.5,
              filter:
                isRelated && hoveredItem
                  ? "drop-shadow(0 0 4px rgba(139,92,246,0.4))"
                  : "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
            onClick={() => onDeleteLink(link.assessmentId, link.uloId)}
          >
            <path
              d={d}
              stroke="#8B5CF6"
              strokeWidth={isRelated ? "4.5" : "3"}
              fill="none"
              className="transition-all duration-200"
            />
            <polygon
              points={`${endX},${endY} ${
                endX - arrowLength * Math.cos(angle - arrowAngle)
              },${endY - arrowLength * Math.sin(angle - arrowAngle)} ${
                endX - arrowLength * Math.cos(angle + arrowAngle)
              },${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill="#8B5CF6"
            />
            {/* Wider hit area for clicking */}
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}
    </>
  );
};

interface OrphanWarningsProps {
  assessmentBoxes: AssessmentBox[];
  uloBoxes: unitLearningOutcomeBox[];
  links: AssessmentULOLink[];
}

export const OrphanWarnings: React.FC<OrphanWarningsProps> = ({
  assessmentBoxes,
  uloBoxes,
  links,
}) => {
  const linkedAssessmentIds = new Set(links.map((l) => l.assessmentId));
  const linkedUloIds = new Set(links.map((l) => l.uloId));

  return (
    <>
      {/* Unaligned assessments — no ULO linked */}
      {assessmentBoxes.map((a) => {
        const id = a.dbID ?? a.id;
        if (linkedAssessmentIds.has(id)) return null;
        return (
          <div
            key={`warn-assessment-${a.id}`}
            className="absolute pointer-events-none"
            style={{ left: a.x + BOX_WIDTH - 8, top: a.y - 8 }}
          >
            <div
              className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold"
              title="No ULO linked to this assessment"
            >
              !
            </div>
          </div>
        );
      })}

      {/* Orphaned ULOs — no assessment linked */}
      {uloBoxes.map((u) => {
        const id = u.uloId ?? u.id;
        if (!id || linkedUloIds.has(id)) return null;
        return (
          <div
            key={`warn-ulo-${u.id}`}
            className="absolute pointer-events-none"
            style={{ left: (u.x ?? 0) + BOX_WIDTH - 8, top: (u.y ?? 0) - 8 }}
          >
            <div
              className="w-6 h-6 rounded-full bg-red-400 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold"
              title="No assessment linked to this ULO"
            >
              !
            </div>
          </div>
        );
      })}
    </>
  );
};
