import { DocumentProject } from '../types/inpage';
import { saveFile } from '../platform/native';

/**
 * Strips extension from project filename cleanly.
 */
export function getProjectBaseName(fileName: string): string {
  return (fileName || 'Qalam_Document').replace(/\.(qlm|qpg|inp|json)$/i, '') || 'Qalam_Document';
}

/**
 * Saves the full editable document with a `.inp` extension.
 */
export async function downloadProjectAsInp(project: DocumentProject): Promise<string | null> {
  const baseName = getProjectBaseName(project.fileName);
  const outName = `${baseName}.inp`;
  const payload = {
    ...project,
    fileName: outName,
    savedBy: 'Qalam Urdu Studio',
  };
  return saveFile(outName, JSON.stringify(payload, null, 2), 'application/json');
}
