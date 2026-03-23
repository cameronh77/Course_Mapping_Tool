// Unit and Canvas-related types
export interface Unit {
  unitId: string;
  unitName: string;
  unitDesc: string;
  credits: number;
  semestersOffered: number[];
}

export interface CourseLearningOutcome {
  cloId?: number | null;
  cloDesc: string;
  courseId: string | undefined;
}

export interface Tag {
  tagId: number;
  tagName: string;
  courseId: string;
}

export interface UnitRelationship {
  id: number;
  unitId: string;
  relatedId: string;
  relationshipType: "PREREQUISITE" | "COREQUISITE" | "PROGRESSION" | "CONNECTED";
  courseId: string | null;
  sId: number | null;
  entryType: number;
}

export interface UnitBox {
  id: number;
  name: string;
  unitId?: string;
  description?: string;
  credits?: number;
  semestersOffered?: number[];
  x: number;
  y: number;
  color?: string;
}

export interface UnitMapping {
  clos: CourseLearningOutcome[];
  tags: Tag[];
}

// Record type for unit mappings keyed by unitId
export type UnitMappings = Record<string, UnitMapping>;
