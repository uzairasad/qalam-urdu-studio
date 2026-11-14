/**
 * Low-level reader for the InPage document stream: "InPage100" (InPage 1.x–2005, text in
 * InPage's own 8-bit encoding) and "InPage300" (InPage 2009 and later, text in UTF-16LE).
 * Both share one structure, worked out from real documents (see docs/INPAGE-FORMAT.md):
 *
 * 1. Document defaults, including page size and margins (tags 06 01 … 0B 01, 1/2000 pt).
 * 2. Layout: one record per object (pages, guides, text frames, lines, graphics, pictures),
 *    `[kind u16][id u16][page u32][length u32][tag stream]`. Objects placed by a master page are
 *    repeated on every page with a reference to the master object and any overrides.
 * 3. Fonts, then the text table: every paragraph's length and bytes, stories (the text of one
 *    chain of linked frames) one after another.
 * 4. Style runs covering the text, then the saved layout: for each story, the frames it flows
 *    through (and the height each one uses), then every line with its byte count and height.
 *
 * Everything is validated (tables must cover exactly the same bytes, records must parse to
 * their end); anything that doesn't add up is treated as absent, so callers can fall back.
 */

/** InPage measures in 1/2000 of a point. */
export const UNITS_PER_POINT = 2000;

export type InPageVersion = 1 | 3;

/** A tag value: `key` and `group` bytes, then 2 or 4 bytes (or a block for 7e.1b / 05.00). */
export type Tags = Map<number, number>;
export const tagKey = (group: number, key: number) => (group << 8) | key;

const WIDE: Readonly<Record<number, ReadonlySet<number>>> = {
  0x00: new Set([0x80, 0x82]),
  0x03: new Set([0x01, 0x02, 0x06, 0x08]),
  0x05: new Set([0x00, 0x01, 0x02, 0x03, 0x04]),
  0x7c: new Set([0x03, 0x04, 0x05, 0x06, 0x07]),
  0x7e: new Set([0x00, 0x01, 0x02, 0x03, 0x05, 0x1a, 0x1b, 0x1c]),
};

/** Character/paragraph style tags (groups 02 and 7f) that hold 4-byte values. */
const WIDE_STYLE = new Set([0x00, 0x05, 0x06, 0x21, 0x48, 0x81, 0x82, 0x83, 0x8a, 0x8b, 0x8d, 0x8e, 0x8f]);

class Reader {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  get length() {
    return this.bytes.length;
  }
  u16(p: number) {
    return p + 2 <= this.bytes.length ? this.view.getUint16(p, true) : -1;
  }
  u32(p: number) {
    return p + 4 <= this.bytes.length ? this.view.getUint32(p, true) : -1;
  }
  i32(p: number) {
    return p + 4 <= this.bytes.length ? this.view.getInt32(p, true) : 0;
  }
}

/** Parses an object record's tag stream. Returns null unless it parses to exactly `end`. */
function parseObjectTags(r: Reader, start: number, end: number, polygon?: { x: number; y: number }[]): Tags | null {
  const tags: Tags = new Map();
  let p = start;
  while (p + 2 <= end) {
    const key = r.bytes[p];
    const group = r.bytes[p + 1];
    // Picture properties 05.0d (8 bytes) and 05.0f (4 bytes) are wider than the rest of their group.
    const width = group === 0x05 && key === 0x0d ? 8 : group === 0x05 && key === 0x0f ? 4 : WIDE[group]?.has(key) ? 4 : 2;
    if (p + 2 + width > end) return null;
    const value = width >= 4 ? r.i32(p + 2) : r.u16(p + 2);
    tags.set(tagKey(group, key), value);
    p += 2 + width;
    // Polygon vertices (7e.1b) and a picture's file names (05.00) follow their byte count.
    if ((group === 0x7e && key === 0x1b) || (group === 0x05 && key === 0x00)) {
      if (value < 0 || p + value > end) return null;
      if (polygon && group === 0x7e && value % 8 === 0) {
        for (let v = p; v + 8 <= p + value; v += 8) polygon.push({ x: r.i32(v), y: r.i32(v + 4) });
      }
      p += value;
    }
  }
  return p === end ? tags : null;
}

// ---- Layout objects ------------------------------------------------------------------------

