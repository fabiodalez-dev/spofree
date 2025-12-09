

import React, { useState, useEffect, useRef } from 'react';
import { Player } from './components/Player';
import { Sidebar } from './components/Sidebar';
import { TrackList } from './components/TrackList';
import { ImportModal } from './components/ImportModal';
import { PlaylistEditModal } from './components/PlaylistEditModal';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { RightSidebar } from './components/RightSidebar';
import { DownloadManager } from './components/DownloadManager';
import { DetailHeader } from './components/DetailHeader';
import { MediaGrid } from './components/MediaGrid';
import { GenreCard } from './components/GenreCard';
import { CsvFileIcon } from './components/Icons';
import { ViewState, Track, Album, Artist, Playlist, RecentlyPlayedItem, RepeatMode, AudioQuality } from './types';
import { 
    searchAll, getStreamUrl, getCurrentApiUrl, 
    getAlbumTracks, getArtistTopTracks, getPlaylistTracks, getArtistAlbums, downloadTrackBlob, downloadBlobWithProgress 
} from './services/hifiService';
import { storageService } from './services/storageService';
import { ChevronLeft, ChevronRight, Search, Home, Library, Heart, Github, Pencil, Settings, Download, Archive, Loader2, Plus, Disc, Mic2, ListMusic, ArrowDownUp, LayoutGrid, List, X, Play } from 'lucide-react';
import { Button } from './components/Button';
import JSZip from 'jszip';

type CategoryFilter = 'ALL' | 'TRACKS' | 'ALBUMS' | 'ARTISTS' | 'PLAYLISTS';
type LibraryTab = 'ALL' | 'PLAYLISTS' | 'LIKED_SONGS' | 'ALBUMS' | 'ARTISTS';
type SortOption = 'CUSTOM' | 'TITLE' | 'ARTIST' | 'ALBUM' | 'DURATION';
type ViewMode = 'GRID' | 'LIST';

// History Item type for navigation
interface HistoryState {
    view: ViewState;
    entity?: any;
    query?: string;
    filter?: CategoryFilter;
    detailTracks?: Track[];
    detailAlbums?: Album[]; // Added for Artist view
}

// Fixed genres with colors
const GENRES = [
    { name: 'Pop', color: '#8c67ac' },
    { name: 'Hip-Hop', color: '#ba5d07' },
    { name: 'Rock', color: '#e91429' },
    { name: 'Indie', color: '#608108' },
    { name: 'R&B', color: '#dc148c' },
    { name: 'Electronic', color: '#148a08' },
    { name: 'Jazz', color: '#1e3264' },
    { name: 'Classical', color: '#7d4b32' },
    { name: 'K-Pop', color: '#bc5900' },
    { name: 'Metal', color: '#777777' }
];

