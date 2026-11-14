import {
  DocumentProject,
  TableElement,
  TextElement,
} from '../types/inpage';
import { URDU_NUMERALS } from './phoneticKeyboard';
import { getProjectBaseName } from './exportInpage';
import { saveFile } from '../platform/native';

function resolvePageTokens(text: string, pageNumber: number, isRtl: boolean): string {
  const numStr = String(pageNumber);
  const localized = isRtl
    ? numStr.replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
    : numStr;
  return (text || '').replace(/\{\{PAGE\}\}/g, localized);
}

/** All the document's text in reading order: frames top to bottom, tables as tab-separated rows. */
export function projectToPlainText(project: DocumentProject, pageMarkers = true): string {
  const pageChunks: string[] = [];

  for (const page of project.pages) {
    const combined = [...project.masterElements, ...page.elements];
    const sorted = [...combined].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
      return project.pageSetup.direction === 'rtl' ? b.x - a.x : a.x - b.x;
    });

    const parts: string[] = [];
    for (const el of sorted) {
      if (el.type === 'text') {
        const te = el as TextElement;
        const txt = resolvePageTokens(
          te.text,
          page.pageNumber,
          (te.direction || 'rtl') === 'rtl'
        ).trim();
        if (txt) parts.push(txt);
      } else if (el.type === 'table') {
        const table = el as TableElement;
        const rowsText = table.data
          .map((row) => row.map((c) => (c || '').trim()).join('\t'))
          .filter((r) => r.trim().length > 0)
          .join('\n');
        if (rowsText) parts.push(rowsText);
      }
    }

    if (parts.length > 0) {
      const body = parts.join('\n\n');
      pageChunks.push(
        pageMarkers && project.pages.length > 1 ? `--- Page ${page.pageNumber} ---\n\n${body}` : body
      );
    }
  }

  return pageChunks.join(pageMarkers ? '\n\n\n' : '\n\n');
}

export async function exportProjectToTxt(project: DocumentProject): Promise<string | null> {
  const content = '﻿' + projectToPlainText(project);
  const baseName = getProjectBaseName(project.fileName);
  return saveFile(`${baseName}.txt`, content, 'text/plain;charset=utf-8');
}
