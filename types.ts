
export interface Artist {
  id: number | string;
  name: string;
  picture?: string;
  type?: string;
}

export interface Album {
  id: number | string;
  title: string;
  cover: string;
  artist?: Artist;
  releaseDate?: string;
}

export interface Playlist {
  uuid: string;
  title: string;
  image: string;
  creator: { name: string };
  isLocal?: boolean; // Flag for user created playlists
  tracks?: Track[];
}

export interface Track {
  id: number | string;
  title: string;
  artist: Artist;
  album: Album;
  duration: number; // in seconds
  streamUrl?: string; // Direct URL if available
  quality?: 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES';
}

export interface LyricsLine {
  time: number;
  text: string;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  isShuffling: boolean;
  isRepeating: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  LIBRARY = 'LIBRARY',
  ALBUM_DETAILS = 'ALBUM_DETAILS',
  ARTIST_DETAILS = 'ARTIST_DETAILS',
  PLAYLIST_DETAILS = 'PLAYLIST_DETAILS',
  LIKED_SONGS = 'LIKED_SONGS'
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface LocalStorageData {
  likedSongs: Track[];
  playlists: Playlist[];
  searchHistory: string[];
}
