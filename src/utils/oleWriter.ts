/**
 * Writes OLE compound files (the container of .inp, .doc and .xls): version 3, 512-byte
 * sectors, streams in the root storage. Streams under 4096 bytes go in the mini stream, as the
 * format requires. The directory is a balanced red-black tree, as Windows expects.
 */

const SECTOR = 512;
const MINI = 64;
const CUTOFF = 4096;
const FREE = 0xffffffff;
const END = 0xfffffffe;
const FATSECT = 0xfffffffd;

export interface OleStream {
  name: string;
  data: Uint8Array;
}

/** CFB name order: shorter names first, then by upper-case code units. */
function compareNames(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  return A < B ? -1 : A > B ? 1 : 0;
}

export function writeOle(streams: OleStream[]): Uint8Array {
  const sorted = [...streams].sort((a, b) => compareNames(a.name, b.name));
  const small = sorted.filter((s) => s.data.length < CUTOFF);
  const big = sorted.filter((s) => s.data.length >= CUTOFF);

  // Mini stream: small streams in 64-byte mini sectors.
  const miniStart = new Map<OleStream, number>();
  let miniCount = 0;
  for (const s of small) {
    miniStart.set(s, s.data.length ? miniCount : END);
    miniCount += Math.ceil(s.data.length / MINI);
  }
  const miniBytes = miniCount * MINI;
  const containerSectors = Math.ceil(miniBytes / SECTOR);
  const miniFatSectors = Math.ceil((miniCount * 4) / SECTOR);
  const dirEntries = sorted.length + 1;
  const dirSectors = Math.ceil(dirEntries / 4);
  const bigSectors = big.map((s) => Math.ceil(s.data.length / SECTOR));
  const dataSectors = dirSectors + miniFatSectors + containerSectors + bigSectors.reduce((a, b) => a + b, 0);
  let fatSectors = 1;
  while (fatSectors * (SECTOR / 4) < dataSectors + fatSectors) fatSectors++;
  if (fatSectors > 109) throw new Error('Document too large to save in this format.');
  const total = fatSectors + dataSectors;

  const file = new Uint8Array(SECTOR * (total + 1));
  const dv = new DataView(file.buffer);
  const sectorOffset = (n: number) => SECTOR * (n + 1);

  // Sector allocation, in order.
  let next = fatSectors;
  const firstDir = next;
  next += dirSectors;
  const firstMiniFat = miniFatSectors ? next : END;
  next += miniFatSectors;
  const firstContainer = containerSectors ? next : END;
  next += containerSectors;
  const bigStart = new Map<OleStream, number>();
  big.forEach((s, i) => {
    bigStart.set(s, next);
    next += bigSectors[i];
  });

  const fat = new Uint32Array(fatSectors * (SECTOR / 4)).fill(FREE);
  for (let i = 0; i < fatSectors; i++) fat[i] = FATSECT;
  const chain = (start: number, count: number) => {
    for (let i = 0; i < count; i++) fat[start + i] = i + 1 < count ? start + i + 1 : END;
  };
  chain(firstDir, dirSectors);
  if (miniFatSectors) chain(firstMiniFat, miniFatSectors);
  if (containerSectors) chain(firstContainer, containerSectors);
  big.forEach((s, i) => chain(bigStart.get(s)!, bigSectors[i]));

  // Header.
  [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].forEach((b, i) => (file[i] = b));
  dv.setUint16(0x18, 0x3e, true); // minor version
  dv.setUint16(0x1a, 3, true); // major version 3
  dv.setUint16(0x1c, 0xfffe, true); // little-endian
  dv.setUint16(0x1e, 9, true); // 512-byte sectors
  dv.setUint16(0x20, 6, true); // 64-byte mini sectors
  dv.setUint32(0x2c, fatSectors, true);
  dv.setUint32(0x30, firstDir, true);
  dv.setUint32(0x38, CUTOFF, true);
  dv.setUint32(0x3c, firstMiniFat, true);
  dv.setUint32(0x40, miniFatSectors, true);
  dv.setUint32(0x44, END, true); // no DIFAT sectors
  dv.setUint32(0x48, 0, true);
  for (let i = 0; i < 109; i++) dv.setUint32(0x4c + i * 4, i < fatSectors ? i : FREE, true);

  // FAT.
  for (let i = 0; i < fat.length; i++) dv.setUint32(sectorOffset(Math.floor(i / 128)) + (i % 128) * 4, fat[i], true);

  // Mini FAT and mini stream.
  if (miniFatSectors) {
    const miniFat = new Uint32Array(miniFatSectors * (SECTOR / 4)).fill(FREE);
    for (const s of small) {
      const start = miniStart.get(s)!;
      const n = Math.ceil(s.data.length / MINI);
      for (let i = 0; i < n; i++) miniFat[start + i] = i + 1 < n ? start + i + 1 : END;
    }
    for (let i = 0; i < miniFat.length; i++) dv.setUint32(sectorOffset(firstMiniFat + Math.floor(i / 128)) + (i % 128) * 4, miniFat[i], true);
    const container = new Uint8Array(containerSectors * SECTOR);
    for (const s of small) if (s.data.length) container.set(s.data, miniStart.get(s)! * MINI);
    for (let i = 0; i < containerSectors; i++) file.set(container.subarray(i * SECTOR, (i + 1) * SECTOR), sectorOffset(firstContainer + i));
  }
  for (const s of big) {
    const start = bigStart.get(s)!;
    for (let i = 0; i * SECTOR < s.data.length; i++) {
      file.set(s.data.subarray(i * SECTOR, Math.min(s.data.length, (i + 1) * SECTOR)), sectorOffset(start + i));
    }
  }

  // Directory: entry 0 is the root; streams 1…n in name order, as a balanced tree.
  const left = new Array(dirEntries).fill(FREE);
  const right = new Array(dirEntries).fill(FREE);
  const red = new Array(dirEntries).fill(false);
  let maxDepth = 0;
  const depth = new Array(dirEntries).fill(0);
  const build = (lo: number, hi: number, d: number): number => {
    if (lo > hi) return FREE;
    const mid = (lo + hi) >> 1;
    const id = mid + 1;
    depth[id] = d;
    maxDepth = Math.max(maxDepth, d);
    left[id] = build(lo, mid - 1, d + 1);
    right[id] = build(mid + 1, hi, d + 1);
    return id;
  };
  const rootChild = build(0, sorted.length - 1, 0);
  // Nodes on the deepest level are red when that level isn't full (every path stays equally black).
  const perfect = sorted.length === 2 ** (maxDepth + 1) - 1;
  for (let id = 1; id < dirEntries; id++) red[id] = !perfect && depth[id] === maxDepth && maxDepth > 0;

  const entry = (index: number, name: string, type: number, start: number, size: number, child: number) => {
    const o = sectorOffset(firstDir) + index * 128;
    for (let i = 0; i < name.length && i < 31; i++) dv.setUint16(o + i * 2, name.charCodeAt(i), true);
    dv.setUint16(o + 64, (Math.min(name.length, 31) + 1) * 2, true);
    file[o + 66] = type;
    file[o + 67] = index === 0 || !red[index] ? 1 : 0; // 1 black, 0 red
    dv.setUint32(o + 68, index === 0 ? FREE : left[index], true);
    dv.setUint32(o + 72, index === 0 ? FREE : right[index], true);
    dv.setUint32(o + 76, child, true);
    dv.setUint32(o + 116, start, true);
    dv.setUint32(o + 120, size, true);
  };
  entry(0, 'Root Entry', 5, firstContainer, miniBytes, rootChild);
  sorted.forEach((s, i) => {
    const start = s.data.length < CUTOFF ? miniStart.get(s)! : bigStart.get(s)!;
    entry(i + 1, s.name, 2, s.data.length ? start : END, s.data.length, FREE);
  });
  for (let i = dirEntries; i < dirSectors * 4; i++) {
    const o = sectorOffset(firstDir) + i * 128;
    dv.setUint32(o + 68, FREE, true);
    dv.setUint32(o + 72, FREE, true);
    dv.setUint32(o + 76, FREE, true);
  }
  return file;
}
