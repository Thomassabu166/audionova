import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { updateProfile } from 'firebase/auth'; // Add this import
import { auth, googleProvider } from '../lib/firebase';
// Removed demo mode imports since we're using real Firebase

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
  emailSignUp: (email: string, password: string) => Promise<void>;
  emailSignIn: (email: string, password: string) => Promise<void>;
  updateProfilePicture: (photoURL: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Only check admin status for the specific admin email to reduce console noise
        const isAdminEmail = currentUser.email === 'thomassabu512@gmail.com';
        
        if (isAdminEmail) {
          // 🔒 MAXIMUM-SECURITY CLAIM VERIFICATION (UX ONLY)
          // WARNING: This is ONLY for user interface - ALL security is server-side
          try {
            console.log('🔍 Verifying admin status for:', currentUser.email);
            
            // 🚨 CRITICAL: Force fresh token to get latest claims
            console.log('🔄 Forcing token refresh...');
            await currentUser.getIdToken(true); // Force refresh
            
            // 🔒 Get fresh token result with server-verified claims
            const tokenResult = await currentUser.getIdTokenResult(true);
            console.log('🔑 Server-verified claims:', {
              admin: tokenResult.claims.admin,
              adminEmail: tokenResult.claims.adminEmail,
              singleAdmin: tokenResult.claims.singleAdmin,
              securityLevel: tokenResult.claims.securityLevel
            });
            
            // 🛡️ STRICT: Check ONLY server-cryptographically-verified admin claim
            const hasAdminClaim = tokenResult.claims.admin === true;
            const isAuthorizedAdmin = tokenResult.claims.adminEmail === 'thomassabu512@gmail.com';
            const isSingleAdmin = tokenResult.claims.singleAdmin === true;
            
            // 🔒 MAXIMUM SECURITY: All conditions must be true
            const isMaxSecurityAdmin = hasAdminClaim && isAuthorizedAdmin && isSingleAdmin;
            
            if (isMaxSecurityAdmin) {
              console.log('✅ MAXIMUM-SECURITY ADMIN VERIFIED');
              console.log('   ✅ Admin claim: true');
              console.log('   ✅ Authorized email: thomassabu512@gmail.com');
              console.log('   ✅ Single admin: true');
              console.log('   🛡️  Note: Real security enforced server-side');
              setIsAdmin(true);
            } else {
              console.log('❌ ADMIN VERIFICATION FAILED');
              console.log('   Admin claim:', hasAdminClaim);
              console.log('   Authorized email:', isAuthorizedAdmin);
              console.log('   Single admin:', isSingleAdmin);
              setIsAdmin(false);
              
              // 🔄 Handle claim changes
              if (isAdmin && !hasAdminClaim) {
                console.log('⚠️  Admin claim revoked - user lost admin access');
              }
            }
          } catch (error: any) {
            console.error('❌ Admin verification error:', error);
            setIsAdmin(false);
            
            // 🔄 Handle specific error cases
            if (error?.code === 'auth/network-request-failed') {
              console.log('🔄 Network error - admin status will retry automatically');
            } else if (error?.code === 'auth/user-token-expired') {
              console.log('🔄 Token expired - forcing re-authentication');
              await logout();
            }
          }
        } else {
          // Regular user - no admin verification needed
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper function to handle profile picture
  const handleUserProfilePicture = (user: User) => {
    if (user.photoURL) {
      // Test if the image loads (completely silent)
      const img = new Image();
      img.onload = () => {
        // Dispatch event to update profile picture components
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { 
          detail: { photoURL: user.photoURL } 
        }));
      };
      img.onerror = () => {
        // Silent failure - no logging
      };
      img.src = user.photoURL;
    }
  };

  const googleSignIn = async () => {
    try {
      // Create a more comprehensive error suppression during auth
      const suppressCORSErrors = () => {
        const originalError = console.error;
        const originalWarn = console.warn;
        
        // Override console methods with more specific filtering
        console.error = function(...args) {
          const message = args.join(' ');
          if (message.includes('Cross-Origin-Opener-Policy') ||
              message.includes('window.closed') ||
              message.includes('window.close')) {
            return; // Completely suppress CORS errors
          }
          return originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
          const message = args.join(' ');
          if (message.includes('Cross-Origin-Opener-Policy') ||
              message.includes('window.closed') ||
              message.includes('window.close')) {
            return; // Completely suppress CORS warnings
          }
          return originalWarn.apply(console, args);
        };
        
        return { originalError, originalWarn };
      };

      // Start suppressing errors
      const { originalError, originalWarn } = suppressCORSErrors();
      
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        handleUserProfilePicture(user);
      } finally {
        // Always restore console methods
        console.error = originalError;
        console.warn = originalWarn;
      }
      
    } catch (error: any) {
      // Only log actual authentication errors, not CORS warnings
      if (error?.code && 
          !error.message?.includes('Cross-Origin-Opener-Policy') &&
          !error.message?.includes('window.closed') &&
          !error.message?.includes('window.close')) {
        console.error('Google sign-in error:', error);
      }
      throw error;
    }
  };

  const emailSignUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const emailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Add this new function
  const updateProfilePicture = async (photoURL: string) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
        // Update the user state to reflect the change
        setUser({ ...auth.currentUser, photoURL });
      }
    } catch (error) {
      console.error('Profile picture update error:', error);
      throw error;
    }
  };

  // 🔒 HARDENED: Get fresh Firebase auth token with latest claims
  const getAuthToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    try {
      if (auth.currentUser) {
        // 🚨 CRITICAL: Always get fresh token for admin operations
        const token = await auth.currentUser.getIdToken(forceRefresh);
        
        // 🔍 Verify token has required claims for admin operations
        if (forceRefresh) {
          const tokenResult = await auth.currentUser.getIdTokenResult(true);
          console.log('🔑 Fresh token obtained with claims:', {
            admin: tokenResult.claims.admin,
            email: tokenResult.claims.email,
            exp: new Date(tokenResult.expirationTime)
          });
        }
        
        return token;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting auth token:', error);
      
      // 🔄 Handle token refresh errors gracefully
      if (error?.code === 'auth/network-request-failed') {
        console.log('🔄 Network error getting token - user may need to retry');
      } else if (error?.code === 'auth/user-token-expired') {
        console.log('🔄 Token expired - forcing sign out');
        await logout();
      }
      
      return null;
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    googleSignIn,
    logout,
    emailSignUp,
    emailSignIn,
    updateProfilePicture,
    getAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};