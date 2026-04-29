export type ThemeCategory = {
  id: number;
  name: string;
  indexLabel: string;
  position: { x: number; y: number };
  tagIds: number[];
  courseId: string;
};

export type ThemeViewStorage = {
  groupPositions: Record<string, { x: number; y: number }>;
  groupUnits: Record<string, string[]>;
  freeUnits: Record<string, { x: number; y: number }>;
};

const storageKey = (courseId: string) => `themeView-${courseId}`;

export function loadThemeLayout(courseId: string): ThemeViewStorage | null {
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    return raw ? (JSON.parse(raw) as ThemeViewStorage) : null;
  } catch {
    return null;
  }
}

export function saveThemeLayout(courseId: string, state: ThemeViewStorage): void {
  localStorage.setItem(storageKey(courseId), JSON.stringify(state));
}