export const ObjectKind = { Page: 1, Text: 3, Line: 4, Graphic: 5, Guide: 6 } as const;

export interface InPageObject {
  kind: number;
  id: number;
  /** Index of the page the object is on (0 is the pasteboard, then master pages, then pages). */
  page: number;
  tags: Tags;
  /** For objects placed by a master page: the master object's id and page. */
  master?: { id: number; page: number };
  /** Picture objects: the name of the stream holding the image (PPicts…). */
  pictureStream?: string;
  /** Polygon shapes: vertices in page units (1/2000 pt). */
  polygon?: { x: number; y: number }[];
}

function recordHeaderAt(r: Reader, q: number): boolean {
  if (q + 16 > r.length) return false;
  const kind = r.u16(q);
  const length = r.u32(q + 8);
  if (kind < 1 || kind > 9 || length < 6 || length > 1_000_000 || q + 12 + length > r.length) return false;
  if (r.u32(q + 4) > 100_000) return false;
  const b = r.bytes;
  return (b[q + 12] === 0x80 && b[q + 13] === 0) || (b[q + 12] === 0 && b[q + 13] === 0 && b[q + 14] === 0x80 && b[q + 15] === 0);
}

function readObject(r: Reader, q: number): InPageObject | null {
  const kind = r.u16(q);
  const id = r.u16(q + 2);
  const page = r.u32(q + 4);
  const end = q + 12 + r.u32(q + 8);
  let start = q + 12;
  // Picture records start with two zero bytes before their tags.
  if (r.bytes[start] === 0 && r.bytes[start + 1] === 0) start += 2;
  const polygon: { x: number; y: number }[] = [];
  const tags = parseObjectTags(r, start, end, polygon);
  if (!tags) return null;
  const obj: InPageObject = { kind, id, page, tags };
  if (polygon.length >= 3) obj.polygon = polygon;
  const ref = tags.get(tagKey(0x00, 0x80));
  if (ref !== undefined && ref !== -1) obj.master = { id: ref & 0xffff, page: ref >>> 16 };
  const nameLength = tags.get(tagKey(0x05, 0x00));
  if (nameLength) {
    // The 05.00 block is "*PPicts…\0<original file path>\0".
    const block = r.bytes.subarray(start, end);
    const text = new TextDecoder('latin1').decode(block);
    const m = /PPicts[0-9a-f]+/i.exec(text);
    if (m) obj.pictureStream = m[0];
  }
  return obj;
}

/**
 * Reads the layout section: object records from the first page record up to the document
 * name. Between records there may be a 6-byte group header or a 4-byte link-chain note.
 */
export function readObjects(stream: Uint8Array): InPageObject[] {
  const r = new Reader(stream);
  let q = -1;
  for (let p = 0; p + 18 <= r.length; p++) {
    if (
      r.u16(p) === 1 &&
      r.u16(p + 2) === 0 &&
      r.u32(p + 4) === 0 &&
      recordHeaderAt(r, p) &&
      r.u32(p + 14) === 0xffffffff
    ) {
      q = p;
      break;
    }
  }
  const objects: InPageObject[] = [];
  while (q >= 0 && objects.length < 200_000) {
    const obj = readObject(r, q);
    if (obj) objects.push(obj);
    const next = q + 12 + r.u32(q + 8);
    q = -1;
    for (const gap of [0, 4, 6, 10]) {
      if (recordHeaderAt(r, next + gap)) {
        q = next + gap;
        break;
      }
    }
  }
  return objects;
}

// ---- Document defaults ----------------------------------------------------------------------

export interface PageGeometry {
  widthPt: number;
  heightPt: number;
  leftPt: number;
  topPt: number;
  rightPt: number;
  bottomPt: number;
}

/** Page size and margins from the document defaults (six consecutive tags 06 01 … 0B 01). */
export function readPageGeometry(stream: Uint8Array): PageGeometry | null {
  const r = new Reader(stream);
  for (let p = 0; p + 36 <= Math.min(r.length, 0x1000); p++) {
    let ok = true;
    for (let i = 0; i < 6 && ok; i++) ok = r.bytes[p + i * 6] === 6 + i && r.bytes[p + i * 6 + 1] === 1;
    if (!ok) continue;
    const v = Array.from({ length: 6 }, (_, i) => r.u32(p + i * 6 + 2) / UNITS_PER_POINT);
    const [widthPt, heightPt, leftPt, topPt, rightPt, bottomPt] = v;
    if (widthPt < 72 || heightPt < 72 || widthPt > 5000 || heightPt > 5000) continue;
    if (leftPt + rightPt >= widthPt || topPt + bottomPt >= heightPt) continue;
    return { widthPt, heightPt, leftPt, topPt, rightPt, bottomPt };
  }
  return null;
}

