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

export interface UnitLearningOutcome {
  uloId?: number | null;
  uloDesc: string;
  unitId: string;
  cloId?: number | null;
  cloIds?: number[];
  assessmentIds?: number[];
}

export interface Assessment {
  assessmentId?: number | null;
  aDesc: string;
  unitId?: string;
  assessmentType?: string;
  assessmentConditions?: string;
  hurdleReq?: number | null;
  unitLosIds?: number[];
export interface unitLearningOutcome {
  id?: number;
  uloId?: number | null;
  uloDesc: string;
  unitId: string;
  cloId?: string;
}

export interface unitLearningOutcomeBox {
  id?: number;
  uloId?: number | null;
  uloDesc: string;
  unitId: string;
  cloId?: string;
  x: number;
  y: number;
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
  relationshipType:
    | "PREREQUISITE"
    | "COREQUISITE"
    | "PROGRESSION"
    | "CONNECTED";
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
  width?: number;
  semester?: number;
  year?: number;
}

export type AssessmentType =
  | "Artefact"
  | "Demonstration"
  | "Examination"
  | "Exercise"
  | "Performance"
  | "Portfolio"
  | "Presentation"
  | "Project"
  | "Quiz / Test"
  | "Work integrated"
  | "Written"
  | null;

export interface Assessment {
  //Frontend ID
  id: number;
  dbID: number | null;
  description: string;
  unitId: string;
  type: AssessmentType;
  name: string;
  value: number | null;
  hurdleReq: number | null;
  dueWeek: number[];
  conditions: string;
  feedbackWeek: number[];
  feedbackDetails: string[];
  x: number;
  y: number;
}

export interface AssessmentBox {
  id: number;
  dbID: number | null;
  description: string;
  unitId: string;
  type: AssessmentType;
  name: string;
  value: number | null;
  hurdleReq: number | null;
  dueWeek: number[];
  conditions: string;
  feedbackWeek: number[];
  feedbackDetails: string[];
  x: number;
  y: number;
}

export interface UnitMapping {
  clos: CourseLearningOutcome[];
  tags: Tag[];
}

// Record type for unit mappings keyed by unitId
export type UnitMappings = Record<string, UnitMapping>;

export interface TeachingActivity {
  id: number;
  activityId: number | null;
  name: string;
  description: string;
  type: string;
  unitId: string;
  x: number;
  y: number;
}

export interface TAAssessmentLink {
  activityId: number;
  assessmentId: number;
  unitId: string;
  reversed: boolean;
}

export interface TAULOLink {
  activityId: number;
  uloId: number;
  unitId: string;
  reversed: boolean;
}

export interface AssessmentRelationshipLink {
  assessmentId: number;
  relatedId: number;
  unitId: string;
}

export interface TARelationship {
  sourceId: number;
  targetId: number;
  unitId: string;
}
