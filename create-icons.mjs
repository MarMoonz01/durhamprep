// Generates icon-192.png and icon-512.png for the Durham Go PWA
// Run once: node create-icons.mjs

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function makePNG(size) {
  // Durham navy blue: #1a237e  RGB(26,35,126)
  const bg = [26, 35, 126];
  // Gold accent: #FFD600  RGB(255,214,0)
  const gold = [255, 214, 0];

  // Build raw scanlines (RGBA)
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte = None
    for (let x = 0; x < size; x++) {
      // Rounded rectangle mask (corner radius = size/8)
      const r = size / 8;
      const cx = size / 2, cy = size / 2;
      const dx = Math.abs(x - cx + 0.5);
      const dy = Math.abs(y - cy + 0.5);
      const inRect = dx < cx - r && dy < cy || dy < cy - r && dx < cx;
      const inCorner = Math.sqrt(Math.pow(Math.max(0, dx - (cx - r)), 2) + Math.pow(Math.max(0, dy - (cy - r)), 2)) < r;
      const inside = inRect || inCorner;

      if (!inside) { row.push(255, 255, 255, 0); continue; }

      // Inner circle (gold) centered
      const dist = Math.sqrt(Math.pow(x - cx + 0.5, 2) + Math.pow(y - cy + 0.5, 2));
      const ringOuter = size * 0.38, ringInner = size * 0.30;
      const dotR = size * 0.10;

      if (dist < dotR) {
        // Center cap
        row.push(255, 255, 255, 255);
      } else if (dist >= ringInner && dist <= ringOuter) {
        // Gold ring
        row.push(gold[0], gold[1], gold[2], 255);
      } else {
        row.push(bg[0], bg[1], bg[2], 255);
      }
    }
    rows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rows);
  const compressed = deflateSync(raw, { level: 6 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

writeFileSync('public/icon-192.png', makePNG(192));
writeFileSync('public/icon-512.png', makePNG(512));
console.log('✅ icon-192.png and icon-512.png created in public/');