/**
 * The document defaults and the paragraph style sheet. Each style is a record
 * [u32 size][u16 1][u16 shortcut][u16 index][u16 1][u32 n]["40 00 9b 7f", tags…, e6 7f name],
 * based on another style (80.00); style 0 ("Normal") is the defaults block. Returns each
 * style's own tags with its base styles' tags underneath.
 */
export function readStyleSheet(stream: Uint8Array, before: number): Tags[] {
  const r = new Reader(stream);
  const end = Math.min(before, r.length);
  const own = new Map<number, Tags>();
  let defaultsAt = -1;
  // The defaults start with the font selectors 00 02, 01 02, 02 02.
  for (let p = 0; p + 12 < end; p++) {
    const b = r.bytes;
    if (b[p] === 0 && b[p + 1] === 2 && b[p + 4] === 1 && b[p + 5] === 2 && b[p + 8] === 2 && b[p + 9] === 2) {
      defaultsAt = p;
      own.set(0, parseStyleTags(r, p, findWrapped(r, p, end)));
      break;
    }
  }
  for (let p = Math.max(0, defaultsAt); defaultsAt >= 0 && p + 16 < end; p++) {
    const size = r.u32(p);
    const index = r.u16(p + 8);
    if (size < 18 || size > 4096 || r.u16(p + 4) !== 1 || r.u16(p + 10) !== 1 || r.u32(p + 12) !== size - 12) continue;
    if (index < 1 || index > 1000 || p + 4 + size > end) continue;
    if (!own.has(index)) own.set(index, parseStyleTags(r, p + 16, p + 4 + size));
    p += 3 + size;
  }
  const resolved: Tags[] = [];
  const resolve = (index: number, depth = 0): Tags => {
    if (resolved[index]) return resolved[index];
    const tags = own.get(index) ?? new Map();
    const base = tags.get(tagKey(0x00, 0x80));
    const merged = index !== 0 && depth < 16 ? new Map([...resolve(base && base !== index ? base : 0, depth + 1), ...tags]) : new Map(tags);
    merged.delete(tagKey(0x00, 0x80));
    resolved[index] = merged;
    return merged;
  };
  for (const index of own.keys()) resolve(index);
  if (!resolved[0]) resolved[0] = new Map();
  return resolved;
}

/** End of the defaults block: the first wrapped property ("9a 7f"). */
function findWrapped(r: Reader, start: number, end: number): number {
  for (let p = start; p + 2 <= end && p < start + 4096; p += 2) {
    if ((r.bytes[p] === 0x9a || r.bytes[p] === 0x9b || r.bytes[p] === 0xe6) && r.bytes[p + 1] === 0x7f) return p;
  }
  return Math.min(end, start + 512);
}

/** Default character size (7f.00) from the document defaults, in points. */
export function readDefaultFontSize(stream: Uint8Array, before: number): number | undefined {
  const r = new Reader(stream);
  // The defaults block lists font selectors 00 02, 01 02, 02 02 … then 00 7f (size).
  for (let p = 0; p + 12 < Math.min(before, r.length); p++) {
    if (r.bytes[p] === 0 && r.bytes[p + 1] === 2 && r.bytes[p + 4] === 1 && r.bytes[p + 5] === 2) {
      for (let q = p; q + 6 < Math.min(p + 400, before); q += 2) {
        if (r.bytes[q] === 0 && r.bytes[q + 1] === 0x7f) {
          const size = r.i32(q + 2) / UNITS_PER_POINT;
          if (size >= 4 && size <= 400) return size;
        }
      }
    }
  }
  return undefined;
}

// ---- Text, fonts, styles, saved layout --------------------------------------------------------

