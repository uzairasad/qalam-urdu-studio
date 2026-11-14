/**
 * Rebuilds an InPage document's pages: page size and margins, text frames where InPage put
 * them with the text InPage set in each (split across linked frames exactly as InPage broke
 * it), columns, rotation, borders and fills, lines, boxes and ellipses, and pictures.
 * Character formatting is per frame in Qalam, so each frame takes the font, size, weight,
 * colour, alignment and leading of most of its text.
 */
import type {
  DocElement,
  DocumentProject,
  GraphicElement,
  LineElement,
  Page,
  PageSetup,
  PaperSize,
  PictureElement,
  TextAlign,
  TextElement,
} from '../types/inpage.ts';
import { dibToPngDataUrl } from './dibToPng.ts';
import {
  type InPageObject,
  type InPageText,
  type PageGeometry,
  type SavedFrame,
  type SavedLine,
  type Tags,
  ObjectKind,
  readObjects,
  readPageGeometry,
  readStyleSheet,
  tagKey,
  UNITS_PER_POINT,
} from './inpageFormat.ts';
import { isTallNastaliqFont } from './fonts.ts';
import { decodeInPageBytes, normalizeInPageText, tidyParagraph } from './inpageText.ts';

const PT_TO_MM = 25.4 / 72;
const mm = (units: number) => Math.round((units / UNITS_PER_POINT) * PT_TO_MM * 100) / 100;
const ptToMm = (pt: number) => Math.round(pt * PT_TO_MM * 100) / 100;

