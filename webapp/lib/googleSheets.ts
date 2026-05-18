import { google } from 'googleapis';
import { Engineer, EngineerInput } from '@/types/engineer';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

// Column headers in spreadsheet (row 1) — 22 columns, A through V
export const SHEET_COLUMNS = [
  '氏名',           // A
  'カナ',           // B
  '生年月日',       // C
  '雇用形態',       // D
  'パートナー名',   // E
  '顧客',           // F
  '案件名',         // G
  '業務内容',       // H
  'スキル',         // I
  '終了見込み',     // J
  '営業担当',       // K
  '参画日',         // L
  '契約単位',       // M
  '有期(雇用期間)', // N
  '案件契約期間',   // O
  '契約金額',       // P
  '給料',           // Q
  '原価',           // R
  '部署',           // S
  '場所',           // T
  '担当者名',       // U
  '貸出',           // V
];

function computeAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  // Support multiple formats: YYYY/MM/DD, YYYY-MM-DD, YYYY年MM月DD日
  const normalized = dateOfBirth
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-');
  const birth = new Date(normalized);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function computeGeneration(age: number | null): string {
  if (age === null || age < 0) return '';
  return `${Math.floor(age / 10) * 10}代`;
}

function computeGrossProfit(contractAmount: number | string, cost: number | string, factor: number): number | null {
  const ca = typeof contractAmount === 'string' ? parseFloat(contractAmount.replace(/[,¥]/g, '')) : contractAmount;
  const c = typeof cost === 'string' ? parseFloat(cost.replace(/[,¥]/g, '')) : cost;
  if (isNaN(ca) || isNaN(c)) return null;
  return ca * factor - c;
}

function rowToEngineer(row: string[], rowIndex: number): Engineer {
  const [
    name = '',
    kana = '',
    dateOfBirth = '',
    employmentType = '',
    partnerName = '',
    customer = '',
    projectName = '',
    workContent = '',
    skills = '',
    estimatedEndDate = '',
    salesRep = '',
    participationDate = '',
    contractUnit = '',
    fixedTerm = '',
    projectContractPeriod = '',
    contractAmountRaw = '',
    salaryRaw = '',
    costRaw = '',
    department = '',
    location = '',
    personInCharge = '',
    lending = '',
  ] = row;

  const contractAmount = contractAmountRaw !== '' ? parseFloat(contractAmountRaw.replace(/[,¥]/g, '')) || contractAmountRaw : '';
  const salary = salaryRaw !== '' ? parseFloat(salaryRaw.replace(/[,¥]/g, '')) || salaryRaw : '';
  const cost = costRaw !== '' ? parseFloat(costRaw.replace(/[,¥]/g, '')) || costRaw : '';

  const age = computeAge(dateOfBirth);
  const generation = computeGeneration(age);
  const grossProfit16 = computeGrossProfit(contractAmount, cost, 1 - 0.16);
  const grossProfit10 = computeGrossProfit(contractAmount, cost, 1 - 0.10);
  const grossProfit30 = computeGrossProfit(contractAmount, cost, 1 + 0.30);

  return {
    rowIndex,
    name,
    kana,
    dateOfBirth,
    employmentType,
    partnerName,
    customer,
    projectName,
    workContent,
    skills,
    estimatedEndDate,
    salesRep,
    participationDate,
    contractUnit,
    fixedTerm,
    projectContractPeriod,
    contractAmount,
    salary,
    cost,
    department,
    location,
    personInCharge,
    lending,
    age,
    generation,
    grossProfit16,
    grossProfit10,
    grossProfit30,
  };
}

function engineerToRow(data: EngineerInput): string[] {
  return [
    data.name ?? '',
    data.kana ?? '',
    data.dateOfBirth ?? '',
    data.employmentType ?? '',
    data.partnerName ?? '',
    data.customer ?? '',
    data.projectName ?? '',
    data.workContent ?? '',
    data.skills ?? '',
    data.estimatedEndDate ?? '',
    data.salesRep ?? '',
    data.participationDate ?? '',
    data.contractUnit ?? '',
    data.fixedTerm ?? '',
    data.projectContractPeriod ?? '',
    data.contractAmount !== undefined && data.contractAmount !== '' ? String(data.contractAmount) : '',
    data.salary !== undefined && data.salary !== '' ? String(data.salary) : '',
    data.cost !== undefined && data.cost !== '' ? String(data.cost) : '',
    data.department ?? '',
    data.location ?? '',
    data.personInCharge ?? '',
    data.lending ?? '',
  ];
}

export async function getEngineers(): Promise<Engineer[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:V`,
  });

  const rows = response.data.values ?? [];
  if (rows.length === 0) return [];

  // Skip header row (row index 1), data starts at row index 2
  return rows.slice(1).map((row, idx) => rowToEngineer(row as string[], idx + 2));
}

export async function addEngineer(data: EngineerInput): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:V`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [engineerToRow(data)],
    },
  });
}

export async function updateEngineer(rowIndex: number, data: EngineerInput): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${rowIndex}:V${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [engineerToRow(data)],
    },
  });
}

export async function deleteEngineer(rowIndex: number): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get spreadsheet info to find the sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheetId = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAME
  )?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error(`Sheet "${SHEET_NAME}" not found`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

export async function ensureHeaders(): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:V1`,
  });

  const firstRow = response.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:V1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [SHEET_COLUMNS],
      },
    });
  }
}
