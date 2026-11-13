import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import {
  DocElement,
  DocumentProject,
  Page,
  PageSetup,
  PaperSize,
  PictureElement,
  TextAlign,
  TextElement,
} from '../types/inpage';

const MM_PER_PT = 25.4 / 72;
const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const MAX_PDF_PAGES = 40;

function hasUrduOrArabic(text: string): boolean {
  return URDU_ARABIC_REGEX.test(text);
}

function detectPaperSize(widthMm: number, heightMm: number): {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
} {
  const orientation: 'portrait' | 'landscape' = widthMm > heightMm ? 'landscape' : 'portrait';
  const shortSide = Math.min(widthMm, heightMm);
  const longSide = Math.max(widthMm, heightMm);

  const candidates: Array<{ size: PaperSize; w: number; h: number }> = [
    { size: 'A4', w: 210, h: 297 },
    { size: 'Letter', w: 215.9, h: 279.4 },
    { size: 'Legal', w: 215.9, h: 355.6 },
    { size: 'Tabloid', w: 279.4, h: 431.8 },
  ];

  for (const c of candidates) {
    if (Math.abs(shortSide - c.w) <= 4 && Math.abs(longSide - c.h) <= 4) {
      return { paperSize: c.size, orientation };
    }
  }
  return { paperSize: 'Custom', orientation };
}

interface PositionedSpan {
  str: string;
  xMm: number;
  yMm: number; // baseline Y from top in mm
  widthMm: number;
  fontSizePt: number;
  bold: boolean;
  italic: boolean;
  isRtl: boolean;
  fontHint: string;
}

interface TextLineSegment {
  yMm: number;
  xStartMm: number;
  xEndMm: number;
  fontSizePt: number;
  bold: boolean;
  italic: boolean;
  isRtl: boolean;
  fontHint: string;
  text: string;
}

interface TextBlock {
  xMm: number;
  xEndMm: number;
  topYMm: number;
  bottomBaselineMm: number;
  fontSizePt: number;
  bold: boolean;
  italic: boolean;
  isRtl: boolean;
  fontHint: string;
  lines: string[];
}

function mapPdfFontToStudio(fontHint: string, isRtl: boolean, fontSizePt: number, bold: boolean): string {
  const lower = fontHint.toLowerCase();
  if (lower.includes('gulzar')) return 'Gulzar';
  if (lower.includes('amiri')) return 'Amiri';
  if (lower.includes('ruqaa') || lower.includes('riqaa')) return 'Aref Ruqaa';
  if (lower.includes('reem') || lower.includes('kufi')) return 'Reem Kufi';
  if (lower.includes('scheherazade')) return 'Scheherazade New';
  if (lower.includes('lateef')) return 'Lateef';
  if (lower.includes('naskh')) return 'Noto Naskh Arabic';
  if (lower.includes('nastaliq') || lower.includes('jameel') || lower.includes('noori')) {
    return 'Noto Nastaliq Urdu';
  }
  if (isRtl) {
    return fontSizePt >= 18 || (bold && fontSizePt >= 15) ? 'Gulzar' : 'Noto Nastaliq Urdu';
  }
  if (lower.includes('serif') || lower.includes('times') || lower.includes('georgia')) {
    return 'Georgia';
  }
  return 'Segoe UI';
}

function joinLineSpans(spans: PositionedSpan[], isRtl: boolean): string {
  if (spans.length === 0) return '';
  const ordered = [...spans].sort((a, b) => (isRtl ? b.xMm - a.xMm : a.xMm - b.xMm));

  let result = '';
  for (let i = 0; i < ordered.length; i++) {
    const curr = ordered[i];
    const clean = curr.str.replace(/\s+/g, ' ').trim();
    if (!clean) continue;

    if (!result) {
      result = clean;
      continue;
    }

    const prev = ordered[i - 1];
    const gapMm = isRtl
      ? prev.xMm - (curr.xMm + curr.widthMm)
      : curr.xMm - (prev.xMm + prev.widthMm);
    const spaceThreshold = Math.max(0.35, curr.fontSizePt * MM_PER_PT * 0.16);

    if (gapMm > spaceThreshold) {
      result += ' ' + clean;
    } else {
      result += clean;
    }
  }
  return result.trim();
}

