/**
 * Saves a document as an InPage 2000–2005 file (.inp, "InPage100"), which every InPage from
 * 2000 on opens.
 *
 * The parts of the format that are understood are written from the document: page size and
 * margins, one InPage page per page, the text (InPage's own encoding) as one story flowing
 * through the pages' text areas, paragraphs, and per-word formatting as style runs (font, size,
 * bold, italic, colour, alignment). Everything else (preferences, colour table, default
 * style, record layouts) is copied from InPage's own sample document (inpageTemplate.ts).
 * InPage saves a layout cache with every line's breaks measured in its own fonts; this writes
 * one line per paragraph, leaving InPage to set the lines again. Frame positions, pictures and
 * shapes aren't written: the text comes in page by page for laying out in InPage.
 */
import type { DocumentProject, TextElement, TextRun } from '../types/inpage.ts';
import { encodeInPageText } from './inpageText.ts';
import * as T from './inpageTemplate.ts';
import { writeOle } from './oleWriter.ts';
import { runsOf } from './richText.ts';

const U = 2000; // InPage units per point
const PT_PER_MM = 72 / 25.4;

function b64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

class Out {
  bytes: number[] = [];
  get length() {
    return this.bytes.length;
  }
  u8(...v: number[]) {
    for (const x of v) this.bytes.push(x & 0xff);
    return this;
  }
  u16(v: number) {
    return this.u8(v, v >> 8);
  }
  u32(v: number) {
    return this.u8(v, v >> 8, v >> 16, v >>> 24);
  }
  raw(a: Uint8Array | number[]) {
    for (const x of a) this.bytes.push(x);
    return this;
  }
  setU32(at: number, v: number) {
    this.bytes[at] = v & 0xff;
    this.bytes[at + 1] = (v >> 8) & 0xff;
    this.bytes[at + 2] = (v >> 16) & 0xff;
    this.bytes[at + 3] = (v >>> 24) & 0xff;
  }
}

/** Sets every 4-byte tag `key group` in a record's bytes (tags are [key][group][value]). */
function patchTag(rec: Uint8Array, group: number, key: number, value: number): void {
  for (let p = 0; p + 6 <= rec.length; p++) {
    if (rec[p] === key && rec[p + 1] === group) {
      new DataView(rec.buffer, rec.byteOffset).setInt32(p + 2, value, true);
      return;
    }
  }
}

/** A copy of a template record with a new page index (header) and serial number (82 tag). */
function record(template: string, page: number, serial?: number): Uint8Array {
  const rec = b64(template);
  new DataView(rec.buffer).setUint32(4, page, true);
  if (serial !== undefined) patchTag(rec, 0x00, 0x82, serial);
  return rec;
}

/** Records in a slice of several (guides): page index and serials on each. */
function records(template: string, page: number, firstSerial: number | undefined): Uint8Array {
  const all = b64(template);
  const dv = new DataView(all.buffer);
  let serial = firstSerial;
  for (let q = 0; q + 12 <= all.length; ) {
    dv.setUint32(q + 4, page, true);
    const len = dv.getUint32(q + 8, true);
    if (serial !== undefined) {
      patchTag(all.subarray(q, q + 12 + len), 0x00, 0x82, serial);
      serial++;
    }
    q += 12 + len;
  }
  return all;
}

/** The template's font names (54-byte slots after a u32 size at the end of `main`). */
function templateFonts(main: Uint8Array): { names: string[]; tableStart: number } {
  for (let count = 1; count < 256; count++) {
    const start = main.length - count * 54;
    if (start < 4) break;
    const size = new DataView(main.buffer, main.byteOffset).getUint32(start - 4, true);
    if (size === count * 54) {
      const names = [];
      for (let i = 0; i < count; i++) {
        const slot = main.subarray(start + i * 54, start + i * 54 + 32);
        const end = slot.indexOf(0);
        names.push(String.fromCharCode(...slot.subarray(0, end < 0 ? 32 : end)));
      }
      return { names, tableStart: start };
    }
  }
  return { names: [], tableStart: main.length };
}

