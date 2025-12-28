const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { requireZeroTrustAdmin } = require('../middleware/zero-trust-auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/songs');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// In-memory storage for demo (replace with database in production)
let songs = [];
let songIdCounter = 1;

/**
 * POST /admin/songs/upload
 * Upload a new song (Admin only)
 */
router.post('/songs/upload', requireZeroTrustAdmin, upload.single('song'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No song file uploaded'
      });
    }

    const { title, artist, album, genre, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({
        success: false,
        error: 'Title and artist are required'
      });
    }

    const newSong = {
      id: songIdCounter++,
      title,
      artist,
      album: album || 'Unknown Album',
      genre: genre || 'Unknown',
      duration: parseInt(duration) || 0,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: req.user.uid,
      uploadedAt: new Date().toISOString()
    };

    songs.push(newSong);

    res.status(201).json({
      success: true,
      message: 'Song uploaded successfully',
      song: {
        id: newSong.id,
        title: newSong.title,
        artist: newSong.artist,
        album: newSong.album,
        genre: newSong.genre,
        duration: newSong.duration,
        uploadedAt: newSong.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading song:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to upload song'
    });
  }
});

/**
 * GET /admin/songs
 * Get all songs (Admin only)
 */
router.get('/songs', requireZeroTrustAdmin, (req, res) => {
  try {
    const songsWithoutFilePaths = songs.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      duration: song.duration,
      uploadedBy: song.uploadedBy,
      uploadedAt: song.uploadedAt
    }));

    res.json({
      success: true,
      songs: songsWithoutFilePaths,
      total: songs.length
    });
  } catch (error) {
    console.error('Error fetching songs:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch songs'
    });
  }
});

/**
 * PUT /admin/songs/:id
 * Update song metadata (Admin only)
 */
router.put('/songs/:id', requireZeroTrustAdmin, (req, res) => {
  try {
    const songId = parseInt(req.params.id);
    const { title, artist, album, genre, duration } = req.body;

    const songIndex = songs.findIndex(song => song.id === songId);
    
    if (songIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    // Update song metadata
    if (title) songs[songIndex].title = title;
    if (artist) songs[songIndex].artist = artist;
    if (album) songs[songIndex].album = album;
    if (genre) songs[songIndex].genre = genre;
    if (duration) songs[songIndex].duration = parseInt(duration);
    
    songs[songIndex].updatedAt = new Date().toISOString();
    songs[songIndex].updatedBy = req.user.uid;

    res.json({
      success: true,
      message: 'Song updated successfully',
      song: {
        id: songs[songIndex].id,
        title: songs[songIndex].title,
        artist: songs[songIndex].artist,
        album: songs[songIndex].album,
        genre: songs[songIndex].genre,
        duration: songs[songIndex].duration,
        updatedAt: songs[songIndex].updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating song:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update song'
    });
  }
});

/**
 * DELETE /admin/songs/:id
 * Delete a song (Admin only)
 */
router.delete('/songs/:id', requireZeroTrustAdmin, async (req, res) => {
  try {
    const songId = parseInt(req.params.id);
    const songIndex = songs.findIndex(song => song.id === songId);
    
    if (songIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    const song = songs[songIndex];

    // Delete the file from filesystem
    try {
      await fs.unlink(song.filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError.message);
      // Continue with database deletion even if file deletion fails
    }

    // Remove from array
    songs.splice(songIndex, 1);

    res.json({
      success: true,
      message: 'Song deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting song:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete song'
    });
  }
});

module.exports = router;