const App: React.FC = () => {
  // Navigation State
  const [historyStack, setHistoryStack] = useState<HistoryState[]>([{ view: ViewState.HOME }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Helpers to get current state from stack
  const currentState = historyStack[historyIndex];
  const view = currentState.view;
  const selectedEntity = currentState.entity;
  const searchQuery = currentState.query || '';
  const filter = currentState.filter || 'ALL';
  const detailTracks = currentState.detailTracks || [];
  const detailAlbums = currentState.detailAlbums || [];

  // Data State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  // Queue Management
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]); // Backup for shuffle OFF
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');

  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);
  
  // Home Recommendations State
  const [homeSections, setHomeSections] = useState<{ title: string; items: any[]; type: 'ALBUM' | 'PLAYLIST' | 'ARTIST' }[]>([]);

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [activeSearchCategory, setActiveSearchCategory] = useState<CategoryFilter>('ALL');
  const [visibleSongsCount, setVisibleSongsCount] = useState(10);

  const [resultTracks, setResultTracks] = useState<Track[]>([]);
  const [resultAlbums, setResultAlbums] = useState<Album[]>([]);
  const [resultArtists, setResultArtists] = useState<Artist[]>([]);
  const [resultPlaylists, setResultPlaylists] = useState<Playlist[]>([]);
  
  // Library State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<Album[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('ALL');
  const [libraryViewMode, setLibraryViewMode] = useState<ViewMode>('GRID');
  
  // View Sorting State
  const [sortOption, setSortOption] = useState<SortOption>('CUSTOM');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Settings State
  const [accentColor, setAccentColor] = useState('#1db954');
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('LOSSLESS');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [squareAvatars, setSquareAvatars] = useState(false);
  const [highPerformanceMode, setHighPerformanceMode] = useState(false);
  const [disableGlow, setDisableGlow] = useState(false);
  const [updateTitle, setUpdateTitle] = useState(true);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Download State
  const [zipDownloadState, setZipDownloadState] = useState<{ name: string, progress: number } | null>(null);
  const [singleDownloadState, setSingleDownloadState] = useState<{ name: string, progress: number } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [connectedInstance, setConnectedInstance] = useState(getCurrentApiUrl());
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Sidebar State
  const [rightSidebarMode, setRightSidebarMode] = useState<'QUEUE' | 'LYRICS' | null>(null);

  // Scroll Detection
  const [isScrolled, setIsScrolled] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlaylistEditModal, setShowPlaylistEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsStartTab, setSettingsStartTab] = useState<SettingsTab>('QUALITY');
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null); 

  const updateConnectionStatus = () => setConnectedInstance(getCurrentApiUrl());

  const refreshLibrary = () => {
      setPlaylists(storageService.getPlaylists());
      setLikedSongs(storageService.getLikedSongs());
      setSavedAlbums(storageService.getSavedAlbums());
      setFollowedArtists(storageService.getFollowedArtists());
      setSearchHistory(storageService.getHistory());
      setRecentlyPlayed(storageService.getRecentlyPlayed());
      
      // Sync settings
      setAccentColor(storageService.getAccentColor());
      setShowVisualizer(storageService.getShowVisualizer());
      setShowStats(storageService.getShowStats());
      setAudioQuality(storageService.getQuality());
      setCompactMode(storageService.getCompactMode());
      setReducedMotion(storageService.getReducedMotion());
      setGrayscaleMode(storageService.getGrayscaleMode());
      setSquareAvatars(storageService.getSquareAvatars());
      setHighPerformanceMode(storageService.getHighPerformanceMode());
      setDisableGlow(storageService.getDisableGlow());
      setUpdateTitle(storageService.getUpdateTitle());
  };

  const fetchHomeContent = async () => {
    const sections: { title: string; items: any[]; type: 'ALBUM' | 'PLAYLIST' | 'ARTIST' }[] = [];
    const recent = storageService.getRecentlyPlayed();
    
    // 1. Personalized Recommendations
    // Find the most recent Artist interaction
    const lastArtistItem = recent.find(i => 
        i.type === 'ARTIST' || 
        (i.type === 'ALBUM' && (i.data as Album).artist) || 
        (i.type === 'TRACK' && (i.data as Track).artist)
    );

    if (lastArtistItem) {
        let artistName;
        if (lastArtistItem.type === 'ARTIST') {
            artistName = (lastArtistItem.data as Artist).name;
        } else if (lastArtistItem.type === 'ALBUM') {
             artistName = (lastArtistItem.data as Album).artist?.name;
        } else if (lastArtistItem.type === 'TRACK') {
             artistName = (lastArtistItem.data as Track).artist.name;
        }

        if (artistName) {
            try {
                // Modified: Search for albums by the artist name to get search results (recommendations)
                // instead of full discography
                const searchRes = await searchAll(artistName);
                if (searchRes.albums.length > 0) {
                    sections.push({
                        title: `More from ${artistName}`,
                        items: searchRes.albums.slice(0, 5),
                        type: 'ALBUM'
                    });
                }
            } catch(e) { console.error(e); }
        }
    }

    // 2. Default Popular Content
    try {
        const [popRes, hitsRes] = await Promise.all([
            searchAll('Kanye'), // Changed from Pop to Kanye per user request
            searchAll('Tidal Hits')
        ]);

        if (hitsRes.playlists.length > 0) {
            sections.push({
                title: 'Top Playlists',
                items: hitsRes.playlists.slice(0, 5),
                type: 'PLAYLIST'
            });
        }
        
        if (popRes.albums.length > 0) {
            sections.push({
                title: 'Trending Albums',
                items: popRes.albums.slice(0, 5),
                type: 'ALBUM'
            });
        }
    } catch (e) { console.error(e); }

    setHomeSections(sections);
  };

  useEffect(() => {
    refreshLibrary();
    updateConnectionStatus();
    fetchHomeContent();
  }, []);

  // Reset sort when view changes
  useEffect(() => {
    setSortOption('CUSTOM');
    setIsSortDropdownOpen(false);
  }, [view, selectedEntity]);

  // Update document title
  useEffect(() => {
      if (updateTitle && currentTrack) {
          document.title = `${currentTrack.title} • ${currentTrack.artist.name}`;
      } else {
          document.title = "SpoFree - High Fidelity Streaming";
      }
  }, [currentTrack, updateTitle]);

  // Update local search input when navigating through history
  useEffect(() => {
      if (currentState.query) {
          setSearchInput(currentState.query);
      } else {
          setSearchInput('');
      }
  }, [currentState]);

  // Scroll Handler
  useEffect(() => {
      const handleScroll = () => {
          if (mainContentRef.current) {
              setIsScrolled(mainContentRef.current.scrollTop > 10);
          }
      };
      const ref = mainContentRef.current;
      ref?.addEventListener('scroll', handleScroll);
      return () => ref?.removeEventListener('scroll', handleScroll);
  }, [view]);

  // Navigation Handler
  const navigateTo = (newState: HistoryState) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    setHistoryStack([...newStack, newState]);
    setHistoryIndex(newStack.length);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Playback Logic
  const handlePlayTrack = async (track: Track, newQueue?: Track[]) => {
    try {
      if (newQueue) {
        setQueue(newQueue);
        setOriginalQueue(newQueue); // Assume not shuffled initially
        setIsShuffling(false);
      }
      
      const streamUrl = await getStreamUrl(track);
      setCurrentTrack({ ...track, streamUrl });
      setIsPlaying(true);
      setError(null);

      storageService.addToRecentlyPlayed({
          type: 'TRACK',
          data: track,
          timestamp: Date.now()
      });
      refreshLibrary();

    } catch (err: any) {
      console.error(err);
      setError("Failed to play track. It might be region-locked or unavailable.");
      // Auto-skip logic
      setTimeout(() => handleNext(), 2000);
    }
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    
    // Repeat One logic
    if (repeatMode === 'ONE') {
        if (audioRefCurrent.current) {
            audioRefCurrent.current.currentTime = 0;
            audioRefCurrent.current.play();
        }
        return;
    }

    if (currentIndex < queue.length - 1) {
      handlePlayTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'ALL') {
      handlePlayTrack(queue[0]); // Loop back to start
    }
  };

  const handlePrev = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(queue[currentIndex - 1]);
    } else {
       // Loop to end if desired, or restart track
       handlePlayTrack(queue[0]);
    }
  };

  // Needed for direct audio ref manipulation in App (hacky but effective for Repeat ONE logic)
  const audioRefCurrent = useRef<HTMLAudioElement | null>(null);

  const addToQueue = (track: Track) => {
      setQueue([...queue, track]);
      if (!isShuffling) setOriginalQueue([...originalQueue, track]);
  };

  const handleShuffleToggle = () => {
      const newShuffleState = !isShuffling;
      setIsShuffling(newShuffleState);
      
      if (newShuffleState) {
          // Shuffle Logic
          const shuffled = [...queue].sort(() => Math.random() - 0.5);
          // Keep current track first if playing
          if (currentTrack) {
               const idx = shuffled.findIndex(t => t.id === currentTrack.id);
               if (idx > -1) {
                   shuffled.splice(idx, 1);
                   shuffled.unshift(currentTrack);
               }
          }
          setQueue(shuffled);
      } else {
          // Restore Logic
          // Try to map current position to original queue
          setQueue([...originalQueue]);
      }
  };

  const handleSearch = async (query: string, category: CategoryFilter = 'ALL') => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearchInput(query);
    setActiveSearchCategory(category);
    setVisibleSongsCount(10);
    
    try {
      const results = await searchAll(query);
      setResultTracks(results.tracks);
      setResultAlbums(results.albums);
      setResultArtists(results.artists);
      setResultPlaylists(results.playlists);
      setHasSearched(true);
      
      navigateTo({ 
          view: ViewState.SEARCH, 
          query: query,
          filter: category
      });
      storageService.addToHistory(query);
      refreshLibrary();
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // View Handlers
  const openAlbum = async (albumId: string | number) => {
      setIsLoading(true);
      try {
          const tracks = await getAlbumTracks(albumId);
          // Find album info from search results or saved albums for metadata
          let albumInfo = resultAlbums.find(a => a.id == albumId) || 
                          savedAlbums.find(a => a.id == albumId) || 
                          homeSections.flatMap(s => s.items).find(i => i.id == albumId);

          if (!albumInfo && tracks.length > 0) {
               albumInfo = tracks[0].album;
          }

          navigateTo({ 
              view: ViewState.ALBUM_DETAILS, 
              entity: albumInfo, 
              detailTracks: tracks 
          });
          
          if (albumInfo) {
              storageService.addToRecentlyPlayed({
                  type: 'ALBUM',
                  data: albumInfo,
                  timestamp: Date.now()
              });
          }
      } catch (e) { setError("Could not load album."); }
      finally { setIsLoading(false); }
  };

  const openArtist = async (artistId: string | number) => {
      setIsLoading(true);
      try {
          const [tracks, albums] = await Promise.all([
              getArtistTopTracks(artistId),
              getArtistAlbums(artistId)
          ]);

          let artistInfo = resultArtists.find(a => a.id == artistId) || 
                           followedArtists.find(a => a.id == artistId) ||
                           (tracks.length > 0 ? tracks[0].artist : null);

          navigateTo({ 
              view: ViewState.ARTIST_DETAILS, 
              entity: artistInfo, 
              detailTracks: tracks,
              detailAlbums: albums
          });

          if (artistInfo) {
            storageService.addToRecentlyPlayed({
                type: 'ARTIST',
                data: artistInfo,
                timestamp: Date.now()
              });
          }
      } catch (e) { setError("Could not load artist."); }
      finally { setIsLoading(false); }
  };

  const openPlaylist = async (playlist: Playlist) => {
      if (playlist.isLocal) {
          // Local playlists have tracks already in memory
          navigateTo({ 
              view: ViewState.PLAYLIST_DETAILS, 
              entity: playlist, 
              detailTracks: playlist.tracks || []
          });
      } else {
          // Fetch remote playlist
          setIsLoading(true);
          try {
              const tracks = await getPlaylistTracks(playlist.uuid);
              navigateTo({ 
                  view: ViewState.PLAYLIST_DETAILS, 
                  entity: playlist, 
                  detailTracks: tracks 
              });
              
              storageService.addToRecentlyPlayed({
                type: 'PLAYLIST',
                data: playlist,
                timestamp: Date.now()
              });
          } catch (e) { setError("Could not load playlist."); }
          finally { setIsLoading(false); }
      }
  };

  const openLikedSongs = () => {
      const songs = storageService.getLikedSongs();
      navigateTo({
          view: ViewState.LIKED_SONGS,
          detailTracks: songs
      });
  };

  // Library Actions
  const handleSavePlaylist = (playlist: Playlist) => {
    storageService.savePlaylist(playlist);
    refreshLibrary();
  };

  const handleCreatePlaylist = (title: string, importedTracks: Track[] = []) => {
      const newPlaylist = storageService.createPlaylist(title);
      if (importedTracks.length > 0) {
          storageService.updatePlaylistTracks(newPlaylist.uuid, importedTracks);
      }
      refreshLibrary();
      // Open new playlist
      openPlaylist({ ...newPlaylist, tracks: importedTracks });
  };

  const handlePlaylistUpdate = (uuid: string, updates: { title: string, description: string, image: string }, tracks: Track[]) => {
      storageService.updatePlaylist(uuid, updates);
      storageService.updatePlaylistTracks(uuid, tracks);
      
      // Update local view state if we are viewing this playlist
      if (view === ViewState.PLAYLIST_DETAILS && selectedEntity.uuid === uuid) {
           const updatedPlaylist = storageService.getPlaylists().find(p => p.uuid === uuid);
           if (updatedPlaylist) {
               navigateTo({
                   view: ViewState.PLAYLIST_DETAILS,
                   entity: updatedPlaylist,
                   detailTracks: tracks
               });
           }
      }
      refreshLibrary();
  };

  const handleDeletePlaylist = (uuid: string) => {
      storageService.deletePlaylist(uuid);
      refreshLibrary();
      if (view === ViewState.PLAYLIST_DETAILS && selectedEntity.uuid === uuid) {
          goBack();
      }
  };

  // Download Logic
  const handleDownloadTrack = async () => {
      if (!currentTrack) return;
      try {
          const filename = `${currentTrack.artist.name} - ${currentTrack.title}.flac`;
          setSingleDownloadState({ name: currentTrack.title, progress: 0 });
          
          let downloadUrl = currentTrack.streamUrl;
          if (!downloadUrl) {
              downloadUrl = await getStreamUrl(currentTrack);
          }

          const blob = await downloadBlobWithProgress(downloadUrl, (p) => {
              setSingleDownloadState(prev => prev ? { ...prev, progress: p } : null);
          });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (e) {
          console.error("Download failed", e);
          setError("Download failed.");
      } finally {
          setTimeout(() => setSingleDownloadState(null), 2000);
      }
  };

  const handleDownloadZip = async (name: string, tracks: Track[]) => {
    if (isExporting) return;
    setIsExporting(true);
    setZipDownloadState({ name: name, progress: 0 });

    const zip = new JSZip();
    let completed = 0;

    // Chunk size to prevent memory issues/rate limits
    const CHUNK_SIZE = 3;
    
    try {
        for (let i = 0; i < tracks.length; i += CHUNK_SIZE) {
            const chunk = tracks.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (track) => {
                try {
                    const url = await getStreamUrl(track);
                    const blob = await downloadTrackBlob(url);
                    const fileName = `${track.artist.name} - ${track.title}.flac`.replace(/[\/\?<>\\:\*\|":]/g, '');
                    zip.file(fileName, blob);
                } catch (e) {
                    console.error(`Failed to download ${track.title}`, e);
                    zip.file(`FAILED_${track.title}.txt`, "Download failed");
                } finally {
                    completed++;
                    const percent = Math.round((completed / tracks.length) * 100);
                    setExportProgress(percent);
                    setZipDownloadState({ name, progress: percent });
                }
            }));
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (e) {
        setError("Batch download failed.");
    } finally {
        setIsExporting(false);
        setExportProgress(0);
        setTimeout(() => setZipDownloadState(null), 2000);
    }
  };

  // CSV Export Logic
  const handleExportCsv = (name: string, tracks: Track[]) => {
      const headers = ['Title', 'Artist', 'Album', 'Duration (s)', 'Stream URL'];
      const rows = tracks.map(t => [
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.artist.name.replace(/"/g, '""')}"`,
          `"${t.album.title.replace(/"/g, '""')}"`,
          t.duration,
          `"${t.streamUrl || ''}"`
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Sorting Logic
  const getSortedTracks = (tracks: Track[]) => {
      if (sortOption === 'CUSTOM') return tracks;
      return [...tracks].sort((a, b) => {
          switch(sortOption) {
              case 'TITLE': return a.title.localeCompare(b.title);
              case 'ARTIST': return a.artist.name.localeCompare(b.artist.name);
              case 'ALBUM': return a.album.title.localeCompare(b.album.title);
              case 'DURATION': return a.duration - b.duration;
              default: return 0;
          }
      });
  };

  return (
    <div className={`h-screen flex flex-col bg-black text-white overflow-hidden ${reducedMotion ? 'motion-reduce' : ''} ${grayscaleMode ? 'grayscale' : ''}`}>
      
      {/* Top Mobile Bar (Fixed) */}
      <div className="md:hidden h-14 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40 border-b border-[#282828]">
          <div className="font-bold text-xl tracking-tight">SpoFree</div>
          <div className="flex gap-4 items-center">
               <button onClick={() => setShowImportModal(true)} className="p-1"><Plus size={24} /></button>
               <button onClick={() => { setSettingsStartTab('TWEAKS'); setShowSettingsModal(true); }} className="p-1"><Settings size={20} /></button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar 
            currentView={view} 
            onChangeView={(v) => navigateTo({ view: v })}
            playlists={playlists}
            onPlaylistClick={openPlaylist}
            onCreatePlaylist={() => setShowImportModal(true)}
            onLikedSongsClick={openLikedSongs}
            onOpenSettings={() => { setSettingsStartTab('QUALITY'); setShowSettingsModal(true); }}
        />

        {/* Main Content Area */}
        <main ref={mainContentRef} className="flex-1 bg-[#121212] relative overflow-y-auto w-full md:rounded-lg md:my-2 md:mr-2 no-scrollbar scroll-smooth pb-40 md:pb-32">
            {/* Header / Nav Bar */}
            <header className={`sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 py-4 transition-colors duration-300 ${isScrolled ? 'bg-[#121212]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                        <button onClick={goBack} disabled={historyIndex <= 0} className="bg-black/50 p-1.5 rounded-full disabled:opacity-30 hover:bg-black/70"><ChevronLeft /></button>
                        <button onClick={goForward} disabled={historyIndex >= historyStack.length - 1} className="bg-black/50 p-1.5 rounded-full disabled:opacity-30 hover:bg-black/70"><ChevronRight /></button>
                    </div>
                    {view === ViewState.SEARCH && (
                         <div className="relative group">
                            <Search className="absolute left-3 top-2.5 text-[#b3b3b3] group-focus-within:text-white" size={20} />
                            <input 
                                className="bg-[#282828] rounded-full py-2.5 pl-10 pr-4 w-full md:w-80 text-sm placeholder-[#b3b3b3] text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                placeholder="What do you want to listen to?"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
                                autoFocus
                            />
                         </div>
                    )}
                </div>
                
                {/* Desktop Top Right Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {/* View specific actions */}
                    {view === ViewState.LIBRARY && (
                         <div className="flex gap-2">
                             <button onClick={() => setLibraryViewMode('GRID')} className={`p-2 rounded-full ${libraryViewMode === 'GRID' ? 'bg-white/10 text-white' : 'text-[#b3b3b3]'}`}><LayoutGrid size={18} /></button>
                             <button onClick={() => setLibraryViewMode('LIST')} className={`p-2 rounded-full ${libraryViewMode === 'LIST' ? 'bg-white/10 text-white' : 'text-[#b3b3b3]'}`}><List size={18} /></button>
                         </div>
                    )}
                </div>
            </header>

            {/* Content Views */}
            <div className="px-4 md:px-8 pb-8 min-h-full">
                {error && (
                    <div className="bg-red-500/10 text-red-500 p-4 rounded-md mb-6 flex justify-between items-center animate-fade-in">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}><X size={18} /></button>
                    </div>
                )}

                {/* HOME VIEW */}
                {view === ViewState.HOME && (
                    <div className="animate-fade-in space-y-8 pt-4">
                        <h1 className="text-3xl md:text-4xl font-bold mb-6">What do you want to listen to?</h1>
                        
                        {/* Recently Played */}
                        {recentlyPlayed.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Recently Played</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {recentlyPlayed.slice(0, 6).map((item, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => {
                                                if(item.type === 'TRACK') handlePlayTrack(item.data as Track);
                                                if(item.type === 'ALBUM') openAlbum((item.data as Album).id);
                                                if(item.type === 'ARTIST') openArtist((item.data as Artist).id);
                                                if(item.type === 'PLAYLIST') openPlaylist(item.data as Playlist);
                                            }}
                                            className="bg-[#2a2a2a]/40 hover:bg-[#2a2a2a] transition-colors rounded-md overflow-hidden flex items-center group cursor-pointer h-16 md:h-20"
                                        >
                                            <img src={(item.data as any).cover || (item.data as any).image || (item.data as any).picture || (item.data as any).album?.cover} className="h-full aspect-square object-cover" />
                                            <div className="px-4 flex-1 min-w-0">
                                                <div className="font-bold text-sm truncate">{(item.data as any).title || (item.data as any).name}</div>
                                                <div className="text-xs text-[#b3b3b3]">{item.type.charAt(0) + item.type.slice(1).toLowerCase()}</div>
                                            </div>
                                            <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                <div className="bg-[#1db954] rounded-full p-2"><Play size={16} fill="black" className="ml-0.5" /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recommendation Sections */}
                        {homeSections.map((section, idx) => (
                            <MediaGrid 
                                key={idx}
                                title={section.title}
                                items={section.items}
                                type={section.type}
                                onItemClick={(item) => section.type === 'ARTIST' ? openArtist(item.id) : section.type === 'ALBUM' ? openAlbum(item.id) : openPlaylist(item)}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        ))}
                    </div>
                )}

                {/* SEARCH VIEW */}
                {view === ViewState.SEARCH && hasSearched && (
                    <div className="animate-fade-in space-y-8">
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar sticky top-16 z-10 bg-[#121212] pt-2">
                             {['ALL', 'TRACKS', 'ALBUMS', 'ARTISTS', 'PLAYLISTS'].map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => handleSearch(currentState.query!, cat as CategoryFilter)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeSearchCategory === cat ? 'bg-white text-black' : 'bg-[#282828] text-white hover:bg-[#333]'}`}
                                 >
                                     {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                 </button>
                             ))}
                        </div>

                        {/* Results */}
                        {(activeSearchCategory === 'ALL' || activeSearchCategory === 'TRACKS') && resultTracks.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold">Songs</h2>
                                <TrackList 
                                    tracks={resultTracks.slice(0, visibleSongsCount)} 
                                    onPlay={(t) => handlePlayTrack(t, resultTracks)}
                                    currentTrackId={currentTrack?.id}
                                    onArtistClick={openArtist}
                                    onAlbumClick={openAlbum}
                                    onAddToPlaylist={(t) => setTrackToAdd(t)}
                                    accentColor={accentColor}
                                    compactMode={compactMode}
                                />
                                {resultTracks.length > visibleSongsCount && (
                                    <button 
                                        onClick={() => setVisibleSongsCount(prev => prev + 10)}
                                        className="mt-4 text-sm font-bold text-[#b3b3b3] hover:text-white uppercase tracking-widest px-4 py-2"
                                    >
                                        Load More
                                    </button>
                                )}
                            </section>
                        )}
                        
                        {(activeSearchCategory === 'ALL' || activeSearchCategory === 'ARTISTS') && resultArtists.length > 0 && (
                            <MediaGrid 
                                title="Artists" 
                                items={resultArtists} 
                                type="ARTIST" 
                                onItemClick={(item) => openArtist(item.id)}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}
                        
                        {(activeSearchCategory === 'ALL' || activeSearchCategory === 'ALBUMS') && resultAlbums.length > 0 && (
                            <MediaGrid 
                                title="Albums" 
                                items={resultAlbums} 
                                type="ALBUM" 
                                onItemClick={(item) => openAlbum(item.id)}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}

                        {(activeSearchCategory === 'ALL' || activeSearchCategory === 'PLAYLISTS') && resultPlaylists.length > 0 && (
                            <MediaGrid 
                                title="Playlists" 
                                items={resultPlaylists} 
                                type="PLAYLIST" 
                                onItemClick={(item) => openPlaylist(item)}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}
                        
                        {!resultTracks.length && !resultAlbums.length && !resultArtists.length && !isLoading && (
                            <div className="text-center py-20">
                                <h3 className="text-2xl font-bold">No results found for "{currentState.query}"</h3>
                                <p className="text-[#b3b3b3] mt-2">Please check your spelling or try different keywords.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {view === ViewState.SEARCH && !hasSearched && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Browse All</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {GENRES.map((genre) => (
                                <GenreCard 
                                    key={genre.name}
                                    genre={genre.name}
                                    color={genre.color}
                                    onClick={() => handleSearch(genre.name)}
                                />
                            ))}
                        </div>
                        
                        {searchHistory.length > 0 && (
                            <div className="mt-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold">Recent Searches</h2>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {searchHistory.map((term, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 hover:bg-white/5 rounded group cursor-pointer" onClick={() => handleSearch(term)}>
                                            <span className="text-[#b3b3b3] group-hover:text-white">{term}</span>
                                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-[#b3b3b3]"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* LIBRARY VIEW */}
                {view === ViewState.LIBRARY && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
                            {['ALL', 'PLAYLISTS', 'LIKED_SONGS', 'ALBUMS', 'ARTISTS'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setLibraryTab(tab as LibraryTab)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${libraryTab === tab ? 'bg-white text-black' : 'bg-[#282828] text-white hover:bg-[#333]'}`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {(libraryTab === 'ALL' || libraryTab === 'LIKED_SONGS') && likedSongs.length > 0 && (
                             <div className="mb-8 cursor-pointer group" onClick={openLikedSongs}>
                                 <div className="bg-gradient-to-br from-indigo-700 to-blue-500 rounded-md p-6 h-48 md:h-60 flex flex-col justify-end relative overflow-hidden">
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                     <h2 className="text-3xl font-bold relative z-10">Liked Songs</h2>
                                     <p className="text-white/80 relative z-10">{likedSongs.length} liked songs</p>
                                     <div className="absolute bottom-4 right-4 bg-[#1db954] rounded-full p-4 shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                         <Play size={24} fill="black" className="ml-1" />
                                     </div>
                                 </div>
                             </div>
                        )}

                        {(libraryTab === 'ALL' || libraryTab === 'PLAYLISTS') && (
                            <MediaGrid 
                                title="Your Playlists" 
                                items={playlists} 
                                type="PLAYLIST" 
                                onItemClick={(item) => openPlaylist(item)}
                                viewMode={(libraryViewMode === 'LIST' && view === ViewState.LIBRARY && libraryTab !== 'ALL') ? 'LIST' : 'GRID'}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}
                        
                        {(libraryTab === 'ALL' || libraryTab === 'ALBUMS') && (
                            <MediaGrid 
                                title="Saved Albums" 
                                items={savedAlbums} 
                                type="ALBUM" 
                                onItemClick={(item) => openAlbum(item.id)}
                                viewMode={(libraryViewMode === 'LIST' && view === ViewState.LIBRARY && libraryTab !== 'ALL') ? 'LIST' : 'GRID'}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}
                        
                        {(libraryTab === 'ALL' || libraryTab === 'ARTISTS') && (
                            <MediaGrid 
                                title="Followed Artists" 
                                items={followedArtists} 
                                type="ARTIST" 
                                onItemClick={(item) => openArtist(item.id)}
                                viewMode={(libraryViewMode === 'LIST' && view === ViewState.LIBRARY && libraryTab !== 'ALL') ? 'LIST' : 'GRID'}
                                grayscaleMode={grayscaleMode}
                                squareAvatars={squareAvatars}
                            />
                        )}

                        {playlists.length === 0 && likedSongs.length === 0 && savedAlbums.length === 0 && followedArtists.length === 0 && (
                            <div className="text-center py-20 text-[#b3b3b3]">
                                <Library size={48} className="mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-white">Your library is empty</h3>
                                <p className="mt-2">Go explore and save some music!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* DETAILS VIEWS */}
                {view === ViewState.ALBUM_DETAILS && selectedEntity && (
                    <div className="animate-fade-in">
                        <DetailHeader 
                            title={selectedEntity.title}
                            type="Album"
                            image={selectedEntity.cover}
                            subtitle={
                                <><span className="hover:underline cursor-pointer" onClick={() => openArtist(selectedEntity.artist.id)}>{selectedEntity.artist?.name}</span> • {selectedEntity.releaseDate?.split('-')[0]} • {detailTracks.length} songs</>
                            }
                            onPlay={() => handlePlayTrack(detailTracks[0], detailTracks)}
                            grayscaleMode={grayscaleMode}
                            squareAvatars={squareAvatars}
                            actions={
                                <div className="flex gap-4">
                                    <button onClick={() => storageService.toggleSaveAlbum(selectedEntity) && refreshLibrary()} className="text-[#b3b3b3] hover:text-white p-2 border border-[#b3b3b3] rounded-full hover:border-white">
                                        <Heart size={24} fill={storageService.isAlbumSaved(selectedEntity.id) ? accentColor : 'none'} className={storageService.isAlbumSaved(selectedEntity.id) ? 'text-green-500 border-none' : ''} />
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDownloadZip(selectedEntity.title, detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Download ZIP"><Archive size={24}/></button>
                                        <button onClick={() => handleExportCsv(selectedEntity.title, detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Export CSV"><CsvFileIcon size={24}/></button>
                                    </div>
                                </div>
                            }
                        />
                        <TrackList 
                            tracks={detailTracks} 
                            onPlay={(t) => handlePlayTrack(t, detailTracks)}
                            currentTrackId={currentTrack?.id}
                            onAddToPlaylist={(t) => setTrackToAdd(t)}
                            accentColor={accentColor}
                            compactMode={compactMode}
                        />
                    </div>
                )}

                {view === ViewState.PLAYLIST_DETAILS && selectedEntity && (
                    <div className="animate-fade-in">
                         {/* Header with Edit Mode */}
                        <div 
                            className={`flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-[#282828] mb-6 animate-fade-in group relative`}
                            style={{ background: `linear-gradient(to bottom, ${accentColor}10, transparent)` }}
                        >
                             <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl flex-shrink-0 relative">
                                  <img src={selectedEntity.image} className="w-full h-full object-cover rounded shadow-lg" />
                                  {selectedEntity.isLocal && (
                                      <div 
                                        onClick={() => setShowPlaylistEditModal(true)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity"
                                      >
                                          <Pencil size={32} />
                                          <span className="text-sm font-bold mt-2">Edit Playlist</span>
                                      </div>
                                  )}
                             </div>
                             <div className="flex flex-col gap-2 md:gap-4 flex-1 w-full text-center md:text-left">
                                  <span className="text-xs font-bold uppercase tracking-widest hidden md:block">Playlist</span>
                                  <h1 className="text-3xl md:text-6xl font-black tracking-tight leading-tight cursor-pointer" onClick={() => selectedEntity.isLocal && setShowPlaylistEditModal(true)}>{selectedEntity.title}</h1>
                                  <p className="text-[#b3b3b3] text-sm md:text-base line-clamp-2">{selectedEntity.description}</p>
                                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-white mt-2">
                                      {selectedEntity.creator.name} • {detailTracks.length} songs
                                  </div>
                                  
                                  <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                                      <Button variant="primary" size="lg" onClick={() => detailTracks.length > 0 && handlePlayTrack(detailTracks[0], detailTracks)}>Play</Button>
                                      <button onClick={() => storageService.savePlaylist(selectedEntity) && refreshLibrary()} className="text-[#b3b3b3] hover:text-white p-2 border border-[#b3b3b3] rounded-full hover:border-white">
                                           <Heart size={24} fill={storageService.isPlaylistSaved(selectedEntity.uuid) ? accentColor : 'none'} className={storageService.isPlaylistSaved(selectedEntity.uuid) ? 'text-green-500' : ''} />
                                      </button>
                                      
                                      {/* Sort Dropdown */}
                                      <div className="relative ml-auto md:ml-0 flex gap-2">
                                          <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="text-[#b3b3b3] hover:text-white p-2 flex items-center gap-1 text-sm font-bold">
                                              {sortOption === 'CUSTOM' ? 'Custom Order' : sortOption} <ArrowDownUp size={16} />
                                          </button>
                                          {isSortDropdownOpen && (
                                              <div className="absolute top-full right-0 mt-2 w-40 bg-[#282828] rounded shadow-xl z-20 border border-[#3e3e3e]">
                                                  {['CUSTOM', 'TITLE', 'ARTIST', 'ALBUM', 'DURATION'].map(opt => (
                                                      <button 
                                                        key={opt}
                                                        onClick={() => { setSortOption(opt as SortOption); setIsSortDropdownOpen(false); }}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${sortOption === opt ? 'text-green-500' : 'text-white'}`}
                                                      >
                                                          {opt}
                                                      </button>
                                                  ))}
                                              </div>
                                          )}
                                          <button onClick={() => handleDownloadZip(selectedEntity.title, detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Download ZIP"><Archive size={24}/></button>
                                          <button onClick={() => handleExportCsv(selectedEntity.title, detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Export CSV"><CsvFileIcon size={24}/></button>
                                      </div>
                                  </div>
                             </div>
                        </div>

                        <TrackList 
                            tracks={getSortedTracks(detailTracks)} 
                            onPlay={(t) => handlePlayTrack(t, getSortedTracks(detailTracks))}
                            currentTrackId={currentTrack?.id}
                            onArtistClick={openArtist}
                            onAlbumClick={openAlbum}
                            onAddToPlaylist={(t) => setTrackToAdd(t)}
                            accentColor={accentColor}
                            compactMode={compactMode}
                        />
                    </div>
                )}

                {view === ViewState.ARTIST_DETAILS && selectedEntity && (
                    <div className="animate-fade-in">
                        <div className="relative h-[40vh] min-h-[300px] -mx-4 md:-mx-8 -mt-8 mb-8">
                             <img src={selectedEntity.picture || selectedEntity.image} className={`w-full h-full object-cover ${grayscaleMode ? 'grayscale' : ''}`} style={{ objectPosition: '50% 20%' }} />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent"></div>
                             <div className="absolute bottom-6 left-6 md:left-10">
                                 <h1 className="text-4xl md:text-7xl font-black mb-4">{selectedEntity.name}</h1>
                                 <div className="flex gap-4">
                                      <Button variant="primary" onClick={() => detailTracks.length > 0 && handlePlayTrack(detailTracks[0], detailTracks)}>Play</Button>
                                      <Button 
                                        variant="secondary" 
                                        onClick={() => storageService.toggleFollowArtist(selectedEntity) && refreshLibrary()}
                                        className={storageService.isArtistFollowed(selectedEntity.id) ? 'bg-transparent border border-white text-white hover:bg-white/10' : ''}
                                      >
                                          {storageService.isArtistFollowed(selectedEntity.id) ? 'Following' : 'Follow'}
                                      </Button>
                                 </div>
                             </div>
                        </div>

                        <h2 className="text-xl font-bold mb-4">Popular</h2>
                        <TrackList 
                            tracks={detailTracks.slice(0, 5)} 
                            onPlay={(t) => handlePlayTrack(t, detailTracks)}
                            currentTrackId={currentTrack?.id}
                            onArtistClick={openArtist}
                            onAlbumClick={openAlbum}
                            onAddToPlaylist={(t) => setTrackToAdd(t)}
                            accentColor={accentColor}
                            compactMode={compactMode}
                        />

                        {detailAlbums.length > 0 && (
                            <div className="mt-10">
                                <h2 className="text-xl font-bold mb-4">Albums</h2>
                                <MediaGrid 
                                    title="" 
                                    items={detailAlbums} 
                                    type="ALBUM" 
                                    onItemClick={(item) => openAlbum(item.id)}
                                    grayscaleMode={grayscaleMode}
                                    squareAvatars={squareAvatars}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                {view === ViewState.LIKED_SONGS && (
                    <div className="animate-fade-in">
                        <DetailHeader 
                            title="Liked Songs"
                            type="Playlist"
                            image="https://misc.scdn.co/liked-songs/liked-songs-640.png"
                            subtitle={
                                <><span>{detailTracks.length} songs</span></>
                            }
                            onPlay={() => detailTracks.length > 0 && handlePlayTrack(detailTracks[0], detailTracks)}
                            grayscaleMode={grayscaleMode}
                            squareAvatars={squareAvatars}
                            actions={
                                <div className="flex gap-2">
                                     <button onClick={() => handleDownloadZip("Liked Songs", detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Download ZIP"><Archive size={24}/></button>
                                     <button onClick={() => handleExportCsv("Liked Songs", detailTracks)} className="text-[#b3b3b3] hover:text-white p-2" title="Export CSV"><CsvFileIcon size={24}/></button>
                                </div>
                            }
                        />
                         <TrackList 
                            tracks={detailTracks} 
                            onPlay={(t) => handlePlayTrack(t, detailTracks)}
                            currentTrackId={currentTrack?.id}
                            onArtistClick={openArtist}
                            onAlbumClick={openAlbum}
                            onAddToPlaylist={(t) => setTrackToAdd(t)}
                            accentColor={accentColor}
                            compactMode={compactMode}
                        />
                    </div>
                )}

            </div>
        </main>

        {/* Right Sidebar */}
        {rightSidebarMode && (
             <aside className="w-80 bg-[#121212] border-l border-[#282828] hidden xl:block animate-slide-right">
                 <RightSidebar 
                    mode={rightSidebarMode}
                    queue={queue}
                    currentTrack={currentTrack}
                    onPlay={(t) => handlePlayTrack(t)} // Don't reset queue when clicking queue item
                    onClose={() => setRightSidebarMode(null)}
                    onClearQueue={() => { setQueue([]); setOriginalQueue([]); }}
                    onSaveQueue={() => handleCreatePlaylist(`Queue ${new Date().toLocaleDateString()}`, queue)}
                    accentColor={accentColor}
                 />
             </aside>
        )}
      </div>

      {/* Player Bar */}
      <Player 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        isShuffling={isShuffling}
        repeatMode={repeatMode}
        onToggleShuffle={handleShuffleToggle}
        onToggleRepeat={() => setRepeatMode(m => m === 'OFF' ? 'ALL' : m === 'ALL' ? 'ONE' : 'OFF')}
        onArtistClick={openArtist}
        onQualityClick={() => { setSettingsStartTab('QUALITY'); setShowSettingsModal(true); }}
        onDownload={handleDownloadTrack}
        
        accentColor={accentColor}
        showVisualizer={showVisualizer}
        showStats={showStats}
        sleepTimer={sleepTimer}
        setSleepTimer={setSleepTimer}
        highPerformanceMode={highPerformanceMode}
        disableGlow={disableGlow}

        showQueue={rightSidebarMode === 'QUEUE'}
        toggleQueue={() => setRightSidebarMode(m => m === 'QUEUE' ? null : 'QUEUE')}
        showLyrics={rightSidebarMode === 'LYRICS'}
        toggleLyrics={() => setRightSidebarMode(m => m === 'LYRICS' ? null : 'LYRICS')}

        queue={queue}
        onPlayTrack={(t) => handlePlayTrack(t)}
      />

      {/* Modals */}
      {showImportModal && (
          <ImportModal 
            onClose={() => setShowImportModal(false)}
            onImport={handleCreatePlaylist}
          />
      )}

      {showPlaylistEditModal && selectedEntity && (
          <PlaylistEditModal 
            playlist={selectedEntity}
            onClose={() => setShowPlaylistEditModal(false)}
            onSave={handlePlaylistUpdate}
            onDelete={handleDeletePlaylist}
          />
      )}

      {showSettingsModal && (
          <SettingsModal 
            onClose={() => setShowSettingsModal(false)}
            defaultTab={settingsStartTab}
            
            quality={audioQuality}
            setQuality={(q) => { storageService.setQuality(q); setAudioQuality(q); }}
            
            accentColor={accentColor}
            setAccentColor={(c) => { storageService.setAccentColor(c); setAccentColor(c); }}
            
            showStats={showStats}
            setShowStats={(v) => { storageService.setShowStats(v); setShowStats(v); }}
            
            compactMode={compactMode}
            setCompactMode={(v) => { storageService.setCompactMode(v); setCompactMode(v); }}
            
            reducedMotion={reducedMotion}
            setReducedMotion={(v) => { storageService.setReducedMotion(v); setReducedMotion(v); }}
            
            grayscaleMode={grayscaleMode}
            setGrayscaleMode={(v) => { storageService.setGrayscaleMode(v); setGrayscaleMode(v); }}
            
            squareAvatars={squareAvatars}
            setSquareAvatars={(v) => { storageService.setSquareAvatars(v); setSquareAvatars(v); }}

            sleepTimer={sleepTimer}
            setSleepTimer={setSleepTimer}

            highPerformanceMode={highPerformanceMode}
            setHighPerformanceMode={(v) => { storageService.setHighPerformanceMode(v); setHighPerformanceMode(v); }}

            disableGlow={disableGlow}
            setDisableGlow={(v) => { storageService.setDisableGlow(v); setDisableGlow(v); }}

            updateTitle={updateTitle}
            setUpdateTitle={(v) => { storageService.setUpdateTitle(v); setUpdateTitle(v); }}

            showVisualizer={showVisualizer}
            setShowVisualizer={(v) => { storageService.setShowVisualizer(v); setShowVisualizer(v); }}
          />
      )}

      {trackToAdd && (
          <AddToPlaylistModal 
            track={trackToAdd}
            onClose={() => setTrackToAdd(null)}
            onCreateNew={() => { setTrackToAdd(null); setShowImportModal(true); }}
          />
      )}

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#282828] flex justify-around items-center h-[56px] box-content pb-safe z-50">
          <button onClick={() => navigateTo({ view: ViewState.HOME })} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.HOME ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Home size={24} strokeWidth={view === ViewState.HOME ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigateTo({ view: ViewState.SEARCH })} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.SEARCH ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Search size={24} strokeWidth={view === ViewState.SEARCH ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Search</span>
          </button>
          <button onClick={() => navigateTo({ view: ViewState.LIBRARY })} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.LIBRARY ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Library size={24} strokeWidth={view === ViewState.LIBRARY ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Library</span>
          </button>
      </div>

      <DownloadManager singleDownload={singleDownloadState} zipDownload={zipDownloadState} />

    </div>
  );
};

export default App;