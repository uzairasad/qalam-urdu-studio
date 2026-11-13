import JSZip from 'jszip';
import {
  DocElement,
  DocumentProject,
  Page,
  PageSetup,
  PaperSize,
  PictureElement,
  TableElement,
  TextAlign,
  TextElement,
} from '../types/inpage';
import { URDU_FONT_OPTIONS } from './fonts';

const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function hasUrduOrArabic(text: string): boolean {
  return URDU_ARABIC_REGEX.test(text);
}

function twipsToMm(twips: number): number {
  return Math.round((twips / 56.6929) * 10) / 10;
}

function emuToMm(emu: number): number {
  return Math.round((emu / 36000) * 10) / 10;
}

function getAttr(el: Element | null | undefined, localName: string): string | null {
  if (!el) return null;
  const direct = el.getAttribute(`w:${localName}`) ?? el.getAttribute(localName);
  if (direct !== null) return direct;
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.localName === localName || attr.name.endsWith(`:${localName}`)) {
      return attr.value;
    }
  }
  return null;
}

function getChildrenByLocalName(parent: Element, localName: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.localName === localName || child.tagName.endsWith(`:${localName}`)) {
      out.push(child);
    }
  }
  return out;
}

function getFirstChildByLocalName(parent: Element | null | undefined, localName: string): Element | null {
  if (!parent) return null;
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.localName === localName || child.tagName.endsWith(`:${localName}`)) {
      return child;
    }
  }
  return null;
}

function getDescendantsByLocalName(parent: Element, localName: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', localName));
}

function detectPaperSize(widthMm: number, heightMm: number): PaperSize {
  const minDim = Math.min(widthMm, heightMm);
  const maxDim = Math.max(widthMm, heightMm);
  if (Math.abs(minDim - 210) < 4 && Math.abs(maxDim - 297) < 4) return 'A4';
  if (Math.abs(minDim - 215.9) < 4 && Math.abs(maxDim - 279.4) < 4) return 'Letter';
  if (Math.abs(minDim - 215.9) < 4 && Math.abs(maxDim - 355.6) < 4) return 'Legal';
  if (Math.abs(minDim - 279.4) < 5 && Math.abs(maxDim - 431.8) < 5) return 'Tabloid';
  return 'Custom';
}

function mapDocxFont(rawFont: string | null, isUrdu: boolean): string {
  if (!rawFont) return isUrdu ? 'Noto Nastaliq Urdu' : 'Segoe UI';
  const cleaned = rawFont.trim();
  const exact = URDU_FONT_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact.value;

  const lower = cleaned.toLowerCase();
  if (lower.includes('nastaleeq') || lower.includes('nastaliq') || lower.includes('noori')) {
    return 'Noto Nastaliq Urdu';
  }
  if (lower.includes('gulzar')) return 'Gulzar';
  if (lower.includes('amiri')) return 'Amiri';
  if (lower.includes('scheherazade')) return 'Scheherazade New';
  if (lower.includes('kufi')) return 'Noto Kufi Arabic';
  if (lower.includes('ruqaa')) return 'Aref Ruqaa';
  if (lower.includes('times')) return 'Times New Roman';
  if (lower.includes('arial') || lower.includes('helvetica')) return 'Arial';
  if (lower.includes('calibri') || lower.includes('segoe')) return isUrdu ? 'Noto Nastaliq Urdu' : 'Segoe UI';

  return isUrdu ? 'Noto Nastaliq Urdu' : cleaned;
}

function normalizeDocxColor(val: string | null): string | undefined {
  if (!val || val === 'auto' || val === 'none') return undefined;
  const cleaned = val.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return `#${cleaned}`;
  return undefined;
}

function guessMimeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/png';
}

interface ParsedStyle {
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontFamily?: string;
  align?: TextAlign;
  direction?: 'rtl' | 'ltr';
  isHeading?: boolean;
}