function buildLineSegments(spans: PositionedSpan[]): TextLineSegment[] {
  if (spans.length === 0) return [];

  // Sort top-to-bottom by baseline Y
  const sortedByY = [...spans].sort((a, b) => a.yMm - b.yMm);

  // Cluster into horizontal baseline rows
  const rows: PositionedSpan[][] = [];
  for (const span of sortedByY) {
    const lastRow = rows[rows.length - 1];
    if (!lastRow) {
      rows.push([span]);
      continue;
    }
    const avgY = lastRow.reduce((acc, s) => acc + s.yMm, 0) / lastRow.length;
    const tol = Math.max(1.8, span.fontSizePt * MM_PER_PT * 0.48);
    if (Math.abs(span.yMm - avgY) <= tol) {
      lastRow.push(span);
    } else {
      rows.push([span]);
    }
  }

  const segments: TextLineSegment[] = [];

  for (const row of rows) {
    // Sort left-to-right to detect wide column gaps
    const rowLtr = [...row].sort((a, b) => a.xMm - b.xMm);
    const subGroups: PositionedSpan[][] = [];
    for (const span of rowLtr) {
      const currentGroup = subGroups[subGroups.length - 1];
      if (!currentGroup) {
        subGroups.push([span]);
        continue;
      }
      const prev = currentGroup[currentGroup.length - 1];
      const prevRight = prev.xMm + prev.widthMm;
      const colGapThreshold = Math.max(12, Math.max(prev.fontSizePt, span.fontSizePt) * MM_PER_PT * 3.5);
      if (span.xMm - prevRight > colGapThreshold) {
        subGroups.push([span]);
      } else {
        currentGroup.push(span);
      }
    }

    for (const grp of subGroups) {
      const combinedRaw = grp.map((g) => g.str).join(' ');
      const rtlChars = (combinedRaw.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
      const latinChars = (combinedRaw.match(/[A-Za-z]/g) || []).length;
      const isRtl = rtlChars > 0 && rtlChars >= latinChars * 0.5;

      const text = joinLineSpans(grp, isRtl);
      if (!text) continue;

      const xStartMm = Math.min(...grp.map((g) => g.xMm));
      const xEndMm = Math.max(...grp.map((g) => g.xMm + Math.max(g.widthMm, 1.5)));
      const yMm = grp.reduce((acc, g) => acc + g.yMm, 0) / grp.length;
      const fontSizePt = Math.round(
        (grp.reduce((acc, g) => acc + g.fontSizePt, 0) / grp.length) * 2
      ) / 2;
      const boldCount = grp.filter((g) => g.bold).length;
      const italicCount = grp.filter((g) => g.italic).length;

      segments.push({
        yMm,
        xStartMm,
        xEndMm,
        fontSizePt: Math.min(72, Math.max(7, fontSizePt)),
        bold: boldCount > grp.length / 2,
        italic: italicCount > grp.length / 2,
        isRtl,
        fontHint: grp[0].fontHint,
        text,
      });
    }
  }

  return segments;
}

function groupSegmentsIntoBlocks(segments: TextLineSegment[], pageWidthMm: number): TextBlock[] {
  const blocks: TextBlock[] = [];

  for (const seg of segments) {
    const segFontMm = seg.fontSizePt * MM_PER_PT;
    const segTopMm = Math.max(0, seg.yMm - segFontMm);

    // Try merging with the most recent compatible block
    let matchedBlock: TextBlock | null = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const vGap = seg.yMm - b.bottomBaselineMm;
      const maxLineGap = Math.max(11, Math.max(b.fontSizePt, seg.fontSizePt) * MM_PER_PT * 2.65);

      if (vGap < -2 || vGap > maxLineGap) continue;
      if (b.isRtl !== seg.isRtl) continue;

      // Require same rough font size (avoid merging big heading with body text)
      const sizeRatio = Math.max(b.fontSizePt, seg.fontSizePt) / Math.max(1, Math.min(b.fontSizePt, seg.fontSizePt));
      if (sizeRatio > 1.25) continue;
      if (b.bold !== seg.bold && b.fontSizePt >= 14) continue;

      // Require horizontal overlap or aligned column edge
      const overlaps =
        Math.min(b.xEndMm, seg.xEndMm) - Math.max(b.xMm, seg.xStartMm) > -10;
      const edgeAligned =
        Math.abs(b.xMm - seg.xStartMm) <= 22 || Math.abs(b.xEndMm - seg.xEndMm) <= 22;

      // Avoid merging distinct narrow centered lines separated by big jump
      const bothNarrowCentered =
        b.xEndMm - b.xMm < pageWidthMm * 0.45 &&
        seg.xEndMm - seg.xStartMm < pageWidthMm * 0.45 &&
        Math.abs((b.xMm + b.xEndMm) / 2 - (seg.xStartMm + seg.xEndMm) / 2) > 25;

      if ((overlaps || edgeAligned) && !bothNarrowCentered) {
        matchedBlock = b;
        break;
      }
    }

    if (matchedBlock) {
      matchedBlock.lines.push(seg.text);
      matchedBlock.xMm = Math.min(matchedBlock.xMm, seg.xStartMm);
      matchedBlock.xEndMm = Math.max(matchedBlock.xEndMm, seg.xEndMm);
      matchedBlock.bottomBaselineMm = Math.max(matchedBlock.bottomBaselineMm, seg.yMm);
    } else {
      blocks.push({
        xMm: seg.xStartMm,
        xEndMm: seg.xEndMm,
        topYMm: segTopMm,
        bottomBaselineMm: seg.yMm,
        fontSizePt: seg.fontSizePt,
        bold: seg.bold,
        italic: seg.italic,
        isRtl: seg.isRtl,
        fontHint: seg.fontHint,
        lines: [seg.text],
      });
    }
  }

  return blocks;
}

