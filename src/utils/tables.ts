import type { TableElement } from '../types/inpage.ts';

/** Column widths as percentages of the table, first column first (equal when unset). */
export function tableColumnPercents(tbl: Pick<TableElement, 'colWidths' | 'data'>): number[] {
  const cols = Math.max(1, tbl.data[0]?.length ?? tbl.colWidths?.length ?? 1);
  // Widths that no longer match the columns (one was added or deleted) fall back to equal.
  const w = tbl.colWidths && tbl.colWidths.length === cols ? tbl.colWidths : new Array(cols).fill(1);
  const total = w.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  return w.map((v) => (Math.max(0, v) / total) * 100);
}
