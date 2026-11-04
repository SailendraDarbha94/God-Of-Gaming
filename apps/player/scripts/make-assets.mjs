// Generates the app icon, Android adaptive-icon foreground and splash image as plain PNGs with
// Node built-ins only: a solid background and a pixel-font "GOG" wordmark (spec 06 §Configuration:
// no third-party artwork). Deterministic, so re-running it produces identical files.
//
//   node scripts/make-assets.mjs
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const scriptDir = dirname(fileURLToPath(import.meta.url));

// The same two colours app.config.ts and src/lib/theme.ts use, so the icon can never drift.
const palette = JSON.parse(
  readFileSync(join(scriptDir, '..', 'src', 'lib', 'palette.json'), 'utf8'),
);

/** `#RRGGBB` → `[r, g, b]`. */
function rgb(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (match === null) {
    throw new Error(`palette colour is not #RRGGBB: ${hex}`);
  }
  return match.slice(1).map((pair) => Number.parseInt(pair, 16));
}

const BACKGROUND = rgb(palette.background);
const ACCENT = rgb(palette.accent);

// 5x7 glyphs; '#' is ink. Only the letters of the working title's initials are needed.
const GLYPHS = {
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
};
const WORDMARK = ['G', 'O', 'G'];
const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;
const GLYPH_GAP = 1;

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Encodes RGBA pixels as an 8-bit truecolour-with-alpha PNG (filter type 0 on every row). */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Paints the wordmark centred on a square canvas. `scale` is the wordmark width as a fraction of
 * the canvas; the adaptive icon keeps it inside Android's 66% safe zone.
 */
function paint({ size, background, scale }) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    if (background === null) {
      rgba[i * 4 + 3] = 0;
    } else {
      rgba.set([...background, 0xff], i * 4);
    }
  }

  const columns = WORDMARK.length * GLYPH_WIDTH + (WORDMARK.length - 1) * GLYPH_GAP;
  const pixel = Math.max(1, Math.floor((size * scale) / columns));
  const originX = Math.floor((size - columns * pixel) / 2);
  const originY = Math.floor((size - GLYPH_HEIGHT * pixel) / 2);

  WORDMARK.forEach((letter, index) => {
    const glyph = GLYPHS[letter];
    const left = originX + index * (GLYPH_WIDTH + GLYPH_GAP) * pixel;
    glyph.forEach((row, gy) => {
      [...row].forEach((cell, gx) => {
        if (cell !== '#') {
          return;
        }
        for (let y = 0; y < pixel; y += 1) {
          for (let x = 0; x < pixel; x += 1) {
            const px = left + gx * pixel + x;
            const py = originY + gy * pixel + y;
            rgba.set([...ACCENT, 0xff], (py * size + px) * 4);
          }
        }
      });
    });
  });

  return encodePng(size, size, rgba);
}

const assetsDir = join(scriptDir, '..', 'assets');
mkdirSync(assetsDir, { recursive: true });

const files = {
  'icon.png': paint({ size: 1024, background: BACKGROUND, scale: 0.6 }),
  'adaptive-icon.png': paint({ size: 1024, background: null, scale: 0.5 }),
  'splash-icon.png': paint({ size: 512, background: null, scale: 0.8 }),
};

for (const [name, png] of Object.entries(files)) {
  writeFileSync(join(assetsDir, name), png);
  process.stdout.write(`wrote assets/${name} (${png.length} bytes)\n`);
}
