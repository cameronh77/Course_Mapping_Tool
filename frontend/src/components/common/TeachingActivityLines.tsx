import React from "react";
import type { TeachingActivity, AssessmentBox, unitLearningOutcomeBox, TAAssessmentLink, TAULOLink, TARelationship } from "../../types";

const BOX_WIDTH = 256;
const BOX_HEIGHT = 80;

type EdgePoint = { x: number; y: number; angle: number };

const getEdgeMidpoints = (box: { x: number; y: number }): EdgePoint[] => [
  { x: box.x + BOX_WIDTH / 2, y: box.y,                   angle: -Math.PI / 2 },
  { x: box.x + BOX_WIDTH,     y: box.y + BOX_HEIGHT / 2,  angle: 0 },
  { x: box.x + BOX_WIDTH / 2, y: box.y + BOX_HEIGHT,      angle: Math.PI / 2 },
  { x: box.x,                 y: box.y + BOX_HEIGHT / 2,  angle: Math.PI },
];

const getConnectionPath = (
  source: { x: number; y: number },
  target: { x: number; y: number },
  linkIndex: number
) => {
  const fanOffset = (linkIndex % 5) * 8 - 16;
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
      if (dist < bestDist) { bestDist = dist; bestSource = se; bestTarget = te; }
    }
  }

  const isVertical =
    Math.abs(bestSource.angle) === Math.PI / 2 &&
    Math.abs(bestTarget.angle) === Math.PI / 2;
  const sx   = bestSource.x + (isVertical ? fanOffset : 0);
  const sy   = bestSource.y + (isVertical ? 0 : fanOffset);
  const endX = bestTarget.x + (isVertical ? fanOffset : 0);
  const endY = bestTarget.y + (isVertical ? 0 : fanOffset);

  const dist = Math.sqrt((endX - sx) ** 2 + (endY - sy) ** 2);
  const cpDist = Math.max(50, dist * 0.4);
  const cp1x = sx   + Math.cos(bestSource.angle) * cpDist;
  const cp1y = sy   + Math.sin(bestSource.angle) * cpDist;
  const cp2x = endX + Math.cos(bestTarget.angle) * cpDist;
  const cp2y = endY + Math.sin(bestTarget.angle) * cpDist;

  const d = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  const angle = bestTarget.angle + Math.PI;
  return { d, endX, endY, angle };
};

interface TeachingActivityLinesProps {
  taAssessmentLinks: TAAssessmentLink[];
  taULOLinks: TAULOLink[];
  taRelationships: TARelationship[];
  teachingActivityBoxes: TeachingActivity[];
  assessmentBoxes: AssessmentBox[];
  uloBoxes: unitLearningOutcomeBox[];
  hoveredItem: string | null;
  onDeleteTAAssessmentLink: (activityId: number, assessmentId: number) => void;
  onDeleteTAULOLink: (activityId: number, uloId: number) => void;
  onDeleteTATALink: (sourceId: number, targetId: number) => void;
}

const arrowLength = 12;
const arrowAngle = Math.PI / 6;

export const TeachingActivityLines: React.FC<TeachingActivityLinesProps> = ({
  taAssessmentLinks,
  taULOLinks,
  taRelationships,
  teachingActivityBoxes,
  assessmentBoxes,
  uloBoxes,
  hoveredItem,
  onDeleteTAAssessmentLink,
  onDeleteTAULOLink,
  onDeleteTATALink,
}) => {
  return (
    <>
      {/* TA ↔ TA links — lime */}
      {taRelationships.map((rel, index) => {
        const source = teachingActivityBoxes.find(
          (a) => a.activityId === rel.sourceId || a.id === rel.sourceId
        );
        const target = teachingActivityBoxes.find(
          (a) => a.activityId === rel.targetId || a.id === rel.targetId
        );
        if (!source || !target) return null;

        const { d, endX, endY, angle } = getConnectionPath(source, target, index);
        const linkKey = `ta-ta-${rel.sourceId}-${rel.targetId}`;
        const isRelated =
          hoveredItem &&
          (hoveredItem === `activity-${rel.sourceId}` ||
            hoveredItem === `activity-${rel.targetId}`);

        return (
          <g
            key={linkKey}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              opacity: hoveredItem ? (isRelated ? 1 : 0.15) : 0.5,
              filter: isRelated ? "drop-shadow(0 0 4px rgba(132,204,22,0.5))" : "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
            onClick={() => onDeleteTATALink(rel.sourceId, rel.targetId)}
          >
            <path d={d} stroke="#84CC16" strokeWidth={isRelated ? "4.5" : "3"} fill="none" strokeDasharray="6 3" className="transition-all duration-200" />
            <polygon
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill="#84CC16"
            />
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}
      {/* TA ↔ Assessment links — teal */}
      {taAssessmentLinks.map((link, index) => {
        const activity = teachingActivityBoxes.find(
          (a) => a.activityId === link.activityId || a.id === link.activityId
        );
        const assessment = assessmentBoxes.find(
          (a) => a.dbID === link.assessmentId || a.id === link.assessmentId
        );
        if (!activity || !assessment) return null;

        const src = link.reversed ? assessment : activity;
        const tgt = link.reversed ? activity : assessment;
        const { d, endX, endY, angle } = getConnectionPath(src, tgt, index);
        const linkKey = `ta-assessment-${link.activityId}-${link.assessmentId}`;
        const isRelated =
          hoveredItem &&
          (hoveredItem === `activity-${link.activityId}` ||
            hoveredItem === `assessment-${link.assessmentId}`);

        return (
          <g
            key={linkKey}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              opacity: hoveredItem ? (isRelated ? 1 : 0.15) : 0.5,
              filter: isRelated ? "drop-shadow(0 0 4px rgba(20,184,166,0.4))" : "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
            onClick={() => onDeleteTAAssessmentLink(link.activityId, link.assessmentId)}
          >
            <path d={d} stroke="#14B8A6" strokeWidth={isRelated ? "4.5" : "3"} fill="none" className="transition-all duration-200" />
            <polygon
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill="#14B8A6"
            />
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}

      {/* TA → ULO links — blue */}
      {taULOLinks.map((link, index) => {
        const activity = teachingActivityBoxes.find(
          (a) => a.activityId === link.activityId || a.id === link.activityId
        );
        const ulo = uloBoxes.find(
          (u) => u.uloId === link.uloId || u.id === link.uloId
        );
        if (!activity || !ulo) return null;

        const src = link.reversed ? ulo : activity;
        const tgt = link.reversed ? activity : ulo;
        const { d, endX, endY, angle } = getConnectionPath(src, tgt, index);
        const linkKey = `ta-ulo-${link.activityId}-${link.uloId}`;
        const isRelated =
          hoveredItem &&
          (hoveredItem === `activity-${link.activityId}` ||
            hoveredItem === `ulo-${link.uloId}`);

        return (
          <g
            key={linkKey}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              opacity: hoveredItem ? (isRelated ? 1 : 0.15) : 0.5,
              filter: isRelated ? "drop-shadow(0 0 4px rgba(59,130,246,0.4))" : "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
            }}
            onClick={() => onDeleteTAULOLink(link.activityId, link.uloId)}
          >
            <path d={d} stroke="#3B82F6" strokeWidth={isRelated ? "4.5" : "3"} fill="none" className="transition-all duration-200" />
            <polygon
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill="#3B82F6"
            />
            <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
          </g>
        );
      })}
    </>
  );
};
