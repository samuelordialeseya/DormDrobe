/**
 * Pure non-AI background removal utility for clothing photos.
 * Uses corner & edge color sampling + breadth-first flood-fill + Euclidean color distance matting.
 * Runs 100% offline in client-side JavaScript/Canvas (<100ms), zero AI, zero API fees.
 */

export interface RemoveBackgroundOptions {
  /** Sensitivity tolerance: 5 to 70 (default 28) */
  tolerance?: number;
  /** Feather softness radius (default 12) */
  feather?: number;
  /** Optional custom background hex color to key out */
  customBgColor?: string | null;
}

export async function removeImageBackground(
  imageUri: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const { tolerance = 28, feather = 14, customBgColor = null } = options;

  return new Promise((resolve) => {
    // If not in a browser/canvas environment (e.g. Node or pure headless), return URI
    if (typeof document === 'undefined') {
      resolve(imageUri);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageUri);
          return;
        }

        // Limit canvas resolution for real-time responsiveness (<100ms)
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // 1. Determine background color (Sample corners and edges)
        let bgR = 255,
          bgG = 255,
          bgB = 255;

        if (customBgColor) {
          const hex = customBgColor.replace('#', '');
          bgR = parseInt(hex.substring(0, 2), 16) || 255;
          bgG = parseInt(hex.substring(2, 4), 16) || 255;
          bgB = parseInt(hex.substring(4, 6), 16) || 255;
        } else {
          // Sample perimeter pixels (8 points around the border)
          const samplePoints = [
            [2, 2],
            [w - 3, 2],
            [2, h - 3],
            [w - 3, h - 3],
            [Math.floor(w / 2), 2],
            [Math.floor(w / 2), h - 3],
            [2, Math.floor(h / 2)],
            [w - 3, Math.floor(h / 2)],
          ];

          let totalR = 0,
            totalG = 0,
            totalB = 0;
          samplePoints.forEach(([x, y]) => {
            const idx = (y * w + x) * 4;
            totalR += data[idx];
            totalG += data[idx + 1];
            totalB += data[idx + 2];
          });
          bgR = Math.round(totalR / samplePoints.length);
          bgG = Math.round(totalG / samplePoints.length);
          bgB = Math.round(totalB / samplePoints.length);
        }

        // Max Euclidean RGB distance is ~441
        const tolDist = (tolerance / 100) * 441;
        const featherDist = (feather / 100) * 441 + 10;

        // 2. BFS Flood-Fill from the 4 outer borders inwards
        // Contiguity check: this protects white buttons/logos inside the garment!
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        // Seed outer edges
        for (let x = 0; x < w; x++) {
          queue.push(x);
          visited[x] = 1;
          const bottomP = (h - 1) * w + x;
          queue.push(bottomP);
          visited[bottomP] = 1;
        }
        for (let y = 1; y < h - 1; y++) {
          const leftP = y * w;
          queue.push(leftP);
          visited[leftP] = 1;
          const rightP = y * w + (w - 1);
          queue.push(rightP);
          visited[rightP] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const p = queue[head++];
          const px = p % w;
          const py = Math.floor(p / w);
          const idx = p * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const dist = Math.sqrt(
            (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
          );

          if (dist <= tolDist) {
            // Background confirmed -> transparent
            data[idx + 3] = 0;

            // Expand to 4-way neighbors
            if (px > 0 && !visited[p - 1]) {
              visited[p - 1] = 1;
              queue.push(p - 1);
            }
            if (px < w - 1 && !visited[p + 1]) {
              visited[p + 1] = 1;
              queue.push(p + 1);
            }
            if (py > 0 && !visited[p - w]) {
              visited[p - w] = 1;
              queue.push(p - w);
            }
            if (py < h - 1 && !visited[p + w]) {
              visited[p + w] = 1;
              queue.push(p + w);
            }
          } else if (dist <= tolDist + featherDist) {
            // Anti-aliased feather border
            const alphaRatio = (dist - tolDist) / featherDist;
            data[idx + 3] = Math.round(data[idx + 3] * alphaRatio);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Background removal error:', err);
        resolve(imageUri);
      }
    };

    img.onerror = () => {
      resolve(imageUri);
    };

    img.src = imageUri;
  });
}
