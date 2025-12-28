const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [{
    songId: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  coverImage: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isCollaborative: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  playCount: {
    type: Number,
    default: 0
  },
  lastPlayedAt: {
    type: Date,
    default: null
  },
  source: {
    type: String,
    enum: ['manual', 'spotify', 'youtube', 'imported'],
    default: 'manual'
  },
  sourceId: {
    type: String, // Original playlist ID from source platform
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
playlistSchema.index({ owner: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ tags: 1 });
playlistSchema.index({ 'songs.songId': 1 });

// Virtual for song count
playlistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

// Virtual for total duration (would need to be calculated with song data)
playlistSchema.virtual('totalDuration').get(function() {
  // This would require populating song data to calculate actual duration
  return this.songs.length * 180; // Placeholder: assume 3 minutes per song
});

module.exports = mongoose.model('Playlist', playlistSchema);