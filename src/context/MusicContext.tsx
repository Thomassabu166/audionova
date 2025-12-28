import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { recordPlay } from '../services/adminApi';
import { AudioProcessor } from '../utils/audioProcessor';
import { selectOptimalAudioSource, getQualityDescription, type AudioSourceInfo } from '../utils/audioSourceOptimizer';

interface Song {
  id: string;
  name: string;
  primaryArtists: string;
  image: string[] | string | null;
  duration: number;
  url: string;
  downloadUrl?: Array<{ quality?: string; link: string }>;
  album?: string;
  year?: string;
  language?: string;
  playCount?: number;
  releaseDate?: string;
}

interface Playlist {
  id: string;
  name: string;
  tracks: Song[];
  currentIndex?: number;
  language?: string;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  activePlaylist: Playlist | null;
  repeatMode: 'none' | 'one' | 'all';
  isShuffle: boolean;
  isSongLiked: (songId: string) => boolean;
  addToLikedSongs: (song: Song) => void;
  removeFromLikedSongs: (songId: string) => void;
  playSong: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setQueue: (songs: Song[]) => void;
  setQueueIndex: (index: number) => void;
  setActivePlaylist: (playlist: Playlist | null) => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  setIsShuffle: (shuffle: boolean) => void;
  setPlaylistAndPlay: (playlist: Song[], index: number) => void;
  savePlaylist: (playlist: Playlist) => void;
  error: string | null;
  setError: (error: string | null) => void;
  likedSongs: Song[];
  savedPlaylists: Playlist[];
  volume: number;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  seekTo: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  // Audio quality and processing
  currentAudioInfo: AudioSourceInfo | null;
  audioProcessingEnabled: boolean;
  setAudioProcessingEnabled: (enabled: boolean) => void;
  audioProcessor: AudioProcessor | null;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAuthToken } = useAuth();
  // Audio state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isShuffle, setIsShuffle] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('likedSongs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('savedPlaylists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Audio processing state
  const [currentAudioInfo, setCurrentAudioInfo] = useState<AudioSourceInfo | null>(null);
  const [audioProcessingEnabled, setAudioProcessingEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('audioProcessingEnabled');
      return saved ? JSON.parse(saved) : true; // Enabled by default
    } catch {
      return true;
    }
  });
  const [audioProcessor] = useState(() => new AudioProcessor());

  // Refs for accessing current values in callbacks
  const audioRef = useRef<HTMLAudioElement>(null);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const playPauseTimeoutRef = useRef<number | null>(null);
  const activePlaylistRef = useRef(activePlaylist);

  // Update refs when state changes
  useEffect(() => {
    queueRef.current = queue;
    queueIndexRef.current = queueIndex;
    activePlaylistRef.current = activePlaylist;
  }, [queue, queueIndex, activePlaylist]);

  // Cleanup audio processor on unmount
  useEffect(() => {
    return () => {
      if (audioProcessor) {
        console.log('[AudioProcessor] Cleaning up audio processor');
        audioProcessor.dispose();
      }
    };
  }, [audioProcessor]);

  // Persist liked songs, playlists, and audio settings
  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('savedPlaylists', JSON.stringify(savedPlaylists));
  }, [savedPlaylists]);



  useEffect(() => {
    localStorage.setItem('audioProcessingEnabled', JSON.stringify(audioProcessingEnabled));
  }, [audioProcessingEnabled]);

  // Audio element setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.debug('[Player] Audio element not available yet');
      return;
    }

    console.debug('[Player] Setting up audio element event listeners');

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      const newDuration = audio.duration || 0;
      console.debug('[Player] Loaded metadata, duration:', newDuration);
      setDuration(newDuration);
      setCurrentTime(0); // Reset current time when new song loads
    };
    
    const handleEnded = () => {
      console.debug('[Player] audio ended');
      setIsPlaying(false);
      setCurrentTime(0);
      playNext();
    };

    const handlePlay = () => {
      console.debug('[Player] audio play event - audio is now playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.debug('[Player] audio pause event - audio is now paused');
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.debug('[Player] audio can play');
    };

    const handleLoadStart = () => {
      console.debug('[Player] audio load start');
      setCurrentTime(0);
    };

    const handleLoadedData = () => {
      console.debug('[Player] audio loaded data');
    };

    const handleWaiting = () => {
      console.debug('[Player] audio waiting/buffering');
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      
      // Only log significant errors, not routine ones
      if (error) {
        const errorCode = error.code;
        const errorMessage = error.message || 'Unknown audio error';
        
        // Categorize errors and reduce spam
        switch (errorCode) {
          case MediaError.MEDIA_ERR_ABORTED:
            console.debug('[Player] Audio loading was aborted (usually harmless)');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            console.warn('[Player] Network error loading audio:', errorMessage);
            setError('Network error loading audio');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            console.error('[Player] Audio decoding error:', errorMessage);
            setError('Audio format error');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error('[Player] Audio source not supported:', errorMessage);
            setError('Audio format not supported');
            break;
          default:
            console.error('[Player] Unknown audio error:', {
              code: errorCode,
              message: errorMessage,
              networkState: target.networkState,
              readyState: target.readyState
            });
            setError('Audio playback error');
        }
      } else {
        console.debug('[Player] Audio error event without error object');
      }
      
      setIsPlaying(false);
    };

    // Add all event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    console.debug('[Player] Audio event listeners added successfully');

    return () => {
      console.debug('[Player] Cleaning up audio event listeners');
      if (playPauseTimeoutRef.current) {
        clearTimeout(playPauseTimeoutRef.current);
        playPauseTimeoutRef.current = null;
      }
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, []); // Empty dependency array is correct here

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Liked songs methods
  const isSongLiked = (songId: string) => {
    return likedSongs.some(song => song.id === songId);
  };

  const addToLikedSongs = (song: Song) => {
    if (!isSongLiked(song.id)) {
      setLikedSongs(prev => [...prev, song]);
    }
  };

  const removeFromLikedSongs = (songId: string) => {
    setLikedSongs(prev => prev.filter(song => song.id !== songId));
  };

  // Analytics tracking
  const trackPlay = async (song: Song) => {
    try {
      console.log('[Analytics] Starting play tracking for:', song.name);
      
      // Check if user is authenticated
      if (!getAuthToken) {
        console.warn('[Analytics] No auth context available, using anonymous tracking');
        await trackPlayAnonymous(song);
        return;
      }
      
      const token = await getAuthToken();
      console.log('[Analytics] Auth token obtained:', token ? 'Yes' : 'No');
      
      if (token) {
        console.log('[Analytics] Tracking authenticated play for:', song.name);
        const playData = {
          songId: song.id,
          songTitle: song.name,
          artist: song.primaryArtists,
          duration: song.duration
        };
        console.log('[Analytics] Play data:', playData);
        
        const result = await recordPlay(token, playData);
        console.log('[Analytics] Play tracked successfully:', result);
      } else {
        console.warn('[Analytics] No auth token available for tracking - using anonymous tracking');
        await trackPlayAnonymous(song);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track authenticated play:', error);
      
      // Fallback to anonymous tracking
      console.log('[Analytics] Falling back to anonymous tracking');
      await trackPlayAnonymous(song);
    }
  };

  // Anonymous analytics tracking (fallback)
  const trackPlayAnonymous = async (song: Song) => {
    try {
      console.log('[Analytics] Tracking anonymous play for:', song.name);
      
      const playData = {
        songId: song.id,
        songTitle: song.name,
        artist: song.primaryArtists,
        duration: song.duration
      };
      
      const response = await fetch('http://localhost:5009/api/play/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[Analytics] Anonymous play tracked successfully');
      } else {
        console.error('[Analytics] Failed to track anonymous play:', result.error);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track anonymous play:', error);
      // Don't block playback if analytics fails
    }
  };

  // Initialize audio processing when audio element is ready
  useEffect(() => {
    // TEMPORARILY DISABLED: AudioProcessor causing connection conflicts
    // TODO: Fix AudioProcessor initialization conflicts
    console.log('[AudioProcessor] Audio processing temporarily disabled to fix playback issues');
    
    /*
    const initializeAudioProcessing = async () => {
      if (audioRef.current && audioProcessingEnabled && !audioProcessor.getStatus().isInitialized) {
        console.log('[AudioProcessor] Initializing audio processing...');
        try {
          const success = await audioProcessor.initializeProcessing(audioRef.current);
          if (success) {
            console.log('[AudioProcessor] Audio processing initialized successfully');
          } else {
            console.warn('[AudioProcessor] Failed to initialize audio processing - falling back to basic playback');
          }
        } catch (error) {
          console.error('[AudioProcessor] Error during initialization:', error);
          console.warn('[AudioProcessor] Falling back to basic audio playback');
        }
      }
    };

    // Initialize when we have an audio element and processing is enabled
    if (audioRef.current && audioProcessingEnabled) {
      initializeAudioProcessing();
    }

    // Cleanup function to dispose audio processor when component unmounts or processing is disabled
    return () => {
      if (!audioProcessingEnabled && audioProcessor.getStatus().isInitialized) {
        console.log('[AudioProcessor] Disposing audio processor due to disabled processing');
        audioProcessor.dispose();
      }
    };
    */
  }, [audioProcessingEnabled]); // Remove audioProcessor from dependencies as it's stable

  // Playback methods with enhanced audio source selection
  const playSong = (song: Song) => {
    console.debug('[Player] playSong called with', song?.name);
    console.log('[Player] Song data structure:', {
      id: song?.id,
      name: song?.name,
      url: song?.url,
      downloadUrl: song?.downloadUrl,
      hasDownloadUrl: !!(song?.downloadUrl && Array.isArray(song.downloadUrl)),
      downloadUrlLength: song?.downloadUrl?.length || 0,
      imageData: song?.image
    });
    
    if (!song) {
      console.warn('[Player] playSong called with invalid song');
      return;
    }
    
    // Clear any existing timeout to prevent race conditions
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }
    
    // Continue with playback directly (no image enhancement)
    proceedWithPlayback(song);
  };

  // Continue with playback
  const proceedWithPlayback = (song: Song) => {
    // Select optimal audio source with better fallback handling
    let audioSourceInfo: AudioSourceInfo;
    
    if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
      // Use the audio source optimizer for better quality
      audioSourceInfo = selectOptimalAudioSource(song.downloadUrl);
      console.log('[AudioOptimizer] Selected audio source:', {
        quality: audioSourceInfo.detectedQuality,
        bitrate: audioSourceInfo.detectedBitrate,
        format: audioSourceInfo.detectedFormat,
        availableOptions: audioSourceInfo.availableQualities.length,
        selectedUrl: audioSourceInfo.selectedUrl.substring(0, 50) + '...'
      });
    } else if (song.url && song.url.trim() !== '') {
      // Fallback to existing URL
      audioSourceInfo = {
        selectedUrl: song.url,
        detectedQuality: 'unknown',
        availableQualities: []
      };
      console.log('[AudioOptimizer] Using fallback URL (no downloadUrl available)');
    } else {
      // No valid audio source found
      console.error('[Player] No valid audio URL found:', song);
      setError('Cannot play song: No audio URL available');
      return;
    }
    
    // Validate we have a valid URL
    if (!audioSourceInfo.selectedUrl || audioSourceInfo.selectedUrl.trim() === '') {
      console.error('[Player] No valid audio URL found after processing:', song);
      setError('Cannot play song: No audio URL available');
      return;
    }
    
    // Clear any previous error
    setError(null);
    
    // Set current song and audio info (with enhanced images)
    setCurrentSong(song);
    setCurrentAudioInfo(audioSourceInfo);
    
    // Track the play for analytics
    console.log('[Player] About to track play for analytics');
    trackPlay(song);
    
    if (audioRef.current) {
      try {
        // Stop current playback first with better error handling
        if (!audioRef.current.paused) {
          try {
            audioRef.current.pause();
          } catch (pauseError) {
            console.warn('[Player] Error pausing current audio:', pauseError);
          }
        }
        
        // Reset audio element
        audioRef.current.currentTime = 0;
        
        // Configure audio element for optimal playback
        audioRef.current.preload = 'auto';
        audioRef.current.crossOrigin = 'anonymous'; // Enable CORS for Web Audio API
        
        // Set new source with optimal URL
        audioRef.current.src = audioSourceInfo.selectedUrl;
        audioRef.current.volume = volume;
        
        console.log('[Player] Audio configured with URL:', audioSourceInfo.selectedUrl.substring(0, 50) + '...');
        
        // Play the audio with enhanced error handling
        const attemptPlay = async () => {
          if (!audioRef.current) {
            throw new Error('Audio element no longer available');
          }
          
          try {
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
              await playPromise;
              console.debug('[Player] Audio started playing successfully');
              console.log('[AudioQuality] Now playing:', getQualityDescription(
                audioSourceInfo.detectedQuality, 
                audioSourceInfo.detectedBitrate
              ));
              setIsPlaying(true);
            }
          } catch (error: any) {
            // Handle specific error types with reduced console spam
            if (error.name === 'AbortError') {
              console.debug('[Player] Play request was aborted - this is usually harmless');
              // Don't show error to user for AbortError as it's usually due to rapid clicking
              return;
            } else if (error.name === 'NotAllowedError') {
              console.warn('[Player] Playback not allowed - user interaction may be required');
              setError('Playback not allowed. Please click play to start.');
            } else if (error.name === 'NotSupportedError') {
              console.error('[Player] Audio format not supported');
              setError('Audio format not supported');
            } else if (error.message && error.message.includes('network')) {
              console.error('[Player] Network error loading audio');
              setError('Network error: Unable to load audio');
            } else {
              console.error('[Player] Failed to play song:', error.message);
              setError('Failed to play song: ' + error.message);
            }
            
            setIsPlaying(false);
          }
        };
        
        // Attempt to play immediately
        attemptPlay();
        
      } catch (error) {
        console.error('[Player] Error setting up audio:', error);
        setIsPlaying(false);
        setError('Failed to setup audio playback');
      }
    }
  };

  const togglePlayPause = () => {
    if (!currentSong || !audioRef.current) {
      console.warn('[Player] No current song or audio element available');
      return;
    }
    
    // Clear any existing timeout to prevent race conditions
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }
    
    const audio = audioRef.current;
    
    // Use the actual audio element state instead of React state to avoid race conditions
    const isCurrentlyPlaying = !audio.paused;
    
    console.debug('[Player] togglePlayPause called, audio element state:', { 
      paused: audio.paused,
      isCurrentlyPlaying,
      reactState: isPlaying,
      readyState: audio.readyState,
      src: !!audio.src
    });
    
    // Immediate state update to prevent UI lag
    setIsPlaying(!isCurrentlyPlaying);
    
    // Debounce rapid play/pause calls with increased timeout
    playPauseTimeoutRef.current = setTimeout(async () => {
      if (!audioRef.current) {
        console.warn('[Player] Audio element no longer available');
        return;
      }
      
      try {
        if (isCurrentlyPlaying) {
          console.debug('[Player] Pausing audio');
          try {
            audioRef.current.pause();
            // State will be updated by the 'pause' event listener
          } catch (pauseError) {
            console.warn('[Player] Error pausing audio:', pauseError);
          }
        } else {
          console.debug('[Player] Starting audio playback');
          
          // Check if audio has a valid source
          if (!audioRef.current.src || audioRef.current.src === '') {
            console.error('[Player] No audio source available');
            setError('No audio source available');
            setIsPlaying(false);
            return;
          }
          
          // Attempt to play with enhanced error handling
          try {
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
              try {
                await playPromise;
                console.debug('[Player] Resume playback successful');
                // State will be updated by the 'play' event listener
              } catch (error: any) {
                // Handle specific error types with reduced console spam
                if (error.name === 'AbortError') {
                  console.debug('[Player] Play request was aborted - this is usually harmless');
                  // Don't show error to user for AbortError as it's usually due to rapid clicking
                  return;
                } else if (error.name === 'NotAllowedError') {
                  console.warn('[Player] Playback not allowed - user interaction may be required');
                  setError('Playback not allowed. Please interact with the page first.');
                } else if (error.name === 'NotSupportedError') {
                  console.error('[Player] Audio format not supported');
                  setError('Audio format not supported');
                } else if (error.message && error.message.includes('network')) {
                  console.error('[Player] Network error during playback');
                  setError('Network error during playback');
                } else {
                  console.error('[Player] Unknown playback error:', error.message);
                  setError('Failed to resume playback: ' + error.message);
                }
                
                setIsPlaying(false);
              }
            }
          } catch (error) {
            console.error('[Player] Error creating play promise:', error);
            setIsPlaying(false);
            setError('Playback error occurred');
          }
        }
      } catch (error) {
        console.error('[Player] Error in togglePlayPause:', error);
        setIsPlaying(false);
        setError('Playback error occurred');
      }
    }, 150); // Increased debounce to 150ms for better stability
  };

  const playNext = () => {
    console.debug('[Player] playNext called');
    // Use refs to get current values to avoid async state issues
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const currentPlaylist = activePlaylistRef.current;
    
    console.debug('[Player] playNext called with', {
      queueLength: currentQueue.length,
      currentIndex: currentIndex,
      repeatMode: repeatMode,
      isShuffle: isShuffle,
      playlistId: currentPlaylist?.id || null,
      playlistTracks: currentPlaylist?.tracks?.length || 0
    });
    
    // Use the active playlist if available, otherwise fall back to queue
    const playlistToUse = currentPlaylist?.tracks || currentQueue;
    let playlistIndex = currentPlaylist?.currentIndex !== undefined ? currentPlaylist.currentIndex : currentIndex;
    
    if (playlistToUse.length > 0 && playlistIndex >= 0) {
      let nextIndex;
      
      if (isShuffle && playlistToUse.length > 1) {
        // For search results with language filtering
        if (currentPlaylist?.language) {
          // Filter songs by the same language as the current song
          const sameLanguageSongs = playlistToUse
            .map((song, index) => ({ song, index }))
            .filter(({ song }) => song.language === currentPlaylist.language);
          
          if (sameLanguageSongs.length > 1) {
            // Generate a random index from songs with the same language
            const currentSongLanguageIndex = sameLanguageSongs.findIndex(({ index }) => index === playlistIndex);
            let nextLanguageSongIndex;
            
            do {
              nextLanguageSongIndex = Math.floor(Math.random() * sameLanguageSongs.length);
            } while (nextLanguageSongIndex === currentSongLanguageIndex && sameLanguageSongs.length > 1);
            
            nextIndex = sameLanguageSongs[nextLanguageSongIndex].index;
          } else {
            // If there's only one song with the same language, just go to the next song in the playlist
            nextIndex = playlistIndex + 1;
            if (nextIndex >= playlistToUse.length) {
              nextIndex = 0; // Loop back to beginning
            }
          }
        } else {
          // Generate a random index that's not the current one
          do {
            nextIndex = Math.floor(Math.random() * playlistToUse.length);
          } while (nextIndex === playlistIndex && playlistToUse.length > 1);
        }
      } else {
        nextIndex = playlistIndex + 1;
        
        // Handle repeat mode
        if (nextIndex >= playlistToUse.length) {
          if (repeatMode === 'all') {
            nextIndex = 0; // Loop back to beginning
          } else {
            // No more songs to play - this is the correct behavior for repeat: none
            console.debug('[Player] reached end, stopping');
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            return;
          }
        }
      }
      
      console.debug('[Player] playNext -> nextIndex', nextIndex, 'nextTrack', playlistToUse[nextIndex]?.name);
      const nextSong = playlistToUse[nextIndex];
      
      // Update the active playlist if it exists
      if (currentPlaylist) {
        const updatedPlaylist = {
          ...currentPlaylist,
          currentIndex: nextIndex
        };
        setActivePlaylist(updatedPlaylist);
      }
      
      setQueueIndex(nextIndex);
      
      // Play the next song immediately
      console.debug('[Player] playNext calling playSong for next track');
      playSong(nextSong);
    } else {
      // If queue is empty or invalid index, stop playing
      console.debug('[Player] queue is empty or invalid index, stopping playback');
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const playPrevious = () => {
    console.debug('[Player] playPrevious called');
    // Use refs to get current values to avoid async state issues
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const currentPlaylist = activePlaylistRef.current;
    
    // Use the active playlist if available, otherwise fall back to queue
    const playlistToUse = currentPlaylist?.tracks || currentQueue;
    let playlistIndex = currentPlaylist?.currentIndex !== undefined ? currentPlaylist.currentIndex : currentIndex;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else if (playlistToUse.length > 0 && playlistIndex >= 0) {
      let prevIndex;
      
      if (isShuffle && playlistToUse.length > 1) {
        // Generate a random index that's not the current one
        do {
          prevIndex = Math.floor(Math.random() * playlistToUse.length);
        } while (prevIndex === playlistIndex && playlistToUse.length > 1);
      } else {
        prevIndex = playlistIndex - 1;
        
        // Handle wraparound for repeat all mode
        if (prevIndex < 0) {
          if (repeatMode === 'all') {
            prevIndex = playlistToUse.length - 1; // Go to last song
          } else {
            prevIndex = 0; // Stay at first song
          }
        }
      }
      
      const prevSong = playlistToUse[prevIndex];
      
      // Update the active playlist if it exists
      if (currentPlaylist) {
        const updatedPlaylist = {
          ...currentPlaylist,
          currentIndex: prevIndex
        };
        setActivePlaylist(updatedPlaylist);
      }
      
      setQueueIndex(prevIndex);
      playSong(prevSong);
    }
  };

  // Add the missing setPlaylistAndPlay function
  const setPlaylistAndPlay = (playlist: Song[], index: number) => {
    console.debug('[Player] setPlaylistAndPlay called with', { playlistLength: playlist.length, index });
    
    if (!playlist || playlist.length === 0) {
      console.warn('[Player] setPlaylistAndPlay called with empty playlist');
      return;
    }
    
    if (index < 0 || index >= playlist.length) {
      console.warn('[Player] setPlaylistAndPlay called with invalid index', { index, playlistLength: playlist.length });
      return;
    }
    
    // Filter out invalid songs
    const validPlaylist = playlist.filter(song => song && song.id && song.name);
    if (validPlaylist.length === 0) {
      console.error('[Player] No valid songs in playlist');
      setError('No valid songs to play');
      return;
    }
    
    // Adjust index if needed after filtering
    let validIndex = index;
    if (validIndex >= validPlaylist.length) {
      validIndex = 0;
    }
    
    // Create a new active playlist object
    const newActivePlaylist = {
      id: `playlist-${Date.now()}`, // Generate a unique ID
      name: 'Current Playlist',
      tracks: validPlaylist,
      currentIndex: validIndex
    };

    // Set the active playlist
    setActivePlaylist(newActivePlaylist);
    
    // Set the queue and play the selected song
    setQueue(validPlaylist);
    setQueueIndex(validIndex);
    
    // Play the selected song immediately
    const songToPlay = validPlaylist[validIndex];
    console.debug('[Player] setPlaylistAndPlay calling playSong for', songToPlay?.name);
    playSong(songToPlay);
  };

  const seekTo = (time: number) => {
    if (audioRef.current && !isNaN(time) && time >= 0) {
      console.debug('[Player] Seeking to:', time);
      try {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      } catch (error) {
        console.error('[Player] Error seeking:', error);
      }
    }
  };

  const savePlaylist = (playlist: Playlist) => {
    try {
      // Check if playlist already exists
      const existingIndex = savedPlaylists.findIndex(p => p.id === playlist.id);
      
      if (existingIndex >= 0) {
        // Update existing playlist
        const updatedPlaylists = [...savedPlaylists];
        updatedPlaylists[existingIndex] = playlist;
        setSavedPlaylists(updatedPlaylists);
        console.log('[Playlist] Updated existing playlist:', playlist.name);
      } else {
        // Add new playlist
        setSavedPlaylists(prev => [...prev, playlist]);
        console.log('[Playlist] Saved new playlist:', playlist.name);
      }
    } catch (error) {
      console.error('[Playlist] Error saving playlist:', error);
      setError('Failed to save playlist');
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        queue,
        queueIndex,
        activePlaylist,
        repeatMode,
        isShuffle,
        isSongLiked,
        addToLikedSongs,
        removeFromLikedSongs,
        playSong,
        playNext,
        playPrevious,
        togglePlayPause,
        setQueue,
        setQueueIndex,
        setActivePlaylist,
        setRepeatMode,
        setIsShuffle,
        setPlaylistAndPlay,
        savePlaylist,
        error,
        setError,
        likedSongs,
        savedPlaylists,
        volume,
        setVolume,
        currentTime,
        duration,
        seekTo,
        audioRef: audioRef as React.RefObject<HTMLAudioElement>,
        // Audio quality and processing
        currentAudioInfo,
        audioProcessingEnabled,
        setAudioProcessingEnabled,
        audioProcessor,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};