export interface InPageParagraph {
  /** Index of the story (chain of linked frames) the paragraph belongs to. */
  story: number;
  /** Offset of the paragraph in the text payload (all paragraphs' bytes, in order). */
  position: number;
  length: number;
}

export interface StyleRun {
  /** Payload bytes [start, end) this run covers. */
  start: number;
  end: number;
  tags: Tags;
}

export interface SavedFrame {
  /** The text frame's object id and page. */
  id: number;
  page: number;
  /** Height the story's text uses in this frame (or column), and the column width, in pt. */
  usedPt: number;
  columnWidthPt: number;
}

export interface SavedLine {
  start: number;
  count: number;
  heightPt: number;
  /** A table row: its paragraphs are the row's cells, side by side. */
  row?: boolean;
  /** Table rows: each cell's left and right edge in the frame (pt), in stored order. */
  cells?: { x: number; right: number }[];
  /** Where the line's text starts and ends across the column (pt from its left), from its runs. */
  extent?: { x: number; right: number };
  /** Width available to the line (pt): less than the column where text wraps around an object. */
  availablePt?: number;
}

export interface InPageText {
  version: InPageVersion;
  /** All paragraphs' bytes, in order (InPage-encoded for version 1, UTF-16LE for version 3). */
  payload: Uint8Array;
  paragraphs: InPageParagraph[];
  storyCount: number;
  fonts: string[];
  runs: StyleRun[];
  /** For each story, the frames (or columns) it flows through, in order. */
  storyFrames: SavedFrame[][] | null;
  lines: SavedLine[] | null;
  /** Stream offset where the text table starts (everything before it is header and layout). */
  tableStart: number;
}

/** A font table ending at `end`: [u32 byte size][slots of `slot` bytes], names first. */
function readFontsEndingAt(r: Reader, end: number, slot: number, utf16: boolean): string[] | null {
  for (let count = 1; count <= 512; count++) {
    const start = end - count * slot;
    if (start < 4) break;
    if (r.u32(start - 4) !== count * slot) continue;
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const s = start + i * slot;
      let name = '';
      for (let k = 0; k < (utf16 ? 32 : 32); k++) {
        const c = utf16 ? r.u16(s + k * 2) : r.bytes[s + k];
        if (!c) break;
        name += String.fromCharCode(c);
      }
      names.push(name);
    }
    if (names[0] && /^[\x20-\x7e]+$/.test(names[0])) return names;
  }
  return null;
}

/** Style runs: [u32 byte count][u32 size][u16 1][u32 size − 6][tags] … */
function readStyleRuns(r: Reader, start: number, total: number): { runs: StyleRun[]; end: number } | null {
  const runs: StyleRun[] = [];
  let p = start;
  let covered = 0;
  while (covered < total && p + 14 <= r.length) {
    const count = r.u32(p);
    const size = r.u32(p + 4);
    if (count <= 0 || count > total - covered || size < 6 || size > 100_000 || r.u16(p + 8) !== 1 || r.u32(p + 10) !== size - 6) {
      return null;
    }
    runs.push({ start: covered, end: covered + count, tags: parseStyleTags(r, p + 14, p + 8 + size) });
    covered += count;
    p += 8 + size;
  }
  return covered === total ? { runs, end: p } : null;
}

/** Character and paragraph properties of a style run (groups 02 and 7f, plus 80.00). */
function parseStyleTags(r: Reader, start: number, end: number): Tags {
  const tags: Tags = new Map();
  let p = start;
  while (p + 4 <= end) {
    const key = r.bytes[p];
    const group = r.bytes[p + 1];
    let width = 2;
    if (group === 0x7f && key === 0xe6) break; // style name follows
    if ((group === 0x7f && (key === 0x9a || key === 0x9b)) || (group === 0x00 && key === 0x40)) {
      p += 2; // markers without a value
      continue;
    }
    if (group === 0x00 && key === 0x80) width = 4;
    else if (group === 0x7f && WIDE_STYLE.has(key)) width = 4;
    else if (group === 0x7f && key === 0x93) width = 10; // tab stop
    else if (group !== 0x02 && group !== 0x7f) {
      p += 2;
      continue;
    }
    if (p + 2 + width > end) break;
    const value = width === 4 ? r.i32(p + 2) : r.u16(p + 2);
    if (!(group === 0x7f && key === 0x93)) tags.set(tagKey(group, key), value);
    p += 2 + width;
  }
  return tags;
}

