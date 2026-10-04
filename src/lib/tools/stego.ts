export const MAGIC = new Uint8Array([77, 89, 83, 84]); // 'MYST'
export const HEADER = 9;

// Returns the flat pixel array index for the k-th bit.
// Skips the alpha channel (every 4th byte) and writes to R, G, B in order.
export const idx = (k: number) => Math.floor(k / 3) * 4 + (k % 3);

export function writeBytes(data: Uint8ClampedArray, bytes: Uint8Array) {
  for (let k = 0; k < bytes.length * 8; k++) {
    const bit = (bytes[k >> 3] >> (7 - (k & 7))) & 1;
    const i = idx(k);
    data[i] = (data[i] & 254) | bit;
  }
}

export function readBytes(data: Uint8ClampedArray, start: number, count: number): Uint8Array {
  const out = new Uint8Array(count);
  for (let k = 0; k < count * 8; k++) {
    const bit = data[idx(start * 8 + k)] & 1;
    out[k >> 3] |= bit << (7 - (k & 7));
  }
  return out;
}

export function encodeStego(
  img: HTMLImageElement,
  payload: Uint8Array,
  type: number
): { blob: Blob | null, message: string, isError: boolean } {
  return new Promise(resolve => {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true });
      if (!x) throw new Error('Could not get canvas context');

      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height); // removes transparency so RGB stays exact
      x.drawImage(img, 0, 0);

      const d = x.getImageData(0, 0, c.width, c.height);
      const capacity = Math.floor(c.width * c.height * 3 / 8) - HEADER;

      if (payload.length > capacity) {
        throw new Error(`Too big. This image holds ${capacity} bytes; your secret is ${payload.length}. Use a larger cover image.`);
      }

      const all = new Uint8Array(HEADER + payload.length);
      all.set(MAGIC, 0);
      all[4] = type;
      new DataView(all.buffer).setUint32(5, payload.length);
      all.set(payload, HEADER);

      writeBytes(d.data, all);
      x.putImageData(d, 0, 0);

      c.toBlob(blob => {
        resolve({ blob, message: `Done. Hid ${payload.length} bytes. Save as PNG and don't edit or screenshot it.`, isError: false });
      }, 'image/png');
    } catch (e: any) {
      resolve({ blob: null, message: e.message, isError: true });
    }
  }) as any;
}

export function decodeStego(
  img: HTMLImageElement
): { text?: string, file?: { name: string, data: Blob }, message?: string, isError?: boolean } {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) throw new Error('Could not get canvas context');

    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;

    const capacity = Math.floor(c.width * c.height * 3 / 8);
    if (capacity < HEADER) throw new Error('Image too small to hold anything.');

    const head = readBytes(d, 0, HEADER);
    for (let i = 0; i < 4; i++) {
      if (head[i] !== MAGIC[i]) throw new Error('No secret found. Was it saved as JPG or resized?');
    }

    const type = head[4];
    const len = new DataView(head.buffer).getUint32(5);
    if (HEADER + len > capacity) throw new Error('Secret is cut off or corrupted.');

    const payload = readBytes(d, HEADER, len);

    if (type === 0) {
      return { text: new TextDecoder().decode(payload) };
    } else if (type === 1) {
      const nl = payload[0];
      const name = new TextDecoder().decode(payload.subarray(1, 1 + nl));
      const blob = new Blob([payload.subarray(1 + nl) as any]);
      return { file: { name, data: blob } };
    }
    throw new Error('Unknown secret type.');
  } catch (e: any) {
    return { message: e.message, isError: true };
  }
}
