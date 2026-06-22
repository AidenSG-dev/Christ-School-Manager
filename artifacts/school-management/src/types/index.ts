export interface ClassInfo {
  id: string;
  name: string;
  section: string;
}

export interface Student {
  id: string;
  rollNo: number;
  name: string;
  studentId: string;
  birthDate: string;
  address: string;
  parentPhone: string;
  [key: string]: any; // For dynamic columns
}

export interface GradingRule {
  grade: string;
  min: number;
  max: number;
}

export interface AppStateData {
  academicYear: string | null;
}
