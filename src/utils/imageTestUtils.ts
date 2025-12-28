/**
 * Image Test Utilities
 * Helper functions to test and debug image loading issues
 */

export const testImageUrl = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url || url.trim() === '') {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    
    // Set timeout to avoid hanging
    setTimeout(() => {
      resolve(false);
    }, 5000);
    
    img.src = url;
  });
};

export const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  // Always allow Google profile pictures - they are trusted
  if (url.includes('googleusercontent.com') || 
      url.includes('googleapis.com') || 
      url.includes('google.com/') ||
      url.includes('lh3.googleusercontent.com') ||
      url.includes('lh4.googleusercontent.com') ||
      url.includes('lh5.googleusercontent.com') ||
      url.includes('lh6.googleusercontent.com')) {
    return true;
  }
  
  const urlLower = url.toLowerCase();
  const suspiciousPatterns = [
    'placeholder',
    'default',
    'generic',
    'unknown',
    'noimage',
    'no_image',
    'missing',
    'temp',
    'thumbnail',
    'thumb',
    'small',
    '150x150',
    '100x100',
    '50x50',
    'banner',
    'cover_all',
    'playlist'
  ];
  
  // Check for suspicious patterns (but not for Google URLs)
  if (suspiciousPatterns.some(pattern => urlLower.includes(pattern))) {
    return false;
  }
  
  // Check URL length (too short likely invalid) - but be more lenient
  if (url.length < 20) {
    return false;
  }
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    // For data URLs (base64), check if they're valid
    if (url.startsWith('data:image/')) {
      return url.length > 50;
    }
    return false;
  }
};

export const debugProfilePicture = (user: any, enabled: boolean = false) => {
  // Debug function disabled by default to reduce console noise
  // Pass enabled=true to activate debugging
  if (!enabled) {
    return;
  }
  
  console.group('🖼️ Profile Picture Debug');
  console.log('User:', user);
  console.log('Has photoURL:', !!user?.photoURL);
  console.log('PhotoURL:', user?.photoURL);
  
  if (user?.uid) {
    const savedPicture = localStorage.getItem(`profilePicture_${user.uid}`);
    console.log('LocalStorage key:', `profilePicture_${user.uid}`);
    console.log('Saved picture:', savedPicture ? 'Present' : 'None');
    
    // Fix: Check if savedPicture is not null before using string methods
    if (savedPicture) {
      console.log('Saved picture type:', savedPicture.startsWith('data:') ? 'Base64' : 'URL');
      console.log('Saved picture length:', savedPicture.length);
    }
  }
  
  console.groupEnd();
};

// Make available globally for debugging
(window as any).imageTestUtils = {
  testImageUrl,
  isValidImageUrl,
  debugProfilePicture
};