const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function blend(bg, fg, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return [
    Math.round(bg[0] * (1 - a) + fg[0] * a),
    Math.round(bg[1] * (1 - a) + fg[1] * a),
    Math.round(bg[2] * (1 - a) + fg[2] * a),
  ];
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function createPng(width, height, isMaskable) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const scale = isMaskable ? 0.82 : 1.0;
  const nibPoly = [
    [0, -0.24 * scale],
    [0.14 * scale, -0.02 * scale],
    [0.095 * scale, 0.14 * scale],
    [-0.095 * scale, 0.14 * scale],
    [-0.14 * scale, -0.02 * scale],
  ];
  const collarPoly = [
    [-0.10 * scale, 0.155 * scale],
    [0.10 * scale, 0.155 * scale],
    [0.125 * scale, 0.215 * scale],
    [-0.125 * scale, 0.215 * scale],
  ];

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = (x + 0.5) / width - 0.5;
      const ny = (y + 0.5) / height - 0.5;

      // Rounded squircle mask for non-maskable icons
      let alpha = 255;
      if (!isMaskable) {
        const ax = Math.max(0, Math.abs(nx) - 0.28);
        const ay = Math.max(0, Math.abs(ny) - 0.28);
        const cornerDist = Math.sqrt(ax * ax + ay * ay);
        if (cornerDist > 0.22) alpha = 0;
        else if (cornerDist > 0.21) alpha = Math.round((0.22 - cornerDist) * 100 * 255);
      }

      // Royal Qalam Indigo-Cobalt Gradient
      const t = (nx + ny + 1) * 0.5;
      let rgb = [
        Math.round(13 + t * 8),
        Math.round(47 + (1 - Math.abs(t - 0.5) * 1.5) * 45),
        Math.round(135 + (1 - t) * 75),
      ];

      // Gold calligraphic outer border ring
      const bx = Math.max(0, Math.abs(nx) - 0.26);
      const by = Math.max(0, Math.abs(ny) - 0.26);
      const borderD = Math.sqrt(bx * bx + by * by);
      if (borderD >= 0.165 && borderD <= 0.185) {
        rgb = blend(rgb, [245, 185, 35], 0.92);
      }

      // Central rotated white medallion
      const rx = (nx * 0.7071 + ny * 0.7071);
      const ry = (-nx * 0.7071 + ny * 0.7071);
      const medSize = 0.21 * scale;
      const mx = Math.max(0, Math.abs(rx) - (medSize - 0.04));
      const my = Math.max(0, Math.abs(ry) - (medSize - 0.04));
      const medDist = Math.sqrt(mx * mx + my * my);
      if (medDist < 0.04) {
        rgb = [255, 255, 255];
      } else if (medDist < 0.046) {
        rgb = blend(rgb, [255, 255, 255], (0.046 - medDist) / 0.006);
      }

      // Qalam Reed-Pen Nib centered inside medallion
      if (pointInPolygon(nx, ny, nibPoly)) {
        rgb = nx > 0 ? [22, 68, 195] : [13, 47, 133];
        // Center ink slit
        if (Math.abs(nx) < 0.011 * scale && ny < 0.02 * scale) {
          rgb = [255, 255, 255];
        }
        // Breather hole
        const holeDist = Math.sqrt(nx * nx + (ny - 0.03 * scale) * (ny - 0.03 * scale));
        if (holeDist < 0.028 * scale) {
          rgb = holeDist < 0.013 * scale ? [245, 158, 11] : [255, 255, 255];
        }
      }

      // Gold collar below nib
      if (pointInPolygon(nx, ny, collarPoly)) {
        rgb = [245, 165, 20];
      }

      // Diamond gold nuqta dot accent
      const dNuqta = Math.abs(nx - 0.11 * scale) + Math.abs(ny + 0.11 * scale);
      if (dNuqta < 0.032 * scale) {
        rgb = [245, 175, 25];
      }

      rawData[pxOffset] = rgb[0];
      rawData[pxOffset + 1] = rgb[1];
      rawData[pxOffset + 2] = rgb[2];
      rawData[pxOffset + 3] = alpha;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

console.log('Successfully generated Qalam Urdu Studio PWA PNG icons in /public.');
