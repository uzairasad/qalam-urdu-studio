/**
 * Synthetic InPage files for the tests: an OLE compound file builder and whole documents made
 * byte by byte (no real InPage documents are kept in the repository).
 */

/**
 * A minimal OLE compound file (512-byte sectors) holding `big` as a regular stream named
 * InPage100 (padded past the 4096-byte mini-stream cutoff) and `small` in the mini stream.
 */
export function buildOle(big: Uint8Array, small: Uint8Array, name = 'InPage100'): Uint8Array {
  const S = 512;
  const END = 0xfffffffe;
  const bigData = new Uint8Array(Math.max(4096, big.length));
  bigData.set(big);
  const miniContainer = new Uint8Array(Math.ceil(small.length / 64) * 64 || 64);
  miniContainer.set(small);
  const miniSectors = miniContainer.length / 64;
  const containerSectors = Math.ceil(miniContainer.length / S);
  const bigSectors = Math.ceil(bigData.length / S);
  // Sector map: 0 FAT, 1 directory, 2 mini FAT, 3.. mini stream container, then the big stream.
  const firstContainer = 3;
  const firstBig = firstContainer + containerSectors;
  const total = firstBig + bigSectors;

  const file = new Uint8Array(S * (total + 1));
  const dv = new DataView(file.buffer);
  [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].forEach((b, i) => (file[i] = b));
  dv.setUint16(0x18, 0x3e, true);
  dv.setUint16(0x1a, 3, true);
  dv.setUint16(0x1c, 0xfffe, true);
  dv.setUint16(0x1e, 9, true);
  dv.setUint16(0x20, 6, true);
  dv.setUint32(0x2c, 1, true); // FAT sectors
  dv.setUint32(0x30, 1, true); // first directory sector
  dv.setUint32(0x38, 4096, true); // mini stream cutoff
  dv.setUint32(0x3c, 2, true); // first mini FAT sector
  dv.setUint32(0x40, 1, true);
  dv.setUint32(0x44, END, true); // no DIFAT sectors
  for (let i = 0; i < 109; i++) dv.setUint32(0x4c + i * 4, i === 0 ? 0 : 0xffffffff, true);

  const sector = (n: number) => S * (n + 1);
  const fat = new Array(S / 4).fill(0xffffffff);
  fat[0] = 0xfffffffd;
  fat[1] = END;
  fat[2] = END;
  for (let i = 0; i < containerSectors; i++) fat[firstContainer + i] = i + 1 < containerSectors ? firstContainer + i + 1 : END;
  for (let i = 0; i < bigSectors; i++) fat[firstBig + i] = i + 1 < bigSectors ? firstBig + i + 1 : END;
  fat.forEach((v, i) => dv.setUint32(sector(0) + i * 4, v, true));

  const miniFat = new Array(S / 4).fill(0xffffffff);
  for (let i = 0; i < miniSectors; i++) miniFat[i] = i + 1 < miniSectors ? i + 1 : END;
  miniFat.forEach((v, i) => dv.setUint32(sector(2) + i * 4, v, true));

  const dirEntry = (index: number, name: string, type: number, start: number, size: number, child = 0xffffffff, right = 0xffffffff) => {
    const o = sector(1) + index * 128;
    for (let i = 0; i < name.length; i++) dv.setUint16(o + i * 2, name.charCodeAt(i), true);
    dv.setUint16(o + 64, (name.length + 1) * 2, true);
    file[o + 66] = type;
    dv.setUint32(o + 68, 0xffffffff, true);
    dv.setUint32(o + 72, right, true);
    dv.setUint32(o + 76, child, true);
    dv.setUint32(o + 116, start, true);
    dv.setUint32(o + 120, size, true);
  };
  dirEntry(0, 'Root Entry', 5, firstContainer, miniContainer.length, 1);
  dirEntry(1, name, 2, firstBig, bigData.length, 0xffffffff, 2);
  dirEntry(2, 'DocumentInfo', 2, 0, small.length);

  file.set(miniContainer, sector(firstContainer));
  file.set(bigData, sector(firstBig));
  return file;
}


// ---- Whole documents --------------------------------------------------------------------------

class Bytes {
  out: number[] = [];
  u8(...v: number[]) {
    this.out.push(...v.map((x) => x & 0xff));
    return this;
  }
  u16(v: number) {
    return this.u8(v, v >> 8);
  }
  u32(v: number) {
    return this.u8(v, v >> 8, v >> 16, v >>> 24);
  }
  tag(group: number, key: number, value: number, wide = false) {
    this.u8(key, group);
    return wide ? this.u32(value) : this.u16(value);
  }
  get length() {
    return this.out.length;
  }
}

export interface TestFrame {
  /** Object id of the text frame, the page it is on (2 is the first page), and its box in pt. */
  id: number;
  page: number;
  box: [number, number, number, number];
  /** Height of the text InPage set in this frame, in lines of this story. */
  lines: number;
}

export interface TestStory {
  paragraphs: string[];
  /** Frames the story flows through, in order. */
  frames: TestFrame[];
  sizePt: number;
  /** InPage alignment code (1 right, 2 centre, 3 justify). */
  align: number;
  /** Mark every line as a table row. */
  table?: boolean;
}

/**
 * A document stream as InPage writes it: defaults with the page size, the layout records, the
 * font table, the text, the style runs, the saved frames and the saved lines.
 * `version` 1 writes InPage 2000–2005 text (InPage-encoded), 3 writes InPage 2009 (UTF-16).
 */
