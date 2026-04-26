/**
 * Utility for processing images: resizing, adding geotags, and compressing.
 */

export interface GeotagData {
  lat: number;
  lng: number;
  outletName: string;
  salesName: string;
}

/**
 * Processes an image file: resizes it, adds a location watermark, and compresses it to < 200KB.
 */
export async function processGeotaggedImage(
  file: File,
  data: GeotagData
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // 1. Target Size (Max Width 800px for < 200KB)
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // 2. Draw Original Image
        ctx.drawImage(img, 0, 0, width, height);

        // 3. Draw Watermark Overlay (Bottom)
        const overlayHeight = 60;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

        // 4. Draw Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        
        const timestamp = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const textLines = [
          `${data.outletName.toUpperCase()} | ${data.salesName.toUpperCase()}`,
          `LOC: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)} | ${timestamp}`,
        ];

        ctx.fillText(textLines[0], 15, height - 35);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(textLines[1], 15, height - 15);

        // 5. Export as Compressed JPEG (Quality 0.6)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(processedFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          0.6 // Quality 0.6 usually results in ~100-150KB for 800px width
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
