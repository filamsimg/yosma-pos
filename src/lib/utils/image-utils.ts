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
        const overlayHeight = 70;
        const gradient = ctx.createLinearGradient(0, height - overlayHeight, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

        // 4. Draw Text with better styling
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px Inter, system-ui, sans-serif';
        
        const timestamp = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        // Outlet & Sales Name (Main Title)
        ctx.fillText(`${data.outletName.toUpperCase()}`, 20, height - 42);
        
        // Secondary Info
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`SALES: ${data.salesName.toUpperCase()} | ${timestamp}`, 20, height - 25);
        
        // GPS Coordinates
        ctx.font = '500 10px Courier New, monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`GPS: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`, 20, height - 12);
        
        // "VERIFIED VISIT" badge
        ctx.fillStyle = '#3b82f6'; // blue-500
        ctx.shadowBlur = 0;
        ctx.fillRect(width - 100, height - 35, 80, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Kunjungan Terverifikasi', width - 60, height - 22);
        ctx.textAlign = 'left';

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