/** InPage font for a bundled font. */
function inpageFontIndex(names: string[], family: string | undefined, urdu: boolean): number {
  const f = (family ?? '').toLowerCase();
  const want = urdu
    ? /naskh|amiri|scheherazade|lateef|kufi|ruqaa|sans arabic/.test(f)
      ? ['Naskh', 'Simplified Arabic', 'Noori Nastaliq']
      : ['Noori Nastaliq']
    : /times|serif/.test(f)
      ? ['Times New Roman', 'Arial']
      : ['Arial', 'Times New Roman'];
  for (const w of want) {
    const i = names.findIndex((n) => n.toLowerCase() === w.toLowerCase());
    if (i >= 0) return i;
  }
  return 0;
}

const PALETTE: [number, number, number][] = [
  [0, 0, 0], // (None: unused)
  [255, 255, 255],
  [0, 0, 0],
  [128, 128, 128],
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
  [0, 0, 255],
  [255, 0, 255],
];

function colorIndex(css: string | undefined): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(css ?? '');
  if (!m) return 2;
  const v = parseInt(m[1], 16);
  const rgb = [v >> 16, (v >> 8) & 255, v & 255];
  let best = 2;
  let bestD = Infinity;
  PALETTE.forEach((c, i) => {
    if (i === 0) return;
    const d = (c[0] - rgb[0]) ** 2 + (c[1] - rgb[1]) ** 2 + (c[2] - rgb[2]) ** 2;
    if (d < bestD) [best, bestD] = [i, d];
  });
  return best;
}

const ALIGN_CODE: Record<string, number> = { left: 0, right: 1, center: 2, justify: 3 };

interface Piece {
  bytes: Uint8Array;
  tags: number[]; // style run tag bytes (after "80 00 <u32 0>")
  sizePt: number;
  urdu: boolean;
}

/** Text frames of a page in reading order: top to bottom, then right to left. */
function framesInOrder(project: DocumentProject, pageIndex: number): TextElement[] {
  const els = [...project.masterElements, ...project.pages[pageIndex].elements].filter(
    (e): e is TextElement => e.type === 'text' && e.text.trim().length > 0
  );
  return els.sort((a, b) => (Math.abs(a.y - b.y) > 3 ? a.y - b.y : b.x + b.width - (a.x + a.width)));
}

export interface InPageWriteResult {
  bytes: Uint8Array;
  /** Characters with no InPage code, left out. */
  unmappable: number;
  pages: number;
}