export async function importPdfToProject(file: File): Promise<DocumentProject> {
  const pdfjsLib = await import('pdfjs-dist');
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
  (globalThis as unknown as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = Math.min(pdfDoc.numPages, MAX_PDF_PAGES);

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  // Determine overall page setup from page 1
  const firstPage = await pdfDoc.getPage(1);
  const firstVp = firstPage.getViewport({ scale: 1 });
  const pageWidthMm = Math.max(50, Math.round(firstVp.width * MM_PER_PT * 10) / 10);
  const pageHeightMm = Math.max(50, Math.round(firstVp.height * MM_PER_PT * 10) / 10);
  const { paperSize, orientation } = detectPaperSize(pageWidthMm, pageHeightMm);

  let rtlPageCount = 0;
  let ltrPageCount = 0;
  let minLeftMargin = pageWidthMm * 0.25;
  let minRightMargin = pageWidthMm * 0.25;
  let minTopMargin = pageHeightMm * 0.25;

  const pages: Page[] = [];
  let elemCounter = 1;
  const nextId = () => `pdf-el-${Date.now()}-${elemCounter++}`;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pdfPage = pageNum === 1 ? firstPage : await pdfDoc.getPage(pageNum);
    const viewport = pdfPage.getViewport({ scale: 1 });
    const currPageWMm = Math.round(viewport.width * MM_PER_PT * 10) / 10;
    const currPageHMm = Math.round(viewport.height * MM_PER_PT * 10) / 10;

    const textContent = await pdfPage.getTextContent();
    const stylesMap = (textContent.styles || {}) as Record<
      string,
      { fontFamily?: string }
    >;

    const spans: PositionedSpan[] = [];
    let nonSpaceChars = 0;

    for (const rawItem of textContent.items) {
      if (!('str' in rawItem)) continue;
      const item = rawItem as TextItem;
      const str = item.str;
      if (!str || !str.trim()) continue;

      nonSpaceChars += str.replace(/\s+/g, '').length;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const xPx = tx[4];
      const yPx = tx[5];
      const fontSizePt = Math.max(6, Math.hypot(tx[2], tx[3]) || Math.hypot(tx[0], tx[1]) || 11);

      const xMm = xPx * MM_PER_PT;
      const yMm = yPx * MM_PER_PT;
      const widthMm = Math.max(0.5, (item.width || 0) * MM_PER_PT);

      const styleEntry = stylesMap[item.fontName];
      const fontHint = `${item.fontName || ''} ${styleEntry?.fontFamily || ''}`.trim();
      const lowerHint = fontHint.toLowerCase();
      const bold = /bold|black|heavy|semibold|demi/.test(lowerHint);
      const italic = /italic|oblique/.test(lowerHint);

      spans.push({
        str,
        xMm,
        yMm,
        widthMm,
        fontSizePt,
        bold,
        italic,
        isRtl: hasUrduOrArabic(str),
        fontHint,
      });
    }

    const elements: DocElement[] = [];

    if (nonSpaceChars < 8) {
      // Scanned or image-only PDF page: render crisp page image into an editable PictureElement
      const maxCanvasDim = 1800;
      const renderScale = Math.min(
        2.0,
        maxCanvasDim / Math.max(viewport.width, viewport.height, 1)
      );
      const scaledVp = pdfPage.getViewport({ scale: Math.max(1, renderScale) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(scaledVp.width));
      canvas.height = Math.max(1, Math.round(scaledVp.height));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await pdfPage.render({ canvas, canvasContext: ctx, viewport: scaledVp }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const picEl: PictureElement = {
          id: nextId(),
          type: 'picture',
          x: 0,
          y: 0,
          width: currPageWMm,
          height: currPageHMm,
          imageSrc: dataUrl,
          shape: 'rect',
          objectFit: 'contain',
          borderStyle: 'none',
          borderWidth: 0,
          borderColor: 'transparent',
        };
        elements.push(picEl);
      }
    } else {
      const segments = buildLineSegments(spans);
      const blocks = groupSegmentsIntoBlocks(segments, currPageWMm);

      for (const block of blocks) {
        const text = block.lines.join('\n').trim();
        if (!text) continue;

        if (block.isRtl) rtlPageCount++;
        else ltrPageCount++;

        const paddingMm = block.isRtl ? 2.5 : 1.5;
        const rawX = Math.max(3, block.xMm - paddingMm);
        const rawEnd = Math.min(currPageWMm - 3, block.xEndMm + paddingMm);
        const width = Math.max(24, Math.round((rawEnd - rawX) * 10) / 10);

        minLeftMargin = Math.min(minLeftMargin, rawX);
        minRightMargin = Math.min(minRightMargin, Math.max(6, currPageWMm - rawEnd));
        minTopMargin = Math.min(minTopMargin, Math.max(6, block.topYMm));

        // Estimate frame height cleanly with extra Nastaliq vertical clearance
        const lineHeight = block.isRtl ? 1.95 : 1.45;
        const fontHeightMm = block.fontSizePt * MM_PER_PT * lineHeight;
        const spanHeight = block.bottomBaselineMm - block.topYMm;
        const estimatedHeight = Math.max(
          spanHeight + fontHeightMm * (block.isRtl ? 0.9 : 0.6) + paddingMm * 2,
          block.lines.length * fontHeightMm + paddingMm * 2
        );
        const y = Math.max(2, Math.round((block.topYMm - (block.isRtl ? 1.5 : 0.5)) * 10) / 10);
        const height = Math.min(
          currPageHMm - y - 2,
          Math.max(10, Math.round(estimatedHeight * 10) / 10)
        );

        // Detect alignment from block position relative to page center
        const centerOffset = Math.abs((rawX + rawEnd) / 2 - currPageWMm / 2);
        let align: TextAlign = block.isRtl ? 'right' : 'left';
        if (block.lines.length <= 3 && rawEnd - rawX < currPageWMm * 0.72 && centerOffset < 12) {
          align = 'center';
        } else if (block.lines.length > 2 && rawEnd - rawX > currPageWMm * 0.68) {
          align = 'justify';
        }

        const fontFamily = mapPdfFontToStudio(
          block.fontHint,
          block.isRtl,
          block.fontSizePt,
          block.bold
        );
        const isTitleBox = block.fontSizePt >= 16 || (block.bold && block.lines.length <= 2 && block.fontSizePt >= 13);

        const textEl: TextElement = {
          id: nextId(),
          type: 'text',
          x: Math.round(rawX * 10) / 10,
          y,
          width,
          height,
          text,
          isTitleBox,
          fontFamily,
          fontSize: Math.round(block.fontSizePt),
          lineHeight,
          letterSpacing: 0,
          scaleX: 100,
          paddingMm,
          color: '#1e293b',
          bold: block.bold,
          italic: block.italic,
          underline: false,
          align,
          direction: block.isRtl ? 'rtl' : 'ltr',
          borderStyle: 'none',
          borderWidth: 0,
          borderColor: '#cbd5e1',
          backgroundColor: 'transparent',
        };
        elements.push(textEl);
      }
    }

    pages.push({
      id: `pdf-page-${Date.now()}-${pageNum}`,
      pageNumber: pageNum,
      elements,
    });
  }

  await pdfDoc.cleanup();
  await loadingTask.destroy();

  const clampedMargin = (val: number) =>
    Math.min(35, Math.max(10, Math.round(val * 10) / 10));

  const pageSetup: PageSetup = {
    paperSize,
    widthMm: pageWidthMm,
    heightMm: pageHeightMm,
    orientation,
    margins: {
      top: clampedMargin(minTopMargin),
      bottom: clampedMargin(minTopMargin),
      left: clampedMargin(minLeftMargin),
      right: clampedMargin(minRightMargin),
    },
    columns: 1,
    columnGutter: 5,
    direction: rtlPageCount >= ltrPageCount ? 'rtl' : 'ltr',
  };

  const baseTitle = file.name.replace(/\.pdf$/i, '') || 'PDF_Import';
  return {
    version: '1.0',
    title: baseTitle,
    fileName: `${baseTitle}.qlm`,
    pageSetup,
    pages,
    masterElements: [],
  };
}
