/**
 * High-Performance Client-Side Image Compressor
 * Resizes and compresses invoice photos and documents before sending to Gemini Vision.
 * Prevents HTTP 413 (Payload Too Large) and "Failed to fetch" errors.
 */

export async function compressImageForOcr(
  fileOrBase64: File | string,
  maxWidth: number = 1600,
  maxHeight: number = 1600,
  quality: number = 0.82
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // If it's a PDF, we can't compress via canvas, return directly
    if (fileOrBase64 instanceof File && fileOrBase64.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          base64: e.target?.result as string,
          mimeType: 'application/pdf',
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoadedImage = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original
        if (typeof fileOrBase64 === 'string') {
          resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
        } else {
          const r = new FileReader();
          r.onload = (e) => resolve({ base64: e.target?.result as string, mimeType: fileOrBase64.type || 'image/jpeg' });
          r.onerror = reject;
          r.readAsDataURL(fileOrBase64);
        }
        return;
      }

      // Fill white background for transparent PNGs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as clean compressed JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve({
        base64: compressedBase64,
        mimeType: 'image/jpeg',
      });
    };

    img.onload = handleLoadedImage;
    img.onerror = () => {
      // If image loading fails, fallback
      if (typeof fileOrBase64 === 'string') {
        resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
      } else {
        const r = new FileReader();
        r.onload = (e) => resolve({ base64: e.target?.result as string, mimeType: fileOrBase64.type || 'image/jpeg' });
        r.onerror = reject;
        r.readAsDataURL(fileOrBase64);
      }
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
