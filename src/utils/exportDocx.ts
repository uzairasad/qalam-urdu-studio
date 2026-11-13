import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import {
  DocElement,
  DocumentProject,
  LineElement,
  PictureElement,
  TableElement,
  TextElement,
} from '../types/inpage';
import { URDU_NUMERALS } from './phoneticKeyboard';
import { getProjectBaseName } from './exportInpage';
import { saveFile } from '../platform/native';

function mmToTwips(mm: number): number {
  return Math.round(convertMillimetersToTwip(mm));
}

function normalizeHexColor(color?: string, fallback = '111827'): string {
  if (!color || color === 'transparent') return fallback;
  const cleaned = color.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toUpperCase();
  }
  return fallback;
}

function localizePageTokens(text: string, pageNumber: number, isRtl: boolean): string {
  const pageStr = isRtl
    ? String(pageNumber).replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
    : String(pageNumber);
  return (text || '').replace(/\{\{PAGE\}\}/g, pageStr);
}

function mapAlignment(align?: string, isRtl = true) {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'left':
      return AlignmentType.LEFT;
    case 'justify':
      return AlignmentType.BOTH;
    case 'right':
    default:
      return isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  }
}

async function loadImageBuffer(
  src: string
): Promise<{ data: Uint8Array; type: 'png' | 'jpg' } | null> {
  if (!src) return null;
  try {
    // Convert SVG or remote image onto a canvas PNG so Word always renders it reliably
    if (src.startsWith('data:image/svg+xml') || !src.startsWith('data:image/')) {
      const pngBytes = await new Promise<Uint8Array | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, img.naturalWidth || 600);
          canvas.height = Math.max(1, img.naturalHeight || 400);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(async (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const buf = await blob.arrayBuffer();
            resolve(new Uint8Array(buf));
          }, 'image/png');
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
      if (pngBytes) return { data: pngBytes, type: 'png' };
    }

    const res = await fetch(src);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const buf = await res.arrayBuffer();
    const isJpeg =
      contentType.includes('jpeg') ||
      contentType.includes('jpg') ||
      src.startsWith('data:image/jpeg') ||
      src.startsWith('data:image/jpg');
    return {
      data: new Uint8Array(buf),
      type: isJpeg ? 'jpg' : 'png',
    };
  } catch {
    return null;
  }
}

/**
 * Exports all pages of a Qalam Urdu Studio document into a Microsoft Word (.docx) file
 * preserving RTL Urdu typography, fonts, alignments, colors, tables, images, and page size.
 */
