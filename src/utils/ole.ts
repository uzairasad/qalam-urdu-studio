/**
 * A small reader for Microsoft Compound File Binary (OLE2) files: the container that old
 * InPage (.inp), Word (.doc) and Excel (.xls) documents use. It only reads streams by name,
 * which is all the InPage importer needs. Spec: [MS-CFB].
 */

const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const END_OF_CHAIN = 0xfffffffe;
const FREE_SECTOR = 0xffffffff;
const NO_STREAM = 0xffffffff;

export interface OleEntry {
  name: string;
  /** 1 = storage (folder), 2 = stream, 5 = root. */
  type: number;
  start: number;
  size: number;
}

export function isOleFile(bytes: Uint8Array): boolean {
  return bytes.length >= 512 && SIGNATURE.every((b, i) => bytes[i] === b);
}

export class OleFile {
  private readonly view: DataView;
  private readonly sectorSize: number;
  private readonly miniSectorSize: number;
  private readonly miniCutoff: number;
  private readonly fat: number[];
  private readonly miniFat: number[];
  private readonly miniStream: Uint8Array;
  private readonly bytes: Uint8Array;
  readonly entries: OleEntry[];

  constructor(bytes: Uint8Array) {
    if (!isOleFile(bytes)) throw new Error('Not an OLE compound file');
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = (o: number) => this.view.getUint16(o, true);
    const u32 = (o: number) => this.view.getUint32(o, true);

    this.sectorSize = 1 << u16(0x1e);
    this.miniSectorSize = 1 << u16(0x20);
    if (this.sectorSize < 128 || this.sectorSize > 65536 || this.miniSectorSize > this.sectorSize) {
      throw new Error('Unsupported compound file sector size');
    }
    const fatSectorCount = u32(0x2c);
    const firstDirSector = u32(0x30);
    this.miniCutoff = u32(0x38);
    const firstMiniFat = u32(0x3c);
    let difatSector = u32(0x44);

    // The FAT's own sectors: 109 listed in the header, the rest in a chain of DIFAT sectors.
    const fatSectors: number[] = [];
    for (let i = 0; i < 109 && fatSectors.length < fatSectorCount; i++) {
      const s = u32(0x4c + i * 4);
      if (s !== FREE_SECTOR) fatSectors.push(s);
    }
    const perDifat = this.sectorSize / 4 - 1;
    for (let guard = 0; difatSector !== END_OF_CHAIN && difatSector !== FREE_SECTOR && fatSectors.length < fatSectorCount; guard++) {
      if (guard > 10000) throw new Error('Corrupt compound file (DIFAT loop)');
      const base = this.sectorOffset(difatSector);
      for (let i = 0; i < perDifat && fatSectors.length < fatSectorCount; i++) {
        const s = u32(base + i * 4);
        if (s !== FREE_SECTOR) fatSectors.push(s);
      }
      difatSector = u32(base + perDifat * 4);
    }
    this.fat = [];
    for (const s of fatSectors) {
      const base = this.sectorOffset(s);
      for (let i = 0; i < this.sectorSize / 4; i++) this.fat.push(u32(base + i * 4));
    }

    // Directory: 128-byte entries in a sector chain.
    const dir = this.readChain(firstDirSector, this.fat, this.sectorSize, (s) => this.sectorBytes(s));
    this.entries = [];
    for (let o = 0; o + 128 <= dir.length; o += 128) {
      const nameLen = dir[o + 64] | (dir[o + 65] << 8);
      const type = dir[o + 66];
      if (type === 0) {
        this.entries.push({ name: '', type: 0, start: 0, size: 0 });
        continue;
      }
      let name = '';
      for (let i = 0; i + 1 < Math.min(nameLen, 64) - 1; i += 2) {
        name += String.fromCharCode(dir[o + i] | (dir[o + i + 1] << 8));
      }
      const dv = new DataView(dir.buffer, dir.byteOffset + o, 128);
      this.entries.push({ name, type, start: dv.getUint32(116, true), size: dv.getUint32(120, true) });
    }

    // Small streams live in the "mini stream", the root entry's data, cut into mini sectors.
    const root = this.entries.find((e) => e.type === 5);
    this.miniStream = root
      ? this.readChain(root.start, this.fat, this.sectorSize, (s) => this.sectorBytes(s)).subarray(0, root.size)
      : new Uint8Array(0);
    const miniFatBytes =
      firstMiniFat === END_OF_CHAIN || firstMiniFat === FREE_SECTOR
        ? new Uint8Array(0)
        : this.readChain(firstMiniFat, this.fat, this.sectorSize, (s) => this.sectorBytes(s));
    const mv = new DataView(miniFatBytes.buffer, miniFatBytes.byteOffset, miniFatBytes.byteLength);
    this.miniFat = [];
    for (let o = 0; o + 4 <= miniFatBytes.length; o += 4) this.miniFat.push(mv.getUint32(o, true));
  }

  /** Names of the streams in the file (any folder). */
  streamNames(): string[] {
    return this.entries.filter((e) => e.type === 2).map((e) => e.name);
  }

  /** A stream's bytes by name (case-insensitive), or null if there is none. */
  stream(name: string): Uint8Array | null {
    const entry = this.entries.find((e) => e.type === 2 && e.name.toLowerCase() === name.toLowerCase());
    if (!entry) return null;
    if (entry.size === 0 || entry.start === NO_STREAM) return new Uint8Array(0);
    const data =
      entry.size < this.miniCutoff
        ? this.readChain(entry.start, this.miniFat, this.miniSectorSize, (s) => this.miniSectorBytes(s))
        : this.readChain(entry.start, this.fat, this.sectorSize, (s) => this.sectorBytes(s));
    if (data.length < entry.size) throw new Error(`Stream "${name}" is truncated`);
    return data.subarray(0, entry.size);
  }

  private sectorOffset(sector: number): number {
    const offset = (sector + 1) * this.sectorSize;
    if (offset + this.sectorSize > this.bytes.length) throw new Error('Corrupt compound file (sector out of range)');
    return offset;
  }

  private sectorBytes(sector: number): Uint8Array {
    const o = this.sectorOffset(sector);
    return this.bytes.subarray(o, o + this.sectorSize);
  }

  private miniSectorBytes(sector: number): Uint8Array {
    const o = sector * this.miniSectorSize;
    if (o + this.miniSectorSize > this.miniStream.length) {
      // The last mini sector may be short; pad it.
      const out = new Uint8Array(this.miniSectorSize);
      out.set(this.miniStream.subarray(o, Math.min(o + this.miniSectorSize, this.miniStream.length)));
      return out;
    }
    return this.miniStream.subarray(o, o + this.miniSectorSize);
  }

  private readChain(first: number, table: number[], size: number, read: (s: number) => Uint8Array): Uint8Array {
    const chunks: Uint8Array[] = [];
    const seen = new Set<number>();
    for (let s = first; s !== END_OF_CHAIN && s !== FREE_SECTOR; s = table[s]) {
      if (s === undefined || seen.has(s) || s >= table.length) {
        if (s === undefined || s >= table.length) break;
        throw new Error('Corrupt compound file (sector loop)');
      }
      seen.add(s);
      chunks.push(read(s));
    }
    const out = new Uint8Array(chunks.length * size);
    chunks.forEach((c, i) => out.set(c, i * size));
    return out;
  }
}
