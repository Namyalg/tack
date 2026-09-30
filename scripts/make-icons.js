// Generates the app icons as PNGs with no image-library dependency.
// The art is a stylised QR code: three finder squares plus a scatter of
// modules, drawn on a 21-module grid and kept inside a maskable safe zone.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const BG = [28, 25, 23];      // stone-900, the app's ink
const FG = [245, 181, 68];    // amber, the app's accent

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// A 21x21 module map. 1 = accent, 0 = background.
function moduleMap() {
  const N = 21;
  const g = Array.from({ length: N }, () => new Array(N).fill(0));

  // Finder pattern: 7x7 ring with a 3x3 solid core.
  const finder = (top, left) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = y === 0 || y === 6 || x === 0 || x === 6;
        const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        if (ring || core) g[top + y][left + x] = 1;
      }
    }
  };
  finder(0, 0);
  finder(0, 14);
  finder(14, 0);

  // A fixed scatter in the data area so the icon reads as a real code.
  const scatter = [
    [9, 2], [9, 4], [10, 3], [11, 2], [11, 5], [12, 4], [13, 3],
    [2, 9], [4, 9], [3, 10], [2, 11], [5, 11], [4, 12], [3, 13],
    [9, 9], [10, 10], [11, 11], [9, 11], [11, 9],
    [16, 16], [16, 18], [18, 16], [18, 18], [17, 17],
    [9, 16], [11, 18], [13, 16], [16, 9], [18, 11], [16, 13],
  ];
  for (const [y, x] of scatter) g[y][x] = 1;
  return g;
}

function render(size) {
  const g = moduleMap();
  const N = g.length;
  const inset = Math.round(size * 0.18);   // maskable safe zone
  const cell = (size - inset * 2) / N;
  const raw = Buffer.alloc(size * (size * 3 + 1));

  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const mx = Math.floor((x - inset) / cell);
      const my = Math.floor((y - inset) / cell);
      const on = mx >= 0 && my >= 0 && mx < N && my < N && g[my][mx] === 1;
      const [r, gr, b] = on ? FG : BG;
      const p = row + 1 + x * 3;
      raw[p] = r; raw[p + 1] = gr; raw[p + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512, 1024]) {
  const file = path.join(out, `icon-${size}.png`);
  fs.writeFileSync(file, render(size));
  console.log('wrote', file);
}