/** Saved frames: [ffffffff][u16][62-byte records…]; a record with id 0 ends each story. */
function readSavedFrames(r: Reader, start: number, stories: number): { frames: SavedFrame[][]; end: number } | null {
  for (let p = start; p < start + 16; p++) {
    if (r.u32(p) !== 0xffffffff || r.u32(p + 6) !== 50) continue;
    let q = p + 6;
    const groups: SavedFrame[][] = [];
    let current: SavedFrame[] = [];
    while (r.u32(q) === 50 && q + 62 <= r.length) {
      const id = r.u16(q + 28);
      if (id === 0) {
        groups.push(current);
        current = [];
      } else {
        current.push({
          id,
          page: r.u16(q + 30),
          usedPt: Math.max(0, r.i32(q + 4) / UNITS_PER_POINT),
          columnWidthPt: r.i32(q + 16) / UNITS_PER_POINT,
        });
      }
      q += 62;
    }
    if (current.length) groups.push(current);
    if (groups.length === stories) return { frames: groups, end: q };
    return null;
  }
  return null;
}

/**
 * Saved lines after the frames: [u32 bytes][u32 height][u32 flags][u32 size][size bytes].
 * Accepted only when the lines cover exactly the text payload.
 */
function readSavedLines(r: Reader, start: number, total: number, runSize: number): SavedLine[] | null {
  for (let off = start; off < start + 64 && off + 24 <= r.length; off++) {
    const lines: SavedLine[] = [];
    let p = off;
    let covered = 0;
    while (covered < total && p + 24 <= r.length) {
      const count = r.u32(p);
      const height = r.u32(p + 4);
      const size = r.u32(p + 12);
      const runCount = size > 8 ? r.u16(p + 20) : 0;
      const extra = size - 16 - runSize * runCount;
      const sizeOk = size === 8 || (extra >= 0 && extra % 8 === 0 && extra <= 8 * runCount);
      if (count < 0 || count > total - covered || height > 4_000_000 || !sizeOk || (!lines.length && !count)) break;
      let row = false;
      const cells: { x: number; right: number }[] = [];
      let left = Infinity;
      let right = -Infinity;
      for (let i = 0; i < runCount; i++) {
        const q = p + 32 + i * runSize;
        const kind = r.u16(q);
        const x = r.i32(q + 8) / UNITS_PER_POINT;
        const rx = r.i32(q + 12) / UNITS_PER_POINT;
        if (kind === 0x7f87) {
          row = true;
          cells.push({ x, right: rx });
        }
        if (rx > x && Math.abs(x) < 5000 && Math.abs(rx) < 5000) {
          left = Math.min(left, x);
          right = Math.max(right, rx);
        }
      }
      lines.push({
        start: covered,
        count,
        heightPt: height / UNITS_PER_POINT,
        ...(row ? { row, cells } : {}),
        ...(right > left ? { extent: { x: left, right } } : {}),
        ...(size > 8 ? { availablePt: r.i32(p + 28) / UNITS_PER_POINT } : {}),
      });
      covered += count;
      p += 16 + size;
    }
    if (covered === total && lines.length) return lines;
  }
  return null;
}

function finish(
  r: Reader,
  version: InPageVersion,
  tableStart: number,
  paragraphs: InPageParagraph[],
  payload: Uint8Array,
  fonts: string[],
  runs: StyleRun[],
  afterRuns: number
): InPageText {
  // Renumber stories 0, 1, 2… (story breaks are zero-length entries; there may be extras).
  const ids = [...new Set(paragraphs.map((p) => p.story))];
  const index = new Map(ids.map((id, i) => [id, i]));
  for (const p of paragraphs) p.story = index.get(p.story)!;
  const storyCount = ids.length;
  const saved = readSavedFrames(r, afterRuns, storyCount);
  const lines = saved ? readSavedLines(r, saved.end, payload.length, version === 3 ? 34 : 30) : null;
  return {
    version,
    payload,
    paragraphs,
    storyCount,
    fonts,
    runs,
    storyFrames: saved?.frames ?? null,
    lines,
    tableStart,
  };
}

