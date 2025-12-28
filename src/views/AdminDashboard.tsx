import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Music, 
  Upload, 
  Users, 
  BarChart3, 
  Play, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  Clock,
  Headphones,
  RefreshCw
} from 'lucide-react';
import { 
  getAnalytics, 
  getUserAnalytics, 
  getSongs, 
  uploadSong, 
  updateSong, 
  deleteSong,
  type Song,
  type Analytics,
  type UserAnalytics
} from '../services/adminApi';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 🔒 SECURITY: Redirect if not admin (UX only - real security is server-side)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have admin privileges to access this dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Admin access is controlled by Firebase Custom Claims and can only be granted by the system administrator.
          </p>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="mt-4"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = await getAuthToken();
      if (!token) return;

      const [analyticsRes, userAnalyticsRes, songsRes] = await Promise.all([
        getAnalytics(token),
        getUserAnalytics(token),
        getSongs(token)
      ]);

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
      }

      if (userAnalyticsRes.success) {
        setUserAnalytics(userAnalyticsRes.users);
      }

      if (songsRes.success) {
        setSongs(songsRes.songs);
      }

      if (showRefreshIndicator) {
        toast.success('Dashboard data refreshed successfully');
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      if (showRefreshIndicator) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const handleUploadSong = async (formData: FormData) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const result = await uploadSong(token, formData);
      if (result.success) {
        toast.success('Song uploaded successfully');
        setUploadDialogOpen(false);
        loadData(true); // Reload data with refresh indicator
      }
    } catch (error: any) {
      console.error('Error uploading song:', error);
      toast.error(error.response?.data?.error || 'Failed to upload song');
    }
  };

  const handleUpdateSong = async (songId: number, songData: Partial<Song>) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const result = await updateSong(token, songId, songData);
      if (result.success) {
        toast.success('Song updated successfully');
        setEditDialogOpen(false);
        setSelectedSong(null);
        loadData(true); // Reload data with refresh indicator
      }
    } catch (error: any) {
      console.error('Error updating song:', error);
      toast.error(error.response?.data?.error || 'Failed to update song');
    }
  };

  const handleDeleteSong = async (songId: number) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const result = await deleteSong(token, songId);
      if (result.success) {
        toast.success('Song deleted successfully');
        loadData(true); // Reload data with refresh indicator
      }
    } catch (error: any) {
      console.error('Error deleting song:', error);
      toast.error(error.response?.data?.error || 'Failed to delete song');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your music platform</p>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs text-muted-foreground">Logged in as: {user?.email}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            Admin
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Refresh and Test Analytics Buttons */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dashboard Overview</h2>
            <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  const token = await getAuthToken();
                  if (token) {
                    // Record a test play
                    const playResult = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009'}/api/play`, {
                      method: 'POST',
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        songId: 'test-song-' + Date.now(),
                        songTitle: 'Test Song',
                        artist: 'Test Artist',
                        duration: 180
                      })
                    });
                    const playData = await playResult.json();
                    console.log('Test play result:', playData);
                    toast.success('Test play recorded successfully');
                    loadData(true); // Reload analytics with refresh indicator
                  }
                } catch (error) {
                  console.error('Test play failed:', error);
                  toast.error('Test play failed');
                }
              }}
              variant="outline"
              size="sm"
            >
              Record Test Play
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const token = await getAuthToken();
                  if (token) {
                    const testResult = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009'}/api/admin/analytics/test`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await testResult.json();
                    console.log('Analytics test result:', data);
                    toast.success(`Analytics test: ${data.data?.totalPlays || 0} plays recorded`);
                  }
                } catch (error) {
                  console.error('Analytics test failed:', error);
                  toast.error('Analytics test failed');
                }
              }}
              variant="outline"
              size="sm"
            >
              Test Analytics
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const token = await getAuthToken();
                  if (token) {
                    const result = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009'}/api/admin/analytics/debug`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await result.json();
                    console.log('Analytics debug result:', data);
                    if (data.success) {
                      const debug = data.debug;
                      toast.success(`Debug Info: MongoDB ${debug.mongodb.status}, Fallback: ${debug.fallbackStorage.playsCount} plays`);
                    } else {
                      toast.error('Debug failed');
                    }
                  }
                } catch (error) {
                  console.error('Debug failed:', error);
                  toast.error('Debug failed');
                }
              }}
              variant="outline"
              size="sm"
            >
              Debug Analytics
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const token = await getAuthToken();
                  if (token) {
                    const result = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009'}/api/admin/analytics/sample-data`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await result.json();
                    console.log('Clear sample data result:', data);
                    if (data.success) {
                      toast.success('Sample data cleared successfully');
                      loadData(true); // Reload analytics
                    } else {
                      toast.error('Failed to clear sample data');
                    }
                  }
                } catch (error) {
                  console.error('Clear sample data failed:', error);
                  toast.error('Clear sample data failed');
                }
              }}
              variant="outline"
              size="sm"
            >
              Clear Sample Data
            </Button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalPlays || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.uniqueUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{songs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Songs Played</CardTitle>
                <Headphones className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.uniqueSongs || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Played Songs</CardTitle>
                <CardDescription>Most popular tracks on your platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topSongs.slice(0, 5).map((song, index) => (
                    <div key={song.songId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{song.songTitle}</p>
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{song.playCount} plays</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Users with the most plays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topUsers.slice(0, 5).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{user.userEmail}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{user.playCount} plays</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="songs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Song Management</h2>
            <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Song
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Song</DialogTitle>
                  <DialogDescription>
                    Upload a new song to your music platform
                  </DialogDescription>
                </DialogHeader>
                <SongUploadForm onSubmit={handleUploadSong} />
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {songs.map((song) => (
                  <div key={song.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{song.title}</h3>
                      <p className="text-sm text-muted-foreground">{song.artist} • {song.album}</p>
                      <p className="text-xs text-muted-foreground">
                        {song.genre} • {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSong(song);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Song</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{song.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSong(song.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Song Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Song</DialogTitle>
                <DialogDescription>
                  Update song information
                </DialogDescription>
              </DialogHeader>
              {selectedSong && (
                <SongEditForm 
                  song={selectedSong} 
                  onSubmit={(data) => handleUpdateSong(selectedSong.id, data)} 
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
              <CardTitle>Plays Over Time</CardTitle>
                <CardDescription>Daily play counts for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.playsByDate.slice(-7).map((day) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <Badge variant="outline">{day.plays} plays</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Songs (All Time)</CardTitle>
                <CardDescription>Most played songs on your platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topSongs.slice(0, 10).map((song, index) => (
                    <div key={song.songId} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{song.songTitle}</p>
                          <p className="text-xs text-muted-foreground">{song.artist}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{song.playCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">User Analytics</h2>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Users
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {userAnalytics.map((user) => (
                  <div key={user.userId} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{user.userEmail}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.totalPlays} total plays • {user.uniqueSongs} unique songs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          First play: {new Date(user.firstPlay).toLocaleDateString()} • 
                          Last play: {new Date(user.lastPlay).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{user.totalPlays} plays</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Song Upload Form Component
const SongUploadForm: React.FC<{ onSubmit: (formData: FormData) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    duration: ''
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a song file');
      return;
    }

    const data = new FormData();
    data.append('song', file);
    data.append('title', formData.title);
    data.append('artist', formData.artist);
    data.append('album', formData.album);
    data.append('genre', formData.genre);
    data.append('duration', formData.duration);

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Song File</Label>
        <Input
          id="file"
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="artist">Artist</Label>
        <Input
          id="artist"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="album">Album</Label>
        <Input
          id="album"
          value={formData.album}
          onChange={(e) => setFormData({ ...formData, album: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="genre">Genre</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, genre: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pop">Pop</SelectItem>
            <SelectItem value="rock">Rock</SelectItem>
            <SelectItem value="hip-hop">Hip Hop</SelectItem>
            <SelectItem value="electronic">Electronic</SelectItem>
            <SelectItem value="classical">Classical</SelectItem>
            <SelectItem value="jazz">Jazz</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="duration">Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Upload Song</Button>
      </DialogFooter>
    </form>
  );
};

// Song Edit Form Component
const SongEditForm: React.FC<{ song: Song; onSubmit: (data: Partial<Song>) => void }> = ({ song, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: song.title,
    artist: song.artist,
    album: song.album,
    genre: song.genre,
    duration: song.duration.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      artist: formData.artist,
      album: formData.album,
      genre: formData.genre,
      duration: parseInt(formData.duration)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-artist">Artist</Label>
        <Input
          id="edit-artist"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-album">Album</Label>
        <Input
          id="edit-album"
          value={formData.album}
          onChange={(e) => setFormData({ ...formData, album: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="edit-genre">Genre</Label>
        <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pop">Pop</SelectItem>
            <SelectItem value="rock">Rock</SelectItem>
            <SelectItem value="hip-hop">Hip Hop</SelectItem>
            <SelectItem value="electronic">Electronic</SelectItem>
            <SelectItem value="classical">Classical</SelectItem>
            <SelectItem value="jazz">Jazz</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="edit-duration">Duration (seconds)</Label>
        <Input
          id="edit-duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="submit">Update Song</Button>
      </DialogFooter>
    </form>
  );
};

export default AdminDashboard;