/**
 * Advanced Color Extraction Utility
 * Extracts dominant colors from images and generates theme palettes
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  vibrant: string;
  muted: string;
}

export interface ExtractedColors {
  dominant: string;
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
  darkMuted: string;
  lightMuted: string;
}

/**
 * Extract colors from an image using canvas
 */
export const extractColorsFromImage = async (imageUrl: string): Promise<ExtractedColors> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Resize image for faster processing
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        
        const colors = analyzeImageData(imageData);
        resolve(colors);
      } catch (error) {
        console.error('Error extracting colors:', error);
        resolve(getDefaultColors());
      }
    };
    
    img.onerror = () => {
      console.warn('Failed to load image for color extraction:', imageUrl);
      resolve(getDefaultColors());
    };
    
    img.src = imageUrl;
  });
};

/**
 * Analyze image data to extract dominant colors
 */
const analyzeImageData = (imageData: ImageData): ExtractedColors => {
  const data = imageData.data;
  const colorCounts: { [key: string]: number } = {};
  const colors: Array<[number, number, number]> = [];
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Skip very dark or very light pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 235) continue;
    
    colors.push([r, g, b]);
    
    // Group similar colors
    const colorKey = `${Math.floor(r / 10)}-${Math.floor(g / 10)}-${Math.floor(b / 10)}`;
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
  }
  
  if (colors.length === 0) {
    return getDefaultColors();
  }
  
  // Find dominant colors
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  // Convert back to RGB and analyze
  const dominantColors = sortedColors.map(([key]) => {
    const [r, g, b] = key.split('-').map(n => parseInt(n) * 10 + 5);
    return [r, g, b] as [number, number, number];
  });
  
  return {
    dominant: rgbToHex(...dominantColors[0] || [200, 100, 150]),
    vibrant: findVibrantColor(colors),
    muted: findMutedColor(colors),
    darkVibrant: findDarkVibrantColor(colors),
    lightVibrant: findLightVibrantColor(colors),
    darkMuted: findDarkMutedColor(colors),
    lightMuted: findLightMutedColor(colors),
  };
};

/**
 * Find vibrant color (high saturation)
 */
const findVibrantColor = (colors: Array<[number, number, number]>): string => {
  let maxSaturation = 0;
  let vibrantColor: [number, number, number] = [255, 100, 100];
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (saturation > maxSaturation && brightness > 0.3 && brightness < 0.8) {
      maxSaturation = saturation;
      vibrantColor = [r, g, b];
    }
  });
  
  return rgbToHex(...vibrantColor);
};

/**
 * Find muted color (low saturation)
 */
const findMutedColor = (colors: Array<[number, number, number]>): string => {
  let minSaturation = 1;
  let mutedColor: [number, number, number] = [150, 150, 150];
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (saturation < minSaturation && brightness > 0.2 && brightness < 0.7) {
      minSaturation = saturation;
      mutedColor = [r, g, b];
    }
  });
  
  return rgbToHex(...mutedColor);
};

/**
 * Find dark vibrant color
 */
const findDarkVibrantColor = (colors: Array<[number, number, number]>): string => {
  let bestColor: [number, number, number] = [100, 50, 100];
  let bestScore = 0;
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (brightness < 0.4 && saturation > 0.3) {
      const score = saturation * (0.4 - brightness);
      if (score > bestScore) {
        bestScore = score;
        bestColor = [r, g, b];
      }
    }
  });
  
  return rgbToHex(...bestColor);
};

/**
 * Find light vibrant color
 */
const findLightVibrantColor = (colors: Array<[number, number, number]>): string => {
  let bestColor: [number, number, number] = [255, 200, 200];
  let bestScore = 0;
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (brightness > 0.6 && saturation > 0.3) {
      const score = saturation * (brightness - 0.6);
      if (score > bestScore) {
        bestScore = score;
        bestColor = [r, g, b];
      }
    }
  });
  
  return rgbToHex(...bestColor);
};

/**
 * Find dark muted color
 */
const findDarkMutedColor = (colors: Array<[number, number, number]>): string => {
  let bestColor: [number, number, number] = [80, 80, 80];
  let bestScore = 0;
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (brightness < 0.4 && saturation < 0.4) {
      const score = (0.4 - saturation) * (0.4 - brightness);
      if (score > bestScore) {
        bestScore = score;
        bestColor = [r, g, b];
      }
    }
  });
  
  return rgbToHex(...bestColor);
};

/**
 * Find light muted color
 */
const findLightMutedColor = (colors: Array<[number, number, number]>): string => {
  let bestColor: [number, number, number] = [200, 200, 200];
  let bestScore = 0;
  
  colors.forEach(([r, g, b]) => {
    const saturation = getSaturation(r, g, b);
    const brightness = getBrightness(r, g, b);
    
    if (brightness > 0.6 && saturation < 0.4) {
      const score = (0.4 - saturation) * (brightness - 0.6);
      if (score > bestScore) {
        bestScore = score;
        bestColor = [r, g, b];
      }
    }
  });
  
  return rgbToHex(...bestColor);
};

/**
 * Calculate color saturation
 */
const getSaturation = (r: number, g: number, b: number): number => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  if (max === 0) return 0;
  return diff / max;
};

/**
 * Calculate color brightness
 */
const getBrightness = (r: number, g: number, b: number): number => {
  return (r + g + b) / (3 * 255);
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generate a complete color palette from extracted colors
 */
export const generateColorPalette = (extractedColors: ExtractedColors): ColorPalette => {
  return {
    primary: extractedColors.vibrant,
    secondary: extractedColors.lightVibrant,
    accent: extractedColors.darkVibrant,
    background: extractedColors.darkMuted,
    text: '#ffffff',
    vibrant: extractedColors.vibrant,
    muted: extractedColors.muted,
  };
};

/**
 * Get default colors when extraction fails
 */
const getDefaultColors = (): ExtractedColors => {
  return {
    dominant: '#ef4444',
    vibrant: '#f97316',
    muted: '#64748b',
    darkVibrant: '#dc2626',
    lightVibrant: '#fb923c',
    darkMuted: '#475569',
    lightMuted: '#94a3b8',
  };
};

/**
 * Convert hex to RGB values
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [255, 255, 255];
};

/**
 * Create CSS gradient from color palette
 */
export const createGradientFromPalette = (palette: ColorPalette): string => {
  return `linear-gradient(135deg, ${palette.primary}20, ${palette.secondary}15, ${palette.accent}10)`;
};

/**
 * Create animated gradient keyframes
 */
export const createAnimatedGradient = (palette: ColorPalette): string[] => {
  return [
    `linear-gradient(45deg, ${palette.primary}20, ${palette.secondary}15)`,
    `linear-gradient(135deg, ${palette.secondary}20, ${palette.accent}15)`,
    `linear-gradient(225deg, ${palette.accent}20, ${palette.vibrant}15)`,
    `linear-gradient(315deg, ${palette.vibrant}20, ${palette.primary}15)`,
  ];
};

/**
 * Cache for color extraction results
 */
const colorCache = new Map<string, ExtractedColors>();

/**
 * Extract colors with caching
 */
export const extractColorsWithCache = async (imageUrl: string): Promise<ExtractedColors> => {
  if (!imageUrl) {
    return getDefaultColors();
  }
  
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }
  
  const colors = await extractColorsFromImage(imageUrl);
  colorCache.set(imageUrl, colors);
  
  // Limit cache size
  if (colorCache.size > 50) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey) {
      colorCache.delete(firstKey);
    }
  }
  
  return colors;
};