/** InPage's built-in colours, in palette order (index 0 is "None"). */
const PALETTE = ['transparent', '#ffffff', '#000000', '#808080', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
const color = (index: number | undefined, fallback: string) =>
  index !== undefined && index >= 0 && index < PALETTE.length ? PALETTE[index] : fallback;

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/** The closest bundled font to an InPage font. */
export function mapInPageFont(name: string | undefined, arabicText: boolean): string {
  const n = (name ?? '').toLowerCase();
  if (arabicText || !n) {
    if (/kufi/.test(n)) return 'Noto Kufi Arabic';
    if (/ruq/.test(n)) return 'Aref Ruqaa';
    if (/quran|majeed|muhammadi|usmani|uthman|hira|qalam/.test(n)) return 'Amiri Quran';
    if (/nast|noori|faiz|jameel|alvi|mehr|kasheeda/.test(n)) return 'Noto Nastaliq Urdu';
    if (/naskh|nafees|aasaar|asaar|arab|trad|hadith|asif|lotus|badr|aswad|sindhi|zohar|pashto/.test(n)) return 'Scheherazade New';
    return arabicText ? 'Noto Nastaliq Urdu' : 'Segoe UI';
  }
  if (/times|roman|georgia|garamond|book|serif/.test(n)) return 'Times New Roman';
  return 'Arial';
}

function paperSize(widthMm: number, heightMm: number): PaperSize {
  const sizes: [PaperSize, number, number][] = [
    ['A4', 210, 297],
    ['Letter', 215.9, 279.4],
    ['Legal', 215.9, 355.6],
    ['Tabloid', 279.4, 431.8],
  ];
  const [w, h] = [Math.min(widthMm, heightMm), Math.max(widthMm, heightMm)];
  for (const [name, sw, sh] of sizes) if (Math.abs(w - sw) < 1.5 && Math.abs(h - sh) < 1.5) return name;
  return 'Custom';
}

export function pageSetupFromGeometry(g: PageGeometry): PageSetup {
  const widthMm = ptToMm(g.widthPt);
  const heightMm = ptToMm(g.heightPt);
  return {
    paperSize: paperSize(widthMm, heightMm),
    widthMm,
    heightMm,
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    margins: { top: ptToMm(g.topPt), bottom: ptToMm(g.bottomPt), left: ptToMm(g.leftPt), right: ptToMm(g.rightPt) },
    columns: 1,
    columnGutter: 5,
    direction: 'rtl',
  };
}

// ---- Text per frame -------------------------------------------------------------------------

interface FrameText {
  /** Payload byte ranges set in this frame, in order (several for multi-column frames). */
  ranges: [number, number][];
  /** The saved lines in each range (empty when the file has no line table). */
  lines: SavedLine[][];
  columnWidthPt?: number;
}

const frameKey = (id: number, page: number) => `${id}:${page}`;

/** Splits every story over its frames the way InPage did, using the saved line table. */
function distributeStories(text: InPageText): Map<string, FrameText> {
  const out = new Map<string, FrameText>();
  if (!text.storyFrames) return out;
  const storyRange: [number, number][] = [];
  for (const p of text.paragraphs) {
    const r = storyRange[p.story];
    if (!r) storyRange[p.story] = [p.position, p.position + p.length];
    else r[1] = p.position + p.length;
  }
  const lines = text.lines;
  let lineIndex = 0;
  text.storyFrames.forEach((frames, story) => {
    const range = storyRange[story];
    if (!range || !frames.length) return;
    const add = (f: SavedFrame, from: number, to: number, frameLines: SavedLine[]) => {
      const key = frameKey(f.id, f.page);
      const entry = out.get(key) ?? { ranges: [], lines: [], columnWidthPt: f.columnWidthPt };
      if (to > from) {
        entry.ranges.push([from, to]);
        entry.lines.push(frameLines);
      }
      out.set(key, entry);
    };
    if (lines) {
      while (lineIndex < lines.length && lines[lineIndex].start < range[0]) lineIndex++;
      const storyLines: typeof lines = [];
      while (lineIndex < lines.length && lines[lineIndex].start < range[1]) storyLines.push(lines[lineIndex++]);
      // Each frame takes lines until it holds the height InPage says it used; anything left
      // over (text InPage itself couldn't fit) goes in the last frame that shows text.
      const lastUsed = frames.reduce((last, f, i) => (f.usedPt > 0 ? i : last), 0);
      const chunks: (typeof lines)[] = frames.map(() => []);
      let k = 0;
      frames.forEach((f, i) => {
        if (f.usedPt <= 0) return;
        const limit = f.usedPt * 1.005 + 0.6;
        let used = 0;
        while (k < storyLines.length && used + storyLines[k].heightPt <= limit) {
          used += storyLines[k].heightPt;
          chunks[i].push(storyLines[k++]);
        }
      });
      if (k < storyLines.length) chunks[lastUsed].push(...storyLines.slice(k));
      frames.forEach((f, i) => {
        const chunk = chunks[i];
        if (!chunk.length) return add(f, 0, 0, []);
        const from = Math.max(range[0], chunk[0].start);
        const to = Math.min(range[1], chunk[chunk.length - 1].start + chunk[chunk.length - 1].count);
        add(f, from, to, chunk);
      });
    } else {
      // No saved lines: share the story out by the height each frame uses.
      const total = frames.reduce((n, f) => n + f.usedPt, 0) || 1;
      let from = range[0];
      frames.forEach((f, i) => {
        const to = i === frames.length - 1 ? range[1] : Math.min(range[1], from + Math.round(((range[1] - range[0]) * f.usedPt) / total));
        add(f, from, to, []);
        from = to;
      });
    }
  });
  return out;
}

export interface DecodedText {
  text: string;
  unreadable: number;
}

/** Tidies decoded text: one paragraph per line, alignment spaces gone, no trailing breaks. */
export function tidyText(raw: string): string {
  return raw
    .split('\n')
    .map(tidyParagraph)
    .join('\n')
    .replace(/\n+$/, '');
}

/**
 * Text of payload bytes [from, to): paragraphs on lines, page-number markers as {{PAGE}}.
 * `raw` leaves spaces and breaks as they are, for joining pieces before tidying.
 */
export function decodeRange(text: InPageText, from: number, to: number, raw = false): DecodedText {
  const bytes = text.payload.subarray(from, to);
  let out = '';
  let unreadable = 0;
  if (text.version === 3) {
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const c = bytes[i] | (bytes[i + 1] << 8);
      if (c === 0x0d || c === 0x0a || c === 0x0b) out += '\n';
      else if (c === 0x02) out += '{{PAGE}}';
      else if (c === 0x09 || c >= 0x20) out += String.fromCharCode(c);
    }
  } else {
    let start = 0;
    const flush = (end: number) => {
      const d = decodeInPageBytes(bytes.subarray(start, end));
      out += d.text;
      unreadable += d.unreadable;
    };
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0x04) i++;
      else if (bytes[i] === 0x02 || bytes[i] === 0x0b || bytes[i] === 0x0c) {
        flush(i);
        out += bytes[i] === 0x02 ? '{{PAGE}}' : '\n';
        start = i + 1;
      }
    }
    flush(bytes.length);
    out = normalizeInPageText(out);
  }
  return { text: raw ? out : tidyText(out), unreadable };
}

