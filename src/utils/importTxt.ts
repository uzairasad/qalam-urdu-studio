import {
  DocElement,
  DocumentProject,
  Page,
  PageSetup,
  TextElement,
} from '../types/inpage';

const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function estimateLineCount(text: string, charsPerLine: number): number {
  const rawLines = text.split('\n');
  let total = 0;
  for (const line of rawLines) {
    const len = line.trim().length;
    total += Math.max(1, Math.ceil(len / charsPerLine));
  }
  return total;
}

export async function importTxtToProject(file: File): Promise<DocumentProject> {
  const raw = await file.text();
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();

  const urduCount = (normalized.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinCount = (normalized.match(/[A-Za-z]/g) || []).length;
  const isUrduDoc = urduCount > 0 && urduCount >= latinCount * 0.4;

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const margin = 18;
  const contentWidth = pageWidthMm - margin * 2;
  const maxPageY = pageHeightMm - margin;

  const pageSetup: PageSetup = {
    paperSize: 'A4',
    widthMm: pageWidthMm,
    heightMm: pageHeightMm,
    orientation: 'portrait',
    margins: {
      top: margin,
      bottom: margin,
      left: margin,
      right: margin,
    },
    columns: 1,
    columnGutter: 5,
    direction: isUrduDoc ? 'rtl' : 'ltr',
  };

  const baseTitle = file.name.replace(/\.txt$/i, '') || 'Text_Import';
  const paragraphs = normalized
    ? normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [''];

  const pages: Page[] = [];
  let elemCounter = 1;
  const nextId = () => `txt-el-${Date.now()}-${elemCounter++}`;

  let currentElements: DocElement[] = [];
  let cursorY = margin;

  const flushPage = () => {
    pages.push({
      id: `txt-page-${Date.now()}-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      elements: currentElements,
    });
    currentElements = [];
    cursorY = margin;
  };

  const makeTextFrame = (
    text: string,
    y: number,
    height: number,
    opts: { isTitle?: boolean; rtl: boolean }
  ): TextElement => {
    const rtl = opts.rtl;
    const isTitle = Boolean(opts.isTitle);
    return {
      id: nextId(),
      type: 'text',
      x: margin,
      y: Math.round(y * 10) / 10,
      width: contentWidth,
      height: Math.round(height * 10) / 10,
      text,
      isTitleBox: isTitle,
      fontFamily: rtl ? (isTitle ? 'Gulzar' : 'Noto Nastaliq Urdu') : 'Segoe UI',
      fontSize: isTitle ? (rtl ? 20 : 18) : (rtl ? 12 : 11),
      lineHeight: rtl ? (isTitle ? 1.65 : 2.0) : (isTitle ? 1.3 : 1.5),
      letterSpacing: 0,
      scaleX: 100,
      paddingMm: rtl ? 3 : 2,
      color: '#1e293b',
      bold: isTitle,
      italic: false,
      underline: false,
      align: isTitle ? 'center' : rtl ? 'right' : 'left',
      direction: rtl ? 'rtl' : 'ltr',
      borderStyle: 'none',
      borderWidth: 0,
      borderColor: '#cbd5e1',
      backgroundColor: 'transparent',
    };
  };

  // Detect optional title paragraph at top (short first paragraph when followed by more paragraphs)
  let startIdx = 0;
  if (
    paragraphs.length > 1 &&
    paragraphs[0].length <= 80 &&
    !paragraphs[0].includes('\n')
  ) {
    const titleText = paragraphs[0];
    const titleRtl = URDU_ARABIC_REGEX.test(titleText) || isUrduDoc;
    const titleHeight = titleRtl ? 18 : 14;
    currentElements.push(
      makeTextFrame(titleText, cursorY, titleHeight, { isTitle: true, rtl: titleRtl })
    );
    cursorY += titleHeight + 4;
    startIdx = 1;
  }

  // Group remaining paragraphs cleanly per page
  const charsPerLine = isUrduDoc ? 62 : 78;
  const mmPerLine = isUrduDoc ? 8.6 : 5.8;
  let pageBuffer: string[] = [];
  let bufferHeightMm = 6;

  const commitBuffer = () => {
    if (pageBuffer.length === 0) return;
    const text = pageBuffer.join('\n\n');
    const available = Math.max(24, maxPageY - cursorY);
    const frameHeight = Math.min(available, Math.max(24, bufferHeightMm));
    currentElements.push(
      makeTextFrame(text, cursorY, frameHeight, { isTitle: false, rtl: isUrduDoc })
    );
    cursorY += frameHeight + 3;
    pageBuffer = [];
    bufferHeightMm = 6;
  };

  for (let i = startIdx; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const estLines = estimateLineCount(para, charsPerLine);
    const paraHeight = estLines * mmPerLine + 5;

    if (cursorY + bufferHeightMm + paraHeight > maxPageY && pageBuffer.length > 0) {
      commitBuffer();
      flushPage();
    }

    // Handle a single ultra-long paragraph without blank-line breaks by splitting on lines
    if (cursorY + paraHeight > maxPageY && para.includes('\n')) {
      const subLines = para.split('\n');
      for (const sub of subLines) {
        const subEst = estimateLineCount(sub, charsPerLine) * mmPerLine + 2;
        if (cursorY + bufferHeightMm + subEst > maxPageY && pageBuffer.length > 0) {
          commitBuffer();
          flushPage();
        }
        pageBuffer.push(sub);
        bufferHeightMm += subEst;
      }
      continue;
    }

    pageBuffer.push(para);
    bufferHeightMm += paraHeight;
  }

  commitBuffer();
  if (currentElements.length > 0 || pages.length === 0) {
    flushPage();
  }

  return {
    version: '1.0',
    title: baseTitle,
    fileName: `${baseTitle}.qlm`,
    pageSetup,
    pages,
    masterElements: [],
  };
}
