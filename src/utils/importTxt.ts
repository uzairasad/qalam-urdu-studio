import type { DocumentProject } from '../types/inpage';
import { layoutTextAsProject } from './textLayout';

export async function importTxtToProject(file: File): Promise<DocumentProject> {
  const raw = await file.text();
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const baseTitle = file.name.replace(/\.txt$/i, '') || 'Text_Import';
  return layoutTextAsProject(normalized, baseTitle, 'txt');
}