function parseStylesXml(stylesXml: string): Record<string, ParsedStyle> {
  const map: Record<string, ParsedStyle> = {};
  try {
    const doc = new DOMParser().parseFromString(stylesXml, 'application/xml');
    const styleEls = getDescendantsByLocalName(doc.documentElement, 'style');
    for (const s of styleEls) {
      const styleId = getAttr(s, 'styleId');
      if (!styleId) continue;

      const nameEl = getFirstChildByLocalName(s, 'name');
      const styleName = (getAttr(nameEl, 'val') || styleId).toLowerCase();
      const isHeading =
        styleName.includes('heading') || styleName === 'title' || styleName === 'subtitle';

      const pPr = getFirstChildByLocalName(s, 'pPr');
      const rPr = getFirstChildByLocalName(s, 'rPr');

      const parsed: ParsedStyle = { isHeading };

      if (pPr) {
        const jc = getFirstChildByLocalName(pPr, 'jc');
        const jcVal = getAttr(jc, 'val');
        if (jcVal === 'center') parsed.align = 'center';
        else if (jcVal === 'left' || jcVal === 'start') parsed.align = 'left';
        else if (jcVal === 'right' || jcVal === 'end') parsed.align = 'right';
        else if (jcVal === 'both' || jcVal === 'distribute') parsed.align = 'justify';

        const bidi = getFirstChildByLocalName(pPr, 'bidi');
        if (bidi) {
          const bv = getAttr(bidi, 'val');
          parsed.direction = bv === '0' || bv === 'false' ? 'ltr' : 'rtl';
        }
      }

      if (rPr) {
        const sz = getFirstChildByLocalName(rPr, 'szCs') || getFirstChildByLocalName(rPr, 'sz');
        const szVal = Number(getAttr(sz, 'val'));
        if (!Number.isNaN(szVal) && szVal > 0) parsed.fontSize = szVal / 2;

        const b = getFirstChildByLocalName(rPr, 'b');
        if (b) parsed.bold = getAttr(b, 'val') !== '0' && getAttr(b, 'val') !== 'false';

        const it = getFirstChildByLocalName(rPr, 'i');
        if (it) parsed.italic = getAttr(it, 'val') !== '0' && getAttr(it, 'val') !== 'false';

        const u = getFirstChildByLocalName(rPr, 'u');
        if (u && getAttr(u, 'val') !== 'none') parsed.underline = true;

        const col = getFirstChildByLocalName(rPr, 'color');
        parsed.color = normalizeDocxColor(getAttr(col, 'val'));

        const rFonts = getFirstChildByLocalName(rPr, 'rFonts');
        const fontName =
          getAttr(rFonts, 'cs') || getAttr(rFonts, 'ascii') || getAttr(rFonts, 'hAnsi');
        if (fontName) parsed.fontFamily = fontName;
      }

      if (isHeading && !parsed.fontSize) {
        if (styleName === 'title') parsed.fontSize = 22;
        else if (styleName.includes('1')) parsed.fontSize = 18;
        else if (styleName.includes('2')) parsed.fontSize = 15;
        else parsed.fontSize = 13;
        parsed.bold = true;
      }

      map[styleId] = parsed;
    }
  } catch {
    // Ignore malformed styles.xml
  }
  return map;
}

function estimateTextBoxHeightMm(
  text: string,
  fontSizePt: number,
  lineHeight: number,
  boxWidthMm: number,
  isUrdu: boolean
): number {
  const usableWidthMm = Math.max(25, boxWidthMm - 6);
  // Approximate average char width in mm
  const avgCharWidthMm = fontSizePt * 0.3528 * (isUrdu ? 0.52 : 0.48);
  const charsPerLine = Math.max(12, Math.floor(usableWidthMm / Math.max(1.2, avgCharWidthMm)));

  const paragraphs = text.split('\n');
  let totalLines = 0;
  for (const para of paragraphs) {
    if (!para.trim()) {
      totalLines += 1;
    } else {
      totalLines += Math.max(1, Math.ceil(para.length / charsPerLine));
    }
  }

  const lineHeightMm = fontSizePt * 0.3528 * lineHeight;
  const paddingMm = Math.max(4, fontSizePt * 0.3528 * 0.8);
  return Math.max(12, Math.ceil(totalLines * lineHeightMm + paddingMm));
}

