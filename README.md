
# SpoFreeFy - High Fidelity Music Streaming

**SpoFreeFy** is a modern, high-fidelity music streaming client inspired by the aesthetics of Spotify but powered by the lossless audio capabilities of the Tidal-compatible Hifi API.

## 🚀 Features

### 🎧 Audio & Playback
- **Lossless Audio**: Supports streaming FLAC (16-bit/44.1kHz) and AAC (320kbps).
- **Direct Streaming**: Bypasses restrictions by rotating through public Hifi API instances.
- **Robust Player**: Includes Shuffle, Repeat, Volume Control, and Seek capabilities.
- **Lyrics Support**: Real-time synchronized lyrics for supported tracks.
- **Downloads**: Download songs directly to your device as `.flac` files.

### 📚 Library Management
- **Local Playlists**: Create, rename, and delete playlists stored locally in your browser.
- **Liked Songs**: Save your favorite tracks to a dedicated "Liked Songs" library.
- **Import Playlists**: Create playlists by pasting text/CSV lists of songs (e.g., "Song Name - Artist").
- **Search History**: Keeps track of your recent searches for quick access.

### 🎨 UI & UX
- **Spotify-Inspired Design**: Dark mode, clean typography, and familiar layout.
- **Mobile Responsive**: Fully optimized for mobile with a bottom navigation bar and touch-friendly controls.
- **Detail Views**: Dedicated pages for Albums, Artists, and Playlists with full track listings.
- **Search Categorization**: Filter results by Songs, Albums, Artists, or Playlists.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Backend/API**: Connects to public Hifi API instances (Reverse-engineered Tidal API wrappers).
- **Storage**: Browser LocalStorage for playlists and history.

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/redretep/SpoFreeFy.git
    cd SpoFreeFy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm start
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 📝 Usage

1.  **Search**: Use the search bar to find songs, albums, or artists.
2.  **Play**: Click on any track or album cover to start playback.
3.  **Library**: Click the heart icon to save songs, or use the "Import Playlist" button in the sidebar.
4.  **Lyrics**: Click the microphone icon in the player bar to view lyrics.
5.  **Download**: Click the download icon in the player bar to save the current track.

## ⚠️ Disclaimer

This project is for **educational purposes only**. It acts as a frontend for public API instances. The developers do not host any copyrighted content. Please support artists by using official streaming services.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
