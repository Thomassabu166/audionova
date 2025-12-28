import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debugProfileImage } from '../utils/profileImageDebug';

export const useProfilePicture = () => {
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfilePicture = async () => {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setProfilePicture(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🖼️ Loading profile picture for user:', {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL,
          displayName: user.displayName
        });
        
        // Get the debug info which includes localStorage and Firebase data
        const debugInfo = debugProfileImage.getDebugInfo(user.uid, user.photoURL);
        console.log('📊 Profile picture debug info:', debugInfo);
        
        if (debugInfo.finalPicture) {
          // For Google profile pictures, trust them immediately
          if (debugInfo.finalPicture.includes('googleusercontent.com') || 
              debugInfo.finalPicture.includes('googleapis.com')) {
            console.log('🚀 Google profile picture detected, loading immediately:', debugInfo.finalPicture);
            setProfilePicture(debugInfo.finalPicture);
            setIsLoading(false);
            return;
          }
          
          console.log('🔍 Validating profile picture URL:', debugInfo.finalPicture);
          
          // Validate other image URLs before using them
          const isValid = await debugProfileImage.validateImageUrl(debugInfo.finalPicture);
          
          if (isValid) {
            setProfilePicture(debugInfo.finalPicture);
            console.log('✅ Profile picture loaded successfully:', debugInfo.finalPicture);
          } else {
            console.warn('⚠️ Profile picture URL is invalid, clearing...', debugInfo.finalPicture);
            // Only clear localStorage if the invalid image came from there
            if (debugInfo.savedPicture && debugInfo.savedPicture === debugInfo.finalPicture) {
              console.log('🗑️ Clearing invalid image from localStorage');
              debugProfileImage.clearProfileImage(user.uid);
            }
            setProfilePicture(null);
            setError('Profile picture could not be loaded');
          }
        } else {
          console.log('ℹ️ No profile picture available for user');
          setProfilePicture(null);
        }
      } catch (err) {
        console.error('❌ Error loading profile picture:', err);
        setError('Failed to load profile picture');
        setProfilePicture(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfilePicture();
  }, [user]);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 Profile picture updated via event:', event.detail.photoURL);
      setProfilePicture(event.detail.photoURL);
      setError(null);
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
      setError(null);
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
        detail: { photoURL: newPhotoURL } 
      }));
    }
  };

  const clearProfilePicture = () => {
    if (user) {
      debugProfileImage.clearProfileImage(user.uid);
      setProfilePicture(null);
      setError(null);
    }
  };

  return {
    profilePicture,
    isLoading,
    error,
    updateProfilePicture,
    clearProfilePicture,
    hasProfilePicture: !!profilePicture
  };
};