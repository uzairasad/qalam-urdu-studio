import { DocumentProject } from '../types/inpage';
import { saveFile } from '../platform/native';
import { encodeInPageText } from './inpageText';
import { projectToPlainText } from './exportTxt';

/**
 * Strips extension from project filename cleanly.
 */
export function getProjectBaseName(fileName: string): string {
  return (fileName || 'Qalam_Document').replace(/\.(qlm|qpg|inp|b0\d|json)$/i, '') || 'Qalam_Document';
}

/**
 * Writes the document's text in classic InPage encoding, as a .txt file that InPage 2000, XP
 * 2004 and 2005 can bring in with File → Import (the same format their File → Export writes).
 * Layout isn't carried over: InPage text import is text only.
 */
export async function exportForInPage(project: DocumentProject): Promise<{ saved: string | null; unmappable: number }> {
  const { bytes, unmappable } = encodeInPageText(projectToPlainText(project, false));
  const outName = `${getProjectBaseName(project.fileName)} (InPage).txt`;
  const saved = await saveFile(outName, bytes, 'text/plain');
  return { saved, unmappable };
}
