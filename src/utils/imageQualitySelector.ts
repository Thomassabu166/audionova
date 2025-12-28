import { getHighestQualityImage } from '../services/jiosaavnApi';

export interface ImageOption {
  quality?: string;
  link: string;
}

/**
 * Enhanced image quality selector that prioritizes high-resolution images
 */
export const selectHighestQualityImage = (images: ImageOption[] | string | null | undefined): string => {
  // Handle null/undefined
  if (!images) {
    return getPlaceholderImage();
  }

  // Handle string (single URL)
  if (typeof images === 'string') {
    return images.trim() || getPlaceholderImage();
  }

  // Handle non-array
  if (!Array.isArray(images)) {
    return getPlaceholderImage();
  }

  // Handle empty array
  if (images.length === 0) {
    return getPlaceholderImage();
  }

  // Filter and validate images - MUCH MORE PERMISSIVE
  const validImages = images.filter(img => {
    if (!img || !img.link || typeof img.link !== 'string') {
      return false;
    }

    const url = img.link.trim();
    
    // Reject empty URLs
    if (url.length === 0) {
      return false;
    }

    // Only reject obviously bad patterns - be much more permissive
    const badPatterns = [
      'placeholder.jpg',
      'default.jpg',
      'noimage.jpg',
      'missing.jpg'
    ];
    
    // Only reject if it exactly matches bad patterns
    const urlLower = url.toLowerCase();
    if (badPatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }
    
    return true; // Accept everything else
  });

  if (validImages.length === 0) {
    return getPlaceholderImage();
  }

  // Sort images by quality (highest first) - but accept any valid image
  const sortedImages = [...validImages].sort((a, b) => {
    const scoreA = getImageQualityScore(a);
    const scoreB = getImageQualityScore(b);
    return scoreB - scoreA;
  });

  // Return the highest quality image
  const selectedImage = sortedImages[0];
  return selectedImage?.link || getPlaceholderImage();
};

/**
 * Calculate quality score for an image
 */
const getImageQualityScore = (image: ImageOption): number => {
  let score = 0;
  const quality = image.quality?.toLowerCase() || '';
  const url = image.link.toLowerCase();

  // Score based on quality string
  if (quality.includes('500x500') || quality === '500x500') {
    score += 1000; // Highest priority for 500x500
  } else if (quality.includes('350x350') || quality === '350x350') {
    score += 800;
  } else if (quality.includes('300x300') || quality === '300x300') {
    score += 700;
  } else if (quality.includes('250x250') || quality === '250x250') {
    score += 600;
  } else if (quality.includes('200x200') || quality === '200x200') {
    score += 500;
  } else if (quality.includes('150x150') || quality === '150x150') {
    score += 400;
  } else if (quality.includes('100x100') || quality === '100x100') {
    score += 200;
  } else if (quality.includes('50x50') || quality === '50x50') {
    score += 100;
  }

  // Extract dimensions from quality string
  const dimensionMatch = quality.match(/(\d+)x(\d+)/);
  if (dimensionMatch) {
    const width = parseInt(dimensionMatch[1], 10);
    const height = parseInt(dimensionMatch[2], 10);
    const pixels = width * height;
    
    // Bonus for square images (album art)
    const ratio = width / height;
    const isSquare = ratio >= 0.9 && ratio <= 1.1;
    
    if (isSquare) {
      score += pixels * 2; // Double score for square images
    } else {
      score += pixels;
    }
  }

  // Score based on URL patterns (fallback when quality string is missing)
  if (url.includes('500x500')) {
    score += 1000;
  } else if (url.includes('350x350')) {
    score += 800;
  } else if (url.includes('300x300')) {
    score += 700;
  } else if (url.includes('250x250')) {
    score += 600;
  } else if (url.includes('200x200')) {
    score += 500;
  }

  // Prefer c.saavncdn.com over other domains (usually higher quality)
  if (url.includes('c.saavncdn.com')) {
    score += 50;
  }

  // Prefer HTTPS
  if (url.startsWith('https://')) {
    score += 10;
  }

  return score;
};

/**
 * Get placeholder image for when no valid image is found
 */
const getPlaceholderImage = (): string => {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23a855f7" width="500" height="500"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
};

/**
 * Enhanced image selector specifically for music player components
 * Uses the same logic as SongCard to ensure consistent high-quality images
 */
export const selectMusicPlayerImage = (song: any): string => {
  try {
    // Use the exact same function as SongCard for consistency
    if (song?.image && Array.isArray(song.image)) {
      const highQualityUrl = getHighestQualityImage(song.image);
      if (highQualityUrl) {
        return highQualityUrl;
      }
    }
  } catch (error) {
    console.warn('[ImageSelector] Error with getHighestQualityImage:', error);
  }
  
  // Fallback to string image
  if (typeof song?.image === 'string' && song.image.trim()) {
    return song.image;
  }

  // Fallback: Just use the first available image with safe access
  if (song?.image && Array.isArray(song.image) && song.image.length > 0) {
    const firstImage = song.image[0];
    if (firstImage && typeof firstImage === 'object' && firstImage.link && typeof firstImage.link === 'string') {
      return firstImage.link;
    } else if (typeof firstImage === 'string') {
      return firstImage;
    }
  }

  // FALLBACK: Try album image
  try {
    if (song?.album?.image) {
      const albumImage = getHighestQualityImage(song.album.image);
      if (albumImage) {
        return albumImage;
      }
    }
  } catch (error) {
    console.warn('[ImageSelector] Error with album image:', error);
  }

  // Return placeholder if nothing found
  return getPlaceholderImage();
};

/**
 * Preload high-quality image for better user experience
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl.includes('data:image/svg+xml')) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};