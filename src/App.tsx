import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import { SettingsProvider } from './context/SettingsContext';
import { QuickActionsProvider } from './context/QuickActionsContext';
import { PlaylistSidebarProvider } from './context/PlaylistSidebarContext';
import { Toaster as SonnerToaster } from 'sonner';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import ExpandedSongPlayer from './components/ExpandedSongPlayer';

import Signin from './pages/Signin';
import Register from './pages/Register';
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import LikedSongsView from './views/LikedSongsView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import HelpView from './views/HelpView';
import AdminDashboard from './views/AdminDashboard';
import APITest from './components/APITest';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Audio element component that connects to MusicContext
const AudioElement: React.FC = () => {
  const { audioRef } = useMusic();
  
  React.useEffect(() => {
    if (audioRef.current) {
      console.debug('[AudioElement] Audio element initialized:', audioRef.current);
    }
  }, [audioRef]);
  
  return <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" />;
};

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);

  // Comprehensive error suppression for Firebase and CORS issues
  React.useEffect(() => {
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Override console methods globally
    console.error = (...args) => {
      const message = String(args[0] || '');
      const fullMessage = args.join(' ');
      
      // Suppress Firebase and CORS related errors
      if (message.includes('Cross-Origin-Opener-Policy') ||
          message.includes('window.closed') ||
          message.includes('window.close') ||
          message.includes('firebase/init.json') ||
          message.includes('404 (Not Found)') ||
          fullMessage.includes('Cross-Origin-Opener-Policy') ||
          fullMessage.includes('window.closed') ||
          fullMessage.includes('window.close')) {
        return; // Suppress these errors completely
      }
      
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = String(args[0] || '');
      const fullMessage = args.join(' ');
      
      // Suppress CORS and Firebase warnings
      if (message.includes('Cross-Origin-Opener-Policy') ||
          message.includes('window.closed') ||
          message.includes('window.close') ||
          message.includes('Self-XSS') ||
          fullMessage.includes('Cross-Origin-Opener-Policy') ||
          fullMessage.includes('window.closed') ||
          fullMessage.includes('window.close') ||
          fullMessage.includes('Self-XSS')) {
        return; // Suppress these warnings
      }
      
      originalConsoleWarn.apply(console, args);
    };

    // Also override console.log to catch any logs that might slip through
    console.log = (...args) => {
      const message = String(args[0] || '');
      const fullMessage = args.join(' ');
      
      if (message.includes('Cross-Origin-Opener-Policy') ||
          fullMessage.includes('Cross-Origin-Opener-Policy')) {
        return; // Suppress CORS logs
      }
      
      originalConsoleLog.apply(console, args);
    };

    // Intercept window.addEventListener to suppress error events
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (type === 'error' || type === 'unhandledrejection') {
        const wrappedListener = function(this: Window, event: Event) {
          // Check if it's a CORS-related error
          if ((event as ErrorEvent).message && (event as ErrorEvent).message.includes('Cross-Origin-Opener-Policy')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
          if (typeof listener === 'function') {
            return listener.call(this, event);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Suppress network errors for Firebase init.json
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        // Suppress 404 errors for Firebase init.json
        if (args[0]?.toString().includes('firebase/init.json') && response.status === 404) {
          // Return a mock successful response to prevent error logging
          return new Response('{}', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return response;
      } catch (error) {
        // Suppress Firebase-related fetch errors
        if (args[0]?.toString().includes('firebase/init.json')) {
          return new Response('{}', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }
    };

    // Global error handler to catch any remaining errors
    const globalErrorHandler = (event: ErrorEvent) => {
      if (event.message && event.message.includes('Cross-Origin-Opener-Policy')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const globalUnhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason && String(event.reason).includes('Cross-Origin-Opener-Policy')) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', globalErrorHandler, true);
    window.addEventListener('unhandledrejection', globalUnhandledRejectionHandler, true);

    // Cleanup on unmount
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
      window.fetch = originalFetch;
      window.addEventListener = originalAddEventListener;
      window.removeEventListener('error', globalErrorHandler, true);
      window.removeEventListener('unhandledrejection', globalUnhandledRejectionHandler, true);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <MusicProvider>
          <SettingsProvider>
            <QuickActionsProvider>
              <PlaylistSidebarProvider>
                <ErrorBoundary>
                <div className="min-h-screen bg-background">
                  {/* Hidden audio element for playback */}
                  <AudioElement />
                  
                  <div className="flex h-screen">
                    {/* Sidebar */}
                    <Sidebar 
                      isCollapsed={isSidebarCollapsed} 
                      onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                    />
                  
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                      <main className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/signin" element={
                            <RedirectAuthenticated>
                              <Signin />
                            </RedirectAuthenticated>
                          } />
                          <Route path="/register" element={
                            <RedirectAuthenticated>
                              <Register />
                            </RedirectAuthenticated>
                          } />
                          <Route path="/test" element={
                            <ProtectedRoute>
                              <APITest />
                            </ProtectedRoute>
                          } />
                          <Route path="/" element={
                            <ProtectedRoute>
                              <HomeView />
                            </ProtectedRoute>
                          } />
                          <Route path="/search" element={
                            <ProtectedRoute>
                              <SearchView />
                            </ProtectedRoute>
                          } />
                          <Route path="/search/:query" element={
                            <ProtectedRoute>
                              <SearchView />
                            </ProtectedRoute>
                          } />
                          <Route path="/library" element={
                            <ProtectedRoute>
                              <LibraryView />
                            </ProtectedRoute>
                          } />
                          <Route path="/liked-songs" element={
                            <ProtectedRoute>
                              <LikedSongsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/profile" element={
                            <ProtectedRoute>
                              <ProfileView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/account" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/privacy" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/playback" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/downloads" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/notifications" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/appearance" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/accessibility" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/about" element={
                            <ProtectedRoute>
                              <SettingsView />
                            </ProtectedRoute>
                          } />
                          <Route path="/help" element={
                            <ProtectedRoute>
                              <HelpView />
                            </ProtectedRoute>
                          } />
                          <Route path="/admin" element={
                            <ProtectedRoute>
                              <AdminDashboard />
                            </ProtectedRoute>
                          } />
                        </Routes>
                      </main>

                      {/* Music Player - Fixed at bottom */}
                      <MusicPlayer 
                        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        onOpenExpandedPlayer={() => setIsExpandedPlayerOpen(true)}
                      />
                    </div>

                    {/* Expanded Song Player Sidebar */}
                    <ExpandedSongPlayer 
                      isOpen={isExpandedPlayerOpen}
                      onClose={() => setIsExpandedPlayerOpen(false)}
                    />
                  </div>
                  <SonnerToaster />
                </div>
                </ErrorBoundary>
              </PlaylistSidebarProvider>
            </QuickActionsProvider>
          </SettingsProvider>
        </MusicProvider>
      </AuthProvider>
    </Router>
  );
}

// Component to protect routes that require authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

// Component to redirect authenticated users away from auth pages
const RedirectAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default App;