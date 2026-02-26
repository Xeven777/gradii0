import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Extracts prominent colors from an image.
 */
export async function extractColorsFromImage(
  imageSrc: string,
  colorCount: number = 5
): Promise<string[]> {
  if (typeof window === "undefined") return [];

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw image to a small canvas to speed up processing
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size).data;
      const colors: { [key: string]: number } = {};

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        // Skip transparent pixels and very dark/light ones if needed
        if (a < 128) continue;

        // Reduce color depth to group similar colors
        const rd = Math.round(r / 10) * 10;
        const gd = Math.round(g / 10) * 10;
        const bd = Math.round(b / 10) * 10;
        const hex = rgbToHex(rd, gd, bd);
        colors[hex] = (colors[hex] || 0) + 1;
      }

      // Sort colors by frequency
      const sortedColors = Object.keys(colors).sort(
        (a, b) => colors[b] - colors[a]
      );

      // Filter out very similar colors
      const prominentColors: string[] = [];
      for (const color of sortedColors) {
        if (prominentColors.length >= colorCount) break;
        if (!prominentColors.some((p) => isSimilar(p, color))) {
          prominentColors.push(color);
        }
      }

      resolve(prominentColors);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function isSimilar(hex1: string, hex2: string): boolean {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return false;

  const diff =
    Math.abs(rgb1.r - rgb2.r) +
    Math.abs(rgb1.g - rgb2.g) +
    Math.abs(rgb1.b - rgb2.b);
  return diff < 100; // Threshold for similarity
}
