// Minimal Google Sheets client: reads/writes by COLUMN HEADER NAME, not by
// fixed column letter, so the owner can reorder columns in the sheet
// without breaking these functions.
import { getGoogleAccessToken } from './google-auth.ts';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

async function sheetsRequest(path: string, options: RequestInit = {}) {
  const token = await getGoogleAccessToken();
  const response = await fetch(`${SHEETS_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Sheets API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

export interface SheetRow {
  rowNumber: number; // 1-based, matches the actual spreadsheet row
  values: Record<string, string>;
}

export async function getRows(spreadsheetId: string, sheetName: string): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const data = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`);
  const [headerRow, ...dataRows] = data.values ?? [];
  if (!headerRow) return { headers: [], rows: [] };
  return {
    headers: headerRow,
    rows: dataRows.map((row: string[], index: number) => ({
      rowNumber: index + 2, // +1 for the header row, +1 to convert to 1-based
      values: headerRow.reduce((acc: Record<string, string>, header: string, i: number) => {
        acc[header] = row[i] ?? '';
        return acc;
      }, {}),
    })),
  };
}

export async function findRowByColumn(
  spreadsheetId: string,
  sheetName: string,
  column: string,
  value: string
): Promise<{ headers: string[]; row: SheetRow | null }> {
  const { headers, rows } = await getRows(spreadsheetId, sheetName);
  const needle = value.trim().toLowerCase();
  const row = rows.find((r) => (r.values[column] ?? '').trim().toLowerCase() === needle) ?? null;
  return { headers, row };
}

function columnIndexToLetter(index: number): string {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

export async function updateRowCells(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  headers: string[],
  updates: Record<string, string>
) {
  const data = Object.entries(updates).map(([column, value]) => {
    const colIndex = headers.indexOf(column);
    if (colIndex === -1) throw new Error(`Column not found in sheet: ${column}`);
    const colLetter = columnIndexToLetter(colIndex);
    return { range: `${sheetName}!${colLetter}${rowNumber}`, values: [[value]] };
  });

  await sheetsRequest(`/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
  });
}

export async function appendRow(
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  values: Record<string, string>
) {
  const row = headers.map((header) => values[header] ?? '');
  await sheetsRequest(
    `/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`,
    { method: 'POST', body: JSON.stringify({ values: [row] }) }
  );
}