/** A document as an InPage 2000–2005 .inp file. */
export function writeInPage(project: DocumentProject): InPageWriteResult {
  const header = b64(T.header);
  const main = b64(T.main);
  const { names: fonts } = templateFonts(main);
  const ps = project.pageSetup;
  const geometry = [ps.widthMm, ps.heightMm, ps.margins.left, ps.margins.top, ps.margins.right, ps.margins.bottom].map((mm) =>
    Math.round(mm * PT_PER_MM * U)
  );
  const contentW = geometry[0] - geometry[2] - geometry[4];
  const contentH = geometry[1] - geometry[3] - geometry[5];

  // Page size and margins in the document defaults (06 01 … 0B 01).
  const hv = new DataView(header.buffer);
  for (let p = 0; p + 36 <= header.length; p++) {
    let ok = true;
    for (let i = 0; i < 6 && ok; i++) ok = header[p + i * 6] === 6 + i && header[p + i * 6 + 1] === 1;
    if (!ok) continue;
    geometry.forEach((v, i) => hv.setUint32(p + i * 6 + 2, v, true));
    break;
  }
  const withMargins = (rec: Uint8Array) => {
    patchTag(rec, 0x7c, 0x03, geometry[2]);
    patchTag(rec, 0x7c, 0x04, geometry[3]);
    patchTag(rec, 0x7c, 0x05, geometry[4]);
    patchTag(rec, 0x7c, 0x06, geometry[5]);
    return rec;
  };
  const withGuides = (recs: Uint8Array) => {
    // Guides: left, top, right (x = width − right margin), bottom (y = height − bottom margin).
    const dv = new DataView(recs.buffer, recs.byteOffset);
    const values = [
      [0, geometry[2]],
      [1, geometry[3]],
      [0, geometry[0] - geometry[4]],
      [1, geometry[1] - geometry[5]],
    ];
    let q = 0;
    for (const [key, value] of values) {
      const len = dv.getUint32(q + 8, true);
      patchTag(recs.subarray(q, q + 12 + len), 0x7e, key, value);
      q += 12 + len;
    }
    return recs;
  };

  // ---- Text: one story through all pages ----
  let unmappable = 0;
  const pagesText: Piece[][][] = []; // page → paragraphs → pieces
  for (let pi = 0; pi < project.pages.length; pi++) {
    const paragraphs: Piece[][] = [];
    for (const te of framesInOrder(project, pi)) {
      let current: Piece[] = [];
      const flush = () => {
        paragraphs.push(current);
        current = [];
      };
      for (const run of runsOf(te) as TextRun[]) {
        const parts = run.text.split('\n');
        parts.forEach((part, k) => {
          if (k > 0) flush();
          if (!part) return;
          for (const seg of part.split(/(\{\{PAGE\}\})/)) {
            if (!seg) continue;
            let bytes: Uint8Array;
            if (seg === '{{PAGE}}') bytes = new Uint8Array([0x02]);
            else {
              const enc = encodeInPageText(seg);
              unmappable += enc.unmappable;
              bytes = enc.bytes;
            }
            const urdu = /[؀-ۿ]/.test(seg) || (te.direction ?? 'rtl') === 'rtl';
            const sizePt = run.fontSize ?? te.fontSize ?? 12;
            const tags = new Out();
            tags.u8(0x01, 0x02).u16(inpageFontIndex(fonts, run.fontFamily ?? te.fontFamily, false));
            tags.u8(0x02, 0x02).u16(inpageFontIndex(fonts, run.fontFamily ?? te.fontFamily, true));
            tags.u8(0x00, 0x7f).u32(Math.round(sizePt * U));
            tags.u8(0x02, 0x7f).u16((run.bold ?? te.bold) ? 700 : 400);
            tags.u8(0x03, 0x7f).u16((run.italic ?? te.italic) ? 1 : 0);
            tags.u8(0x07, 0x7f).u16(colorIndex(run.color ?? te.color));
            tags.u8(0x80, 0x7f).u16(ALIGN_CODE[te.align] ?? 1);
            current.push({ bytes, tags: tags.bytes, sizePt, urdu });
          }
        });
      }
      flush();
    }
    pagesText.push(paragraphs.filter((p) => p.length));
  }
  if (!pagesText.some((p) => p.length)) pagesText[0] = [[]];

  // ---- Stream ----
  const out = new Out();
  out.raw(header);
  // Pasteboard.
  out.u16(1).u32(11).raw(withMargins(record(T.pasteboard, 0)));
  // Master page 1 with its automatic text frame (the story's frame on every page).
  out.u16(6).u32(14).raw(withMargins(record(T.masterPage, 1))).raw(withGuides(records(T.guides, 1, undefined))).raw(record(T.masterFrame, 1));
  out.u8(0, 0, 1, 0);
  // Pages: InPage keeps an object number per page; continue the template's sequence.
  const pageCount = Math.max(1, project.pages.length);
  for (let n = 0; n < pageCount; n++) {
    const page = 2 + n;
    const id = 41 + 66 * n;
    const pageRec = withMargins(record(T.page, page, 2 + 5 * n));
    patchTag(pageRec, 0x7c, 0x07, ((id + 4) << 16) | 1);
    const frame = record(T.pageFrame, page);
    patchTag(frame, 0x03, 0x08, id + 6);
    out.u16(6).u32(id).raw(pageRec).raw(withGuides(records(T.pageGuides, page, 3 + 5 * n))).raw(frame);
  }
  const nameStart = out.length + 4;
  out.u32(0).raw([...'InPage Arabic Document'].map((c) => c.charCodeAt(0)));
  const nameEnd = out.length;

  // Main section: defaults, style sheet and fonts from the template, then the text.
  out.raw(main);
  // Text table: story 0 (the master frame's own, empty), story 1 (the document).
  out.u32(1).u8(0x0d).u32(0).u8(0);
  const allParagraphs = pagesText.flat();
  for (const para of allParagraphs) {
    const len = para.reduce((n, p) => n + p.bytes.length, 0) + 1;
    out.u32(len);
    for (const p of para) out.raw(p.bytes);
    out.u8(0x0d);
  }
  out.u32(0).u8(0);
  out.u32(0xffffffff);
  // Style runs over the same bytes.
  out.u32(1).u32(12).u16(1).u32(6).u8(0x80, 0).u32(0);
  for (const para of allParagraphs) {
    para.forEach((p, i) => {
      const count = p.bytes.length + (i === para.length - 1 ? 1 : 0);
      const size = 6 + 6 + p.tags.length;
      out.u32(count).u32(size).u16(1).u32(size - 6).u8(0x80, 0).u32(0).raw(p.tags);
    });
    if (!para.length) {
      const size = 12;
      out.u32(1).u32(size).u16(1).u32(size - 6).u8(0x80, 0).u32(0);
    }
  }
  // Saved frames: story 0 in the master frame, story 1 in each page's frame.
  const frames = b64(T.frameRecords);
  const rec = (i: number) => frames.slice(i * 62, (i + 1) * 62);
  out.u32(0xffffffff).u32(0xffffffff).u16(0);
  out.raw(rec(0)).raw(rec(1));
  const lineHeight = (sizePt: number) => Math.round(sizePt * 1.65 * U);
  pagesText.forEach((paras, n) => {
    const r = rec(2);
    const dv = new DataView(r.buffer);
    const used = Math.min(contentH, paras.reduce((h, para) => h + lineHeight(Math.max(...para.map((p) => p.sizePt), 12)), 0));
    dv.setInt32(4, used, true);
    dv.setInt32(12, contentH, true);
    dv.setInt32(16, contentW, true);
    dv.setUint16(28, 5, true);
    dv.setUint16(30, 2 + n, true);
    out.raw(r);
  });
  out.raw(rec(4));
  // Saved lines: one per paragraph (InPage sets the lines again).
  out.u32(0xffffffff).u32(0).u32(0);
  out.raw(b64(T.storyZeroLine));
  let first = true;
  for (const para of allParagraphs) {
    const count = para.reduce((n, p) => n + p.bytes.length, 0) + 1;
    const size = Math.max(12, ...para.map((p) => p.sizePt));
    const h = lineHeight(size);
    out.u32(count).u32(h).u32(first ? 0x10001 : 0x1).u32(16 + 30);
    out.u32(Math.round(h * 0.787)).u16(1).u16(1).u32(0).u32(contentW);
    out.u16(para.some((p) => p.urdu) || !para.length ? 0x7f85 : 0x7f80).u16(0).u16(0).u16(Math.min(count, 0xffff));
    out.u32(0).u32(contentW).raw(new Array(14).fill(0));
    first = false;
  }
  const trailer = b64(T.trailer);
  out.raw(trailer.subarray(0, 18));
  const mainEnd = out.length;
  out.raw(trailer.subarray(18));
  const streamEnd = out.length;

  // Section table: where each part ends.
  const ends = [nameStart, nameStart, nameStart, nameEnd, mainEnd, mainEnd, streamEnd];
  ends.forEach((v, i) => out.setU32(0x12 + i * 6, v));
  // The main section header records the story count (less one) and the font count.
  const mainAt = nameEnd;
  out.setU32(mainAt + 16, 1);

  const stream = new Uint8Array(out.bytes);
  return {
    bytes: writeOle([
      { name: 'InPage100', data: stream },
      { name: 'DocumentInfo', data: new Uint8Array(1316) },
    ]),
    unmappable,
    pages: pageCount,
  };
}
