/**
 * High-performance client-side image compression utility
 * Converts camera/gallery photos to optimized WebP format before network upload
 */

export interface CompressionResult {
  file: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

export async function compressImageToWebP(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.82
): Promise<CompressionResult> {
  // If not an image, return original
  if (!file.type.startsWith('image/')) {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate aspect ratio scaling
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if canvas context unavailable
        resolve({
          file,
          previewUrl: URL.createObjectURL(file),
          width: img.width,
          height: img.height,
        });
        return;
      }

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export to high-efficiency WebP (supported by all modern browsers and Android WebView)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              previewUrl: URL.createObjectURL(file),
              width,
              height,
            });
            return;
          }

          resolve({
            file: blob,
            previewUrl: URL.createObjectURL(blob),
            width,
            height,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
