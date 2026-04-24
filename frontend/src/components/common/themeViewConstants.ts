import type { Tag } from "../../types";

// Layout
export const UNIT_CARD_W = 200;
export const UNIT_CARD_H = 68;
export const CARD_GAP = 12;
export const GROUP_PADDING = 16;
export const GROUP_HEADER_H = 44;
export const CARDS_PER_ROW = 3;
export const GROUP_W = CARDS_PER_ROW * (UNIT_CARD_W + CARD_GAP) - CARD_GAP + GROUP_PADDING * 2;
export const GROUPS_PER_ROW = 2;
export const GROUP_COL_GAP = 40;
export const GROUP_ROW_GAP = 40;
export const CANVAS_PAD = 40;

export const THEME_COLORS = [
  { bg: "#F3E8FF", border: "#C084FC", text: "#7C3AED", label: "#6D28D9" },
  { bg: "#DCFCE7", border: "#86EFAC", text: "#16A34A", label: "#15803D" },
  { bg: "#FEF3C7", border: "#FCD34D", text: "#D97706", label: "#B45309" },
  { bg: "#DBEAFE", border: "#93C5FD", text: "#2563EB", label: "#1D4ED8" },
  { bg: "#FFE4E6", border: "#FDA4AF", text: "#E11D48", label: "#BE123C" },
  { bg: "#CCFBF1", border: "#5EEAD4", text: "#0D9488", label: "#0F766E" },
  { bg: "#FFF7ED", border: "#FDBA74", text: "#EA580C", label: "#C2410C" },
  { bg: "#EDE9FE", border: "#A78BFA", text: "#7C3AED", label: "#6D28D9" },
];

// Types
export type GroupKey = string;

export interface GroupMeta {
  key: GroupKey;
  tag: Tag;
  colorIdx: number;
}

export function getGroupHeight(unitCount: number): number {
  const rows = Math.max(1, Math.ceil(unitCount / CARDS_PER_ROW));
  return GROUP_HEADER_H + GROUP_PADDING + rows * (UNIT_CARD_H + CARD_GAP);
}

export function getTagColor(
  tagId: number | undefined | null,
  existingTags: Pick<Tag, "tagId">[]
): typeof THEME_COLORS[number] {
  const idx = existingTags.findIndex((t) => t.tagId === tagId);
  const safeIdx = idx >= 0 ? idx : 0;
  return THEME_COLORS[safeIdx % THEME_COLORS.length];
}
