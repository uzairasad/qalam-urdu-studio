/**
 * Windows device-independent bitmaps (the pictures InPage keeps in its "PPicts…" streams,
 * stored without a BMP file header) → PNG data URLs, so they display and export everywhere.
 * Handles uncompressed 1, 4, 8, 16, 24 and 32-bit bitmaps; returns null for anything else.
 */

import { zlibSync } from 'fflate';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** RGBA pixels → PNG bytes. */
export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // no filter
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibSync(raw, { level: 6 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Decodes a DIB (optionally with a "BM" file header) to RGBA. */
export function decodeDib(bytes: Uint8Array): { width: number; height: number; rgba: Uint8Array } | null {
  let base = 0;
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) base = 14;
  if (bytes.length < base + 40) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = dv.getUint32(base, true);
  const width = dv.getInt32(base + 4, true);
  const rawHeight = dv.getInt32(base + 8, true);
  const bpp = dv.getUint16(base + 14, true);
  const compression = dv.getUint32(base + 16, true);
  let colorsUsed = dv.getUint32(base + 32, true);
  const height = Math.abs(rawHeight);
  if (headerSize < 40 || width <= 0 || height === 0 || width * height > 40_000_000) return null;
  if (![1, 4, 8, 16, 24, 32].includes(bpp) || !(compression === 0 || compression === 3)) return null;
  let p = base + headerSize;
  let masks = [0x7c00, 0x03e0, 0x001f, 0];
  if (compression === 3) {
    if (headerSize === 40) {
      masks = [dv.getUint32(p, true), dv.getUint32(p + 4, true), dv.getUint32(p + 8, true), 0];
      p += 12;
    } else {
      masks = [dv.getUint32(base + 40, true), dv.getUint32(base + 44, true), dv.getUint32(base + 48, true), headerSize >= 56 ? dv.getUint32(base + 52, true) : 0];
    }
  } else if (bpp === 32) {
    masks = [0xff0000, 0xff00, 0xff, 0];
  }
  const palette: number[][] = [];
  if (bpp <= 8) {
    if (!colorsUsed) colorsUsed = 1 << bpp;
    for (let i = 0; i < colorsUsed && p + 4 <= bytes.length; i++, p += 4) {
      palette.push([bytes[p + 2], bytes[p + 1], bytes[p]]);
    }
  }
  const stride = Math.ceil((width * bpp) / 32) * 4;
  if (p + stride * height > bytes.length) return null;
  const channel = (v: number, mask: number) => {
    if (!mask) return 255;
    const shift = Math.clz32(mask & -mask) ^ 31;
    const max = mask >>> shift;
    return Math.round((((v & mask) >>> shift) * 255) / max);
  };
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const row = p + (rawHeight > 0 ? height - 1 - y : y) * stride;
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      if (bpp <= 8) {
        const bitPos = x * bpp;
        const byte = bytes[row + (bitPos >> 3)];
        const idx = (byte >> (8 - bpp - (bitPos & 7))) & ((1 << bpp) - 1);
        [r, g, b] = palette[idx] ?? [0, 0, 0];
      } else if (bpp === 24) {
        b = bytes[row + x * 3];
        g = bytes[row + x * 3 + 1];
        r = bytes[row + x * 3 + 2];
      } else {
        const v = bpp === 16 ? dv.getUint16(row + x * 2, true) : dv.getUint32(row + x * 4, true);
        r = channel(v, masks[0]);
        g = channel(v, masks[1]);
        b = channel(v, masks[2]);
      }
      const o = (y * width + x) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
  return { width, height, rgba };
}

/** A DIB as a PNG data URL, or null when it isn't a bitmap this can read. */
export function dibToPngDataUrl(bytes: Uint8Array): string | null {
  const img = decodeDib(bytes);
  if (!img) return null;
  return `data:image/png;base64,${toBase64(encodePng(img.width, img.height, img.rgba))}`;
}
