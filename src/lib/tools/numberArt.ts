export const LH = 1.15;

export interface NumberArtConfig {
  chars: string;
  isBold: boolean;
  cols: number;
  matchMode: 'shape' | 'tone';
  autoLevels: boolean;
  contrast: number;
  brightness: number;
  colorMode: 'bw' | 'wb' | 'col';
}

export interface NumberArtResult {
  chars: string[];
  idx: Uint8Array;
  cc: Uint8ClampedArray | null;
  cols: number;
  rows: number;
  inv: boolean;
  colour: boolean;
}

export const PRESETS: Record<string, string> = {
  num: '0123456789',
  classic: '17938',
  hex: '0123456789ABCDEF',
  bin: '01',
  blocks: ' ░▒▓█',
  ascii: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

export const getFontString = (px: number, isBold: boolean) =>
  `${isBold ? 'bold ' : ''}${px}px ui-monospace,Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace`;

export function getUniqueChars(input: string): string[] {
  return [...new Set([...input].filter(c => !'\n\r\t'.includes(c)))];
}

export interface GlyphInfo {
  ch: string;
  v: Float32Array;
  ink: number;
  sq: number;
  vc?: Float32Array;
  sqc?: number;
}

export function measureGlyphs(chars: string[], tw: number, fontStrFn: (px: number) => string): { list: GlyphInfo[], th: number, aspect: number } {
  const mCanvas = document.createElement('canvas');
  const m = mCanvas.getContext('2d')!;
  m.font = fontStrFn(100);
  const aspect = m.measureText('0').width / (100 * LH);
  const th = Math.max(6, Math.round(tw / aspect));

  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const x = c.getContext('2d', { willReadFrequently: true })!;

  const list = chars.map(ch => {
    x.fillStyle = '#fff';
    x.fillRect(0, 0, tw, th);
    x.fillStyle = '#000';
    x.font = fontStrFn(th / LH);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(ch, tw / 2, th / 2);

    const d = x.getImageData(0, 0, tw, th).data;
    const v = new Float32Array(tw * th);
    let ink = 0, sq = 0;

    for (let i = 0; i < v.length; i++) {
      v[i] = 1 - d[i * 4] / 255;
      ink += v[i];
      sq += v[i] * v[i];
    }
    return { ch, v, ink: ink / v.length, sq };
  });

  return { list, th, aspect };
}

export function resampleImage(img: HTMLImageElement, W: number, H: number, fill: string): Uint8ClampedArray {
  let src: CanvasImageSource = img;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  while (sw / 2 > W && sh / 2 > H) {
    sw = Math.round(sw / 2);
    sh = Math.round(sh / 2);
    const t = document.createElement('canvas');
    t.width = sw;
    t.height = sh;
    const tx = t.getContext('2d')!;
    tx.imageSmoothingQuality = 'high';
    tx.drawImage(src, 0, 0, sw, sh);
    src = t;
  }

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.fillStyle = fill;
  x.fillRect(0, 0, W, H);
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, W, H);

  return x.getImageData(0, 0, W, H).data;
}

