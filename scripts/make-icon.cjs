// Rasterizes the GitSylva S-tree mark to a 1024x1024 RGBA PNG without external
// dependencies: shapes are stamped onto a 2x supersampled buffer (round caps
// and joins come free from stamping discs along paths, and a continuously
// tapered spine avoids width steps), then box-downsampled and PNG-encoded.
const zlib = require("zlib");
const fs = require("fs");

// argv: [target] [bgHex] [leafHex] [size] — defaults reproduce the original
// 1024px brand icon; the themed window icons pass their own colors/size.
const hexArg = (s, fallback) => {
  if (!s || !/^#?[0-9a-fA-F]{6}$/.test(s)) return fallback;
  const h = s.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
};

const OUT = parseInt(process.argv[5], 10) || 1024;
const SS = OUT * 2;
const SCALE = SS / 64;

const buf = new Uint8Array(SS * SS * 4);

const BG = hexArg(process.argv[3], [0x14, 0x18, 0x1b, 255]);
const GREEN = hexArg(process.argv[4], [0x7b, 0xc8, 0x96, 255]);

function put(x, y, c) {
  if (x < 0 || y < 0 || x >= SS || y >= SS) return;
  const i = (y * SS + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3];
}

function fillCircle(cx, cy, r, c) {
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(SS - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(SS - 1, Math.ceil(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) put(x, y, c);
    }
}

function roundedRect(x, y, w, h, r, c) {
  for (let py = 0; py < SS; py++)
    for (let px = 0; px < SS; px++) {
      const lx = px / SCALE, ly = py / SCALE;
      if (lx < x || ly < y || lx > x + w || ly > y + h) continue;
      const cx = Math.min(Math.max(lx, x + r), x + w - r);
      const cy = Math.min(Math.max(ly, y + r), y + h - r);
      const dx = lx - cx, dy = ly - cy;
      if (dx * dx + dy * dy <= r * r) put(px, py, c);
    }
}

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

// Continuously tapered stroke along joined cubics: width w0 at t=0 → w1 at t=1.
function strokeTapered(cubics, w0, w1, c) {
  const total = cubics.length;
  cubics.forEach((seg, si) => {
    const steps = 600;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const gt = (si + t) / total;
      const [x, y] = cubic(seg[0], seg[1], seg[2], seg[3], t);
      const w = w0 + (w1 - w0) * Math.pow(gt, 0.85);
      fillCircle(x * SCALE, y * SCALE, (w / 2) * SCALE, c);
    }
  });
}

function strokeCubic(p0, p1, p2, p3, width, c) {
  strokeTapered([[p0, p1, p2, p3]], width, width, c);
}

function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

function fillPolygon(points, c) {
  let minY = Infinity, maxY = -Infinity;
  for (const [, y] of points) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(SS - 1, Math.ceil(maxY)); y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.max(0, Math.round(xs[k])); x <= Math.min(SS - 1, Math.round(xs[k + 1])); x++) put(x, y, c);
  }
}

function leaf(bx, by, tx, ty, bulge, c) {
  // Simple two-arc leaf from base (bx,by) to tip (tx,ty).
  const mx = (bx + tx) / 2, my = (by + ty) / 2;
  const nx = -(ty - by), ny = tx - bx; // normal
  const len = Math.hypot(nx, ny) || 1;
  const ux = (nx / len) * bulge, uy = (ny / len) * bulge;
  const pts = [];
  for (let i = 0; i <= 50; i++) pts.push(quad([bx, by], [mx + ux, my + uy], [tx, ty], i / 50));
  for (let i = 0; i <= 50; i++) pts.push(quad([tx, ty], [mx - ux, my - uy], [bx, by], i / 50));
  fillPolygon(pts.map(([x, y]) => [x * SCALE, y * SCALE]), c);
}

// ---- draw ----
roundedRect(0, 0, 64, 64, 15, BG);

// roots: short nubs spreading from the exact trunk tip on the baseline
strokeCubic([29, 55.5], [25.5, 56.5], [22.5, 57.2], [19.5, 57.2], 2.2, GREEN);
strokeCubic([29, 55.5], [32.5, 56.5], [35.5, 57.2], [38.5, 57.2], 2.2, GREEN);

// The S spine: one continuous tapered vine, thick base → thin top,
// ending upright on the baseline. Two C1-continuous cubics through (33,37).
strokeTapered(
  [
    [[29, 55.5], [37.5, 52], [38.5, 44.5], [33, 37]],
    [[33, 37], [27.9, 30.1], [25, 17], [38, 10.5]],
  ],
  6.6,
  2.3,
  GREEN,
);

// crown branches (commits growing off the vine)
strokeCubic([34.5, 13.5], [39, 12.5], [45, 13.5], [51, 17], 2, GREEN); // right
strokeCubic([28.8, 21.5], [24.5, 20], [20, 21], [15.5, 24], 2, GREEN); // left

// hollow commit nodes
for (const [cx, cy] of [[51, 17], [15.5, 24], [38, 10.5]]) {
  fillCircle(cx * SCALE, cy * SCALE, 4.2 * SCALE, GREEN);
  fillCircle(cx * SCALE, cy * SCALE, 2.1 * SCALE, BG);
}
// one filled node riding the right branch, clear of both hollow nodes
fillCircle(45 * SCALE, 13.9 * SCALE, 2 * SCALE, GREEN);

// leaf sprouting from the lower bowl (variação B: uma folha na base)
leaf(37, 46.5, 47.5, 42, 3, GREEN);

// ---- downsample ----
const out = Buffer.alloc(OUT * OUT * 4);
for (let y = 0; y < OUT; y++)
  for (let x = 0; x < OUT; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const i = ((y * 2 + dy) * SS + x * 2 + dx) * 4;
        const al = buf[i + 3] / 255;
        r += buf[i] * al; g += buf[i + 1] * al; b += buf[i + 2] * al; a += buf[i + 3];
      }
    const o = (y * OUT + x) * 4;
    const al = a / 4 / 255;
    out[o] = al > 0 ? Math.round(r / 4 / al) : 0;
    out[o + 1] = al > 0 ? Math.round(g / 4 / al) : 0;
    out[o + 2] = al > 0 ? Math.round(b / 4 / al) : 0;
    out[o + 3] = Math.round(a / 4);
  }

// ---- PNG encode ----
function crc32(bytes) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(OUT, 0);
ihdr.writeUInt32BE(OUT, 4);
ihdr[8] = 8; ihdr[9] = 6;

const raw = Buffer.alloc(OUT * (OUT * 4 + 1));
for (let y = 0; y < OUT; y++) {
  raw[y * (OUT * 4 + 1)] = 0;
  out.copy(raw, y * (OUT * 4 + 1) + 1, y * OUT * 4, (y + 1) * OUT * 4);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const target = process.argv[2] || "icon-1024.png";
fs.writeFileSync(target, png);
console.log("wrote", target, png.length, "bytes");
