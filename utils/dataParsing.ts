import type { File } from 'buffer';
import * as XLSX from 'xlsx';

export interface ParsedChartData {
  labels: string[];
  values: number[];
  title?: string;
  type?: 'bar' | 'line' | 'pie';
  columns?: string[];
}

// Safety limits to avoid excessive memory/CPU usage on client-side parsing
const MAX_ROWS = 5000;
const MAX_COLUMNS = 50;

const parseCSV = (text: string, labelIdx = 0, valueIdx = 1, preferredType?: ParsedChartData['type']): ParsedChartData | null => {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return null;
  const header = lines[0].split(',');
  // Expect at least 2 columns: label, value
  if (header.length < 2) return null;
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 1; i < lines.length && labels.length < MAX_ROWS; i++) {
    const cells = lines[i].split(',');
    const label = cells[labelIdx]?.trim();
    const valueStr = cells[valueIdx]?.trim();
    if (!label || !valueStr) continue;
    const value = Number(valueStr.replace(',', '.'));
    if (!isNaN(value)) {
      labels.push(label);
      values.push(value);
    }
  }
  if (labels.length === 0 || values.length === 0) return null;
  return { labels, values, type: preferredType ?? 'bar', columns: header.slice(0, MAX_COLUMNS) };
};

const parseTSV = (text: string, labelIdx = 0, valueIdx = 1, preferredType?: ParsedChartData['type']): ParsedChartData | null => {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return null;
  const header = lines[0].split('\t');
  if (header.length < 2) return null;
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 1; i < lines.length && labels.length < MAX_ROWS; i++) {
    const cells = lines[i].split('\t');
    const label = cells[labelIdx]?.trim();
    const valueStr = cells[valueIdx]?.trim();
    if (!label || !valueStr) continue;
    const value = Number(valueStr.replace(',', '.'));
    if (!isNaN(value)) {
      labels.push(label);
      values.push(value);
    }
  }
  if (labels.length === 0 || values.length === 0) return null;
  return { labels, values, type: preferredType ?? 'line', columns: header.slice(0, MAX_COLUMNS) };
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new (window as any).FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file as unknown as Blob);
  });
};

