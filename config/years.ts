// Academic-year configurations for BBDU Dental result retrieval.
// Each year has its own roll-number prefix and examination parameters.
// Do NOT assume all years share the same prefix. Update here when new configs are provided.

export interface YearConfig {
  key: string;          // stable id, e.g. "bds1"
  label: string;        // display name
  rollPrefix: string;   // university roll prefix
  session: string;      // academic session, e.g. "2023-24"
  year: string;         // BDS year number as string for API
  examYear: string;
  examMonth: string;
  examType: string;
  // optional: known max roll suffix (for bulk upper bound hints)
  maxSuffix?: number;
  notes?: string;
}

export const YEAR_CONFIGS: YearConfig[] = [
  {
    key: "bds1",
    label: "BDS 1st Year",
    rollPrefix: "12303210",
    session: "2023-24",
    year: "1",
    examYear: "2024",
    examMonth: "September",
    examType: "MAIN",
    maxSuffix: 99,
  },
  {
    key: "bds2",
    label: "BDS 2nd Year",
    rollPrefix: "12303210",
    session: "2024-25",
    year: "2",
    examYear: "2025",
    examMonth: "September",
    examType: "MAIN",
    maxSuffix: 99,
    notes: "Configuration to be confirmed by administrator. Prefix/session may differ.",
  },
  {
    key: "bds3",
    label: "BDS 3rd Year",
    rollPrefix: "12303210",
    session: "2025-26",
    year: "3",
    examYear: "2026",
    examMonth: "September",
    examType: "MAIN",
    maxSuffix: 99,
  },
  {
    key: "bds4",
    label: "BDS 4th Year",
    rollPrefix: "12003210",
    session: "2023-24",
    year: "4",
    examYear: "2024",
    examMonth: "September",
    examType: "MAIN",
    maxSuffix: 99,
  },
];

export function getYearConfig(key: string): YearConfig | undefined {
  return YEAR_CONFIGS.find((y) => y.key === key);
}