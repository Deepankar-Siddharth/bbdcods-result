export interface SubjectMark {
  code: string;
  name: string;
  cells?: string[];
  thTotal?: string;
  thObtained?: string;
  prTotal?: string;
  prObtained?: string;
  subTotal?: string;
  subObtained?: string;
  [key: string]: any;
}

export interface ResultData {
  rollNo: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  course?: string;
  yearLabel?: string;
  session?: string;
  examYear?: string;
  examMonth?: string;
  subjects: SubjectMark[];
  totalObtained?: string;
  grandTotal?: string;
  status?: string; // PASS/FAIL etc.
  rawHtml: string;
  fetchedAt: string;
}

export interface RankingEntry {
  rollNo: string;
  name: string;
  totalObtained: number;
  grandTotal: number;
  percentage: number;
  status: string;
  rank: number;
}

export interface BulkProgress {
  checked: number;
  collected: number;
  currentRoll: string;
  done: boolean;
  totalCollected: number;
}