export const parseDataFile = async (
  file: File,
  labelColumnIndex?: number,
  valueColumnIndex?: number,
  preferredType?: ParsedChartData['type']
): Promise<ParsedChartData | null> => {
  const ext = file.name.toLowerCase();
  if (ext.endsWith('.csv')) {
    const text = await file.text();
    return parseCSV(text, labelColumnIndex ?? 0, valueColumnIndex ?? 1, preferredType);
  }
  if (ext.endsWith('.tsv')) {
    const text = await file.text();
    return parseTSV(text, labelColumnIndex ?? 0, valueColumnIndex ?? 1, preferredType);
  }
  if (ext.endsWith('.json')) {
    try {
      const obj = JSON.parse(await file.text());
      if (Array.isArray(obj)) {
        // Expect array of { label, value }
        const labels: string[] = [];
        const values: number[] = [];
        for (const row of obj) {
          if (row && typeof row.label === 'string' && typeof row.value === 'number') {
            labels.push(row.label);
            values.push(row.value);
            if (labels.length >= MAX_ROWS) break;
          }
        }
        if (labels.length && values.length) return { labels, values, type: preferredType ?? 'bar', columns: ['label','value'] };
      }
    } catch {}
    return null;
  }
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
    const buf = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetNames = wb.SheetNames;
    const firstSheetName = sheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 2) return null;
    const header = Array.isArray(rows[0]) ? rows[0].map((c: any) => String(c ?? '')).slice(0, MAX_COLUMNS) : [];

    const normalize = (s?: any) => String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const monthTokens = ['janeiro','fevereiro','marco','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    // 1) Multi-sheet detection: months split across workbook sheets
    const monthSheetNames = sheetNames.filter(n => monthTokens.some(t => normalize(n).includes(normalize(t))));

    const readCellNumeric = (sheet: XLSX.WorkSheet, addr: string): number | null => {
      const cell = sheet?.[addr];
      if (!cell) return null;
      const raw = cell.v;
      const val = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(',', '.'));
      return isFinite(val) ? val : null;
    };

    const computeSheetTotal = (sheetRows: any[], sheet?: XLSX.WorkSheet): number | null => {
      // Preferência: célula específica H35 (pedido do usuário)
      if (sheet) {
        const h35 = readCellNumeric(sheet, 'H35');
        if (h35 !== null) return h35;
      }
      if (!sheetRows || sheetRows.length < 2) return null;
      const hdr = Array.isArray(sheetRows[0]) ? sheetRows[0].map((c: any) => String(c ?? '')) : [];
      const valueTokens = ['peso','total','peso total','kg','quantidade','valor','volume'];
      const valColIdx = hdr.findIndex(h => valueTokens.some(t => normalize(h).includes(normalize(t))));
      let sum = 0;
      let count = 0;
      if (valColIdx >= 0) {
        for (let ri = 1; ri < sheetRows.length; ri++) {
          const cell = sheetRows[ri]?.[valColIdx];
          const val = typeof cell === 'number' ? cell : Number(String(cell ?? '').replace(',', '.'));
          if (isFinite(val)) { sum += val; count++; }
          if (count >= MAX_ROWS) break;
        }
      } else {
        // Fallback: sum all numeric cells except header row
        for (let ri = 1; ri < sheetRows.length; ri++) {
          const row = sheetRows[ri];
          if (!Array.isArray(row)) continue;
          for (let ci = 0; ci < Math.min(row.length, MAX_COLUMNS); ci++) {
            const cell = row[ci];
            const val = typeof cell === 'number' ? cell : Number(String(cell ?? '').replace(',', '.'));
            if (isFinite(val)) { sum += val; count++; }
          }
          if (count >= MAX_ROWS) break;
        }
      }
      return count > 0 ? sum : null;
    };

    if (monthSheetNames.length >= 2) {
      const labelsMS: string[] = [];
      const valuesMS: number[] = [];
      for (const name of monthSheetNames) {
        const s = wb.Sheets[name];
        const r: any[] = XLSX.utils.sheet_to_json(s, { header: 1 });
        const total = computeSheetTotal(r, s);
        if (total !== null) {
          labelsMS.push(String(name));
          valuesMS.push(total);
        }
        if (labelsMS.length >= MAX_ROWS) break;
      }
      if (labelsMS.length >= 2) {
        return { labels: labelsMS, values: valuesMS, type: preferredType ?? 'bar', columns: header };
      }
      // else fallthrough to header-month detection
    }

    // Detect header-based month layout (months across columns)
    const monthColIdxs: number[] = [];
    for (let ci = 0; ci < header.length; ci++) {
      const hNorm = normalize(header[ci]);
      if (monthTokens.some(t => hNorm.includes(t))) {
        monthColIdxs.push(ci);
      }
    }

    if (monthColIdxs.length >= 2) {
      // Choose a candidate data row (prefer rows that indicate total/peso)
      const preferTokens = ['total','peso','peso total','soma','subtotal','acumulado'];
      let candidateRowIndex = -1;
      let bestNumericCount = -1;
      for (let ri = 1; ri < rows.length; ri++) {
        const row = rows[ri];
        const firstCellNorm = normalize(row?.[0]);
        const hasPrefer = preferTokens.some(t => firstCellNorm.includes(normalize(t)));
        const numericCount = monthColIdxs.reduce((acc, ci) => {
          const cell = row?.[ci];
          const val = typeof cell === 'number' ? cell : Number(String(cell ?? '').replace(',', '.'));
          return acc + (isFinite(val) ? 1 : 0);
        }, 0);
        if (hasPrefer && numericCount > 0) {
          candidateRowIndex = ri;
          break;
        }
        if (numericCount > bestNumericCount) {
          bestNumericCount = numericCount;
          candidateRowIndex = ri;
        }
      }

      const labels: string[] = [];
      const values: number[] = [];
      const candidateRow = rows[candidateRowIndex];
      for (const ci of monthColIdxs) {
        const label = String(header[ci] ?? '').trim();
        const cell = candidateRow?.[ci];
        const value = typeof cell === 'number' ? cell : Number(String(cell ?? '').replace(',', '.'));
        if (label && isFinite(value)) {
          labels.push(label);
          values.push(value);
        }
      }
      if (labels.length && values.length) {
        return { labels, values, type: preferredType ?? 'bar', columns: header };
      }
      // fallthrough to default parsing below
    }

    // Default: treat first column as label and second as value
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 1; i < rows.length && labels.length < MAX_ROWS; i++) {
      const row = rows[i];
      const label = String(row[labelColumnIndex ?? 0] ?? '').trim();
      const valCell = row[valueColumnIndex ?? 1];
      const value = typeof valCell === 'number' ? valCell : Number(String(valCell ?? '').replace(',', '.'));
      if (label && !isNaN(value)) {
        labels.push(label);
        values.push(value);
      }
    }
    if (labels.length === 0 || values.length === 0) return null;
    return { labels, values, type: preferredType ?? 'bar', columns: header };
  }
  // Unsupported format
  return null;
};