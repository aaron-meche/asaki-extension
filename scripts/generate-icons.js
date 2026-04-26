#!/usr/bin/env node
// Generates icon16.png, icon48.png, icon128.png — indigo circle with "A".
// Uses only Node.js built-ins (zlib for deflate, fs for writing).
// Run: node scripts/generate-icons.js

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

const SIZES   = [16, 48, 128];
const OUT_DIR = 'static/icons';
const BG      = [99, 102, 241]; // indigo-500
const FG      = [255, 255, 255];

// ── CRC32 (must be initialised before any PNG is encoded) ─────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
function encodePNG(w, h, rgba) {
  const SIG = Buffer.from([137,80,78,71,13,10,26,10]);

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const lenB = Buffer.alloc(4); lenB.writeUInt32BE(d.length);
    const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([t,d])));
    return Buffer.concat([lenB, t, d, crcB]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, RGBA colour type

  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); // filter=None
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      raw.push(rgba[i], rgba[i+1], rgba[i+2], rgba[i+3]);
    }
  }

  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Pixel builder ─────────────────────────────────────────────────────────────
function buildPixels(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;

  // Filled circle with anti-aliased edge
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      const i = (y * size + x) * 4;
      if (dist < r) {
        const a = dist > r - 1 ? Math.round(255 * (r - dist)) : 255;
        pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2]; pixels[i+3] = a;
      }
    }
  }

  // Paint white "A" glyph (scaled to icon size)
  const s = size / 16;
  const glyphDots = [];
  const rng = (a, b) => Array.from({length:b-a+1},(_,i)=>a+i);
  // Left diagonal leg
  for (const [gx, gy] of rng(-3,-1).flatMap(x => rng(-6, 1).map(y => [x, y])))
    glyphDots.push([gx, gy]);
  // Right diagonal leg
  for (const [gx, gy] of rng(1,3).flatMap(x => rng(-6, 1).map(y => [x, y])))
    glyphDots.push([gx, gy]);
  // Crossbar
  for (const gx of rng(-2, 2)) glyphDots.push([gx, -2]);

  for (const [gx, gy] of glyphDots) {
    const px = Math.round(size/2 + gx * s);
    const py = Math.round(size*0.6 + gy * s);
    const pr = Math.max(1, Math.round(s * 0.55));
    for (let dy = -pr; dy <= pr; dy++) {
      for (let dx = -pr; dx <= pr; dx++) {
        const x = px+dx, y = py+dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const i = (y*size+x)*4;
        if (pixels[i+3] > 0) { // only inside circle
          pixels[i]=FG[0]; pixels[i+1]=FG[1]; pixels[i+2]=FG[2]; pixels[i+3]=255;
        }
      }
    }
  }

  return pixels;
}

// ── Main ──────────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const path = `${OUT_DIR}/icon${size}.png`;
  writeFileSync(path, encodePNG(size, size, buildPixels(size)));
  console.log(`✓  ${path}`);
}