/** The style covering most of payload bytes [from, to): defaults, paragraph style, run. */
function dominantStyle(text: InPageText, ranges: [number, number][], sheet: Tags[]): Tags {
  const weight = new Map<number, number>();
  for (const [from, to] of ranges) {
    for (let i = 0; i < text.runs.length; i++) {
      const run = text.runs[i];
      if (run.end <= from || run.start >= to) continue;
      const overlap = Math.min(run.end, to) - Math.max(run.start, from);
      weight.set(i, (weight.get(i) ?? 0) + overlap);
    }
  }
  let best = -1;
  let bestWeight = -1;
  for (const [i, w] of weight) if (w > bestWeight) [best, bestWeight] = [i, w];
  const run = best >= 0 ? text.runs[best].tags : new Map<number, number>();
  const paragraphStyle = sheet[run.get(tagKey(0x00, 0x80)) ?? 0] ?? sheet[0];
  return new Map([...sheet[0], ...paragraphStyle, ...run]);
}

const ALIGN: Readonly<Record<number, TextAlign>> = { 0: 'left', 1: 'right', 2: 'center', 3: 'justify', 4: 'justify' };

// ---- Objects → elements ---------------------------------------------------------------------

/** Converts InPage's top-left-anchored, counter-clockwise rotation to a centre rotation. */
function placeRotated(x: number, y: number, w: number, h: number, degrees: number) {
  if (!degrees) return { x, y, rotation: 0 };
  const t = (degrees * Math.PI) / 180;
  const cx = x + (w / 2) * Math.cos(t) + (h / 2) * Math.sin(t);
  const cy = y - (w / 2) * Math.sin(t) + (h / 2) * Math.cos(t);
  return { x: cx - w / 2, y: cy - h / 2, rotation: Math.round(((-degrees % 360) + 360) % 360 * 100) / 100 };
}

function bounds(tags: Tags) {
  const x = tags.get(tagKey(0x7e, 0x00));
  const y = tags.get(tagKey(0x7e, 0x01));
  const w = tags.get(tagKey(0x7e, 0x02));
  const h = tags.get(tagKey(0x7e, 0x03));
  if (x === undefined || y === undefined || w === undefined || h === undefined) return null;
  return { x, y, w, h };
}

function borderOf(tags: Tags) {
  const style = tags.get(tagKey(0x7e, 0x15)) ?? 0;
  const width = tags.get(tagKey(0x7e, 0x05));
  if (!style) return { borderStyle: 'none' as const, borderWidth: 0, borderColor: '#000000' };
  return {
    borderStyle: (style === 2 ? 'dashed' : style === 3 ? 'dotted' : style === 4 ? 'double' : 'solid') as 'solid',
    borderWidth: Math.max(0.25, (width ?? 1000) / UNITS_PER_POINT),
    borderColor: color(tags.get(tagKey(0x7e, 0x07)), '#000000') === 'transparent' ? '#000000' : color(tags.get(tagKey(0x7e, 0x07)), '#000000'),
  };
}

export interface LayoutResult {
  project: DocumentProject;
  unreadable: number;
  paragraphs: number;
  frames: number;
  pictures: number;
}