export function buildNumberArt(img: HTMLImageElement, config: NumberArtConfig): { result: NumberArtResult | null, message: string } {
  const chars = getUniqueChars(config.chars);
  if (chars.length < 2) {
    return { result: null, message: 'Add at least 2 characters.' };
  }

  const inv = config.colorMode !== 'bw';
  const colour = config.colorMode === 'col';
  const shape = config.matchMode === 'shape';

  const tw = config.cols > 160 ? 8 : 10;
  const fontStrFn = (px: number) => getFontString(px, config.isBold);
  const Gl = measureGlyphs(chars, tw, fontStrFn);
  const th = Gl.th;
  const n = tw * th;
  const gl = Gl.list;
  const L = gl.length;

  const rows = Math.max(1, Math.round(img.naturalHeight / img.naturalWidth * config.cols * Gl.aspect));
  const W = config.cols * tw;
  const H = rows * th;
  const D = resampleImage(img, W, H, inv ? '#000' : '#fff');

  const Lm = new Float32Array(W * H);
  const hist = new Uint32Array(256);

  for (let i = 0, j = 0; j < Lm.length; i += 4, j++) {
    const l = (D[i] * 0.299 + D[i + 1] * 0.587 + D[i + 2] * 0.114) / 255;
    Lm[j] = l;
    hist[Math.min(255, (l * 255) | 0)]++;
  }

  let lo = 0, hi = 1;
  if (config.autoLevels) {
    const t = W * H * 0.01;
    let s = 0, k = 0;
    for (; k < 256; k++) {
      s += hist[k];
      if (s >= t) break;
    }
    lo = k / 255;
    s = 0;
    for (k = 255; k >= 0; k--) {
      s += hist[k];
      if (s >= t) break;
    }
    hi = Math.max(k / 255, lo + 0.05);
  }

  const ct = config.contrast;
  const br = config.brightness;
  const T = new Float32Array(W * H);
  for (let j = 0; j < T.length; j++) {
    let l = (Lm[j] - lo) / (hi - lo);
    l = (l - 0.5) * ct + 0.5 + br;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    T[j] = inv ? l : 1 - l;
  }

  const maxInk = Math.max(...gl.map(g => g.ink));
  const minInk = Math.min(...gl.map(g => g.ink));
  gl.forEach(g => {
    g.vc = new Float32Array(g.v.length);
    for(let i=0; i<g.v.length; i++) g.vc[i] = g.v[i] - g.ink;
    g.sqc = g.vc.reduce((t, a) => t + a * a, 0);
  });

  const idx = new Uint8Array(rows * config.cols);
  const cc = colour ? new Uint8ClampedArray(rows * config.cols * 3) : null;
  const tl = new Float32Array(n);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      let sum = 0, sq2 = 0, k = 0, best = 0, R = 0, Gc = 0, B = 0;
      for (let y = 0; y < th; y++) {
        const o = (r * th + y) * W + c * tw;
        for (let x = 0; x < tw; x++) {
          const v = T[o + x];
          tl[k++] = v;
          sum += v;
          sq2 += v * v;
          if (colour) {
            const p = (o + x) * 4;
            R += D[p];
            Gc += D[p + 1];
            B += D[p + 2];
          }
        }
      }

      const mT = sum / n;
      const tone = minInk + mT * (maxInk - minInk);
      const sw = Math.min(1, (sq2 / n - mT * mT) * 10);
      let bs = 1e9;

      for (let g = 0; g < L; g++) {
        const e = tone - gl[g].ink;
        let sc = n * e * e * 30;
        if (shape) {
          const v = gl[g].vc!;
          let d = 0;
          for (let q = 0; q < n; q++) d += tl[q] * v[q];
          sc += sw * (gl[g].sqc! - 2 * d);
        }
        if (sc < bs) {
          bs = sc;
          best = g;
        }
      }
      idx[r * config.cols + c] = best;
      if (colour && cc) {
        const q = (r * config.cols + c) * 3;
        cc[q] = R / n;
        cc[q + 1] = Gc / n;
        cc[q + 2] = B / n;
      }
    }
  }

  const result: NumberArtResult = {
    chars: gl.map(g => g.ch),
    idx,
    cc,
    cols: config.cols,
    rows,
    inv,
    colour
  };

  const order = gl.slice().sort((a, b) => a.ink - b.ink).map(g => g.ch).join(' ');
  const message = `${config.cols} x ${rows} characters. Light to dark order measured: ${order.length > 40 ? order.slice(0, 40) + '…' : order}`;

  return { result, message };
}

export function paintNumberArt(c: HTMLCanvasElement, res: NumberArtResult, fs: number, isBold: boolean) {
  const m = document.createElement('canvas').getContext('2d')!;
  const fontStr = getFontString(fs, isBold);
  m.font = fontStr;
  const adv = m.measureText('0').width;
  const ph = fs * LH;

  c.width = Math.round(adv * res.cols);
  c.height = Math.round(ph * res.rows);
  const x = c.getContext('2d')!;

  x.fillStyle = res.inv ? '#000' : '#fff';
  x.fillRect(0, 0, c.width, c.height);
  x.font = fontStr;
  x.textBaseline = 'middle';
  x.textAlign = 'left';
  x.fillStyle = res.inv ? '#fff' : '#000';

  for (let r = 0; r < res.rows; r++) {
    if (res.colour && res.cc) {
      for (let k = 0; k < res.cols; k++) {
        const q = (r * res.cols + k) * 3;
        x.fillStyle = `rgb(${res.cc[q]},${res.cc[q + 1]},${res.cc[q + 2]})`;
        x.fillText(res.chars[res.idx[r * res.cols + k]], k * adv, (r + 0.5) * ph);
      }
    } else {
      let s = '';
      for (let c = 0; c < res.cols; c++) s += res.chars[res.idx[r * res.cols + c]];
      x.fillText(s, 0, (r + 0.5) * ph);
    }
  }
}

export function getLineOf(res: NumberArtResult, r: number): string {
  let s = '';
  for (let c = 0; c < res.cols; c++) s += res.chars[res.idx[r * res.cols + c]];
  return s;
}

export function getAsText(res: NumberArtResult): string {
  return Array.from({ length: res.rows }, (_, r) => getLineOf(res, r)).join('\n');
}
