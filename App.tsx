
import React, { useState, useEffect } from 'react';
import { Player } from './components/Player';
import { Sidebar } from './components/Sidebar';
import { TrackList } from './components/TrackList';
import { LyricsOverlay } from './components/LyricsOverlay';
import { ImportModal } from './components/ImportModal';
import { PlaylistEditModal } from './components/PlaylistEditModal';
import { ViewState, Track, Album, Artist, Playlist, LyricsLine } from './types';
import { 
    searchAll, getStreamUrl, getCurrentApiUrl, 
    getAlbumTracks, getArtistTopTracks, getPlaylistTracks, getLyrics 
} from './services/hifiService';
import { storageService } from './services/storageService';
import { ChevronLeft, ChevronRight, Search, Home, Library, Heart, Github, Pencil } from 'lucide-react';
import { Button } from './components/Button';

type CategoryFilter = 'ALL' | 'TRACKS' | 'ALBUMS' | 'ARTISTS' | 'PLAYLISTS';

const App: React.FC = () => {
  // Navigation & Content State
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [filter, setFilter] = useState<CategoryFilter>('ALL');
  
  // Data State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [homeTracks, setHomeTracks] = useState<Track[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [resultTracks, setResultTracks] = useState<Track[]>([]);
  const [resultAlbums, setResultAlbums] = useState<Album[]>([]);
  const [resultArtists, setResultArtists] = useState<Artist[]>([]);
  const [resultPlaylists, setResultPlaylists] = useState<Playlist[]>([]);
  
  // Detail/Library State
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [detailTracks, setDetailTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedInstance, setConnectedInstance] = useState(getCurrentApiUrl());
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlaylistEditModal, setShowPlaylistEditModal] = useState(false);

  const updateConnectionStatus = () => setConnectedInstance(getCurrentApiUrl());

  const refreshLibrary = () => {
      setPlaylists(storageService.getPlaylists());
      setLikedSongs(storageService.getLikedSongs());
      setSearchHistory(storageService.getHistory());
  };

  useEffect(() => {
    const fetchHome = async () => {
      setIsLoading(true);
      try {
        const results = await searchAll('Hits');
        setHomeTracks(results.tracks);
        updateConnectionStatus();
      } catch (err) {
        console.error("Home fetch failed", err);
        updateConnectionStatus();
      } finally {
        setIsLoading(false);
      }
    };
    fetchHome();
    refreshLibrary();
  }, []);

  const handleSearch = async (e?: React.FormEvent, override?: string) => {
    if (e) e.preventDefault();
    const query = override || searchQuery;
    if (!query.trim()) return;
    
    setSearchQuery(query);
    storageService.addToHistory(query);
    refreshLibrary();
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setView(ViewState.SEARCH);
    
    setResultTracks([]); setResultAlbums([]); setResultArtists([]); setResultPlaylists([]);
    
    try {
      const results = await searchAll(query);
      setResultTracks(results.tracks);
      setResultAlbums(results.albums);
      setResultArtists(results.artists);
      setResultPlaylists(results.playlists);
      updateConnectionStatus();
    } catch (err) {
      setError("Search failed. Trying next instance...");
      updateConnectionStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const playTrack = async (track: Track, context: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (context.length > 0) setQueue(context);
    
    // Optimistic UI update
    setCurrentTrack(track);
    setIsPlaying(false);
    setError(null);
    setLyrics([]);
    
    // Fetch lyrics
    getLyrics(track.id).then(setLyrics);

    try {
        const streamUrl = await getStreamUrl(track.id);
        updateConnectionStatus();
        setCurrentTrack({ ...track, streamUrl });
        setIsPlaying(true);
    } catch (err: any) {
        console.error("Play error:", err);
        setError("Could not resolve stream. Trying another server...");
        updateConnectionStatus();
        setIsPlaying(false);
    }
  };

  const handleEntityClick = async (type: 'ALBUM' | 'ARTIST' | 'PLAYLIST', item: any) => {
      setSelectedEntity(item);
      setDetailTracks([]);
      setIsLoading(true);
      
      try {
          if (type === 'ALBUM') {
              setView(ViewState.ALBUM_DETAILS);
              setDetailTracks(await getAlbumTracks(item.id));
          } else if (type === 'ARTIST') {
              setView(ViewState.ARTIST_DETAILS);
              setDetailTracks(await getArtistTopTracks(item.id));
          } else if (type === 'PLAYLIST') {
              setView(ViewState.PLAYLIST_DETAILS);
              setDetailTracks(item.isLocal ? (item.tracks || []) : await getPlaylistTracks(item.uuid));
          }
      } catch (e) {
          setError("Failed to load details");
      } finally {
          setIsLoading(false);
      }
  };

  const MediaGrid = ({ title, items, type }: any) => {
     if (!items?.length) return null;
     return (
        <div className="mb-8">
           <h2 className="text-2xl font-bold mb-4">{title}</h2>
           <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item: any, idx: number) => (
                 <div key={idx} onClick={() => handleEntityClick(type.toUpperCase(), item)}
                    className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] cursor-pointer group transition-colors">
                    <img src={type === 'artist' ? item.picture : (type === 'playlist' ? item.image : item.cover)} 
                         className={`w-full aspect-square object-cover shadow-lg mb-4 ${type === 'artist' ? 'rounded-full' : 'rounded-md'}`} />
                    <h3 className="font-bold truncate mb-1">{item.title || item.name}</h3>
                    <p className="text-sm text-[#b3b3b3] truncate">{type === 'album' ? item.artist.name : (type === 'playlist' ? item.creator.name : 'Artist')}</p>
                 </div>
              ))}
           </div>
        </div>
     );
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-black text-white">
      <Sidebar 
        currentView={view} 
        onChangeView={(v) => { setView(v); refreshLibrary(); }} 
        playlists={playlists}
        onPlaylistClick={(p) => handleEntityClick('PLAYLIST', p)}
        onCreatePlaylist={() => setShowImportModal(true)}
        onLikedSongsClick={() => { 
            refreshLibrary(); 
            setView(ViewState.LIKED_SONGS); 
            setDetailTracks(storageService.getLikedSongs()); 
            setSelectedEntity({ title: 'Liked Songs', cover: 'https://misc.scdn.co/liked-songs/liked-songs-640.png', artist: { name: 'You' } });
        }}
      />

      <div className="flex-1 flex flex-col relative rounded-none md:rounded-lg ml-0 md:ml-2 mt-0 md:mt-2 mr-0 md:mr-2 mb-20 md:mb-2 bg-[#121212] overflow-hidden">
        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-[#121212] border-t border-[#282828] flex justify-around items-center z-50 pb-safe">
             <button onClick={() => setView(ViewState.HOME)} className={`flex flex-col items-center ${view === ViewState.HOME ? 'text-white' : 'text-[#b3b3b3]'}`}><Home size={24}/><span className="text-[10px]">Home</span></button>
             <button onClick={() => setView(ViewState.SEARCH)} className={`flex flex-col items-center ${view === ViewState.SEARCH ? 'text-white' : 'text-[#b3b3b3]'}`}><Search size={24}/><span className="text-[10px]">Search</span></button>
             <button onClick={() => { setView(ViewState.LIBRARY); refreshLibrary(); }} className={`flex flex-col items-center ${view === ViewState.LIBRARY ? 'text-white' : 'text-[#b3b3b3]'}`}><Library size={24}/><span className="text-[10px]">Library</span></button>
        </div>

        {/* Top Bar */}
        <div className={`h-16 w-full flex items-center justify-between px-4 md:px-6 z-20 absolute top-0 ${view === ViewState.SEARCH ? 'bg-[#121212]' : ''}`}>
          <div className="flex gap-4 items-center w-full md:w-auto">
             <div className="hidden md:flex gap-2">
                 <div className="bg-black/70 rounded-full p-1"><ChevronLeft size={22} color="gray"/></div>
                 <div className="bg-black/70 rounded-full p-1"><ChevronRight size={22} color="gray"/></div>
             </div>
             {view === ViewState.SEARCH && (
                <form onSubmit={(e) => handleSearch(e)} className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input className="h-10 w-full rounded-full pl-10 pr-4 bg-[#242424] text-sm text-white focus:outline-none" 
                           placeholder="Songs, Artists, Albums..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                </form>
             )}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/redretep/SpoFreeFy', '_blank')} className="flex items-center gap-2">
                <Github size={16} /><span>GitHub</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#121212]">
           <div className="h-16"></div>
           <div className="px-4 md:px-6 pb-32">
              {error && <div className="bg-red-500/20 text-red-100 p-4 rounded mb-6 text-sm">{error}</div>}

              {view === ViewState.HOME && !isLoading && (
                  <div>
                     <h1 className="text-3xl font-bold mb-4">Good evening</h1>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {homeTracks.slice(0, 6).map(track => (
                            <div key={track.id} onClick={() => playTrack(track, homeTracks)} className="h-20 bg-white/10 hover:bg-white/20 rounded flex items-center gap-4 cursor-pointer group">
                                <img src={track.album.cover} className="h-full w-20 object-cover shadow-lg" />
                                <span className="font-bold text-sm line-clamp-2 pr-2">{track.title}</span>
                            </div>
                        ))}
                     </div>
                  </div>
              )}
              
              {view === ViewState.LIBRARY && (
                  <div>
                      <h1 className="text-3xl font-bold mb-4">Your Library</h1>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          <div onClick={() => { refreshLibrary(); setView(ViewState.LIKED_SONGS); setDetailTracks(storageService.getLikedSongs()); setSelectedEntity({ title: 'Liked Songs', cover: 'https://misc.scdn.co/liked-songs/liked-songs-640.png', artist: { name: 'You' } }); }}
                              className="bg-gradient-to-br from-indigo-800 to-blue-800 p-4 rounded-md cursor-pointer aspect-square flex flex-col justify-end shadow-lg">
                              <Heart className="text-white mb-2" size={32} fill="white" />
                              <h3 className="font-bold text-xl">Liked Songs</h3>
                              <p className="text-sm text-white/70">{likedSongs.length} songs</p>
                          </div>
                          {playlists.map(p => (
                              <div key={p.uuid} onClick={() => handleEntityClick('PLAYLIST', p)} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] cursor-pointer">
                                  <img src={p.image} className="w-full aspect-square object-cover shadow-lg rounded-md mb-4" />
                                  <h3 className="font-bold truncate">{p.title}</h3>
                                  <p className="text-sm text-[#b3b3b3]">By {p.creator.name}</p>
                               </div>
                          ))}
                      </div>
                  </div>
              )}

              {view === ViewState.SEARCH && (
                  <>
                    {!searchQuery && searchHistory.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4">Recent Searches</h2>
                            <div className="flex flex-wrap gap-2">
                                {searchHistory.map((term, i) => (
                                    <button key={i} onClick={() => handleSearch(undefined, term)} className="px-4 py-2 bg-[#2a2a2a] rounded-full text-sm">{term}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasSearched && !isLoading && (
                        <>
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                             {['ALL', 'TRACKS', 'ALBUMS', 'ARTISTS', 'PLAYLISTS'].map(f => (
                                 <button key={f} onClick={() => setFilter(f as CategoryFilter)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'}`}>
                                    {f.charAt(0) + f.slice(1).toLowerCase()}
                                 </button>
                             ))}
                        </div>
                        <div className="flex flex-col gap-8">
                            {(filter === 'ALL' || filter === 'TRACKS') && resultTracks.length > 0 && <div><h2 className="text-2xl font-bold mb-4">Songs</h2><TrackList tracks={resultTracks} onPlay={(t) => playTrack(t, resultTracks)} currentTrackId={currentTrack?.id} /></div>}
                            {(filter === 'ALL' || filter === 'ALBUMS') && <MediaGrid title="Albums" items={resultAlbums} type="album" />}
                            {(filter === 'ALL' || filter === 'ARTISTS') && <MediaGrid title="Artists" items={resultArtists} type="artist" />}
                            {(filter === 'ALL' || filter === 'PLAYLISTS') && <MediaGrid title="Playlists" items={resultPlaylists} type="playlist" />}
                        </div>
                        </>
                    )}
                  </>
              )}

              {([ViewState.ALBUM_DETAILS, ViewState.ARTIST_DETAILS, ViewState.PLAYLIST_DETAILS, ViewState.LIKED_SONGS].includes(view)) && (
                  <div>
                      <div className="flex flex-col md:flex-row gap-6 items-end mb-6">
                          <img src={selectedEntity?.cover || selectedEntity?.picture || selectedEntity?.image} className={`w-32 h-32 md:w-52 md:h-52 shadow-2xl ${view === ViewState.ARTIST_DETAILS ? 'rounded-full' : 'rounded-md'}`} />
                          <div className="flex flex-col gap-2 flex-1">
                              <span className="text-xs font-bold uppercase">{view === ViewState.ARTIST_DETAILS ? 'Artist' : view === ViewState.ALBUM_DETAILS ? 'Album' : 'Playlist'}</span>
                              <div className="flex items-center gap-4">
                                  <h1 className="text-3xl md:text-5xl font-black">{selectedEntity?.title || selectedEntity?.name}</h1>
                                  {view === ViewState.PLAYLIST_DETAILS && selectedEntity?.isLocal && (
                                      <button onClick={() => setShowPlaylistEditModal(true)} className="text-[#b3b3b3] hover:text-white"><Pencil size={24}/></button>
                                  )}
                              </div>
                              <p className="text-[#b3b3b3]">{selectedEntity?.artist?.name || selectedEntity?.creator?.name}</p>
                          </div>
                      </div>
                      {isLoading ? <div className="text-center py-10">Loading...</div> : <TrackList tracks={detailTracks} onPlay={(t) => playTrack(t, detailTracks)} currentTrackId={currentTrack?.id} />}
                  </div>
              )}
              
              <div className="mt-20 text-xs text-[#535353] pb-10">Connected to: <span className="text-green-600">{connectedInstance}</span></div>
           </div>
        </div>
      </div>

      <Player 
        currentTrack={currentTrack} 
        isPlaying={isPlaying} 
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={() => {
            if (currentTrack && queue.length) {
                const idx = queue.findIndex(t => t.id === currentTrack.id);
                if (idx < queue.length - 1) playTrack(queue[idx+1], queue);
            }
        }}
        onPrev={() => {
             if (currentTrack && queue.length) {
                const idx = queue.findIndex(t => t.id === currentTrack.id);
                if (idx > 0) playTrack(queue[idx-1], queue);
            }
        }}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        isLyricsOpen={showLyrics}
      />
      
      <LyricsOverlay lyrics={lyrics} currentTime={0} isOpen={showLyrics} onClose={() => setShowLyrics(false)} isLoading={false} />
      
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={(t, tr) => { 
          const p = storageService.createPlaylist(t); 
          tr.forEach(x => storageService.addTrackToPlaylist(p.uuid, x)); 
          refreshLibrary(); 
      }} />}
      
      {showPlaylistEditModal && selectedEntity?.isLocal && (
          <PlaylistEditModal playlist={selectedEntity} onClose={() => setShowPlaylistEditModal(false)} 
              onSave={(id, t) => { storageService.renamePlaylist(id, t); refreshLibrary(); setSelectedEntity({...selectedEntity, title: t}); }}
              onDelete={(id) => { storageService.deletePlaylist(id); refreshLibrary(); setView(ViewState.LIBRARY); }}
          />
      )}
    </div>
  );
};

export default App;
