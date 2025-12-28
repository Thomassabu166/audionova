import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isValidImageUrl, debugProfilePicture } from '../utils/imageTestUtils';

/**
 * Simplified hook specifically for Google profile pictures
 * This ensures Google profile pictures are always displayed immediately
 */
export const useGoogleProfilePicture = () => {
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfilePicture = () => {
      setIsLoading(true);

      if (!user) {
        setProfilePicture(null);
        setIsLoading(false);
        return;
      }

      // Debug profile picture data (disabled to reduce console noise)
      // if (import.meta.env.DEV) {
      //   debugProfilePicture(user);
      // }

      // Priority order:
      // 1. Custom uploaded image from localStorage
      // 2. Google profile picture from Firebase (with special handling)
      // 3. null (will show initials)

      const savedPicture = localStorage.getItem(`profilePicture_${user.uid}`);
      
      if (savedPicture && savedPicture.trim() !== '' && isValidImageUrl(savedPicture)) {
        // Use custom uploaded image
        setProfilePicture(savedPicture);
      } else if (user.photoURL && user.photoURL.trim() !== '') {
        // For Google profile pictures, be more lenient with validation
        const isGoogleImage = user.photoURL.includes('googleusercontent.com') || 
                             user.photoURL.includes('googleapis.com') ||
                             user.photoURL.includes('google.com/') ||
                             user.photoURL.includes('lh3.googleusercontent.com') ||
                             user.photoURL.includes('lh4.googleusercontent.com') ||
                             user.photoURL.includes('lh5.googleusercontent.com') ||
                             user.photoURL.includes('lh6.googleusercontent.com');
        
        if (isGoogleImage || isValidImageUrl(user.photoURL)) {
          setProfilePicture(user.photoURL);
        } else {
          // Invalid or broken profile picture URL
          setProfilePicture(null);
        }
      } else {
        // No profile picture available - will show initials
        setProfilePicture(null);
      }

      setIsLoading(false);
    };

    loadProfilePicture();
  }, [user]);

  // Listen for profile picture updates from settings
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setProfilePicture(event.detail.photoURL);
    };

    window.addEventListener('profilePictureUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const updateProfilePicture = (newPhotoURL: string | null) => {
    if (user && newPhotoURL) {
      // Save to localStorage
      localStorage.setItem(`profilePicture_${user.uid}`, newPhotoURL);
      
      // Update state
      setProfilePicture(newPhotoURL);
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
        detail: { photoURL: newPhotoURL } 
      }));
    }
  };

  const clearProfilePicture = () => {
    if (user) {
      // Clear localStorage
      localStorage.removeItem(`profilePicture_${user.uid}`);
      
      // Fall back to Google profile picture if available
      setProfilePicture(user.photoURL || null);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
        detail: { photoURL: user.photoURL || null } 
      }));
    }
  };

  return {
    profilePicture,
    isLoading,
    updateProfilePicture,
    clearProfilePicture,
    hasProfilePicture: !!profilePicture,
    isGooglePicture: !!(user?.photoURL && profilePicture === user.photoURL)
  };
};