interface ParagraphMeta {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: TextAlign;
  direction: 'rtl' | 'ltr';
  lineHeight: number;
  isTitleBox: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  hasPageBreakBeforeOrAfter: boolean;
  images: { src: string; widthMm: number; heightMm: number }[];
}

/**
 * Parses a Microsoft Word (.docx) file in the browser using JSZip + DOMParser
 * and returns a full editable Qalam Urdu Studio DocumentProject.
 */
export async function importDocxToProject(file: File): Promise<DocumentProject> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('This file does not contain a valid Word (word/document.xml) document.');
  }

  const docXmlText = await docXmlFile.async('string');
  const doc = new DOMParser().parseFromString(docXmlText, 'application/xml');

  // Parse styles
  const stylesFile = zip.file('word/styles.xml');
  const styleMap = stylesFile ? parseStylesXml(await stylesFile.async('string')) : {};

  // Parse relationships for embedded images
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('string');
    const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml');
    const relEls = getDescendantsByLocalName(relsDoc.documentElement, 'Relationship');
    for (const rel of relEls) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) relsMap[id] = target;
    }
  }

  const loadMediaAsDataUrl = async (rId: string | null): Promise<string | null> => {
    if (!rId || !relsMap[rId]) return null;
    const rawTarget = relsMap[rId].replace(/^\/+/, '');
    const zipPath = rawTarget.startsWith('word/') ? rawTarget : `word/${rawTarget}`;
    const mediaFile = zip.file(zipPath);
    if (!mediaFile) return null;
    const base64 = await mediaFile.async('base64');
    return `data:${guessMimeFromPath(zipPath)};base64,${base64}`;
  };

  // Extract Page Setup from sectPr
  const body = getFirstChildByLocalName(doc.documentElement, 'body');
  if (!body) {
    throw new Error('Could not find document body in Word file.');
  }

  const sectPr = getFirstChildByLocalName(body, 'sectPr');
  let widthMm = 210;
  let heightMm = 297;
  let orientation: 'portrait' | 'landscape' = 'portrait';
  const margins = { top: 20, bottom: 20, left: 20, right: 20 };
  let docDirection: 'rtl' | 'ltr' = 'rtl';

  if (sectPr) {
    const pgSz = getFirstChildByLocalName(sectPr, 'pgSz');
    if (pgSz) {
      const wTwips = Number(getAttr(pgSz, 'w'));
      const hTwips = Number(getAttr(pgSz, 'h'));
      if (wTwips > 0) widthMm = twipsToMm(wTwips);
      if (hTwips > 0) heightMm = twipsToMm(hTwips);
      const orientAttr = getAttr(pgSz, 'orient');
      if (orientAttr === 'landscape' || widthMm > heightMm) {
        orientation = 'landscape';
      }
    }

    const pgMar = getFirstChildByLocalName(sectPr, 'pgMar');
    if (pgMar) {
      const topT = Number(getAttr(pgMar, 'top'));
      const bottomT = Number(getAttr(pgMar, 'bottom'));
      const leftT = Number(getAttr(pgMar, 'left'));
      const rightT = Number(getAttr(pgMar, 'right'));
      if (topT > 0) margins.top = Math.min(50, Math.max(8, twipsToMm(topT)));
      if (bottomT > 0) margins.bottom = Math.min(50, Math.max(8, twipsToMm(bottomT)));
      if (leftT > 0) margins.left = Math.min(50, Math.max(8, twipsToMm(leftT)));
      if (rightT > 0) margins.right = Math.min(50, Math.max(8, twipsToMm(rightT)));
    }

    const sectBidi = getFirstChildByLocalName(sectPr, 'bidi');
    if (sectBidi) {
      const bv = getAttr(sectBidi, 'val');
      docDirection = bv === '0' || bv === 'false' ? 'ltr' : 'rtl';
    }
  }

  const pageSetup: PageSetup = {
    paperSize: detectPaperSize(widthMm, heightMm),
    widthMm,
    heightMm,
    orientation,
    margins,
    columns: 1,
    columnGutter: 5,
    direction: docDirection,
  };

  const contentWidthMm = Math.max(60, widthMm - margins.left - margins.right);
  const maxPageY = heightMm - margins.bottom;

  const pages: Page[] = [];
  let currentElements: DocElement[] = [];
  let cursorY = margins.top;
  let idCounter = 1;
  const nextId = () => `elem-docx-${Date.now()}-${idCounter++}`;

  const flushPage = () => {
    pages.push({
      id: `page-docx-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      elements: currentElements,
    });
    currentElements = [];
    cursorY = margins.top;
  };

  // Pending group of consecutive matching body paragraphs to merge into one clean editable TextElement
  let pendingGroup: {
    paragraphs: string[];
    meta: ParagraphMeta;
  } | null = null;

  const commitPendingGroup = () => {
    if (!pendingGroup) return;
    const { paragraphs, meta } = pendingGroup;
    pendingGroup = null;

    const fullText = paragraphs.join('\n');
    if (!fullText.trim()) return;

    const isUrdu = meta.direction === 'rtl' || hasUrduOrArabic(fullText);
    const estH = estimateTextBoxHeightMm(
      fullText,
      meta.fontSize,
      meta.lineHeight,
      contentWidthMm,
      isUrdu
    );

    if (cursorY + estH > maxPageY && currentElements.length > 0) {
      flushPage();
    }

    const boxH = Math.min(maxPageY - cursorY, estH);
    const textElem: TextElement = {
      id: nextId(),
      type: 'text',
      x: margins.left,
      y: Math.round(cursorY * 10) / 10,
      width: contentWidthMm,
      height: Math.max(12, Math.round(boxH * 10) / 10),
      text: fullText,
      isTitleBox: meta.isTitleBox,
      fontFamily: meta.fontFamily,
      fontSize: meta.fontSize,
      lineHeight: meta.lineHeight,
      letterSpacing: 0,
      color: meta.color,
      bold: meta.bold,
      italic: meta.italic,
      underline: meta.underline,
      align: meta.align,
      direction: meta.direction,
      backgroundColor: meta.backgroundColor || 'transparent',
      borderColor: meta.borderColor || 'transparent',
      borderWidth: meta.borderWidth || 0,
      borderStyle: meta.borderWidth ? 'solid' : 'none',
    };

    currentElements.push(textElem);
    cursorY += textElem.height + 3;
  };

  const parseParagraph = async (pEl: Element): Promise<ParagraphMeta> => {
    const pPr = getFirstChildByLocalName(pEl, 'pPr');
    const pStyleId = getAttr(getFirstChildByLocalName(pPr, 'pStyle'), 'val');
    const baseStyle: ParsedStyle = (pStyleId && styleMap[pStyleId]) || {};

    let align: TextAlign | undefined = baseStyle.align;
    let direction: 'rtl' | 'ltr' | undefined = baseStyle.direction;
    let backgroundColor: string | undefined;
    let borderColor: string | undefined;
    let borderWidth: number | undefined;
    let lineHeight: number | undefined;

    if (pPr) {
      const jc = getAttr(getFirstChildByLocalName(pPr, 'jc'), 'val');
      if (jc === 'center') align = 'center';
      else if (jc === 'left' || jc === 'start') align = 'left';
      else if (jc === 'right' || jc === 'end') align = 'right';
      else if (jc === 'both' || jc === 'distribute') align = 'justify';

      const bidi = getFirstChildByLocalName(pPr, 'bidi');
      if (bidi) {
        const bv = getAttr(bidi, 'val');
        direction = bv === '0' || bv === 'false' ? 'ltr' : 'rtl';
      }

      const shd = getFirstChildByLocalName(pPr, 'shd');
      const fill = normalizeDocxColor(getAttr(shd, 'fill'));
      if (fill && fill.toLowerCase() !== '#ffffff') {
        backgroundColor = fill;
      }

      const pBdr = getFirstChildByLocalName(pPr, 'pBdr');
      if (pBdr) {
        const topB = getFirstChildByLocalName(pBdr, 'top') || getFirstChildByLocalName(pBdr, 'left');
        if (topB && getAttr(topB, 'val') !== 'none') {
          borderColor = normalizeDocxColor(getAttr(topB, 'color')) || '#94a3b8';
          const szEighths = Number(getAttr(topB, 'sz'));
          borderWidth = !Number.isNaN(szEighths) && szEighths > 0 ? Math.max(0.5, szEighths / 8) : 1;
        }
      }

      const spacing = getFirstChildByLocalName(pPr, 'spacing');
      const lineAttr = Number(getAttr(spacing, 'line'));
      if (!Number.isNaN(lineAttr) && lineAttr > 120) {
        lineHeight = Math.min(2.6, Math.max(1.3, Math.round((lineAttr / 240) * 100) / 100));
      }
    }

    let text = '';
    let hasPageBreak = false;
    let runBold: boolean | undefined = baseStyle.bold;
    let runItalic: boolean | undefined = baseStyle.italic;
    let runUnderline: boolean | undefined = baseStyle.underline;
    let runColor: string | undefined = baseStyle.color;
    let runSize: number | undefined = baseStyle.fontSize;
    let runFont: string | undefined = baseStyle.fontFamily;
    let runRtl: boolean | undefined;

    const images: { src: string; widthMm: number; heightMm: number }[] = [];

    const collectFromRun = async (rEl: Element) => {
      const rPr = getFirstChildByLocalName(rEl, 'rPr');
      let capturedMeta = false;
      for (let i = 0; i < rEl.children.length; i++) {
        const child = rEl.children[i];
        const ln = child.localName;
        if (ln === 't') {
          text += child.textContent || '';
          capturedMeta = true;
        } else if (ln === 'tab') {
          text += '    ';
        } else if (ln === 'br' || ln === 'cr') {
          if (getAttr(child, 'type') === 'page') {
            hasPageBreak = true;
          } else {
            text += '\n';
          }
        } else if (ln === 'drawing' || ln === 'pict') {
          const blips = getDescendantsByLocalName(child, 'blip');
          const extents = getDescendantsByLocalName(child, 'extent');
          const vImgs = getDescendantsByLocalName(child, 'imagedata');

          if (blips.length > 0) {
            for (let b = 0; b < blips.length; b++) {
              const rId = getAttr(blips[b], 'embed') || getAttr(blips[b], 'link');
              const src = await loadMediaAsDataUrl(rId);
              if (src) {
                const ext = extents[b] || extents[0];
                const cx = Number(getAttr(ext, 'cx'));
                const cy = Number(getAttr(ext, 'cy'));
                let wMm = !Number.isNaN(cx) && cx > 0 ? emuToMm(cx) : 90;
                let hMm = !Number.isNaN(cy) && cy > 0 ? emuToMm(cy) : 60;
                if (wMm > contentWidthMm) {
                  const ratio = contentWidthMm / wMm;
                  wMm = contentWidthMm;
                  hMm = Math.round(hMm * ratio * 10) / 10;
                }
                images.push({ src, widthMm: Math.max(20, wMm), heightMm: Math.max(15, hMm) });
              }
            }
          } else if (vImgs.length > 0) {
            for (const vImg of vImgs) {
              const rId = getAttr(vImg, 'id');
              const src = await loadMediaAsDataUrl(rId);
              if (src) {
                images.push({ src, widthMm: Math.min(90, contentWidthMm), heightMm: 60 });
              }
            }
          }
        }
      }

      if (capturedMeta && rPr) {
        if (runSize === undefined) {
          const sz = getFirstChildByLocalName(rPr, 'szCs') || getFirstChildByLocalName(rPr, 'sz');
          const szVal = Number(getAttr(sz, 'val'));
          if (!Number.isNaN(szVal) && szVal > 0) runSize = szVal / 2;
        }
        if (runBold === undefined) {
          const b = getFirstChildByLocalName(rPr, 'b');
          if (b) runBold = getAttr(b, 'val') !== '0' && getAttr(b, 'val') !== 'false';
        }
        if (runItalic === undefined) {
          const it = getFirstChildByLocalName(rPr, 'i');
          if (it) runItalic = getAttr(it, 'val') !== '0' && getAttr(it, 'val') !== 'false';
        }
        if (runUnderline === undefined) {
          const u = getFirstChildByLocalName(rPr, 'u');
          if (u && getAttr(u, 'val') !== 'none') runUnderline = true;
        }
        if (!runColor) {
          const col = getFirstChildByLocalName(rPr, 'color');
          runColor = normalizeDocxColor(getAttr(col, 'val'));
        }
        if (!runFont) {
          const rFonts = getFirstChildByLocalName(rPr, 'rFonts');
          runFont = getAttr(rFonts, 'cs') || getAttr(rFonts, 'ascii') || getAttr(rFonts, 'hAnsi') || undefined;
        }
        if (runRtl === undefined) {
          const rtl = getFirstChildByLocalName(rPr, 'rtl');
          if (rtl) runRtl = getAttr(rtl, 'val') !== '0' && getAttr(rtl, 'val') !== 'false';
        }
      }
    };

    for (let i = 0; i < pEl.children.length; i++) {
      const child = pEl.children[i];
      if (child.localName === 'r') {
        await collectFromRun(child);
      } else if (child.localName === 'hyperlink') {
        const innerRuns = getChildrenByLocalName(child, 'r');
        for (const ir of innerRuns) {
          await collectFromRun(ir);
        }
      }
    }

    const isUrduText = hasUrduOrArabic(text);
    const finalDir: 'rtl' | 'ltr' =
      direction || (runRtl ? 'rtl' : isUrduText ? 'rtl' : docDirection === 'rtl' && !text.trim() ? 'rtl' : isUrduText ? 'rtl' : 'ltr');

    const finalAlign: TextAlign = align || (finalDir === 'rtl' ? 'right' : 'left');
    const isHeading = Boolean(baseStyle.isHeading) || (runSize !== undefined && runSize >= 16);
    const fontFamily = isHeading && isUrduText && !runFont
      ? 'Gulzar'
      : mapDocxFont(runFont || null, isUrduText || finalDir === 'rtl');

    const fontSize = runSize || (isHeading ? 18 : isUrduText ? 12 : 11);
    const defaultLineHeight =
      fontFamily === 'Noto Nastaliq Urdu' || fontFamily === 'Gulzar' ? 1.85 : 1.55;

    return {
      text,
      fontFamily,
      fontSize,
      bold: Boolean(runBold),
      italic: Boolean(runItalic),
      underline: Boolean(runUnderline),
      color: runColor || '#111827',
      align: finalAlign,
      direction: finalDir,
      lineHeight: lineHeight || defaultLineHeight,
      isTitleBox: isHeading,
      backgroundColor,
      borderColor,
      borderWidth,
      hasPageBreakBeforeOrAfter: hasPageBreak,
      images,
    };
  };

  const processBodyElement = async (el: Element) => {
    const ln = el.localName;

    if (ln === 'p') {
      const meta = await parseParagraph(el);

      // Flush images embedded inside this paragraph
      if (meta.images.length > 0) {
        commitPendingGroup();
        for (const img of meta.images) {
          if (cursorY + img.heightMm > maxPageY && currentElements.length > 0) {
            flushPage();
          }
          const picX = Math.max(margins.left, margins.left + (contentWidthMm - img.widthMm) / 2);
          const picElem: PictureElement = {
            id: nextId(),
            type: 'picture',
            x: Math.round(picX * 10) / 10,
            y: Math.round(cursorY * 10) / 10,
            width: img.widthMm,
            height: img.heightMm,
            imageSrc: img.src,
            shape: 'rect',
            objectFit: 'contain',
            borderColor: '#cbd5e1',
            borderWidth: 0,
            borderStyle: 'none',
          };
          currentElements.push(picElem);
          cursorY += picElem.height + 4;
        }
      }

      if (meta.text.trim()) {
        const canMerge =
          pendingGroup &&
          !meta.isTitleBox &&
          !pendingGroup.meta.isTitleBox &&
          !meta.backgroundColor &&
          !pendingGroup.meta.backgroundColor &&
          !meta.borderWidth &&
          !pendingGroup.meta.borderWidth &&
          pendingGroup.meta.fontFamily === meta.fontFamily &&
          pendingGroup.meta.fontSize === meta.fontSize &&
          pendingGroup.meta.align === meta.align &&
          pendingGroup.meta.direction === meta.direction &&
          pendingGroup.meta.bold === meta.bold &&
          pendingGroup.meta.color === meta.color;

        if (canMerge && pendingGroup) {
          const candidateText = [...pendingGroup.paragraphs, meta.text].join('\n');
          const estH = estimateTextBoxHeightMm(
            candidateText,
            pendingGroup.meta.fontSize,
            pendingGroup.meta.lineHeight,
            contentWidthMm,
            pendingGroup.meta.direction === 'rtl'
          );
          if (cursorY + estH <= maxPageY) {
            pendingGroup.paragraphs.push(meta.text);
          } else {
            commitPendingGroup();
            pendingGroup = { paragraphs: [meta.text], meta };
          }
        } else {
          commitPendingGroup();
          pendingGroup = { paragraphs: [meta.text], meta };
        }
      }

      if (meta.hasPageBreakBeforeOrAfter) {
        commitPendingGroup();
        flushPage();
      }
      return;
    }

    if (ln === 'tbl') {
      commitPendingGroup();
      const rowEls = getChildrenByLocalName(el, 'tr');
      if (rowEls.length === 0) return;

      const data: string[][] = [];
      let maxCols = 1;
      for (const rEl of rowEls) {
        const cellEls = getChildrenByLocalName(rEl, 'tc');
        const rowCells: string[] = [];
        for (const cEl of cellEls) {
          const cellParagraphs = getChildrenByLocalName(cEl, 'p');
          const cellText = cellParagraphs
            .map((cp) =>
              getDescendantsByLocalName(cp, 't')
                .map((t) => t.textContent || '')
                .join('')
            )
            .filter(Boolean)
            .join('\n');
          rowCells.push(cellText);
        }
        maxCols = Math.max(maxCols, rowCells.length);
        data.push(rowCells);
      }

      const normalizedData = data.map((row) => {
        const copy = [...row];
        while (copy.length < maxCols) copy.push('');
        return copy;
      });

      const allTableText = normalizedData.flat().join(' ');
      const isUrduTable = hasUrduOrArabic(allTableText) || docDirection === 'rtl';
      const tblHeight = Math.max(22, Math.min(maxPageY - margins.top, normalizedData.length * 10));

      if (cursorY + tblHeight > maxPageY && currentElements.length > 0) {
        flushPage();
      }

      const tblElem: TableElement = {
        id: nextId(),
        type: 'table',
        x: margins.left,
        y: Math.round(cursorY * 10) / 10,
        width: contentWidthMm,
        height: tblHeight,
        rows: normalizedData.length,
        cols: maxCols,
        data: normalizedData,
        headerRow: normalizedData.length > 1,
        fontFamily: isUrduTable ? 'Noto Nastaliq Urdu' : 'Segoe UI',
        fontSize: 10,
        color: '#1f2937',
        borderColor: '#64748b',
        borderWidth: 1,
      };

      currentElements.push(tblElem);
      cursorY += tblHeight + 4;
      return;
    }

    if (ln === 'sdt') {
      const sdtContent = getFirstChildByLocalName(el, 'sdtContent');
      if (sdtContent) {
        for (let i = 0; i < sdtContent.children.length; i++) {
          await processBodyElement(sdtContent.children[i]);
        }
      }
    }
  };

  for (let i = 0; i < body.children.length; i++) {
    await processBodyElement(body.children[i]);
  }

  commitPendingGroup();
  if (currentElements.length > 0 || pages.length === 0) {
    flushPage();
  }

  const baseTitle = file.name.replace(/\.docx$/i, '') || 'Word_Import';
  return {
    version: '1.0',
    title: baseTitle,
    fileName: `${baseTitle}.qlm`,
    pageSetup,
    pages,
    masterElements: [],
  };
}
