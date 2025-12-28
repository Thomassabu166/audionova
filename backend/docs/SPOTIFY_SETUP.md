# Spotify API Setup Guide

To enable Spotify playlist import functionality, you need to set up Spotify API credentials.

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the details:
   - **App name**: Music Player App (or any name you prefer)
   - **App description**: Personal music player with playlist import
   - **Website**: http://localhost:3000 (or your app URL)
   - **Redirect URI**: **REQUIRED** - Use this exact URL:

### ✅ Required Redirect URI:

**Use This Exact URL**: `https://developer.spotify.com/callback`
- ✅ HTTPS (secure)
- ✅ Official Spotify domain (always accepted)
- ✅ Never actually used by our app
- ✅ Spotify's own recommended placeholder

**❌ Don't Use**: 
- `http://localhost:3000` (HTTP rejected as "not secure")
- `http://localhost:5009/callback` (HTTP rejected as "not secure")
- Any HTTP URLs (Spotify blocks all HTTP)

### Why We Need a Redirect URI (Even Though We Don't Use It)

Spotify **requires** at least one **HTTPS** redirect URI when creating any app, even for Client Credentials flow. Use `https://developer.spotify.com/callback` - it's Spotify's own domain and never actually used for playlist import.

**Important**: We use Client Credentials flow, so this redirect URI is never actually called!

## Step 2: Get Your Credentials

1. Click on your newly created app
2. You'll see your **Client ID** and **Client Secret**
3. Copy these values

## Step 3: Update Your .env File

1. Open `backend/.env`
2. Replace the placeholder values:

```env
SPOTIFY_CLIENT_ID=your_actual_client_id_here
SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
```

## Step 4: Restart the Backend

1. Stop the backend server (Ctrl+C)
2. Start it again: `npm run dev`
3. You should see "SPOTIFY_CLIENT_ID: Set" and "SPOTIFY_CLIENT_SECRET: Set" in the console

## Important Notes

### No Redirect URI Needed
- We use **Client Credentials Flow** which doesn't require user login
- This means we can import **public playlists** without redirect URIs
- You can leave the "Redirect URIs" field empty in your Spotify app settings
- The `http://localhost:5009/callback` in the code is not used for playlist import

### What We Can Import
- ✅ **Public playlists** (anyone can view)
- ✅ **Spotify's official playlists** (like "Today's Top Hits")
- ❌ **Private playlists** (requires user authentication)
- ❌ **User's personal playlists** (requires user authentication)

## Testing

1. Find a **public** Spotify playlist (like Spotify's official playlists)
2. Copy the playlist URL (e.g., `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`)
3. Try importing it in your music app
4. The playlist should import successfully

## Troubleshooting

### "Please enter a valid redirect URL" Error
- **Problem**: Spotify requires at least one **HTTPS** redirect URI when creating an app
- **Solution**: Use `https://developer.spotify.com/callback` (Spotify's official placeholder)
- **Note**: This URI is never actually used for playlist import, but Spotify requires it

### "Redirect URL is not secure" Error  
- **Problem**: You used an HTTP URL (like `http://localhost:5009/callback`)
- **Solution**: Use `https://developer.spotify.com/callback` instead
- **Important**: Never use HTTP URLs - Spotify blocks all HTTP redirect URIs

### Other Common Issues
- **"Invalid client" error**: Double-check your Client ID and Client Secret
- **"Access denied" error**: Make sure the playlist is public
- **Rate limiting**: Spotify has rate limits, try again after a few minutes
- **Redirect URI warnings**: You can ignore these - we don't use redirect URIs for playlist import

## Security Note

The Client Credentials Flow is perfect for this use case because:
- No user authentication required
- No sensitive redirect URIs needed
- Works with public playlists only
- Secure for server-to-server communication