/**
 * InPage 2000–2005: a table of [u32 length][bytes ending in 0x0D] paragraphs and
 * [u32 0][u8 flag] story breaks, then ffffffff and the style runs, which must cover the same bytes.
 */
export function readTextV1(stream: Uint8Array): InPageText | null {
  const r = new Reader(stream);
  for (let marker = 0; marker + 18 < r.length; marker++) {
    if (r.u32(marker) !== 0xffffffff) continue;
    // Total bytes the style runs cover.
    let total = 0;
    for (let p = marker + 4, n = 0; p + 14 <= r.length && n < 200_000; n++) {
      const count = r.u32(p);
      const size = r.u32(p + 4);
      if (count <= 0 || size < 6 || size > 100_000 || r.u16(p + 8) !== 1 || r.u32(p + 10) !== size - 6) break;
      total += count;
      p += 8 + size;
    }
    if (!total || total > marker) continue;
    for (let start = Math.max(0, marker - total * 2 - 8192); start < marker; start++) {
      const paragraphs = walkTextTableV1(r, start, marker, total);
      if (!paragraphs) continue;
      const payload = new Uint8Array(total);
      for (const p of paragraphs) payload.set(r.bytes.subarray(p.offset, p.offset + p.length), p.position);
      const styled = readStyleRuns(r, marker + 4, total);
      if (!styled) return null;
      // The table may begin with zero-length entries; the font table ends at one of them.
      let fonts: string[] | null = null;
      for (let s = start; s < marker; s += 5) {
        fonts = readFontsEndingAt(r, s, 54, false);
        if (fonts || r.u32(s) !== 0) break;
      }
      fonts ??= readFontsEndingAt(r, start, 54, false) ?? [];
      return finish(r, 1, start, paragraphs.map(({ story, position, length }) => ({ story, position, length })), payload, fonts, styled.runs, styled.end);
    }
  }
  return null;
}

function walkTextTableV1(r: Reader, start: number, end: number, total: number) {
  const out: (InPageParagraph & { offset: number })[] = [];
  let p = start;
  let story = 0;
  let position = 0;
  while (p + 4 <= end) {
    const length = r.u32(p);
    if (length === 0) {
      if (p + 5 > end || r.bytes[p + 4] > 1) return null;
      if (r.bytes[p + 4] === 0) story++;
      p += 5;
      continue;
    }
    if (length > total - position || p + 4 + length > end || r.bytes[p + 3 + length] !== 0x0d) return null;
    out.push({ story, position, length, offset: p + 4 });
    position += length;
    p += 4 + length;
  }
  return p === end && position === total && out.length ? out : null;
}

/**
 * InPage 2009+: a table of u32 paragraph byte lengths (0 ends a story), ffffffff, then all the
 * paragraphs' UTF-16 text (each ending in CR), then the style runs over the same bytes.
 */
export function readTextV3(stream: Uint8Array): InPageText | null {
  const r = new Reader(stream);
  for (let marker = 4; marker + 8 < r.length; marker += 2) {
    if (r.u32(marker) !== 0xffffffff) continue;
    // Font table followed by length entries up to the marker.
    for (let tableStart = marker - 4; tableStart >= Math.max(4, marker - 400_000); tableStart -= 4) {
      const entry = r.u32(tableStart);
      if (entry > 0x200000 || entry % 2) break;
      const fonts = readFontsEndingAt(r, tableStart, 86, true);
      if (!fonts) continue;
      const paragraphs: InPageParagraph[] = [];
      let story = 0;
      let position = 0;
      let ok = true;
      for (let p = tableStart; p < marker; p += 4) {
        const length = r.u32(p);
        if (length === 0) {
          story++;
          continue;
        }
        const end = marker + 4 + position + length;
        if (end > r.length || r.u16(end - 2) !== 0x0d) {
          ok = false;
          break;
        }
        paragraphs.push({ story, position, length });
        position += length;
      }
      if (!ok || !paragraphs.length) continue;
      const payload = r.bytes.slice(marker + 4, marker + 4 + position);
      const styled = readStyleRuns(r, marker + 4 + position, position);
      return finish(r, 3, tableStart, paragraphs, payload, fonts, styled?.runs ?? [], styled?.end ?? marker + 4 + position);
    }
  }
  return null;
}
