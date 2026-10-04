export const CRC = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (b: Uint8Array): number => {
    let c = -1;
    for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8);
    return (~c) >>> 0;
  };
})();

export function exif(desc: string, dt: string): Uint8Array {
  // dt = "YYYY:MM:DD HH:MM:SS"
  const e = new TextEncoder();
  const D = Array.from(e.encode(desc));
  D.push(0);
  if (D.length % 2) D.push(0);

  const T = Array.from(e.encode(dt));
  T.push(0);

  const has = desc.length > 0;
  const n = has ? 3 : 2;

  let off = 8 + 2 + 12 * n + 4;
  const dOff = off;
  if (has) off += D.length;

  const tOff = off; off += 20;
  const xOff = off; off += 2 + 24 + 4;
  const t2 = off; off += 20;
  const t3 = off; off += 20;

  const out = new Uint8Array(off);
  const v = new DataView(out.buffer);

  out.set([0x4D, 0x4D, 0, 42], 0);
  v.setUint32(4, 8);

  let p = 8;
  v.setUint16(p, n);
  p += 2;

  const ent = (tag: number, type: number, cnt: number, vo: number) => {
    v.setUint16(p, tag);
    v.setUint16(p + 2, type);
    v.setUint32(p + 4, cnt);
    v.setUint32(p + 8, vo);
    p += 12;
  };

  if (has) ent(0x010E, 2, D.length, dOff);
  ent(0x0132, 2, 20, tOff);
  ent(0x8769, 4, 1, xOff);
  v.setUint32(p, 0);

  if (has) out.set(D, dOff);
  out.set(T, tOff);
  out.set(T, t2);
  out.set(T, t3);

  p = xOff;
  v.setUint16(p, 2);
  p += 2;
  ent(0x9003, 2, 20, t2);
  ent(0x9004, 2, 20, t3);
  v.setUint32(p, 0);

  return out;
}

export function addExif(png: Uint8Array, ex: Uint8Array): Uint8Array {
  // insert an eXIf chunk right after IHDR
  const ch = new Uint8Array(12 + ex.length);
  const v = new DataView(ch.buffer);

  v.setUint32(0, ex.length);
  ch.set([0x65, 0x58, 0x49, 0x66], 4);
  ch.set(ex, 8);

  v.setUint32(8 + ex.length, CRC(ch.subarray(4, 8 + ex.length)));

  const out = new Uint8Array(png.length + ch.length);
  out.set(png.subarray(0, 33));
  out.set(ch, 33);
  out.set(png.subarray(33), 33 + ch.length);

  return out;
}

export function pad(n: number | string): string {
  return String(n).padStart(2, '0');
}

export function nowLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface TextOptions {
  x: number;
  y: number;
  r: number;
  s: number;
  f: string;
  b: boolean;
  a: CanvasTextAlign;
  l: number;
  fit: boolean;
}

export function drawText(x: CanvasRenderingContext2D, W: number, H: number, t: string, o: TextOptions, k: number) {
  x.save();
  x.translate(o.x * W / 100, o.y * H / 100);
  x.rotate(o.r * Math.PI / 180);
  let s = o.s * k;
  const font = (p: number) => `${o.b ? 'bold ' : ''}${p}px ${o.f}`;
  x.font = font(s);
  const L = t.split('\n');
  if (o.fit) {
    const mw = Math.max(1, ...L.map(l => x.measureText(l).width));
    if (mw > 0.92 * W) {
      s *= 0.92 * W / mw;
      x.font = font(s);
    }
  }
  x.textAlign = o.a;
  x.textBaseline = 'middle';
  L.forEach((l, i) => x.fillText(l, 0, (i - (L.length - 1) / 2) * s * o.l));
  x.restore();
}

export interface InvisibleInkConfig {
  w: number;
  h: number;
  op: number;
  bg: string;
  c1: string;
  c2: string;
  ga: number;
  dec: string;
  dc: string;
  dx: number;
  dy: number;
  ds: number;
  dfn: string;
  sec: string;
  sx: number;
  sy: number;
  sr: number;
  ss: number;
  sf: string;
  sb: boolean;
  sa: CanvasTextAlign;
  sl: number;
  fit: boolean;
}

export function renderInvisibleInk(
  c: HTMLCanvasElement,
  W: number,
  H: number,
  config: InvisibleInkConfig,
  photo: HTMLImageElement | null
) {
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return;

  const clamp = (v: number) => Math.max(200, Math.min(4000, v || 1080));
  const k = W / clamp(config.w);
  const K = Math.round(255 * config.op / 100);   // brightness of the hidden text on black

  // 1. visible background
  const bgt = config.bg;
  if (bgt === 'photo' && photo) {
    const f = Math.max(W / photo.width, H / photo.height);
    x.drawImage(photo, (W - photo.width * f) / 2, (H - photo.height * f) / 2, photo.width * f, photo.height * f);
  } else if (bgt === 'grad') {
    const a = config.ga * Math.PI / 180, r = Math.hypot(W, H) / 2, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    const g = x.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    g.addColorStop(0, config.c1);
    g.addColorStop(1, config.c2);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  } else {
    x.fillStyle = config.c1;
    x.fillRect(0, 0, W, H);
  }

  // 2. lift the picture into [K..255] so the secret can hide underneath it
  const lf = x.getImageData(0, 0, W, H);
  const ld = lf.data;
  for (let i = 0; i < ld.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      ld[i + j] = K + (255 - K) * ld[i + j] / 255;
    }
  }
  x.putImageData(lf, 0, 0);

  // 3. visible text (after the lift, so it keeps its own colour)
  if (config.dec.trim()) {
    x.fillStyle = config.dc;
    drawText(x, W, H, config.dec, { x: config.dx, y: config.dy, r: 0, s: config.ds, f: config.dfn, b: true, a: 'center', l: 1.2, fit: true }, k);
  }

  // 4. secret text mask
  const m = document.createElement('canvas');
  m.width = W;
  m.height = H;
  const mc = m.getContext('2d', { willReadFrequently: true });
  if (!mc) return;
  mc.fillStyle = '#fff';
  drawText(mc, W, H, config.sec, { x: config.sx, y: config.sy, r: config.sr, s: config.ss, f: config.sf, b: config.sb, a: config.sa, l: config.sl, fit: config.fit }, k);
  const a = mc.getImageData(0, 0, W, H).data;

  // 5. colour + transparency: white shows the picture exactly, black shows picture minus D (text has small D, so it glows)
  const wd = x.getImageData(0, 0, W, H);
  const d = wd.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const D = Math.max(0, Math.round(Math.min(r, g, b) - K * a[i + 3] / 255));
    d[i] = r - D;
    d[i + 1] = g - D;
    d[i + 2] = b - D;
    d[i + 3] = Math.max(0, Math.min(255, Math.round(255 - D * 255 / K)));
  }
  x.putImageData(wd, 0, 0);
}
