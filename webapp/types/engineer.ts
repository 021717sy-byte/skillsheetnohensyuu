export interface Engineer {
  rowIndex: number; // actual Google Sheets row number (2-based)

  // Stored in spreadsheet
  name: string;           // 氏名
  kana: string;           // カナ
  dateOfBirth: string;    // 生年月日
  employmentType: string; // 雇用形態
  partnerName: string;    // パートナー名
  customer: string;       // 顧客
  projectName: string;    // 案件名
  workContent: string;    // 業務内容
  skills: string;         // スキル
  estimatedEndDate: string; // 終了見込み
  salesRep: string;       // 営業担当
  participationDate: string; // 参画日
  contractUnit: string;   // 契約単位
  fixedTerm: string;      // 有期(雇用期間)
  projectContractPeriod: string; // 案件契約期間
  contractAmount: number | string; // 契約金額
  salary: number | string;         // 給料
  cost: number | string;           // 原価
  department: string;     // 部署
  location: string;       // 場所
  personInCharge: string; // 担当者名
  lending: string;        // 貸出

  // Computed fields (not stored in spreadsheet)
  age: number | null;
  generation: string;     // 年代 (e.g. 20代)
  grossProfit16: number | null; // 粗利-16
  grossProfit10: number | null; // 粗利-10
  grossProfit30: number | null; // 粗利+30
}

export type EngineerInput = Omit<Engineer, 'age' | 'generation' | 'grossProfit16' | 'grossProfit10' | 'grossProfit30'>;

export const FIELD_LABELS: Record<keyof Engineer, string> = {
  rowIndex: 'Row',
  name: '氏名',
  kana: 'カナ',
  dateOfBirth: '生年月日',
  age: '年齢',
  generation: '年代',
  employmentType: '雇用形態',
  partnerName: 'パートナー名',
  customer: '顧客',
  projectName: '案件名',
  workContent: '業務内容',
  skills: 'スキル',
  estimatedEndDate: '終了見込み',
  salesRep: '営業担当',
  participationDate: '参画日',
  contractUnit: '契約単位',
  fixedTerm: '有期(雇用期間)',
  projectContractPeriod: '案件契約期間',
  contractAmount: '契約金額',
  salary: '給料',
  cost: '原価',
  grossProfit16: '粗利-16',
  grossProfit10: '粗利-10',
  grossProfit30: '粗利+30',
  department: '部署',
  location: '場所',
  personInCharge: '担当者名',
  lending: '貸出',
};

// Display order for table columns (excluding rowIndex)
export const COLUMN_ORDER: (keyof Engineer)[] = [
  'name',
  'kana',
  'dateOfBirth',
  'age',
  'generation',
  'employmentType',
  'partnerName',
  'customer',
  'projectName',
  'workContent',
  'skills',
  'estimatedEndDate',
  'salesRep',
  'participationDate',
  'contractUnit',
  'fixedTerm',
  'projectContractPeriod',
  'contractAmount',
  'salary',
  'cost',
  'grossProfit16',
  'grossProfit10',
  'grossProfit30',
  'department',
  'location',
  'personInCharge',
  'lending',
];

export const COMPUTED_FIELDS: (keyof Engineer)[] = ['age', 'generation', 'grossProfit16', 'grossProfit10', 'grossProfit30'];

/** Alias — same list, used in components */
export const COMPUTED_READONLY = COMPUTED_FIELDS;