/**
 * Builds the pages of a Qalam document from an InPage stream and its decoded text. Returns
 * null when the layout or saved frames can't be read, so the caller can fall back to text.
 */
export function buildLayout(
  stream: Uint8Array,
  text: InPageText,
  title: string,
  pictureStreams: (name: string) => Uint8Array | null
): LayoutResult | null {
  const geometry = readPageGeometry(stream);
  const objects = readObjects(stream.subarray(0, text.tableStart));
  if (!geometry || !objects.length || !text.storyFrames) return null;

  const byKey = new Map<string, InPageObject>();
  for (const o of objects) byKey.set(`${o.kind}:${o.id}:${o.page}`, o);
  const resolve = (o: InPageObject): Tags => {
    if (!o.master) return o.tags;
    const m = byKey.get(`${o.kind}:${o.master.id}:${o.master.page}`);
    return m ? new Map([...resolve(m), ...o.tags]) : o.tags;
  };

  const pageRecords = objects.filter((o) => o.kind === ObjectKind.Page);
  let realPages = pageRecords.filter((p) => p.tags.has(tagKey(0x7c, 0x07)));
  if (!realPages.length) realPages = pageRecords.filter((p) => p.page > 0).slice(-1);
  if (!realPages.length) return null;

  const frameTexts = distributeStories(text);
  const sheet = readStyleSheet(stream, text.tableStart);
  const defaultSize = (sheet[0].get(tagKey(0x7f, 0x00)) ?? 24000) / UNITS_PER_POINT;
  const setup = pageSetupFromGeometry(geometry);
  let unreadable = 0;
  let paragraphs = 0;
  let frames = 0;
  let pictures = 0;
  let counter = 1;
  const nextId = () => `inp-el-${Date.now().toString(36)}-${counter++}`;

  const textFor = (o: InPageObject): FrameText | undefined =>
    frameTexts.get(frameKey(o.id, o.page)) ?? (o.master ? frameTexts.get(frameKey(o.master.id, o.master.page)) : undefined);

  // Paragraph boundaries, to give each saved line the style of the paragraph it belongs to.
  const paragraphStarts = text.paragraphs.map((p) => p.position);
  const paragraphKey = new Map<number, string>();
  const styleKeyAt = (position: number): string => {
    let lo = 0;
    let hi = paragraphStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (paragraphStarts[mid] <= position) lo = mid;
      else hi = mid - 1;
    }
    const cached = paragraphKey.get(lo);
    if (cached !== undefined) return cached;
    const para = text.paragraphs[lo];
    const st = para ? dominantStyle(text, [[para.position, para.position + para.length]], sheet) : new Map();
    const key = [0x0202, 0x0201, 0x7f00, 0x7f80, 0x7f02, 0x7f07].map((k) => st.get(k) ?? '').join('|');
    paragraphKey.set(lo, key);
    return key;
  };

  interface Geometry {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }

  /** One Qalam text element for payload ranges, styled like most of its text. */
  const makeText = (
    ranges: [number, number][],
    lineHeights: number[],
    geometry: Geometry,
    options: { paddingPt: number; columns: number; gutterPt: number; border: ReturnType<typeof borderOf>; fill: string; fitBox: boolean },
    preset?: DecodedText
  ): TextElement | null => {
    const decoded = preset ? [preset] : ranges.map(([a, b]) => decodeRange(text, a, b));
    const body = decoded.map((d) => d.text).join('\n').replace(/^\n+|\n+$/g, '');
    if (!body.trim() && options.border.borderStyle === 'none' && (options.fill === 'transparent' || options.fill === '#ffffff')) return null;
    unreadable += decoded.reduce((n, d) => n + d.unreadable, 0);
    paragraphs += body.split(/\n+/).filter((p) => p.trim()).length;

    const style = dominantStyle(text, ranges, sheet);
    const plain = body.replace(/\{\{PAGE\}\}/g, '');
    const rtl = ARABIC.test(plain) || !/[A-Za-z]/.test(plain);
    const fontIndex = style.get(tagKey(0x02, rtl ? 0x02 : 0x01));
    const fontFamily = mapInPageFont(text.fonts[fontIndex ?? -1], rtl);
    const minLeading = isTallNastaliqFont(fontFamily) ? 1.75 : rtl ? 1.45 : 1.15;
    let fontSize = Math.max(4, Math.min(400, (style.get(tagKey(0x7f, 0x00)) ?? defaultSize * UNITS_PER_POINT) / UNITS_PER_POINT));
    const heights = lineHeights.filter((h) => h > 0.01);
    // Average line height, so the lines take exactly the height InPage gave them.
    const pitch = heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : (style.get(tagKey(0x7f, 0x8a)) ?? 0) / UNITS_PER_POINT;
    // Keep InPage's line spacing; where the bundled font needs more room per line than that,
    // set it a little smaller instead of letting lines overlap.
    if (pitch > 0) fontSize = Math.min(fontSize, pitch / minLeading);
    fontSize = Math.round(fontSize * 10) / 10;
    const lineHeight = pitch > 0 ? pitch / fontSize : rtl ? 1.85 : 1.3;
    const weight = style.get(tagKey(0x7f, 0x02)) ?? 400;
    const align = ALIGN[style.get(tagKey(0x7f, 0x80)) ?? (rtl ? 1 : 0)] ?? (rtl ? 'right' : 'left');
    const scale = style.get(tagKey(0x7f, 0x01));

    let { x, y, width, height } = geometry;
    let paddingMm = Math.round(Math.min(10, options.paddingPt * PT_TO_MM) * 10) / 10;
    if (options.fitBox) {
      // The canvas pads frame text; widen the box by that padding so the text sits where it was.
      const px = fontSize * (96 / 72);
      const top = Math.max(4, Math.round(px * 0.28)) / 3.78;
      const bottom = Math.max(5, Math.round(px * 0.34)) / 3.78;
      const side = 5 / 3.78;
      x -= side;
      width += 2 * side;
      y -= top;
      height += top + bottom;
      paddingMm = 0;
    }
    const round = (v: number) => Math.round(v * 100) / 100;
    const textColor = color(style.get(tagKey(0x7f, 0x07)), '#000000');
    return {
      id: nextId(),
      type: 'text',
      x: round(x),
      y: round(y),
      width: round(width),
      height: round(height),
      ...(geometry.rotation ? { rotation: geometry.rotation } : {}),
      text: body,
      fontFamily,
      fontSize,
      lineHeight: Math.round(Math.min(6, Math.max(1, lineHeight)) * 1000) / 1000,
      letterSpacing: 0,
      scaleX: scale && scale >= 500 && scale <= 2000 && scale !== 1000 ? Math.round(scale / 10) : 100,
      paddingMm,
      color: textColor === 'transparent' ? '#000000' : textColor,
      bold: weight >= 600,
      italic: style.get(tagKey(0x7f, 0x03)) === 1,
      underline: false,
      align,
      direction: rtl ? 'rtl' : 'ltr',
      ...(options.columns > 1 ? { columns: options.columns, columnGutter: ptToMm(options.gutterPt || 12) } : {}),
      ...options.border,
      backgroundColor: options.fill,
    };
  };

  /** A text frame: one element, or (single column, upright) a block per paragraph style. */
  /** Text of saved lines; a table row's cells go side by side, separated by tabs. */
  const blockText = (blockLines: SavedLine[]): DecodedText => {
    let raw = '';
    let bad = 0;
    for (const l of blockLines) {
      const d = decodeRange(text, l.start, l.start + l.count, true);
      bad += d.unreadable;
      raw += l.row ? d.text.replace(/\n(?=[^\n]*\S)(?!$)/g, '\t').replace(/\n*$/, '\n') : d.text;
    }
    return { text: tidyText(raw.replace(/[ \t]*\t[ \t]*/g, '\t')), unreadable: bad };
  };

  /**
   * A text frame: one element, or (single column, upright) a block per paragraph style. Where
   * other text frames overlap it (interlinear translations and the like), every line is placed
   * on its own, at the exact position and with the exact line break InPage gave it.
   */
  const toText = (o: InPageObject, tags: Tags, page: InPageObject, overlapped: boolean): DocElement[] => {
    const ft = textFor(o);
    const border = borderOf(tags);
    const fill = color(tags.get(tagKey(0x7e, 0x0e)), 'transparent');

    let box = bounds(tags);
    if (!box || (!box.w && !box.h)) {
      // A frame with no geometry is the page's automatic text area, inside the margins.
      const l = page.tags.get(tagKey(0x7c, 0x03)) ?? geometry.leftPt * UNITS_PER_POINT;
      const t = page.tags.get(tagKey(0x7c, 0x04)) ?? geometry.topPt * UNITS_PER_POINT;
      const r = page.tags.get(tagKey(0x7c, 0x05)) ?? geometry.rightPt * UNITS_PER_POINT;
      const b = page.tags.get(tagKey(0x7c, 0x06)) ?? geometry.bottomPt * UNITS_PER_POINT;
      box = { x: l, y: t, w: geometry.widthPt * UNITS_PER_POINT - l - r, h: geometry.heightPt * UNITS_PER_POINT - t - b };
    }
    const x0 = Math.min(box.x, box.x + box.w);
    const y0 = Math.min(box.y, box.y + box.h);
    const w = Math.abs(box.w);
    const h = Math.abs(box.h);
    const rot = placeRotated(mm(x0), mm(y0), mm(w), mm(h), (tags.get(tagKey(0x7e, 0x1a)) ?? 0) / 1000);
    const columns = Math.max(1, Math.min(16, tags.get(tagKey(0x03, 0x05)) ?? 1));
    const gutterPt = (tags.get(tagKey(0x03, 0x06)) ?? 0) / UNITS_PER_POINT;
    const widthPt = w / UNITS_PER_POINT;
    const insetPt = ft?.columnWidthPt ? Math.max(0, (widthPt - ft.columnWidthPt * columns - gutterPt * (columns - 1)) / 2) : 2;

    const lines = ft && ft.lines.length === 1 ? ft.lines[0] : null;
    if (lines && lines.length && columns === 1 && !rot.rotation) {
      const out: DocElement[] = [];
      if (border.borderStyle !== 'none' || (fill !== 'transparent' && fill !== '#ffffff')) {
        out.push({ id: nextId(), type: 'graphic', x: rot.x, y: rot.y, width: mm(w), height: mm(h), shape: 'rect', fillColor: fill, ...border });
      }
      const none = { borderStyle: 'none' as const, borderWidth: 0, borderColor: '#000000' };
      const textWidthPt = ft!.columnWidthPt && ft!.columnWidthPt > 0 ? ft!.columnWidthPt : widthPt - 2 * insetPt;
      let offset = 0;
      let i = 0;
      while (i < lines.length) {
        const key = styleKeyAt(lines[i].start);
        let j = i;
        let blockHeight = 0;
        do blockHeight += lines[j++].heightPt;
        while (!overlapped && j < lines.length && styleKeyAt(lines[j].start) === key);
        const from = lines[i].start;
        const to = lines[j - 1].start + lines[j - 1].count;
        const el = makeText(
          [[from, to]],
          lines.slice(i, j).map((l) => l.heightPt),
          { x: rot.x + ptToMm(insetPt), y: rot.y + ptToMm(insetPt + offset), width: ptToMm(textWidthPt), height: ptToMm(blockHeight) },
          { paddingPt: 0, columns: 1, gutterPt: 0, border: none, fill: 'transparent', fitBox: true },
          blockText(lines.slice(i, j))
        );
        if (el) out.push(el);
        offset += blockHeight;
        i = j;
      }
      if (out.length) frames++;
      return out;
    }

    const el = makeText(
      ft?.ranges ?? [],
      (ft?.lines ?? []).flat().map((l) => l.heightPt),
      { x: rot.x, y: rot.y, width: mm(w), height: mm(h), rotation: rot.rotation },
      { paddingPt: insetPt, columns, gutterPt, border, fill, fitBox: false }
    );
    if (el) frames++;
    return el ? [el] : [];
  };

  const toLine = (tags: Tags): LineElement | null => {
    const box = bounds(tags);
    if (!box) return null;
    const x1 = mm(box.x);
    const y1 = mm(box.y);
    const dx = mm(box.w);
    const dy = mm(box.h);
    const length = Math.hypot(dx, dy);
    if (length < 0.2) return null;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const strokePt = Math.max(0.25, (tags.get(tagKey(0x7e, 0x05)) ?? 500) / UNITS_PER_POINT);
    const boxH = Math.max(1, strokePt * PT_TO_MM * 2);
    const cx = x1 + dx / 2;
    const cy = y1 + dy / 2;
    const style = tags.get(tagKey(0x7e, 0x15)) ?? 1;
    return {
      id: nextId(),
      type: 'line',
      x: Math.round((cx - length / 2) * 100) / 100,
      y: Math.round((cy - boxH / 2) * 100) / 100,
      width: Math.round(length * 100) / 100,
      height: Math.round(boxH * 100) / 100,
      ...(Math.abs(angle) > 0.05 ? { rotation: Math.round(((angle % 360) + 360) % 360 * 100) / 100 } : {}),
      orientation: 'horizontal',
      strokeWidth: Math.round(strokePt * (96 / 72) * 100) / 100,
      color: (() => {
        const c = color(tags.get(tagKey(0x7e, 0x07)), '#000000');
        return c === 'transparent' || c === '#ffffff' ? '#000000' : c;
      })(),
      style: style === 2 ? 'dashed' : style === 3 ? 'dotted' : style === 4 ? 'double' : 'solid',
    };
  };

  const toGraphic = (o: InPageObject, tags: Tags): GraphicElement | PictureElement | null => {
    const box = bounds(tags);
    if (!box || !box.w || !box.h) return null;
    const x0 = Math.min(box.x, box.x + box.w);
    const y0 = Math.min(box.y, box.y + box.h);
    const w = Math.abs(box.w);
    const h = Math.abs(box.h);
    const rot = placeRotated(mm(x0), mm(y0), mm(w), mm(h), (tags.get(tagKey(0x7e, 0x1a)) ?? 0) / 1000);
    const shapeCode = tags.get(tagKey(0x05, 0x05)) ?? 0;
    const base = {
      id: nextId(),
      x: rot.x,
      y: rot.y,
      width: mm(w),
      height: mm(h),
      ...(rot.rotation ? { rotation: rot.rotation } : {}),
      ...borderOf(tags),
    };
    const streamName = o.pictureStream ?? (o.master ? byKey.get(`${o.kind}:${o.master.id}:${o.master.page}`)?.pictureStream : undefined);
    if (streamName) {
      const bytes = pictureStreams(streamName);
      const src = bytes ? imageDataUrl(bytes) : null;
      if (src) {
        pictures++;
        return { ...base, type: 'picture', imageSrc: src, shape: shapeCode === 1 ? 'oval' : 'rect', objectFit: 'contain' };
      }
    }
    const fill = color(tags.get(tagKey(0x7e, 0x0e)), 'transparent');
    if (fill === 'transparent' && base.borderStyle === 'none') return null;
    const polygon = o.polygon ?? (o.master ? byKey.get(`${o.kind}:${o.master.id}:${o.master.page}`)?.polygon : undefined);
    if (shapeCode === 6 && polygon) {
      // Polygons (slanted boxes and the like) become a vector picture of the exact shape.
      const left = Math.min(...polygon.map((v) => v.x));
      const top = Math.min(...polygon.map((v) => v.y));
      const right = Math.max(...polygon.map((v) => v.x));
      const bottom = Math.max(...polygon.map((v) => v.y));
      const stroke = base.borderStyle === 'none' ? 0 : base.borderWidth * UNITS_PER_POINT;
      const pad = stroke / 2;
      const vw = right - left + stroke;
      const vh = bottom - top + stroke;
      const points = polygon.map((v) => `${v.x - left + pad},${v.y - top + pad}`).join(' ');
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="none">` +
        `<polygon points="${points}" fill="${fill === 'transparent' ? 'none' : fill}"` +
        (stroke ? ` stroke="${base.borderColor}" stroke-width="${stroke}" stroke-linejoin="miter"` : '') +
        '/></svg>';
      const picture: PictureElement = {
        id: base.id,
        type: 'picture',
        x: mm(left - pad),
        y: mm(top - pad),
        width: mm(vw),
        height: mm(vh),
        borderStyle: 'none',
        borderWidth: 0,
        imageSrc: `data:image/svg+xml;base64,${btoa(svg)}`,
        shape: 'rect',
        objectFit: 'fill',
      };
      return picture;
    }
    return { ...base, type: 'graphic', shape: shapeCode === 1 ? 'oval' : shapeCode === 2 ? 'roundRect' : 'rect', fillColor: fill };
  };

  const pages: Page[] = realPages.map((pageRecord, index) => {
    const elements: DocElement[] = [];
    let onPage = objects.filter((o) => o.page === pageRecord.page && o.kind !== ObjectKind.Page && o.kind !== ObjectKind.Guide);
    // Older files may not repeat master objects on each page: take them from the master.
    const masterIndex = (pageRecord.tags.get(tagKey(0x7c, 0x07)) ?? 0) & 0xffff;
    if (masterIndex && !onPage.some((o) => o.master)) {
      const fromMaster = objects.filter(
        (o) => o.page === masterIndex && o.kind !== ObjectKind.Page && o.kind !== ObjectKind.Guide && !onPage.some((p) => p.id === o.id)
      );
      onPage = [...fromMaster, ...onPage];
    }
    // Text frames' boxes, to find frames laid over one another.
    const textBoxes = onPage
      .filter((o) => o.kind === ObjectKind.Text)
      .map((o) => {
        const b = bounds(resolve(o));
        return b && b.w && b.h
          ? { o, x0: Math.min(b.x, b.x + b.w), y0: Math.min(b.y, b.y + b.h), x1: Math.max(b.x, b.x + b.w), y1: Math.max(b.y, b.y + b.h) }
          : null;
      })
      .filter((b) => b !== null);
    const overlapped = (o: InPageObject) => {
      const me = textBoxes.find((b) => b.o === o);
      if (!me) return false;
      return textBoxes.some((b) => {
        if (b === me || !textFor(b.o)?.ranges.length) return false;
        const w = Math.min(me.x1, b.x1) - Math.max(me.x0, b.x0);
        const h = Math.min(me.y1, b.y1) - Math.max(me.y0, b.y0);
        return w > 0 && h > 0 && w * h > 0.02 * Math.min((b.x1 - b.x0) * (b.y1 - b.y0), (me.x1 - me.x0) * (me.y1 - me.y0));
      });
    };
    for (const o of onPage) {
      const tags = resolve(o);
      const made: (DocElement | null)[] =
        o.kind === ObjectKind.Text ? toText(o, tags, pageRecord, overlapped(o)) : o.kind === ObjectKind.Line ? [toLine(tags)] : o.kind === ObjectKind.Graphic ? [toGraphic(o, tags)] : [];
      for (const el of made) if (el) elements.push({ ...el, zIndex: elements.length + 1 });
    }
    return { id: `inp-page-${Date.now().toString(36)}-${index + 1}`, pageNumber: index + 1, elements };
  });

  return {
    project: { version: '1.0', title, fileName: `${title}.qlm`, pageSetup: setup, pages, masterElements: [] },
    unreadable,
    paragraphs,
    frames,
    pictures,
  };
}

function imageDataUrl(bytes: Uint8Array): string | null {
  const b64 = () => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return `data:image/jpeg;base64,${b64()}`;
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return `data:image/png;base64,${b64()}`;
  return dibToPngDataUrl(bytes);
}
