import React, { useMemo } from "react";
import type { Tag, UnitBox as UnitBoxType, UnitMappings } from "../../types";

const THEME_COLORS = [
  { bg: "#F3E8FF", border: "#C084FC", text: "#7C3AED", label: "#6D28D9" }, // Purple
  { bg: "#DCFCE7", border: "#86EFAC", text: "#16A34A", label: "#15803D" }, // Green
  { bg: "#FEF3C7", border: "#FCD34D", text: "#D97706", label: "#B45309" }, // Amber
  { bg: "#DBEAFE", border: "#93C5FD", text: "#2563EB", label: "#1D4ED8" }, // Blue
  { bg: "#FFE4E6", border: "#FDA4AF", text: "#E11D48", label: "#BE123C" }, // Rose
  { bg: "#CCFBF1", border: "#5EEAD4", text: "#0D9488", label: "#0F766E" }, // Teal
  { bg: "#FFF7ED", border: "#FDBA74", text: "#EA580C", label: "#C2410C" }, // Orange
  { bg: "#EDE9FE", border: "#A78BFA", text: "#7C3AED", label: "#6D28D9" }, // Violet
];

const UNIT_CARD_W = 220;
const UNIT_CARD_H = 72;
const CARD_GAP = 16;
const CARDS_PER_ROW = 3;
const GROUP_PADDING = 24;
const GROUP_HEADER = 48;
const GROUP_GAP = 32;
const START_X = 40;
const START_Y = 40;

interface ThemeViewProps {
  unitBoxes: UnitBoxType[];
  unitMappings: UnitMappings;
  existingTags: Tag[];
  getCLOColor: (cloId: number) => string;
}

interface ThemeGroup {
  tag: Tag | null; // null = untagged
  units: UnitBoxType[];
  colorIdx: number;
}

export const ThemeView: React.FC<ThemeViewProps> = ({
  unitBoxes,
  unitMappings,
  existingTags,
}) => {
  const groups: ThemeGroup[] = useMemo(() => {
    const tagGroups = new Map<number, UnitBoxType[]>();
    const untagged: UnitBoxType[] = [];

    for (const unit of unitBoxes) {
      const key = unit.unitId || unit.id.toString();
      const tags = unitMappings[key]?.tags || [];
      if (tags.length === 0) {
        untagged.push(unit);
      } else {
        for (const tag of tags) {
          if (!tagGroups.has(tag.tagId)) tagGroups.set(tag.tagId, []);
          tagGroups.get(tag.tagId)!.push(unit);
        }
      }
    }

    const result: ThemeGroup[] = [];
    let colorIdx = 0;
    for (const tag of existingTags) {
      const units = tagGroups.get(tag.tagId);
      if (units && units.length > 0) {
        result.push({ tag, units, colorIdx });
        colorIdx++;
      }
    }
    if (untagged.length > 0) {
      result.push({ tag: null, units: untagged, colorIdx });
    }
    return result;
  }, [unitBoxes, unitMappings, existingTags]);

  // Calculate layout positions
  let currentY = START_Y;
  const groupLayouts = groups.map((group) => {
    const rows = Math.ceil(group.units.length / CARDS_PER_ROW);
    const groupWidth = CARDS_PER_ROW * (UNIT_CARD_W + CARD_GAP) - CARD_GAP + GROUP_PADDING * 2;
    const groupHeight = GROUP_HEADER + rows * (UNIT_CARD_H + CARD_GAP) - CARD_GAP + GROUP_PADDING * 2;
    const layout = { x: START_X, y: currentY, width: groupWidth, height: groupHeight };
    currentY += groupHeight + GROUP_GAP;
    return layout;
  });

  const totalHeight = currentY + 40;
  const totalWidth = CARDS_PER_ROW * (UNIT_CARD_W + CARD_GAP) - CARD_GAP + GROUP_PADDING * 2 + START_X * 2;

  return (
    <div className="relative bg-gray-50" style={{ width: `${Math.max(totalWidth, 1200)}px`, height: `${Math.max(totalHeight, 800)}px` }}>
      {groups.map((group, gi) => {
        const colors = THEME_COLORS[group.colorIdx % THEME_COLORS.length];
        const layout = groupLayouts[gi];
        const isUntagged = !group.tag;

        return (
          <div
            key={group.tag?.tagId ?? "untagged"}
            className="absolute rounded-2xl border-2 transition-all"
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.width,
              height: layout.height,
              backgroundColor: isUntagged ? "#F9FAFB" : colors.bg,
              borderColor: isUntagged ? "#D1D5DB" : colors.border,
            }}
          >
            {/* Group Header */}
            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isUntagged ? "#9CA3AF" : colors.text }}
              />
              <h3
                className="text-base font-bold tracking-wide"
                style={{ color: isUntagged ? "#6B7280" : colors.label }}
              >
                {isUntagged ? "Untagged" : group.tag!.tagName}
              </h3>
              <span
                className="text-xs font-medium ml-1 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isUntagged ? "#E5E7EB" : colors.border + "44",
                  color: isUntagged ? "#6B7280" : colors.text,
                }}
              >
                {group.units.length} unit{group.units.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Unit Cards */}
            <div
              className="flex flex-wrap gap-4 px-5 pb-4"
              style={{ paddingTop: 4 }}
            >
              {group.units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  style={{ width: UNIT_CARD_W, height: UNIT_CARD_H }}
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: unit.color || "#3B82F6" }}
                  />
                  <div className="px-3 py-2">
                    <div className="text-xs font-bold text-blue-700 truncate">
                      {unit.unitId || unit.name}
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate mt-0.5">
                      {unit.name}
                    </div>
                    {unit.credits && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {unit.credits} credits
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">No units on canvas</p>
            <p className="text-sm mt-1">Add units and assign tags to see theme groupings</p>
          </div>
        </div>
      )}
    </div>
  );
};
