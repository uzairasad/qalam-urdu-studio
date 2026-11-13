import { jsPDF } from 'jspdf';
import { DocumentProject } from '../types/inpage';
import { renderPageToCanvas } from './exportPng';
import { getProjectBaseName } from './exportInpage';
import { saveFile } from '../platform/native';

/**
 * Exports all pages of a Qalam Urdu Studio project into a multi-page PDF
 * matched 1:1 to the document's exact physical millimeter dimensions.
 */
export async function exportProjectToPdf(project: DocumentProject): Promise<string | null> {
  const { pageSetup, pages, masterElements, fileName } = project;
  const widthMm = pageSetup.widthMm;
  const heightMm = pageSetup.heightMm;
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    // 2.5x DPI (~240 DPI) provides sharp Nastaliq curves while keeping file size fast
    const canvas = await renderPageToCanvas(
      pageSetup,
      page.elements,
      masterElements,
      page.pageNumber,
      2.5
    );

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  }

  const baseName = getProjectBaseName(fileName);
  const outName = `${baseName}.pdf`;
  return saveFile(outName, pdf.output('blob'), 'application/pdf');
}