export async function exportProjectToDocx(project: DocumentProject): Promise<string | null> {
  const { pageSetup, pages, masterElements, fileName, title } = project;
  const children: Array<Paragraph | Table> = [];

  const contentWidthMm = Math.max(
    60,
    pageSetup.widthMm - pageSetup.margins.left - pageSetup.margins.right
  );

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    if (pIdx > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    const sortByPosition = (a: DocElement, b: DocElement) =>
      Math.abs(a.y - b.y) > 4 ? a.y - b.y : b.x - a.x;

    const topMaster = masterElements
      .filter((el) => el.y < pageSetup.heightMm / 2)
      .sort(sortByPosition);
    const bottomMaster = masterElements
      .filter((el) => el.y >= pageSetup.heightMm / 2)
      .sort(sortByPosition);
    const bodyElements = [...page.elements].sort(sortByPosition);

    const orderedElements = [...topMaster, ...bodyElements, ...bottomMaster];

    for (const elem of orderedElements) {
      if (elem.type === 'text') {
        const te = elem as TextElement;
        const isRtl = (te.direction || 'rtl') === 'rtl';
        const resolvedText = localizePageTokens(te.text || '', page.pageNumber, isRtl);
        const lines = resolvedText.split('\n');
        const fontName = te.fontFamily || 'Noto Nastaliq Urdu';
        const colorHex = normalizeHexColor(te.color, '111827');
        const halfPts = Math.max(14, Math.round((te.fontSize || 12) * 2));
        const lineSpacingTwips = Math.round((te.lineHeight || 1.85) * 240);
        const boxFill =
          te.backgroundColor && te.backgroundColor !== 'transparent'
            ? normalizeHexColor(te.backgroundColor, 'FFFFFF')
            : undefined;
        const hasBoxBorder = Boolean(te.borderWidth && te.borderWidth > 0 && te.borderColor !== 'transparent');
        const borderHex = normalizeHexColor(te.borderColor, 'CBD5E1');

        lines.forEach((lineText, idx) => {
          const isLastLine = idx === lines.length - 1;
          children.push(
            new Paragraph({
              bidirectional: isRtl,
              alignment: mapAlignment(te.align, isRtl),
              spacing: {
                line: lineSpacingTwips,
                after: isLastLine ? 140 : 40,
              },
              shading: boxFill
                ? {
                    type: ShadingType.CLEAR,
                    fill: boxFill,
                  }
                : undefined,
              border: hasBoxBorder
                ? {
                    top:
                      idx === 0
                        ? {
                            style: BorderStyle.SINGLE,
                            size: Math.max(4, Math.round((te.borderWidth || 1) * 4)),
                            color: borderHex,
                          }
                        : undefined,
                    bottom: isLastLine
                      ? {
                          style: BorderStyle.SINGLE,
                          size: Math.max(4, Math.round((te.borderWidth || 1) * 4)),
                          color: borderHex,
                        }
                      : undefined,
                    left: {
                      style: BorderStyle.SINGLE,
                      size: Math.max(4, Math.round((te.borderWidth || 1) * 4)),
                      color: borderHex,
                    },
                    right: {
                      style: BorderStyle.SINGLE,
                      size: Math.max(4, Math.round((te.borderWidth || 1) * 4)),
                      color: borderHex,
                    },
                  }
                : undefined,
              children: [
                new TextRun({
                  text: lineText,
                  font: {
                    name: fontName,
                    cs: fontName,
                    ascii: fontName,
                    hAnsi: fontName,
                  },
                  size: halfPts,
                  bold: Boolean(te.bold),
                  italics: Boolean(te.italic),
                  underline: te.underline ? { type: UnderlineType.SINGLE } : undefined,
                  color: colorHex,
                  rightToLeft: isRtl,
                }),
              ],
            })
          );
        });
      } else if (elem.type === 'table') {
        const tbl = elem as TableElement;
        const fontName = tbl.fontFamily || 'Noto Nastaliq Urdu';
        const colorHex = normalizeHexColor(tbl.color, '1F2937');
        const borderHex = normalizeHexColor(tbl.borderColor, '64748B');
        const halfPts = Math.max(14, Math.round((tbl.fontSize || 10) * 2));
        const colCount = Math.max(1, tbl.data[0]?.length || 1);
        const colWidthTwips = Math.round(mmToTwips(Math.min(tbl.width, contentWidthMm)) / colCount);

        const rows = tbl.data.map((rowData, rIdx) => {
          const isHeader = Boolean(tbl.headerRow && rIdx === 0);
          return new TableRow({
            tableHeader: isHeader,
            children: rowData.map(
              (cellText) =>
                new TableCell({
                  width: { size: colWidthTwips, type: WidthType.DXA },
                  shading: isHeader
                    ? {
                        type: ShadingType.CLEAR,
                        fill: 'F1F5F9',
                      }
                    : undefined,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
                    left: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
                    right: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
                  },
                  children: [
                    new Paragraph({
                      bidirectional: true,
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 60, after: 60 },
                      children: [
                        new TextRun({
                          text: cellText || '',
                          font: {
                            name: fontName,
                            cs: fontName,
                            ascii: fontName,
                            hAnsi: fontName,
                          },
                          size: halfPts,
                          bold: isHeader,
                          color: colorHex,
                          rightToLeft: true,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          });
        });

        children.push(
          new Table({
            visuallyRightToLeft: true,
            width: {
              size: mmToTwips(Math.min(tbl.width, contentWidthMm)),
              type: WidthType.DXA,
            },
            rows,
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      } else if (elem.type === 'picture') {
        const pe = elem as PictureElement;
        const maxW = Math.min(pe.width, contentWidthMm);
        const aspect = pe.width > 0 ? pe.height / pe.width : 0.7;
        const pxW = Math.round(maxW * 3.7795);
        const pxH = Math.round(maxW * aspect * 3.7795);

        const imgPayload = await loadImageBuffer(pe.imageSrc);
        if (imgPayload) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: pe.caption ? 40 : 140 },
              children: [
                new ImageRun({
                  data: imgPayload.data,
                  type: imgPayload.type,
                  transformation: {
                    width: Math.max(40, pxW),
                    height: Math.max(30, pxH),
                  },
                }),
              ],
            })
          );
        }
        if (pe.caption) {
          children.push(
            new Paragraph({
              bidirectional: true,
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: pe.caption,
                  font: {
                    name: 'Noto Nastaliq Urdu',
                    cs: 'Noto Nastaliq Urdu',
                    ascii: 'Noto Nastaliq Urdu',
                    hAnsi: 'Noto Nastaliq Urdu',
                  },
                  size: 20,
                  italics: true,
                  color: '475569',
                  rightToLeft: true,
                }),
              ],
            })
          );
        }
      } else if (elem.type === 'line') {
        const le = elem as LineElement;
        if (le.orientation !== 'vertical') {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 80 },
              border: {
                bottom: {
                  style:
                    le.style === 'dashed'
                      ? BorderStyle.DASHED
                      : le.style === 'dotted'
                      ? BorderStyle.DOTTED
                      : le.style === 'double'
                      ? BorderStyle.DOUBLE
                      : BorderStyle.SINGLE,
                  size: Math.max(4, Math.round((le.strokeWidth || 1) * 6)),
                  color: normalizeHexColor(le.color, '1E293B'),
                },
              },
              children: [],
            })
          );
        }
      }
    }
  }

  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

  const doc = new Document({
    title: title || 'Qalam Urdu Studio Document',
    creator: 'Qalam Urdu Studio v1.0',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mmToTwips(pageSetup.widthMm),
              height: mmToTwips(pageSetup.heightMm),
              orientation:
                pageSetup.widthMm > pageSetup.heightMm
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT,
            },
            margin: {
              top: mmToTwips(pageSetup.margins.top),
              right: mmToTwips(pageSetup.margins.right),
              bottom: mmToTwips(pageSetup.margins.bottom),
              left: mmToTwips(pageSetup.margins.left),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const baseName = getProjectBaseName(fileName);
  const outName = `${baseName}.docx`;
  return saveFile(outName, blob, blob.type);
}
