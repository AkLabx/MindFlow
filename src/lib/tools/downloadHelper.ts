import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export async function saveFile({
  data,
  name,
  mime,
  isBase64 = false,
  fallbackToClipboard = false
}: {
  data: string | Blob;
  name: string;
  mime: string;
  isBase64?: boolean;
  fallbackToClipboard?: boolean;
}) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      let base64Data: string;

      if (data instanceof Blob) {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove the data URI prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(data);
        });
      } else if (isBase64) {
        base64Data = data;
      } else {
        // Plain text
        base64Data = btoa(unescape(encodeURIComponent(data)));
      }

      // Write to Cache directory (or Documents, but Cache + Share is safer for Android 11+)
      const result = await Filesystem.writeFile({
        path: name,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Share the file
      await Share.share({
        title: `Share ${name}`,
        url: result.uri,
        dialogTitle: 'Save or Share',
      });
      return true;
    } catch (e) {
      console.error('Error saving file natively:', e);
      toast.error('Failed to save file natively.');
      return false;
    }
  } else {
    // Web fallback
    try {
      let url: string;
      if (data instanceof Blob) {
        url = URL.createObjectURL(data);
      } else {
        const blob = new Blob([data], { type: mime });
        url = URL.createObjectURL(blob);
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();

      if (data instanceof Blob) {
         setTimeout(() => URL.revokeObjectURL(url), 8000);
      }
      return true;
    } catch (e) {
       console.error('Error saving file on web:', e);
       toast.error('Failed to download file.');
       return false;
    }
  }
}

export async function copyText(text: string) {
  const isNative = Capacitor.isNativePlatform();
  try {
    if (isNative) {
      await Clipboard.write({ string: text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    toast.success('Text copied to clipboard!');
    return true;
  } catch (e) {
    console.error('Copy failed:', e);
    toast.error('Could not copy to clipboard.');
    return false;
  }
}