export function inpageDocument(
  version: 1 | 3,
  page: { width: number; height: number; margin: number; pages: number },
  stories: TestStory[],
  encode: (text: string) => Uint8Array
): Uint8Array {
  const U = 2000;
  const b = new Bytes();
  b.u8(...new Array(16).fill(0));
  // Defaults: page width, height, left, top, right, bottom margins.
  [page.width, page.height, page.margin, page.margin, page.margin, page.margin].forEach((v, i) => b.tag(0x01, 6 + i, v * U, true));
  b.u8(0, 0);
  // Character defaults: fonts 0/1/2, 12 pt, right aligned, black; then a wrapped property.
  b.tag(0x02, 0, 0).tag(0x02, 1, 1).tag(0x02, 2, 0).tag(0x7f, 0x00, 12 * U, true).tag(0x7f, 0x80, 1).tag(0x7f, 0x07, 2).u8(0x9a, 0x7f, 0, 0);

  // Layout: pasteboard, master page, then the pages.
  const record = (kind: number, id: number, pageIndex: number, tags: Bytes) => {
    b.u16(kind).u16(id).u32(pageIndex).u32(tags.length + 6).u8(0x80, 0).u32(0xffffffff).u8(...tags.out);
  };
  record(1, 0, 0, new Bytes().tag(0x00, 0x82, 0, true));
  record(1, 0, 1, new Bytes().tag(0x00, 0x82, 1, true));
  let storyRef = 400;
  for (let p = 2; p < 2 + page.pages; p++) {
    record(1, 0, p, new Bytes().tag(0x00, 0x82, p, true).tag(0x7c, 0x07, 1, true));
    for (const story of stories) {
      for (const f of story.frames.filter((fr) => fr.page === p)) {
        const t = new Bytes().tag(0x00, 0x82, 100 + f.id, true).tag(0x03, 0x05, 1).tag(0x03, 0x08, storyRef++, true);
        f.box.forEach((v, i) => t.tag(0x7e, i, v * U, true));
        record(3, f.id, p, t);
      }
    }
  }
  b.u8(0, 0, 0, 0, ...new TextEncoder().encode('InPage Arabic Document'));

  // Fonts: [u32 size][slots].
  const fonts = ['Noori Nastaliq', 'Arial'];
  const slot = version === 3 ? 86 : 54;
  b.u32(fonts.length * slot);
  for (const name of fonts) {
    const s = new Bytes();
    for (const ch of name) version === 3 ? s.u16(ch.charCodeAt(0)) : s.u8(ch.charCodeAt(0));
    b.u8(...s.out, ...new Array(slot - s.length).fill(0));
  }

  // Text: every paragraph's bytes, then style runs over the same bytes.
  const paraBytes = stories.map((st) =>
    st.paragraphs.map((p) => {
      if (version === 1) return [...encode(p), 0x0d];
      const u = new Bytes();
      for (const ch of p + '\r') u.u16(ch.charCodeAt(0));
      return u.out;
    })
  );
  if (version === 1) {
    for (const st of paraBytes) {
      for (const p of st) b.u32(p.length).u8(...p);
      b.u32(0).u8(0);
    }
    b.u32(0xffffffff);
  } else {
    for (const st of paraBytes) {
      for (const p of st) b.u32(p.length);
      b.u32(0);
    }
    b.u32(0xffffffff);
    for (const st of paraBytes) for (const p of st) b.u8(...p);
  }
  stories.forEach((st, i) => {
    const count = paraBytes[i].reduce((n, p) => n + p.length, 0);
    const tags = new Bytes().tag(0x00, 0x80, 0, true).tag(0x7f, 0x00, st.sizePt * U, true).tag(0x7f, 0x80, st.align);
    b.u32(count).u32(tags.length + 6).u16(1).u32(tags.length).u8(...tags.out);
  });

  // Saved frames: per story, a record per frame, then an empty record.
  b.u32(0).u32(0xffffffff).u16(0);
  const lineHeight = (st: TestStory) => st.sizePt * 2;
  const frameRecord = (id: number, pageIndex: number, usedPt: number, heightPt: number, widthPt: number) => {
    const r = new Array(62).fill(0);
    const w = new Bytes().u32(50).u32(Math.round(usedPt * U)).u32(0).u32(Math.round(heightPt * U)).u32(Math.round(widthPt * U));
    w.out.forEach((v, i) => (r[i] = v));
    r[28] = id & 0xff;
    r[29] = id >> 8;
    r[30] = pageIndex;
    b.u8(...r);
  };
  for (const st of stories) {
    for (const f of st.frames) frameRecord(f.id, f.page, f.lines * lineHeight(st), f.box[3] - 12, f.box[2] - 12);
    frameRecord(0, 0, 0, 0, 0);
  }

  // Saved lines: one per paragraph.
  b.u32(0xffffffff).u32(0).u32(0);
  const runSize = version === 3 ? 34 : 30;
  stories.forEach((st, i) => {
    // A table row is one line holding all of its cells.
    const lines = st.table ? [paraBytes[i].flat()] : paraBytes[i];
    for (const p of lines) {
      b.u32(p.length).u32(lineHeight(st) * U).u32(1).u32(16 + runSize).u32(0).u16(1).u8(...new Array(10).fill(0));
      const run = new Array(runSize).fill(0);
      const kind = st.table ? 0x7f87 : 0x7f85;
      run[0] = kind & 0xff;
      run[1] = kind >> 8;
      b.u8(...run);
    }
  });
  b.u8(...new Array(64).fill(0));
  return new Uint8Array(b.out);
}
